function attr(tag, name) {
  const re = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s"'=<>\`]+))`, 'i');
  const match = re.exec(tag);
  if (!match) return '';
  return match[2] ?? match[3] ?? match[4] ?? '';
}

export function metaContent(html, key) {
  const slice = String(html || '').slice(0, 150_000);
  const re = /<meta\b[^>]*>/gi;
  let match;
  while ((match = re.exec(slice))) {
    const tag = match[0];
    const prop = (attr(tag, 'property') || attr(tag, 'name')).toLowerCase();
    if (prop === key) return attr(tag, 'content');
  }
  return '';
}

export function extractTitle(html) {
  for (const key of ['og:title', 'twitter:title']) {
    const value = metaContent(html, key);
    if (value) return value;
  }
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(String(html || '').slice(0, 150_000));
  return match ? match[1] : '';
}

export function extractImage(html) {
  return metaContent(html, 'og:image') || metaContent(html, 'twitter:image');
}
