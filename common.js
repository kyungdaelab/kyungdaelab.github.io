// 수업 공간(포털)의 두 화면(첫 화면 · 교사 로그인)이 함께 쓰는 것
// 가상미술관 사이트의 맨 앞 주소: 깃허브에서는 /museum/, 내 컴퓨터에서 시험할 때는 맨 앞(/)
export const MUSEUM = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? '/' : '/museum/';

// 로그인 기능은 가상미술관의 것을 그대로 불러 쓴다 (같은 사이트라 로그인이 서로 이어진다). 불러오지 못하면 null
export const loadAuth = () => import(MUSEUM + 'src/data/student-auth.js').catch(() => null);
export const loadNickname = () => import(MUSEUM + 'src/shared/nickname.js').catch(() => null);

export const $ = (id) => document.getElementById(id);
export function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k in e) e[k] = v;
    else e.setAttribute(k, v);
  }
  e.append(...kids.flat().filter((x) => x != null && x !== false));
  return e;
}
export function toast(text, kind = 'info') {
  let box = $('toasts');
  if (!box) { box = h('div', { id: 'toasts', 'aria-live': 'polite' }); document.body.append(box); }
  const t = h('div', { class: 'toast ' + kind }, text);
  box.append(t);
  setTimeout(() => t.remove(), kind === 'error' ? 6000 : 3000);
}
// 버튼을 누르면: 중복 클릭을 막고, 오류는 알림으로 보여 준다
export async function run(btn, work) {
  if (btn) { if (btn.disabled) return; btn.disabled = true; }
  try { return await work(); }
  catch (e) { toast(e?.message || String(e), 'error'); }
  finally { if (btn) btn.disabled = false; }
}
// 예/아니오 창
export const confirmBox = (text, yes = '확인', danger = false) => dialog((panel, close) => {
  panel.append(h('p', { class: 'pre' }, text),
    h('div', { class: 'row end' }, h('button', { class: 'btn ghost', type: 'button', onclick: () => close(false) }, '취소'), h('button', { class: 'btn' + (danger ? ' danger' : ''), type: 'button', onclick: () => close(true) }, yes)));
}).then((v) => v === true);
// 화면 안의 창 (ESC · 바깥 누르기로 닫힘)
export function dialog(build) {
  return new Promise((resolve) => {
    const panel = h('div', { class: 'panel', role: 'dialog', 'aria-modal': 'true' });
    const overlay = h('div', { class: 'overlay', onpointerdown: (e) => { if (e.target === overlay) close(null); } }, panel);
    const onKey = (e) => { if (e.key === 'Escape') close(null); };
    function close(value = null) { document.removeEventListener('keydown', onKey); overlay.remove(); resolve(value); }
    document.addEventListener('keydown', onKey);
    document.body.append(overlay);
    build(panel, close);
    panel.querySelector('input')?.focus();
  });
}
