const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let assinaturaConfirmada = false;

function ajustarCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}
ajustarCanvas();
window.addEventListener('resize', ajustarCanvas);

let desenhando = false;

function iniciar(e) {
  if (assinaturaConfirmada) return;
  e.preventDefault();
  desenhando = true;
  ctx.beginPath();
  const pos = pegarPosicao(e);
  ctx.moveTo(pos.x, pos.y);
}


function finalizar() {
  desenhando = false;
  ctx.beginPath();
}

function desenhar(e) {
  if (!desenhando || assinaturaConfirmada) return;
  e.preventDefault();

  const pos = pegarPosicao(e);
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#000';

  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
}

function pegarPosicao(e) {
  const rect = canvas.getBoundingClientRect();

  if (e.touches) {
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
    };
  } else {
    return {
      x: e.offsetX,
      y: e.offsetY
    };
  }
}

/* Eventos Mouse */
canvas.addEventListener('mousedown', iniciar);
canvas.addEventListener('mouseup', finalizar);
canvas.addEventListener('mousemove', desenhar);

/* Eventos Touch */
canvas.addEventListener('touchstart', iniciar);
canvas.addEventListener('touchend', finalizar);
canvas.addEventListener('touchmove', desenhar);

function limparAssinatura() {
  if (assinaturaConfirmada) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}


function confirmarAssinatura() {
  const imagem = canvas.toDataURL('image/png');
  document.getElementById('assinaturaInput').value = imagem;
  document.getElementById('assinaturaImg').src = imagem;

  assinaturaConfirmada = true;
  canvas.style.pointerEvents = 'none'; // trava total
}

