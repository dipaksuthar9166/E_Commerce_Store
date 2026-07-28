const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const barcode = process.argv[2] || '8901030865563';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

(async () => {
  // Save go-upc HTML for Indian code
  try {
    const r = await axios.get(`https://go-upc.com/search?q=${barcode}`, {
      timeout: 20000,
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      validateStatus: () => true,
    });
    fs.writeFileSync('_goupc.html', r.data);
    console.log('go-upc', r.status, r.data.slice(0, 500).replace(/\s+/g, ' '));
  } catch (e) {
    console.log('go-upc fail', e.message);
  }

  // DuckDuckGo HTML
  try {
    const r = await axios.get('https://html.duckduckgo.com/html/', {
      params: { q: `${barcode} product` },
      timeout: 15000,
      headers: { 'User-Agent': UA },
      validateStatus: () => true,
    });
    const $ = cheerio.load(r.data);
    const results = [];
    $('.result__a, a.result__a').each((i, el) => {
      if (i < 5) results.push($(el).text().trim());
    });
    console.log('ddg titles', results);
    $('.result__snippet').each((i, el) => {
      if (i < 3) console.log('snip', $(el).text().trim().slice(0, 120));
    });
  } catch (e) {
    console.log('ddg fail', e.message);
  }

  // Bing
  try {
    const r = await axios.get('https://www.bing.com/search', {
      params: { q: `${barcode} barcode product name` },
      timeout: 15000,
      headers: { 'User-Agent': UA },
      validateStatus: () => true,
    });
    const $ = cheerio.load(r.data);
    const titles = [];
    $('h2 a, li.b_algo h2 a').each((i, el) => {
      if (i < 5) titles.push($(el).text().trim());
    });
    console.log('bing', r.status, titles);
  } catch (e) {
    console.log('bing fail', e.message);
  }

  // OFF v0 with user agent contact as required
  try {
    const r = await axios.get(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      {
        timeout: 15000,
        headers: {
          'User-Agent': 'MerskoECommerce/1.0 (barcode-lookup; https://github.com/example)',
        },
        validateStatus: () => true,
      }
    );
    console.log('off v0', r.status, r.data.status, r.data.product?.product_name);
  } catch (e) {
    console.log('off fail', e.message);
  }

  // Try ean-search API free?
  try {
    const r = await axios.get(`https://eandata.com/feed/?v=3&keycode=FREE&mode=json&find=${barcode}`, {
      timeout: 12000,
      validateStatus: () => true,
    });
    console.log('eandata', r.status, JSON.stringify(r.data).slice(0, 300));
  } catch (e) {
    console.log('eandata', e.message);
  }
})();
