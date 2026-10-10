/* ===== EDIT ME ===== */
const CONFIG = {
  loaderMs: 3000, // how long the jumbled "Brewing some cool things" screen stays (ms)
  leetcode: {     // live stats are fetched automatically; these show only if the fetch fails
    user: 'sneha_goyal7',
    rank: null, solved: '300+', easy: null, medium: null, hard: null,
    total: 3800   // approx. total LeetCode problems, used for the ring if live stats fail
  }
};
/* ==================== */

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;

/* 1. Loader: letters stay jumbled, then settle left to right */
(function () {
  const el = $('#scr'), final = 'cool things';
  const pool = final.replace(' ', '');
  const ms = reduce ? 500 : CONFIG.loaderMs, t0 = performance.now();
  const rnd = () => {
    const c = pool[Math.random() * pool.length | 0];
    return Math.random() > .5 ? c.toUpperCase() : c;
  };
  (function tick() {
    const p = Math.min((performance.now() - t0) / ms, 1);
    const fixed = Math.floor(Math.max(0, p - .35) / .65 * final.length);
    el.textContent = [...final].map((c, i) => (c === ' ' || i < fixed) ? c : rnd()).join('');
    if (p < 1) setTimeout(tick, 90);
    else {
      el.textContent = final;
      setTimeout(() => {
        $('#loader').classList.add('done');
        document.body.classList.remove('loading');
      }, 400);
    }
  })();
})();

/* 2. Custom cursor */
if (fine) {
  document.body.classList.add('fine');
  const cur = $('#cursor');
  let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my;
  addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  (function f() {
    cx += (mx - cx) * .2; cy += (my - cy) * .2;
    cur.style.transform = `translate(${cx}px,${cy}px) translate(-50%,-50%)`;
    requestAnimationFrame(f);
  })();
  document.addEventListener('mouseover', e =>
    cur.classList.toggle('big', !!e.target.closest('a,button,.l')));
} else $('#cursor').remove();

/* 3. Hero: split name into letters, wavy tagline */
$('#name').innerHTML = [...$('#name').textContent]
  .map(c => c === ' ' ? '<span class="l sp"></span>' : `<span class="l">${c}</span>`).join('');
const tag = $('#tag');
tag.innerHTML = tag.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
const words = $$('.w');
let amp = 1, target = 1;
tag.addEventListener('mouseenter', () => target = 0);
tag.addEventListener('mouseleave', () => target = 1);
if (!reduce) (function wave(t) {
  amp += (target - amp) * .08;
  words.forEach((w, i) => {
    w.style.transform = `translateY(${Math.sin(t / 900 + i * .7) * 12 * amp}px) rotate(${Math.sin(t / 1300 + i) * 16 * amp}deg)`;
  });
  requestAnimationFrame(wave);
})(0);

/* 4. GitHub tablet tilt */
const tab = $('#tablet');
if (fine && !reduce) {
  tab.addEventListener('mousemove', e => {
    const r = tab.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    tab.style.transform = `rotateY(${-10 + x * 10}deg) rotateX(${6 - y * 10}deg)`;
  });
  tab.addEventListener('mouseleave', () => tab.style.transform = 'rotateY(-10deg) rotateX(6deg)');
  tab.style.transform = 'rotateY(-10deg) rotateX(6deg)';
}

/* 5. Side label + scroll reveals */
const side = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) {
    $('#sideName').textContent = e.target.dataset.label;
    $('#sideNum').textContent = e.target.dataset.n;
  }
}), { rootMargin: '-45% 0px -45% 0px' });
$$('[data-label]').forEach(s => side.observe(s));
const rv = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); rv.unobserve(e.target); }
}), { threshold: .15 });
$$('.rv').forEach(el => rv.observe(el));

/* 6. LeetCode card: live stats from a public stats API, CONFIG values as fallback */
const L = CONFIG.leetcode;
const fmt = v => v == null ? '—' : (typeof v === 'number' ? v.toLocaleString() : v);
const frac = (a, b) => a == null ? '—' : (b ? `${fmt(a)} / ${fmt(b)}` : fmt(a));
const ring = $('#ring'), C = 2 * Math.PI * 118;
ring.style.strokeDasharray = C;
ring.style.strokeDashoffset = C;
function showLC(d) {
  $('#lc-user').textContent = '@' + L.user;
  $('#lc-rank').textContent = fmt(d.rank);
  $('#lc-solved').textContent = fmt(d.solved);
  $('#lc-of').textContent = d.total ? `of ${fmt(d.total)} problems solved` : 'problems solved';
  $('#lc-easy').textContent = frac(d.easy, d.totalEasy);
  $('#lc-medium').textContent = frac(d.medium, d.totalMedium);
  $('#lc-hard').textContent = frac(d.hard, d.totalHard);
  const n = parseInt(d.solved) || 0;
  setTimeout(() => ring.style.strokeDashoffset = C * (1 - Math.min(n / (d.total || L.total), 1)), 400);
}
showLC(L);
fetch(`https://leetcode-stats-api.herokuapp.com/${L.user}`)
  .then(r => r.json())
  .then(d => {
    if (d.status !== 'success') throw new Error('no data');
    showLC({ rank: d.ranking, solved: d.totalSolved, total: d.totalQuestions,
      easy: d.easySolved, totalEasy: d.totalEasy, medium: d.mediumSolved, totalMedium: d.totalMedium,
      hard: d.hardSolved, totalHard: d.totalHard });
  })
  .catch(() => {});

/* 7. Projects: drag, arrows, click opens link */
const tr = $('#track');
let down = false, moved = false, sx = 0, sl = 0;
tr.addEventListener('pointerdown', e => {
  if (e.pointerType === 'touch') return;
  down = true; moved = false; sx = e.clientX; sl = tr.scrollLeft;
});
addEventListener('pointermove', e => {
  if (!down) return;
  const d = e.clientX - sx;
  if (Math.abs(d) > 6) { moved = true; tr.classList.add('drag'); }
  if (moved) tr.scrollLeft = sl - d;
});
addEventListener('pointerup', () => { down = false; tr.classList.remove('drag'); });
tr.addEventListener('click', e => { if (moved) { e.preventDefault(); moved = false; } }, true);
$('#prev').onclick = () => tr.scrollBy({ left: -360, behavior: 'smooth' });
$('#next').onclick = () => tr.scrollBy({ left: 360, behavior: 'smooth' });