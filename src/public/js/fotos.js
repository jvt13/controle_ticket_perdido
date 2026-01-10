// fotos.js — gerencia tirar/mostrar até 5 fotos e armazenar em hidden inputs
const MAX_FOTOS = 4;
const fotos = [];
let replaceIndex = -1;

function criarInputFileTrigger() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.capture = 'environment';
  input.style.display = 'none';
  input.addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const dataUrl = await toDataURL(file);
    if (replaceIndex >= 0) {
      fotos[replaceIndex] = dataUrl;
    } else {
      if (fotos.length >= MAX_FOTOS) return;
      fotos.push(dataUrl);
    }
    replaceIndex = -1;
    renderFotos();
  });
  document.body.appendChild(input);
  return input;
}

function toDataURL(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

function renderFotos() {
  const container = document.getElementById('fotosContainer');
  const hidden = document.getElementById('hiddenFotos');
  const tirarBtn = document.getElementById('tirarFotoBtn');
  container.innerHTML = '';
  hidden.innerHTML = '';

  fotos.forEach((dataUrl, idx) => {
    const wrapper = document.createElement('div');
    wrapper.style.width = '80px';
    wrapper.style.height = '80px';
    wrapper.style.border = '1px solid #ccc';
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.justifyContent = 'center';
    wrapper.style.position = 'relative';
    wrapper.style.cursor = 'pointer';

    const img = document.createElement('img');
    img.src = dataUrl;
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100%';
    img.alt = 'Foto ' + (idx + 1);
    wrapper.title = 'Clique para substituir esta foto';

    const badge = document.createElement('span');
    badge.textContent = idx + 1;
    badge.style.position = 'absolute';
    badge.style.top = '2px';
    badge.style.left = '4px';
    badge.style.background = 'rgba(0,0,0,0.6)';
    badge.style.color = '#fff';
    badge.style.fontSize = '11px';
    badge.style.padding = '2px 6px';
    badge.style.borderRadius = '10px';

    wrapper.appendChild(img);
    wrapper.appendChild(badge);
    wrapper.addEventListener('click', () => {
      replaceIndex = idx;
      triggerFileInput();
    });

    container.appendChild(wrapper);

    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = 'fotos[]';
    hiddenInput.value = dataUrl;
    hidden.appendChild(hiddenInput);
  });

  // botão desabilita quando atinge limite
  if (tirarBtn) tirarBtn.disabled = fotos.length >= MAX_FOTOS;
}

let fileTrigger = null;
function triggerFileInput() {
  if (!fileTrigger) fileTrigger = criarInputFileTrigger();
  fileTrigger.value = null;
  fileTrigger.click();
}

document.addEventListener('DOMContentLoaded', () => {
  const tirarBtn = document.getElementById('tirarFotoBtn');
  if (tirarBtn) tirarBtn.addEventListener('click', () => {
    replaceIndex = -1;
    triggerFileInput();
  });
  renderFotos();
});

// export functions for debugging
window._fotosManager = { fotos, renderFotos };
