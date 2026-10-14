(function () {
  // ----------------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------------
  function getText(selector) {
    const el = document.querySelector(selector);
    return el ? el.textContent.trim() : '';
  }

  function getMeta(name) {
    const el = document.querySelector(
      `meta[property="${name}"], meta[name="${name}"]`
    );
    return el ? (el.getAttribute('content') || '').trim() : '';
  }

  function cleanText(str) {
    if (!str) return '';
    return str.replace(/\s+/g, ' ').trim();
  }

  // Strip site suffix like "| Free Shipping at Academy" or "| eBay"
  function cleanTitle(raw) {
    if (!raw) return '';
    return cleanText(raw)
      .replace(/\s*[\|\-—]\s*(free shipping|ebay|amazon|walmart|bestbuy|academy|mercado|mercadolibre|mercadolivre|gun\.deals|optics planet|buds gun shop|sportsman's warehouse|academy sports)[^]*$/i, '')
      .trim();
  }

  // Only keep a valid UPC/EAN/GTIN (8-14 digits, no spaces, no HTML)
  function cleanUPC(str) {
    if (!str) return '';
    const match = (str || '').match(/\b(\d{8,14})\b/);
    return match ? match[1] : '';
  }

  function getProductSchemas() {
    const products = [];
    document.querySelectorAll('script[type="application/ld+json"]').forEach((script) => {
      try {
        const parsed = JSON.parse(script.textContent || '');
        const values = Array.isArray(parsed) ? parsed : [parsed];
        values.forEach((value) => {
          const graph = Array.isArray(value?.['@graph']) ? value['@graph'] : [value];
          graph.forEach((entry) => {
            const types = Array.isArray(entry?.['@type']) ? entry['@type'] : [entry?.['@type']];
            if (types.some((type) => String(type).toLowerCase() === 'product')) products.push(entry);
          });
        });
      } catch (_error) {
        // Ignore invalid structured data from the page.
      }
    });
    return products;
  }

  function getProductSchema() {
    return getProductSchemas()[0] || null;
  }

  function schemaText(value) {
    if (typeof value === 'string') return cleanText(value);
    if (value && typeof value === 'object' && typeof value.name === 'string') return cleanText(value.name);
    return '';
  }

  function schemaPrice(product) {
    const offers = Array.isArray(product?.offers) ? product.offers[0] : product?.offers;
    const value = offers?.price ?? product?.price;
    const number = Number.parseFloat(String(value || '').replace(/,/g, ''));
    return Number.isFinite(number) && number > 0 ? number : null;
  }

  function isUsableBrand(value) {
    const normalized = cleanText(value).toLowerCase();
    return Boolean(normalized) && normalized.length < 60 && !/^(add to cart|buy now|shop now|visit store|official store|na|n\/a|none)$/i.test(normalized);
  }

  // ----------------------------------------------------------------
  // Site-specific extractors (called first, then generic fallback)
  // ----------------------------------------------------------------
  const hostname = window.location.hostname.replace(/^www\./, '');

  function extractTitleSiteSpecific() {
    // Amazon
    if (hostname.includes('amazon.')) {
      return (
        getText('#productTitle') ||
        getText('#title') ||
        getText('.product-title-word-break')
      );
    }
    // MercadoLibre
    if (hostname.includes('mercadolibre') || hostname.includes('mercadolivre')) {
      return getText('h1.ui-pdp-title') || getText('.ui-pdp-title');
    }
    // eBay
    if (hostname.includes('ebay.')) {
      return getText('h1.x-item-title__mainTitle span') || getText('#itemTitle');
    }
    // gun.deals
    if (hostname.includes('gun.deals')) {
      return getText('h1.node-title') || getText('h1');
    }
    // Academy
    if (hostname.includes('academy.com')) {
      return getText('h1[data-aui-component]') || getText('h1');
    }
    return '';
  }

  function extractBrandSiteSpecific() {
    if (hostname.includes('amazon.')) {
      return (
        getText('#bylineInfo') ||
        getText('#brand') ||
        getText('.po-brand .po-break-word') ||
        getText('tr.po-brand td:last-child')
      );
    }
    if (hostname.includes('mercadolibre') || hostname.includes('mercadolivre')) {
      const brandEl = document.querySelector(
        'span.ui-pdp-action-modal__link, [class*="brand"] a, .andes-table__column--value a'
      );
      return brandEl ? cleanText(brandEl.textContent) : '';
    }
    if (hostname.includes('ebay.')) {
      const row = [...document.querySelectorAll('.ux-labels-values__labels')].find(
        (el) => el.textContent.trim().toLowerCase() === 'brand'
      );
      return row ? cleanText(row.nextElementSibling?.textContent || '') : '';
    }
    return '';
  }

  function extractPriceSiteSpecific() {
    if (hostname.includes('amazon.')) {
      const el =
        document.querySelector('.a-price .a-offscreen') ||
        document.querySelector('#priceblock_ourprice') ||
        document.querySelector('#priceblock_dealprice') ||
        document.querySelector('.apexPriceToPay .a-offscreen');
      if (el) {
        const m = el.textContent.match(/[\d.,]+/);
        if (m) return parseFloat(m[0].replace(/,(?=\d{3})/g, '').replace(',', '.'));
      }
    }
    if (hostname.includes('mercadolibre') || hostname.includes('mercadolivre')) {
      const el =
        document.querySelector('.andes-money-amount__fraction') ||
        document.querySelector('[class*="price-fraction"]');
      if (el) {
        const m = el.textContent.match(/[\d.,]+/);
        if (m) return parseFloat(m[0].replace(/,/g, ''));
      }
    }
    if (hostname.includes('ebay.')) {
      const el =
        document.querySelector('.x-price-primary .ux-textspans') ||
        document.querySelector('#prcIsum');
      if (el) {
        const m = el.textContent.match(/[\d.,]+/);
        if (m) return parseFloat(m[0].replace(/,/g, ''));
      }
    }
    if (hostname.includes('gun.deals')) {
      const titlePrice = extractTitle().match(/(?:-|–|—|:)\s*\$\s*([\d.,]+)/);
      if (titlePrice) return parseFloat(titlePrice[1].replace(/,/g, ''));

      const selectors = [
        '[data-price]', '.deal-price', '.current-price', '.product-price',
        '.price-current', '.deal-card .price', '.deal-listing .price',
      ];
      for (const selector of selectors) {
        const el = document.querySelector(selector);
        const match = el?.textContent?.match(/\$\s*([\d.,]+)/);
        if (match) {
          const value = parseFloat(match[1].replace(/,/g, ''));
          if (value > 0) return value;
        }
      }
      return null;
    }
    if (hostname.includes('academy.com')) {
      const el =
        document.querySelector('[data-aui-component="price"] .styled__StyledPriceWrapper') ||
        document.querySelector('.price-now') ||
        document.querySelector('[class*="CurrentPrice"]');
      if (el) {
        const m = el.textContent.match(/[\d.,]+/);
        if (m) return parseFloat(m[0].replace(/,/g, ''));
      }
    }
    return null;
  }

  function extractUPCSiteSpecific() {
    // Amazon rarely shows UPC in DOM; skip
    if (hostname.includes('amazon.')) return '';
    // eBay tech specs table
    if (hostname.includes('ebay.')) {
      const rows = document.querySelectorAll('.ux-labels-values__labels');
      for (const row of rows) {
        const label = row.textContent.trim().toLowerCase();
        if (label === 'upc' || label === 'ean' || label === 'gtin') {
          return cleanUPC(row.nextElementSibling?.textContent || '');
        }
      }
    }
    // MercadoLibre attributes table
    if (hostname.includes('mercadolibre') || hostname.includes('mercadolivre')) {
      const rows = document.querySelectorAll('.andes-table__row');
      for (const row of rows) {
        const cells = row.querySelectorAll('.andes-table__column');
        if (cells.length >= 2) {
          const label = cells[0].textContent.trim().toLowerCase();
          if (label.includes('gtin') || label.includes('ean') || label.includes('upc')) {
            return cleanUPC(cells[1].textContent);
          }
        }
      }
    }
    return '';
  }

  // ----------------------------------------------------------------
  // Generic extractors (fallback)
  // ----------------------------------------------------------------
  function extractPrice() {
    const schemaPriceValue = schemaPrice(getProductSchema());
    if (!hostname.includes('gun.deals') && schemaPriceValue !== null) return schemaPriceValue;

    const sitePrice = extractPriceSiteSpecific();
    if (sitePrice !== null || hostname.includes('gun.deals')) return sitePrice;

    const priceSelectors = [
      '[itemprop="price"]', '.product-price', '.current-price',
      '.sale-price', '.price-value', '.price-now', '.offer-price',
    ];
    for (const sel of priceSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const text = el.textContent || el.getAttribute('content') || '';
        const match = text.match(/[\d.,]+/);
        if (match) {
          const price = parseFloat(match[0].replace(/,(?=\d{2}\b)/, '.').replace(/,/g, ''));
          if (!isNaN(price) && price > 0) return price;
        }
      }
    }
    return null;
  }

  function extractCurrency() {
    if (hostname.includes('amazon.') || hostname.includes('ebay.') || hostname.includes('gun.deals') || hostname.includes('academy.com')) {
      return 'USD';
    }
    if (hostname.includes('mercadolibre.com.mx') || hostname.includes('mercadolibre.com.co')) {
      return hostname.includes('.mx') ? 'MXN' : 'COP';
    }
    const selectors = ['[itemprop="priceCurrency"]', '[data-currency]'];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        const val = el.getAttribute('content') || el.getAttribute('data-currency') || el.textContent.trim();
        if (val && /^[A-Z]{3}$/.test(val)) return val.toUpperCase();
      }
    }
    const m = document.body?.innerText?.match(/\b(USD|MXN|EUR|COP|ARS|BRL|CLP|PEN|UYU)\b/i);
    return m ? m[1].toUpperCase() : 'USD';
  }

  function extractImages() {
    const images = [];
    const schema = getProductSchema();
    const schemaImages = Array.isArray(schema?.image) ? schema.image : [schema?.image];
    schemaImages.forEach((image) => {
      const url = typeof image === 'string' ? image : image?.url;
      if (url && /^https?:\/\//i.test(url) && !images.includes(url)) images.push(url);
    });

    // Site-specific selectors first
    let siteSelectors = [];
    if (hostname.includes('amazon.')) {
      siteSelectors = ['#landingImage', '#imgBlkFront', '.a-dynamic-image', '#imageBlock img'];
    } else if (hostname.includes('mercadolibre') || hostname.includes('mercadolivre')) {
      siteSelectors = ['.ui-pdp-gallery__figure img', '.ui-pdp-image'];
    } else if (hostname.includes('ebay.')) {
      siteSelectors = ['.ux-image-carousel-item img', '#icImg'];
    } else if (hostname.includes('academy.com')) {
      siteSelectors = ['[data-testid="main-product-image"] img', '.slick-slide img'];
    }

    const allSelectors = [
      ...siteSelectors,
      'img[itemprop="image"]',
      '.product-image img', '.gallery-image', '.carousel-image',
      'picture source[srcset]', '[data-zoom-image]', '.product__image img',
    ];

    allSelectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        let src = el.getAttribute('data-old-hires') ||
          el.getAttribute('data-zoom-image') ||
          el.getAttribute('data-src') ||
          el.srcset || el.src || '';
        src = src.split(' ')[0];
        if (src && src.startsWith('http') && !images.includes(src)) {
          images.push(src);
        }
      });
    });

    // Fallback: any sufficiently large image
    if (images.length === 0) {
      document.querySelectorAll('img').forEach((img) => {
        const src = img.src || img.getAttribute('data-src') || '';
        if (src && src.startsWith('http') && img.naturalWidth >= 100 && img.naturalHeight >= 100 && !images.includes(src)) {
          images.push(src);
        }
      });
    }

    return images.slice(0, 10);
  }

  function extractBrand() {
    const site = extractBrandSiteSpecific();
    if (isUsableBrand(site)) return cleanText(site);

    const schemaBrand = schemaText(getProductSchema()?.brand || getProductSchema()?.manufacturer);
    if (isUsableBrand(schemaBrand)) return schemaBrand;

    const brandSelectors = [
      '[itemprop="brand"] [itemprop="name"]',
      '[itemprop="brand"]',
      '[data-brand]', '.product-brand', '.brand-name',
      '[itemprop="manufacturer"]',
    ];
    for (const sel of brandSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const val = el.getAttribute('content') || el.textContent.trim();
        if (isUsableBrand(val)) return cleanText(val);
      }
    }
    return cleanText(getMeta('product:brand'));
  }

  function extractModel() {
    const schemaModel = schemaText(getProductSchema()?.model);
    if (schemaModel) return schemaModel;

    if (hostname.includes('amazon.')) {
      const rows = document.querySelectorAll('#productDetails_techSpec_section_1 tr, #detailBullets_feature_div li');
      for (const row of rows) {
        const text = row.textContent.toLowerCase();
        if (text.includes('item model number') || text.includes('model number')) {
          const val = row.querySelector('td:last-child, .a-list-item');
          if (val) return cleanText(val.textContent);
        }
      }
    }
    const selectors = ['[itemprop="model"]', '[data-model]', '.product-model', '.model-number', '.item-model'];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        const val = el.getAttribute('content') || el.textContent.trim();
        if (val) return cleanText(val);
      }
    }
    return '';
  }

  function extractMPN() {
    const schemaMpn = schemaText(getProductSchema()?.mpn);
    if (schemaMpn) return schemaMpn;

    if (hostname.includes('amazon.')) {
      const rows = document.querySelectorAll('#productDetails_techSpec_section_1 tr, #detailBullets_feature_div li');
      for (const row of rows) {
        const text = row.textContent.toLowerCase();
        if (text.includes('manufacturer part number') || text.includes('mpn')) {
          const val = row.querySelector('td:last-child, .a-list-item');
          if (val) return cleanText(val.textContent);
        }
      }
    }
    if (hostname.includes('gun.deals')) {
      // MPN often in title as "Model# XXX" or in specs
      const m = document.title.match(/\b([A-Z0-9]{3,}-[A-Z0-9]{2,})\b/);
      if (m) return m[1];
    }
    const selectors = ['[itemprop="mpn"]', '[data-mpn]', '.mpn', '.manufacturer-part'];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        const val = el.getAttribute('content') || el.textContent.trim();
        if (val) return cleanText(val);
      }
    }
    return '';
  }

  function extractUPC() {
    const schema = getProductSchema();
    const schemaUpc = cleanUPC(schema?.gtin13 || schema?.gtin12 || schema?.gtin14 || schema?.gtin || '');
    if (schemaUpc) return schemaUpc;

    const site = extractUPCSiteSpecific();
    if (site) return site;
    const selectors = ['[itemprop="gtin13"]', '[itemprop="gtin12"]', '[itemprop="gtin"]', '[data-upc]', '[data-gtin]', '.upc', '.gtin'];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        const val = el.getAttribute('content') || el.textContent.trim();
        const clean = cleanUPC(val);
        if (clean) return clean;
      }
    }
    return '';
  }

  function extractASIN() {
    const match = window.location.href.match(/\/dp\/([A-Z0-9]{10})/);
    if (match) return match[1];
    const el = document.querySelector('[data-asin]');
    if (el) {
      const val = el.getAttribute('data-asin') || '';
      if (val.length === 10) return val;
    }
    return '';
  }

  function extractDescription() {
    const descSelectors = [
      '[itemprop="description"]',
      '#productDescription p', '#feature-bullets .a-list-item',
      '.ui-pdp-description__content',
      '.product-description', '.product__description',
      '[data-testid="product-description"]',
    ];
    for (const sel of descSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const text = el.textContent.trim().substring(0, 2000);
        if (text.length > 20) return cleanText(text);
      }
    }
    return getMeta('og:description') || getMeta('description') || '';
  }

  function extractTitle() {
    const site = extractTitleSiteSpecific();
    if (site) return cleanTitle(site);

    const candidates = [
      getMeta('og:title'),
      getText('[itemprop="name"]'),
      getText('h1'),
      getText('.product-title'),
      getText('.product-name'),
    ].filter(Boolean);

    for (const c of candidates) {
      const cleaned = cleanTitle(c);
      if (cleaned && cleaned.length > 5) return cleaned;
    }

    return cleanTitle(document.title);
  }

  function extractAttributes() {
    const attrs = {};
    const specContainers = [
      '#productDetails_techSpec_section_1',
      '#productDetails_detailBullets_sections1',
      '.product-specifications table',
      '.tech-spec-table',
      '.andes-table',
      '[data-testid="product-specifications"]',
    ];
    specContainers.forEach((sel) => {
      const container = document.querySelector(sel);
      if (!container) return;
      container.querySelectorAll('tr, .andes-table__row').forEach((row) => {
        const cells = row.querySelectorAll('td, th, .andes-table__column');
        if (cells.length >= 2) {
          const key = cleanText(cells[0].textContent);
          const value = cleanText(cells[1].textContent);
          if (key && value && key.length < 80 && value.length < 200) {
            attrs[key] = value;
          }
        }
      });
    });

    // Amazon bullet points as attributes
    if (hostname.includes('amazon.')) {
      document.querySelectorAll('#feature-bullets li .a-list-item').forEach((el) => {
        const text = cleanText(el.textContent);
        const sep = text.indexOf(':');
        if (sep > 0 && sep < 60) {
          attrs[text.substring(0, sep).trim()] = text.substring(sep + 1).trim();
        }
      });
    }

    return attrs;
  }

  function extractExternalReference() {
    if (hostname.includes('mercadolibre') || hostname.includes('mercadolivre')) {
      const match = window.location.pathname.match(/\/(ML[A-Z]?-?\d+)/);
      if (match) return match[1];
    }
    if (hostname.includes('amazon.')) {
      return extractASIN() || null;
    }
    if (hostname.includes('ebay.')) {
      const m = window.location.pathname.match(/\/(\d{10,13})/);
      if (m) return m[1];
    }
    return null;
  }

  function extractProduct() {
    const title = extractTitle();
    if (!title || title.length < 3) return null;

    // Final safety: if extracted UPC looks like garbage (>14 chars of digits) discard
    const rawUpc = extractUPC();
    const safeUpc = rawUpc && /^\d{8,14}$/.test(rawUpc) ? rawUpc : null;

    const rawMpn = extractMPN();
    const safeMpn = rawMpn && rawMpn.length <= 50 ? rawMpn : null;

    const rawBrand = extractBrand();
    const safeBrand = rawBrand && rawBrand.length <= 80 ? rawBrand : null;

    return {
      title,
      description: extractDescription(),
      brand: safeBrand || null,
      model: extractModel() || null,
      mpn: safeMpn || null,
      upc: safeUpc || null,
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
