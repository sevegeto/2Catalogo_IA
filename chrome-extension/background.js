chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'catalogai-capture',
    title: 'Capturar producto en CatalogAI',
    contexts: ['page', 'image', 'link'],
  });
});

function isRestrictedPage(url) {
  return !url || /^(chrome|edge|about|chrome-extension|devtools|view-source|file):/i.test(url) || url.startsWith('https://chromewebstore.google.com');
}

async function requestProduct(tabId, tabUrl) {
  if (isRestrictedPage(tabUrl)) return null;

  try {
    return await chrome.tabs.sendMessage(tabId, { type: 'CAPTURE_PRODUCT' });
  } catch (_messageError) {
    try {
      await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
      return await chrome.tabs.sendMessage(tabId, { type: 'CAPTURE_PRODUCT' });
    } catch (_injectionError) {
      console.error('CatalogAI: no se puede leer esta pagina.');
      return null;
    }
  }
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'catalogai-capture' || !tab?.id) return;

  const response = await requestProduct(tab.id, tab.url);

  if (!response?.success) return;

  chrome.storage.local.get(['supabaseUrl', 'supabaseKey'], (config) => {
    if (!config.supabaseUrl || !config.supabaseKey) {
      console.error('CatalogAI: Supabase no configurado');
      return;
    }

    const product = response.data;
    const insertData = {
      id: 'cap_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      source_type: 'CHROME_EXTENSION',
      source_url: tab.url,
      source_domain: new URL(tab.url).hostname,
      captured_title: product.title || 'Sin titulo',
      captured_description: product.description || null,
      captured_brand: product.brand || null,
      captured_model: product.model || null,
      captured_mpn: product.mpn || null,
      captured_upc: product.upc || null,
      captured_asin: product.asin || null,
      captured_price: product.price || null,
      captured_currency: product.currency || 'MXN',
      captured_attributes: product.attributes || {},
      captured_images: product.images || [],
      raw_payload: JSON.parse(JSON.stringify(product)),
      status: 'RECEIVED',
      captured_by: 'chrome_extension',
      captured_at: new Date().toISOString(),
    };

    fetch(`${config.supabaseUrl}/rest/v1/captures`, {
      method: 'POST',
      headers: {
        apikey: config.supabaseKey,
        Authorization: `Bearer ${config.supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(insertData),
    }).catch((err) => {
      console.error('CatalogAI capture submit error:', err);
    });
  });
});
