importScripts('api.js');

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

  if (!response?.success) {
    flashBadge('!', '#dc2626', 'No se pudo leer el producto de esta página');
    return;
  }

  try {
    await CatalogAI.submitCapture(response.data, tab.url);
    flashBadge('✓', '#16a34a', 'Captura enviada a CatalogAI');
  } catch (err) {
    console.error('CatalogAI capture submit error:', err);
    flashBadge('!', '#dc2626', err.message || 'No se pudo enviar la captura');
  }
});

// Sin popup abierto, el resultado se indica en el icono durante unos segundos.
function flashBadge(text, color, title) {
  chrome.action.setBadgeBackgroundColor({ color });
  chrome.action.setBadgeText({ text });
  chrome.action.setTitle({ title: `CatalogAI Capture — ${title}` });
  setTimeout(() => {
    chrome.action.setBadgeText({ text: '' });
    chrome.action.setTitle({ title: 'CatalogAI Capture' });
  }, 6000);
}
