import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCHEMA = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'schema.sql'), 'utf8');
const MAX_WISHES = 80;

const WISH_COLS = `id, list_id, title, note, size, color, price_text, price_checked_on, most_wanted,
  quantity, source, product_url, affiliate, shop_name, image_url, image_rights, state, created_at, updated_at`;

export function createStore(db) {
  return {
    async init() {
      await db.exec(SCHEMA);
    },

    async createList(row) {
      await db.run(
        `INSERT INTO lists (id, name, occasion, lang, edit_hash, view_token, view_hash, created_at, activity_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [row.id, row.name, row.occasion, row.lang, row.editHash, row.viewToken, row.viewHash, row.now, row.now],
      );
    },

    async listByEdit(editHash) {
      return db.get(`SELECT id, name, occasion, lang, view_token, created_at, activity_at FROM lists WHERE edit_hash = ?`, [editHash]);
    },

    async listByView(viewHash) {
      return db.get(`SELECT id, name, occasion, lang, created_at FROM lists WHERE view_hash = ?`, [viewHash]);
    },

    async wishesForList(listId) {
      return db.all(
        `SELECT ${WISH_COLS} FROM wishes WHERE list_id = ? ORDER BY most_wanted DESC, created_at ASC, id ASC`,
        [listId],
      );
    },

    async touch(listId, now, staleBefore) {
      await db.run(`UPDATE lists SET activity_at = ? WHERE id = ? AND activity_at < ?`, [now, listId, staleBefore]);
    },

    async addWish(editHash, wish, maxWishes = MAX_WISHES) {
      const result = await db.run(
        `INSERT INTO wishes (id, list_id, title, note, size, color, price_text, price_checked_on, most_wanted,
            quantity, source, product_url, affiliate, shop_name, image_url, image_rights, state, created_at, updated_at)
         SELECT ?, lists.id, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, 'open', ?, ?
         FROM lists
         WHERE lists.edit_hash = ?
           AND (SELECT COUNT(*) FROM wishes WHERE list_id = lists.id) < ?`,
        [
          wish.id, wish.title, wish.note, wish.size, wish.color, wish.priceText, wish.priceCheckedOn,
          wish.mostWanted, wish.source, wish.productUrl, wish.affiliate, wish.shopName, wish.imageUrl,
          wish.imageRights, wish.now, wish.now, editHash, maxWishes,
        ],
      );
      if (result.changes === 1) {
        await db.run(`UPDATE lists SET activity_at = ? WHERE edit_hash = ?`, [wish.now, editHash]);
        return { ok: true };
      }
      const list = await db.get(`SELECT id FROM lists WHERE edit_hash = ?`, [editHash]);
      if (!list) return { ok: false, error: 'not_found' };
      return { ok: false, error: 'too_many' };
    },

    async updateWish(editHash, wishId, wish) {
      const result = await db.run(
        `UPDATE wishes SET title = ?, note = ?, size = ?, color = ?, price_text = ?, price_checked_on = ?,
            most_wanted = ?, source = ?, product_url = ?, affiliate = ?, shop_name = ?, image_url = ?,
            image_rights = ?, updated_at = ?
         WHERE id = ? AND list_id = (SELECT id FROM lists WHERE edit_hash = ?)`,
        [
          wish.title, wish.note, wish.size, wish.color, wish.priceText, wish.priceCheckedOn, wish.mostWanted,
          wish.source, wish.productUrl, wish.affiliate, wish.shopName, wish.imageUrl, wish.imageRights,
          wish.now, wishId, editHash,
        ],
      );
      if (result.changes !== 1) return { ok: false, error: 'not_found' };
      await db.run(`UPDATE lists SET activity_at = ? WHERE edit_hash = ?`, [wish.now, editHash]);
      return { ok: true };
    },

    async deleteWish(editHash, wishId, now) {
      const result = await db.run(
        `DELETE FROM wishes WHERE id = ? AND list_id = (SELECT id FROM lists WHERE edit_hash = ?)`,
        [wishId, editHash],
      );
      if (result.changes !== 1) return { ok: false, error: 'not_found' };
      await db.run(`UPDATE lists SET activity_at = ? WHERE edit_hash = ?`, [now, editHash]);
      return { ok: true };
    },

    async deleteList(editHash) {
      const result = await db.run(`DELETE FROM lists WHERE edit_hash = ?`, [editHash]);
      return result.changes === 1;
    },

    async rotateView(editHash, viewToken, viewHash, now) {
      const result = await db.run(
        `UPDATE lists SET view_token = ?, view_hash = ?, activity_at = ? WHERE edit_hash = ?`,
        [viewToken, viewHash, now, editHash],
      );
      return result.changes === 1;
    },

    /**
     * One statement, conditional on state = 'open'. Two concurrent callers
     * cannot both observe a change: SQLite applies the write once.
     */
    async reserve(viewHash, wishId, resHash, now) {
      const result = await db.run(
        `UPDATE wishes SET state = 'reserved', res_hash = ?, updated_at = ?
         WHERE id = ? AND state = 'open' AND list_id = (SELECT id FROM lists WHERE view_hash = ?)`,
        [resHash, now, wishId, viewHash],
      );
      if (result.changes === 1) {
        await db.run(`UPDATE lists SET activity_at = ? WHERE view_hash = ?`, [now, viewHash]);
        return { ok: true };
      }
      const row = await db.get(
        `SELECT state FROM wishes WHERE id = ? AND list_id = (SELECT id FROM lists WHERE view_hash = ?)`,
        [wishId, viewHash],
      );
      if (!row) return { ok: false, error: 'not_found' };
      return { ok: false, error: 'conflict' };
    },

    async reservation(resHash) {
      return db.get(
        `SELECT wishes.id, wishes.title, wishes.state, wishes.product_url, wishes.shop_name, lists.name AS list_name, lists.lang
         FROM wishes JOIN lists ON lists.id = wishes.list_id WHERE wishes.res_hash = ?`,
        [resHash],
      );
    },

    async markBought(resHash, now) {
      const result = await db.run(
        `UPDATE wishes SET state = 'bought', updated_at = ? WHERE res_hash = ? AND state = 'reserved'`,
        [now, resHash],
      );
      if (result.changes === 1) return { ok: true };
      const row = await db.get(`SELECT state FROM wishes WHERE res_hash = ?`, [resHash]);
      if (row?.state === 'bought') return { ok: true };
      return { ok: false, error: 'not_found' };
    },

    async release(resHash, now) {
      const result = await db.run(
        `UPDATE wishes SET state = 'open', res_hash = NULL, updated_at = ?
         WHERE res_hash = ? AND state IN ('reserved', 'bought')`,
        [now, resHash],
      );
      return result.changes === 1 ? { ok: true } : { ok: false, error: 'not_found' };
    },

    async rateLimit(bucket, limit, windowMs, nowMs) {
      const resetAt = nowMs + windowMs;
      const row = await db.get(
        `INSERT INTO rate_limits (bucket, hits, reset_at) VALUES (?, 1, ?)
         ON CONFLICT(bucket) DO UPDATE SET
           hits = CASE WHEN rate_limits.reset_at <= ? THEN 1 ELSE rate_limits.hits + 1 END,
           reset_at = CASE WHEN rate_limits.reset_at <= ? THEN excluded.reset_at ELSE rate_limits.reset_at END
         RETURNING hits, reset_at`,
        [bucket, resetAt, nowMs, nowMs],
      );
      const hits = Number(row?.hits || 0);
      return { ok: hits <= limit, hits, resetAt: Number(row?.reset_at || resetAt) };
    },

    async purgeRates(nowMs) {
      await db.run(`DELETE FROM rate_limits WHERE reset_at < ?`, [nowMs]);
    },

    async purgeInactive(cutoffIso) {
      const result = await db.run(`DELETE FROM lists WHERE activity_at < ?`, [cutoffIso]);
      return result.changes;
    },

    async setActivity(listId, iso) {
      await db.run(`UPDATE lists SET activity_at = ? WHERE id = ?`, [iso, listId]);
    },
  };
}
