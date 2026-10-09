(function () {
  const $ = (id) => document.getElementById(id);

  const urlInput = $('supabase-url');
  const keyInput = $('supabase-key');
  const saveBtn = $('save-config');
  const captureBtn = $('capture-btn');
  const statusEl = $('status');
  const previewEl = $('preview');
  const previewTitle = $('preview-title');
  const previewRows = $('preview-rows');
  const previewImages = $('preview-images');
  const connBadge = $('conn-badge');

  function showStatus(msg, type) {
    statusEl.className = 'status ' + type;
    statusEl.textContent = msg;
  }

  function clearStatus() {
    statusEl.className = 'status';
    statusEl.textContent = '';
  }

  function updateBadge(configured) {
    if (configured) {
      connBadge.textContent = 'Conectado';
      connBadge.style.background = 'rgba(74, 222, 128, 0.25)';
    } else {
      connBadge.textContent = 'No config';
      connBadge.style.background = 'rgba(255, 255, 255, 0.2)';
    }
  }

  chrome.storage.local.get(['supabaseUrl', 'supabaseKey'], (result) => {
    if (result.supabaseUrl) urlInput.value = result.supabaseUrl;
    if (result.supabaseKey) keyInput.value = result.supabaseKey;
    updateBadge(!!result.supabaseUrl && !!result.supabaseKey);
  });

  saveBtn.addEventListener('click', () => {
    const url = urlInput.value.trim().replace(/\/$/, '');
    const key = keyInput.value.trim();
    if (!url || !key) {
      showStatus('Completa la URL y la Anon Key', 'error');
      return;
    }
    chrome.storage.local.set({ supabaseUrl: url, supabaseKey: key }, () => {
      updateBadge(true);
      showStatus('Configuracion guardada', 'success');
      setTimeout(clearStatus, 2000);
    });
  });

  captureBtn.addEventListener('click', async () => {
    clearStatus();
    previewEl.classList.remove('visible');

    const config = await chrome.storage.local.get(['supabaseUrl', 'supabaseKey']);
    if (!config.supabaseUrl || !config.supabaseKey) {
      showStatus('Configura Supabase primero', 'error');
      return;
    }

    captureBtn.disabled = true;
    const originalHTML = captureBtn.innerHTML;
    captureBtn.innerHTML = '<span class="spinner"></span> Extrayendo...';

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) {
        showStatus('No se encontro la pestana activa', 'error');
        return;
      }

      const response = await chrome.tabs.sendMessage(tab.id, { type: 'CAPTURE_PRODUCT' });

      if (!response || !response.success) {
        showStatus(response?.error || 'No se pudo extraer el producto', 'error');
        return;
      }

      const product = response.data;
      showPreview(product);

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

      showStatus('Enviando a CatalogAI...', 'info');

      const apiResponse = await fetch(`${config.supabaseUrl}/rest/v1/captures`, {
        method: 'POST',
        headers: {
          'apikey': config.supabaseKey,
          'Authorization': `Bearer ${config.supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(insertData),
      });

      if (!apiResponse.ok) {
        const errBody = await apiResponse.text();
        showStatus(`Error del servidor: ${apiResponse.status}`, 'error');
        console.error('Insert error:', errBody);
        return;
      }

      showStatus('Producto capturado y enviado a CatalogAI', 'success');
    } catch (err) {
      showStatus('Error: ' + (err.message || 'desconocido'), 'error');
      console.error('Capture error:', err);
    } finally {
      captureBtn.disabled = false;
      captureBtn.innerHTML = originalHTML;
    }
  });

  function showPreview(product) {
    previewTitle.textContent = product.title || 'Sin titulo';
    previewRows.innerHTML = '';

    const fields = [
      ['Marca', product.brand],
      ['Modelo', product.model],
      ['MPN', product.mpn],
      ['UPC', product.upc],
      ['ASIN', product.asin],
      ['Precio', product.price ? `${product.currency || 'MXN'} ${product.price}` : null],
      ['Imagenes', product.images ? `${product.images.length} encontradas` : null],
    ];

    fields.forEach(([label, value]) => {
      if (!value) return;
      const row = document.createElement('div');
      row.className = 'preview-row';
      row.innerHTML = `<span>${label}</span><span>${escapeHtml(String(value))}</span>`;
      previewRows.appendChild(row);
    });

    previewImages.innerHTML = '';
    if (product.images && product.images.length > 0) {
      product.images.slice(0, 5).forEach((url) => {
        const img = document.createElement('img');
        img.src = url;
        img.alt = 'product';
        img.onerror = () => { img.style.display = 'none'; };
        previewImages.appendChild(img);
      });
    }

    previewEl.classList.add('visible');
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();
