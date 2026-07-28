const axios = require('axios');
const cheerio = require('cheerio');

const barcode = process.argv[2] || '8901030865563';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function testGoUpc() {
  const { data, status } = await axios.get(`https://go-upc.com/search?q=${barcode}`, {
    timeout: 20000,
    headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' },
    validateStatus: (s) => s < 500,
  });
  console.log('go-upc status', status, 'len', data.length);
  const $ = cheerio.load(data);
  console.log('h1', $('h1').first().text().trim());
  console.log('og:title', $('meta[property="og:title"]').attr('content'));
  console.log('og:image', $('meta[property="og:image"]').attr('content'));
  console.log('product-name', $('.product-name').text().trim());
  $('table tr').each((i, el) => {
    if (i > 8) return;
    console.log('row', $(el).text().replace(/\s+/g, ' ').trim());
  });
  // dump useful class names
  const classes = new Set();
  $('[class]').each((_, el) => {
    String($(el).attr('class') || '')
      .split(/\s+/)
      .forEach((c) => {
        if (/product|name|brand|image|title/i.test(c)) classes.add(c);
      });
  });
  console.log('classes', [...classes].slice(0, 30));
}

async function testBarcodeLookup() {
  const { data, status } = await axios.get(`https://www.barcodelookup.com/${barcode}`, {
    timeout: 20000,
    headers: { 'User-Agent': UA },
    validateStatus: (s) => s < 500,
  });
  console.log('bcl status', status);
  const $ = cheerio.load(data);
  console.log('h4', $('h4').first().text().trim());
  console.log('og:title', $('meta[property="og:title"]').attr('content'));
  console.log('#product-name', $('#product-name').text().trim());
}

async function testUpcitemdb() {
  const { data, status } = await axios.get('https://api.upcitemdb.com/prod/trial/lookup', {
    params: { upc: barcode },
    timeout: 15000,
    headers: { 'User-Agent': 'MerskoECommerce/1.0', Accept: 'application/json' },
    validateStatus: (s) => s < 500,
  });
  console.log('upcitemdb', status, JSON.stringify(data).slice(0, 400));
}

async function testOff() {
  for (const base of [
    'https://world.openfoodfacts.org',
    'https://world.openbeautyfacts.org',
    'https://world.openproductsfacts.org',
  ]) {
    const { data, status } = await axios.get(`${base}/api/v2/product/${barcode}.json`, {
      timeout: 12000,
      headers: { 'User-Agent': 'MerskoECommerce/1.0 (test)' },
      validateStatus: (s) => s < 500,
    });
    console.log(
      base.split('//')[1].split('.')[1],
      status,
      data.status,
      data.product?.product_name || data.product?.product_name_en || '-'
    );
  }
}

(async () => {
  console.log('CODE', barcode);
  try {
    await testOff();
  } catch (e) {
    console.log('off err', e.message);
  }
  try {
    await testUpcitemdb();
  } catch (e) {
    console.log('upc err', e.message);
  }
  try {
    await testGoUpc();
  } catch (e) {
    console.log('goupc err', e.response?.status, e.message);
  }
  try {
    await testBarcodeLookup();
  } catch (e) {
    console.log('bcl err', e.response?.status, e.message);
  }
})();
