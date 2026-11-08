/** Adapt a D1 binding to the store's get/all/run interface. */
export function createD1Adapter(db) {
  return {
    async get(sql, params = []) {
      const row = await db.prepare(sql).bind(...params).first();
      return row ?? null;
    },
    async all(sql, params = []) {
      const result = await db.prepare(sql).bind(...params).all();
      return result?.results || [];
    },
    async run(sql, params = []) {
      const result = await db.prepare(sql).bind(...params).run();
      return { changes: Number(result?.meta?.changes || 0) };
    },
  };
}
