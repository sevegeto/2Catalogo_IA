(function () {
  function getText(selector) {
    const el = document.querySelector(selector);
    return el ? el.textContent.trim() : '';
  }

  function getMeta(name) {
    const el = document.querySelector(`meta[property="${name}"], meta[name="${name}"]`);
    return el ? el.getAttribute('content') || '' : '';
  }

  function extractPrice() {
    const priceSelectors = [
      '[data-price]', '.price', '.product-price', '.a-price .a-offscreen',
      '[itemprop="price"]', '.current-price', '.sale-price', '.price-value',
      '.product-detail__price', '.price-now', '.offer-price',
    ];
    for (const sel of priceSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const text = el.textContent || el.getAttribute('content') || '';
        const match = text.match(/[\d.,]+/);
        if (match) {
          let priceStr = match[0].replace(/,(?=\d{2}\b)/, '.').replace(/,/g, '');
          const price = parseFloat(priceStr);
          if (!isNaN(price) && price > 0) return price;
        }
      }
    }
    return null;
  }

  function extractCurrency() {
    const currencySelectors = [
      '[itemprop="priceCurrency"]', '[data-currency]',
    ];
    for (const sel of currencySelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const val = el.getAttribute('content') || el.getAttribute('data-currency') || el.textContent.trim();
        if (val) return val.substring(0, 3).toUpperCase();
      }
    }
    const priceText = document.body?.innerText?.match(/\b(USD|MXN|EUR|COP|ARS|BRL|CLP|PEN|UYU)\b/i);
    if (priceText) return priceText[1].toUpperCase();
    return 'MXN';
  }

  function extractImages() {
    const images = [];
    const selectors = [
      'img[itemprop="image"]',
      '.product-image img', '.gallery-image', '.carousel-image',
      '.a-dynamic-image', '[data-zoom-image]',
      'picture source[srcset]',
      '.product__image img',
    ];
    selectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        const src = el.srcset || el.src || el.getAttribute('data-src') || '';
        if (src && !images.includes(src) && src.startsWith('http')) {
          images.push(src.split(' ')[0]);
        }
      });
    });
    if (images.length === 0) {
      document.querySelectorAll('img').forEach((img) => {
        const src = img.src || img.getAttribute('data-src') || '';
        if (src && src.startsWith('http') && img.width >= 100 && img.height >= 100 && !images.includes(src)) {
          images.push(src);
        }
      });
    }
    return images.slice(0, 10);
  }

  function extractBrand() {
    const brandSelectors = [
      '[itemprop="brand"]', '[data-brand]', '.product-brand',
      '.brand-name', '.manufacturer', '[itemprop="manufacturer"]',
    ];
    for (const sel of brandSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const val = el.getAttribute('content') || el.textContent.trim();
        if (val) return val;
      }
    }
    return getMeta('product:brand') || '';
  }

  function extractModel() {
    const modelSelectors = [
      '[itemprop="model"]', '[data-model]', '.product-model',
      '.model-number', '.item-model',
    ];
    for (const sel of modelSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const val = el.getAttribute('content') || el.textContent.trim();
        if (val) return val;
      }
    }
    return '';
  }

  function extractMPN() {
    const selectors = ['[itemprop="mpn"]', '[data-mpn]', '.mpn', '.manufacturer-part'];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        const val = el.getAttribute('content') || el.textContent.trim();
        if (val) return val;
      }
    }
    return '';
  }

  function extractUPC() {
    const selectors = ['[itemprop="gtin13"]', '[itemprop="gtin"]', '[data-upc]', '[data-gtin]', '.upc', '.gtin'];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        const val = el.getAttribute('content') || el.textContent.trim();
        if (val) return val;
      }
    }
    return '';
  }

  function extractASIN() {
    const match = window.location.href.match(/\/dp\/([A-Z0-9]{10})/);
    if (match) return match[1];
    const el = document.querySelector('[data-asin]');
    if (el) return el.getAttribute('data-asin') || '';
    return '';
  }

  function extractDescription() {
    const descSelectors = [
      '[itemprop="description"]', '.product-description',
      '#productDescription', '.product__description',
      '.product-detail__description', '[data-testid="product-description"]',
    ];
    for (const sel of descSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const text = el.textContent.trim().substring(0, 5000);
        if (text) return text;
      }
    }
    return getMeta('og:description') || getMeta('description') || '';
  }

  function extractTitle() {
    return (
      getMeta('og:title') ||
      getText('[itemprop="name"]') ||
      getText('h1') ||
      getText('.product-title') ||
      getText('.product-name') ||
      document.title
    );
  }

  function extractAttributes() {
    const attrs = {};
    const specContainers = [
      '.product-specifications table', '.tech-spec-table',
      '#feature-bullets ul', '.product-attributes',
      '[data-testid="product-specifications"]',
    ];
    specContainers.forEach((sel) => {
      const container = document.querySelector(sel);
      if (!container) return;
      container.querySelectorAll('tr, li, .spec-row').forEach((row) => {
        const cells = row.querySelectorAll('td, th, .spec-label, .spec-value');
        if (cells.length >= 2) {
          const key = cells[0].textContent.trim();
          const value = cells[1].textContent.trim();
          if (key && value && key.length < 100) {
            attrs[key] = value;
          }
        }
      });
    });
    return attrs;
  }

  function extractExternalReference() {
    if (window.location.hostname.includes('mercadolibre') || window.location.hostname.includes('mercadolivre')) {
      const match = window.location.pathname.match(/\/(ML[A-Z]?-\d+)/);
      if (match) return match[1];
    }
    if (window.location.hostname.includes('amazon.')) {
      const asin = extractASIN();
      if (asin) return asin;
    }
    return null;
  }

  function extractProduct() {
    const title = extractTitle();
    if (!title) return null;

    return {
      title: title,
      description: extractDescription(),
      brand: extractBrand() || null,
      model: extractModel() || null,
      mpn: extractMPN() || null,
      upc: extractUPC() || null,
      asin: extractASIN() || null,
      price: extractPrice(),
      currency: extractCurrency(),
      images: extractImages(),
      attributes: extractAttributes(),
      externalReference: extractExternalReference(),
      sourceUrl: window.location.href,
      sourceDomain: window.location.hostname,
      capturedAt: new Date().toISOString(),
    };
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'CAPTURE_PRODUCT') {
      try {
        const product = extractProduct();
        if (!product) {
          sendResponse({ success: false, error: 'No se encontro un titulo de producto en esta pagina' });
        } else {
          sendResponse({ success: true, data: product });
        }
      } catch (err) {
        sendResponse({ success: false, error: err.message || 'Error al extraer el producto' });
      }
    }
    return true;
  });
})();
