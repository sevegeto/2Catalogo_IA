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
  const loginForm = $('login-form');
  const loginBtn = $('login-btn');
  const emailInput = $('login-email');
  const passwordInput = $('login-password');
  const sessionInfo = $('session-info');
  const sessionEmail = $('session-email');
  const logoutBtn = $('logout-btn');

  function showStatus(msg, type) {
    statusEl.className = 'status ' + type;
    statusEl.textContent = msg;
  }

  function clearStatus() {
    statusEl.className = 'status';
    statusEl.textContent = '';
  }

  async function render() {
    const config = await CatalogAI.getConfig();
    if (config.url && !urlInput.value) urlInput.value = config.url;
    if (config.key && !keyInput.value) keyInput.value = config.key;
    const session = config.url && config.key ? await CatalogAI.getSession() : null;
    const configured = !!config.url && !!config.key;

    loginForm.style.display = session ? 'none' : 'block';
    sessionInfo.style.display = session ? 'block' : 'none';
    sessionEmail.textContent = session ? session.email : '';
    loginBtn.disabled = !configured;
    captureBtn.disabled = !session;

    if (session) {
      connBadge.textContent = 'Conectado';
      connBadge.style.background = 'rgba(74, 222, 128, 0.25)';
    } else {
      connBadge.textContent = configured ? 'Sin sesión' : 'No config';
      connBadge.style.background = 'rgba(255, 255, 255, 0.2)';
    }
  }

  saveBtn.addEventListener('click', async () => {
    try {
      await CatalogAI.saveConfig(urlInput.value, keyInput.value);
      showStatus('Configuracion guardada', 'success');
      setTimeout(clearStatus, 2000);
    } catch (err) {
      showStatus(err.message, 'error');
    }
    await render();
  });

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    loginBtn.disabled = true;
    clearStatus();
    try {
      await CatalogAI.signIn(emailInput.value, passwordInput.value);
      showStatus('Sesión iniciada', 'success');
      setTimeout(clearStatus, 2000);
    } catch (err) {
      showStatus(err.message, 'error');
    } finally {
      passwordInput.value = '';
      await render();
    }
  });

  logoutBtn.addEventListener('click', async () => {
    await CatalogAI.signOut();
    showStatus('Sesión cerrada', 'info');
    setTimeout(clearStatus, 2000);
    await render();
  });

  render();

  function isRestrictedPage(url) {
    return !url || /^(chrome|edge|about|chrome-extension|devtools|view-source|file):/i.test(url) || url.startsWith('https://chromewebstore.google.com');
  }

  async function requestProduct(tab) {
    if (!tab.id || isRestrictedPage(tab.url)) {
      throw new Error('Chrome no permite leer esta pestaña. Abre una página normal de producto y vuelve a intentarlo.');
    }

    try {
      return await chrome.tabs.sendMessage(tab.id, { type: 'CAPTURE_PRODUCT' });
    } catch (_messageError) {
      try {
        await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
        return await chrome.tabs.sendMessage(tab.id, { type: 'CAPTURE_PRODUCT' });
      } catch (_injectionError) {
        throw new Error('No se pudo activar el lector. Recarga la página del producto y vuelve a intentarlo.');
      }
    }
  }

  captureBtn.addEventListener('click', async () => {
    clearStatus();
    previewEl.classList.remove('visible');

    if (!(await CatalogAI.getSession())) {
      showStatus('Inicia sesión para enviar capturas', 'error');
      await render();
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

      const response = await requestProduct(tab);

      if (!response || !response.success) {
        showStatus(response?.error || 'No se pudo extraer el producto', 'error');
        return;
      }

      const product = response.data;
      showPreview(product);

      showStatus('Enviando a CatalogAI...', 'info');
      await CatalogAI.submitCapture(product, tab.url);

      showStatus('Producto capturado y enviado a CatalogAI', 'success');
    } catch (err) {
      showStatus('Error: ' + (err.message || 'desconocido'), 'error');
      console.error('Capture error:', err);
    } finally {
      captureBtn.innerHTML = originalHTML;
      await render();
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
