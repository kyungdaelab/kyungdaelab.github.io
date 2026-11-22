// 수업 공간 첫 화면: 카드 목록 + 학생 구글 로그인 · 가입
//   로그인은 여기서 한 번만 하면 가상미술관과 아틀리에에서도 이어진다.
//   교사는 '선생님'을 누르면 새 창(teacher.html)에서 로그인한다.
import { APPS } from './apps.js';
import { MUSEUM, loadAuth, loadNickname, $, h, toast, run, dialog } from './common.js';

let account = { kind: 'guest' };
let auth = null;

/* ── 카드 ── */
function card(app, i) {
  const open = app.status === 'open';
  const path = account.kind === 'teacher' && app.teacherPath ? app.teacherPath : app.path;
  // 로그인한 사람은 미술관 정문을 건너뛰고 바로 들어간다
  const href = MUSEUM + path + (app.id === 'museum' && account.kind !== 'guest' ? '?enter' : '');
  const el = h(open ? 'a' : 'div', { class: 'card ' + (open ? 'is-open' : 'is-soon'), href: open ? href : null, 'aria-disabled': open ? null : 'true' },
    h('div', { class: 'art', innerHTML: app.art }),
    h('div', { class: 'body' },
      h('span', { class: 'num' }, String(i + 1).padStart(2, '0')),
      h('div', { class: 'text' }, h('h2', null, app.title), h('p', null, app.desc)),
      h('span', { class: 'go' }, open ? ['들어가기 ', h('span', { 'aria-hidden': 'true' }, '→')] : '준비 중')));
  // 로그인이 필요한 공간: 로그인 전에는 먼저 로그인하도록 안내한다
  if (open && app.needLogin && account.kind === 'guest') el.addEventListener('click', (e) => {
    e.preventDefault();
    if (account.unregistered) openSignup(); else toast(`${app.title}는 로그인한 뒤에 들어갈 수 있어요. 오른쪽 위의 "학생 로그인"을 눌러 주세요.`);
  });
  return el;
}
const renderCards = () => $('apps').replaceChildren(...APPS.map(card));

/* ── 오른쪽 위: 로그인 상태 ── */
const logoutBtn = () => { const b = h('button', { class: 'btn ghost small', type: 'button', onclick: () => run(b, async () => { await auth.signOut(); await refresh(); }) }, '로그아웃'); return b; };
function renderAccount() {
  const box = $('account'); box.replaceChildren();
  const teacherLink = h('a', { class: 'link', href: 'teacher.html', target: '_blank', rel: 'noopener' }, '선생님');
  if (account.kind === 'student') box.append(h('b', { class: 'ellipsis' }, account.nickname || '학생'), logoutBtn());       // 학번 · 이름이 아니라 별명만 보인다
  else if (account.kind === 'teacher') box.append(h('b', { class: 'ellipsis' }, `${account.name} 선생님`), h('a', { class: 'link', href: 'teacher.html', target: '_blank', rel: 'noopener' }, '교사용'), logoutBtn());
  else if (account.pending) box.append(h('span', { class: 'muted' }, '선생님 승인 대기 중'), logoutBtn());
  else if (account.unregistered) box.append(h('button', { class: 'btn small', type: 'button', onclick: openSignup }, '가입 마무리하기'), logoutBtn());
  else {
    const login = h('button', { class: 'btn small', type: 'button', onclick: () => run(login, async () => {
      if (!auth) throw new Error('로그인 기능을 불러오지 못했어요. 새로 고친 뒤 다시 해 보세요');
      const r = await auth.signInWithGoogle(location.origin + location.pathname);
      if (r.error) throw new Error(r.error);
    }) }, '학생 로그인');
    box.append(login, teacherLink);
  }
}

/* ── 학생 가입: 구글로 처음 로그인하면 학번 · 이름 · 별명을 적는다 ── */
let signupOpen = false;
async function openSignup() {
  if (signupOpen) return; signupOpen = true;
  const nick = await loadNickname();
  await dialog((panel, close) => {
    const code = h('input', { type: 'text', inputMode: 'numeric', maxLength: 6, placeholder: '예: 2312 (2학년 3반 12번)' });
    const name = h('input', { type: 'text', maxLength: 20, placeholder: '예: 김하늘' });
    const nickname = h('input', { type: 'text', maxLength: nick?.NICK_MAX ?? 12, placeholder: '예: 하늘이' });
    const classCode = h('input', { type: 'text', maxLength: 20, placeholder: '선생님이 알려 준 경우에만' });
    const join = h('button', { class: 'btn', type: 'button', onclick: () => run(join, async () => {
      const c = code.value.replace(/\s/g, ''), n = name.value.trim(), k = nick ? nick.cleanNickname(nickname.value) : nickname.value.trim();
      if (!/^\d{4,6}$/.test(c)) throw new Error('학번은 숫자 4~6자리로 적어 주세요 (예: 2학년 3반 12번 → 2312)');
      if (!n) throw new Error('이름을 적어 주세요');
      if (!k) throw new Error('별명을 다시 정해 주세요 (1~12자, 나쁜 말은 쓸 수 없어요)');
      const r = await auth.signUpStudent(c, n, k, classCode.value.trim());
      if (r.error) throw new Error(r.error);
      close(true); toast(`${k} 님, 가입을 마쳤어요`);
    }) }, '가입하기');
    panel.append(h('h2', null, '처음 오셨네요'),
      h('p', { class: 'muted' }, '학번과 이름은 선생님이 가진 명렬표와 똑같이 적어야 가입돼요. 학번과 이름은 선생님만 볼 수 있고, 다른 친구들에게는 별명만 보여요.'),
      h('label', { class: 'f' }, '학번', code), h('label', { class: 'f' }, '이름', name), h('label', { class: 'f' }, '별명 (화면에 보이는 이름)', nickname),
      h('label', { class: 'f' }, '학급 코드 (비워 두어도 돼요)', classCode),
      h('div', { class: 'row end' }, h('button', { class: 'btn ghost', type: 'button', onclick: () => close(null) }, '나중에'), join),
      h('p', { class: 'muted' }, '선생님이신가요? 오른쪽 위에서 로그아웃한 뒤 "선생님"을 눌러 주세요.'));
  });
  signupOpen = false;
  await refresh(false);
}

async function refresh(askSignup = true) {
  account = auth ? await auth.currentAccount().catch(() => ({ kind: 'guest' })) : { kind: 'guest' };
  renderAccount(); renderCards();
  if (askSignup && account.unregistered) openSignup();
}

renderCards();                    // 카드는 로그인 확인을 기다리지 않고 먼저 그린다
auth = await loadAuth();
await refresh();
