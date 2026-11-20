


const escenas = [...document.querySelectorAll('[data-escena]')];
const rotuloEscena = document.getElementById('escenaActual');
const barra = document.getElementById('barra');

let actual = 0;
let pausado = false;
let temporizador = null;
let animacion = null;
let reanudador = null;

const suave = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function desplazar(destino, ms, alTerminar) {
  cancelAnimationFrame(animacion);
  const desde = scrollY, inicio = performance.now();
  const paso = (ahora) => {
    const k = Math.min((ahora - inicio) / ms, 1);
    scrollTo(0, desde + (destino - desde) * suave(k));
    if (k < 1) animacion = requestAnimationFrame(paso);
    else if (alTerminar) alTerminar();
  };
  animacion = requestAnimationFrame(paso);
}

function reiniciarBarra(ms) {
  barra.style.transition = 'none';
  barra.style.width = '0';
  void barra.offsetWidth;
  if (ms) {
    barra.style.transition = `width ${ms}ms linear`;
    barra.style.width = '100%';
  }
}

function permanecer(el) {
  const extra = el.offsetHeight - innerHeight;
  const ms = (parseFloat(el.dataset.dwell) || 9) * 1000 + (extra > 4 ? (extra / innerHeight) * 4000 : 0);
  reiniciarBarra(ms);
  if (extra > 4) desplazar(el.offsetTop + extra, ms * 0.9);
  temporizador = setTimeout(() => ir(actual + 1), ms);
}

function ir(i) {
  clearTimeout(temporizador);
  actual = (i + escenas.length) % escenas.length;
  const el = escenas[actual];
  rotuloEscena.textContent = el.dataset.nombre || '';
  reiniciarBarra(0);
  const vuelta = actual === 0 && scrollY > innerHeight * 2;
  desplazar(el.offsetTop, vuelta ? 2800 : 1800, () => permanecer(el));
}

function escenaMasCercana() {
  let mejor = 0, dist = Infinity;
  escenas.forEach((e, i) => {
    const d = Math.abs(e.offsetTop - scrollY);
    if (d < dist) { dist = d; mejor = i; }
  });
  return mejor;
}

function detener() {
  clearTimeout(temporizador);
  cancelAnimationFrame(animacion);
  const w = getComputedStyle(barra).width;
  barra.style.transition = 'none';
  barra.style.width = w;
}

function reanudar() {
  pausado = false;
  ir(escenaMasCercana());
}

function intervencionManual() {
  if (pausado) return;
  detener();
  clearTimeout(reanudador);
  reanudador = setTimeout(() => { if (!pausado) reanudar(); }, 15000);
}
addEventListener('wheel', intervencionManual, { passive: true });
addEventListener('touchstart', intervencionManual, { passive: true });

addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    clearTimeout(reanudador);
    if (pausado) reanudar();
    else { pausado = true; detener(); }
  } else if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') {
    e.preventDefault();
    clearTimeout(reanudador);
    pausado = false;
    ir(escenaMasCercana() + (e.code === 'ArrowRight' ? 1 : -1));
  } else if (e.key === 'f' || e.key === 'F') {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  }
});

let ocultaCursor;
addEventListener('mousemove', () => {
  document.body.classList.remove('sin-cursor');
  clearTimeout(ocultaCursor);
  ocultaCursor = setTimeout(() => document.body.classList.add('sin-cursor'), 2000);
});
document.body.classList.add('sin-cursor');

function arrancar() {
  if (pausado) return;
  scrollTo(0, 0);
  rotuloEscena.textContent = escenas[0].dataset.nombre;
  permanecer(escenas[0]);
}
if (document.readyState === 'complete') setTimeout(arrancar, 800);
else addEventListener('load', () => setTimeout(arrancar, 800));

let anchoPrevio = innerWidth, tRedim;
addEventListener('resize', () => {
  clearTimeout(tRedim);
  tRedim = setTimeout(() => {
    if (innerWidth === anchoPrevio) return;
    anchoPrevio = innerWidth;
    cancelAnimationFrame(animacion);
    scrollTo(0, escenas[actual].offsetTop);
    if (!pausado) { clearTimeout(temporizador); permanecer(escenas[actual]); }
  }, 350);
});


const revelar = new IntersectionObserver((entradas) => {
  entradas.forEach(e => e.target.classList.toggle('visible', e.isIntersecting));
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(el => revelar.observe(el));


const contar = new IntersectionObserver((entradas) => {
  entradas.forEach(e => {
    const el = e.target;
    const dec = parseInt(el.dataset.dec || 0);
    el._id = (el._id || 0) + 1;
    const miId = el._id;
    if (!e.isIntersecting) { el.textContent = (0).toFixed(dec); return; }
    const meta = parseFloat(el.dataset.to);
    const dur = 1400, ini = performance.now();
    const paso = (t) => {
      if (miId !== el._id) return;
      const k = Math.min((t - ini) / dur, 1);
      el.textContent = (meta * (1 - Math.pow(1 - k, 3))).toFixed(dec);
      if (k < 1) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  });
}, { threshold: 0.6 });
document.querySelectorAll('.count').forEach(el => contar.observe(el));


const reproducir = (v) => {
  v.muted = true;
  const p = v.play();
  if (p) p.catch(() => {});
};

const controlVideos = new IntersectionObserver((entradas) => {
  entradas.forEach(e => {
    if (e.isIntersecting) reproducir(e.target);
    else e.target.pause();
  });
}, { threshold: 0.4 });
document.querySelectorAll('.auto-video').forEach(v => controlVideos.observe(v));

const hero = document.querySelector('.hero-video');
if (hero) reproducir(hero);
['scroll', 'touchstart', 'click', 'keydown'].forEach(ev =>
  addEventListener(ev, () => hero && hero.paused && reproducir(hero), { once: true, passive: true })
);


const SVG_BRAZO = `<svg class="brazo-ph" viewBox="0 0 80 80" fill="none" stroke="#DDEBFF" stroke-width="5" stroke-linecap="round">
  <rect x="22" y="70" width="36" height="6" rx="2" fill="#22344F" stroke="none"/>
  <path d="M40 70 V42 L58 24"/><circle cx="40" cy="42" r="4" fill="#FF6A2B" stroke="none"/><circle cx="58" cy="24" r="4" fill="#FF6A2B" stroke="none"/>
  <path d="M58 24 l8 -4 M58 24 l4 8"/></svg>`;

function reemplazarPorCuadro(el) {
  if (el.dataset.fallo) return;
  el.dataset.fallo = '1';

  if (el.classList.contains('hero-video') || el.closest('.fullvideo')) { el.style.display = 'none'; return; }

  const ph = document.createElement('div');
  ph.className = 'ph';
  ph.innerHTML = `${SVG_BRAZO}<div><b>${el.dataset.rotulo || 'Falta un archivo'}</b><code>${el.getAttribute('src')}</code></div>`;
  el.replaceWith(ph);
}

document.addEventListener('error', (ev) => {
  const el = ev.target;
  if (el instanceof HTMLImageElement || el instanceof HTMLVideoElement) reemplazarPorCuadro(el);
}, true);

function revisarArchivosFaltantes() {
  document.querySelectorAll('img').forEach(i => { if (i.complete && i.naturalWidth === 0) reemplazarPorCuadro(i); });
  document.querySelectorAll('video').forEach(v => { if (v.error) reemplazarPorCuadro(v); });
}
addEventListener('load', revisarArchivosFaltantes);


const j1 = document.getElementById('j1'), j2 = document.getElementById('j2'), j3 = document.getElementById('j3');
const r1 = document.getElementById('r1'), r2 = document.getElementById('r2'), r3 = document.getElementById('r3');

function moverBrazo() {
  const max = document.documentElement.scrollHeight - innerHeight;
  const p = max > 0 ? scrollY / max : 0;

  const a1 = -40 + 80 * p;
  const a2 = 65 * Math.sin(p * Math.PI * 3);
  const a3 = 40 * Math.sin(p * Math.PI * 5);

  j1.setAttribute('transform', `translate(60,172) rotate(${a1})`);
  j2.setAttribute('transform', `translate(0,-60) rotate(${a2})`);
  j3.setAttribute('transform', `translate(0,-48) rotate(${a3})`);

  r1.textContent = Math.round(a1) + '°';
  r2.textContent = Math.round(a2) + '°';
  r3.textContent = Math.round(a3) + '°';
}
addEventListener('scroll', () => requestAnimationFrame(moverBrazo), { passive: true });
moverBrazo();
