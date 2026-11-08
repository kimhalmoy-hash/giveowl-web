const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

/** Strip tags and control characters. Used on stored text and fetched titles. */
export function cleanText(input, max, { multiline = false } = {}) {
  if (typeof input !== 'string') return '';
  let s = input;
  for (let pass = 0; pass < 2; pass++) {
    s = s.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (_all, ent) => {
    if (ent[0] === '#') {
      const hex = ent[1] === 'x' || ent[1] === 'X';
      const cp = hex ? Number.parseInt(ent.slice(2), 16) : Number.parseInt(ent.slice(1), 10);
      if (!Number.isFinite(cp) || cp < 0 || cp > 0x10ffff) return '';
      if ((cp < 32 && cp !== 10 && cp !== 9) || cp === 127) return ' ';
      try { return String.fromCodePoint(cp); } catch { return ''; }
    }
    const key = ent.toLowerCase();
    return Object.prototype.hasOwnProperty.call(NAMED, key) ? NAMED[key] : ' ';
    });
  }
  s = s.replace(/<[^>]*>/g, ' ').replace(/[<>]/g, ' ');
  if (multiline) {
    s = s.replace(/\r\n?/g, '\n').replace(/[^\S\n]+/g, ' ').replace(/\n{3,}/g, '\n\n');
    s = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  } else {
    s = s.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ');
  }
  s = s.trim();
  if (s.length > max) s = s.slice(0, max).trim();
  return s;
}

export function cleanDate(input) {
  if (input == null || input === '') return null;
  if (typeof input !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input)) return undefined;
  const [y, m, d] = input.split('-').map(Number);
  if (y < 2000 || y > 2100) return undefined;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return undefined;
  return input;
}
