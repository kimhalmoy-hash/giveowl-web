/**
 * Landing-page indexability.
 *
 * false: every wishlist landing is noindex,nofollow and is kept out of sitemap.xml.
 *        Use this until a production API actually saves lists for giveowl.com.
 * true:  landings may be indexed. Individual lists stay unindexed because the
 *        access keys live in the URL fragment (#eier=, #vis=, #res=), which is
 *        not sent to the server and is not a separate URL.
 *
 * After changing this flag, rebuild the pages and the sitemap block:
 *   node onskeliste/build-pages.mjs
 *
 * API responses always send X-Robots-Tag: noindex, nofollow. That does not change.
 */
export const LANDINGS_INDEXABLE = false;

export function landingRobots(indexable = LANDINGS_INDEXABLE) {
  return indexable ? 'index, follow' : 'noindex, nofollow';
}
