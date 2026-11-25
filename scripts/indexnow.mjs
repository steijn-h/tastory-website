// Meldt URL's van tastory.nl aan bij IndexNow (Bing, Yandex, Seznam, Naver;
// Bing deelt ze met o.a. Copilot). Zonder argumenten: alle URL's uit de
// sitemaps. Met argumenten: alleen die URL's.
//   node scripts/indexnow.mjs
//   node scripts/indexnow.mjs https://www.tastory.nl/restaurant/moeke-enschede-d0ed92
// De sleutel is openbaar (zo werkt IndexNow): public/61de10c7795362554e9a1e15f9d1fd4f.txt.
const KEY = '61de10c7795362554e9a1e15f9d1fd4f';
const HOST = 'www.tastory.nl';

async function sitemapUrls() {
  const index = await (await fetch(`https://${HOST}/sitemap-index.xml`)).text();
  const maps = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const urls = [];
  for (const map of maps) {
    const xml = await (await fetch(map)).text();
    urls.push(...[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
  }
  return [...new Set(urls)];
}

const urlList = process.argv.length > 2 ? process.argv.slice(2) : await sitemapUrls();
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({
    host: HOST,
    key: KEY,
    keyLocation: `https://${HOST}/${KEY}.txt`,
    urlList,
  }),
});
console.log(`${urlList.length} URL's aangemeld: ${res.status} ${res.statusText}`);
