// 수업 공간 · 선생님 화면
//   구글 로그인 → (처음이면) 가입 신청 → 관리자 승인 → 학급 · 학생 관리 + 교사용 화면으로 가는 길
//   여기서 만든 학급과 가입한 학생은 가상미술관 · 아틀리에가 함께 쓴다 (전시실의 학급 전용, 선물, 과제 · 공지를 낼 반).
//   구글 드라이브 연결은 여기서 하지 않는다. 아틀리에 교사용 화면의 "드라이브 연결"에서 따로 정한다.
import { MUSEUM, loadAuth, $, h, toast, run, dialog, confirmBox } from './common.js';

const auth = await loadAuth();
const demo = new URLSearchParams(location.search).has('demo');        // 주소에 ?demo: 로그인 없이 화면을 미리 써 본다 (저장되지 않음)
const view = $('view');
let tapi = null, planRoster = null;       // 학급 · 학생 기능 (가상미술관의 교사용 기능 모음을 그대로 불러 쓴다)
let current = null;                          // 지금 열어 본 학급

const logoutBtn = (label = '로그아웃') => { const b = h('button', { class: 'btn ghost small', type: 'button', onclick: () => run(b, async () => { await auth.signOut(); current = null; await render(); }) }, label); return b; };
const homeLink = () => h('a', { class: 'link', href: './' }, '← 수업 공간 첫 화면');

async function render() {
  const a = demo ? { kind: 'teacher', name: '연습 교사' } : auth ? await auth.currentAccount().catch(() => ({ kind: 'guest' })) : { kind: 'guest' };
  // 첫 화면으로 가는 길은 선택지가 아니라 위쪽에 따로 둔다
  $('account').replaceChildren(homeLink(), ...(!demo && (a.kind !== 'guest' || a.signedIn) ? [logoutBtn()] : []));
  view.replaceChildren();

  if (a.kind === 'teacher') return renderTeacher(a);
  if (a.kind === 'student') {
    view.append(h('h1', null, '학생 계정으로 들어와 있어요'), h('p', { class: 'lead' }, '선생님이라면 로그아웃한 뒤 선생님의 구글 계정으로 다시 로그인해 주세요.'), h('div', null, logoutBtn('로그아웃하고 다시 로그인')));
    return;
  }
  if (a.pending) {
    view.append(h('h1', null, '승인을 기다리는 중입니다'), h('p', { class: 'lead' }, `${a.name} 선생님의 가입 신청이 접수되었습니다. 관리자가 승인하면 전시실과 과제를 만들 수 있습니다.`),
      h('div', { class: 'row' }, h('button', { class: 'btn', type: 'button', onclick: () => { auth.forgetAccount(); render(); } }, '승인되었는지 다시 확인'), logoutBtn()));
    return;
  }
  if (a.unregistered) {              // 구글로 로그인은 했지만 아직 신청 전
    const name = h('input', { type: 'text', maxLength: 40, value: a.googleName || '' }), school = h('input', { type: 'text', maxLength: 60, placeholder: '예: 한빛초등학교' });
    const apply = h('button', { class: 'btn', type: 'button', onclick: () => run(apply, async () => {
      if (!name.value.trim()) throw new Error('이름을 적어 주세요');
      const r = await auth.applyTeacher(name.value.trim(), school.value.trim());
      if (r.error) throw new Error(r.error);
      toast('가입 신청이 접수되었습니다'); await render();
    }) }, '교사 가입 신청');
    view.append(h('h1', null, '교사 가입 신청'), h('p', { class: 'lead' }, '구글 계정으로 로그인했습니다. 이름과 학교를 적어 신청하면 관리자가 확인한 뒤 승인합니다.'),
      h('div', { class: 'card stack' }, h('label', { class: 'f' }, '이름', name), h('label', { class: 'f' }, '학교', school), h('div', { class: 'row end' }, logoutBtn('다른 계정으로'), apply)),
      h('p', { class: 'muted' }, '학생이라면 이 창을 닫고 수업 공간 첫 화면에서 "학생 로그인"을 눌러 주세요.'));
    return;
  }
  // 로그인 전
  const login = h('button', { class: 'btn', type: 'button', onclick: () => run(login, async () => {
    if (!auth) throw new Error('로그인 기능을 불러오지 못했습니다. 새로 고친 뒤 다시 해 주세요');
    const r = await auth.signInWithGoogle(location.origin + location.pathname);
    if (r.error) throw new Error(r.error);
  }) }, '구글 계정으로 로그인');
  view.append(h('h1', null, '선생님 로그인'), h('p', { class: 'lead' }, '구글 계정으로 로그인합니다. 처음이면 로그인한 뒤 이름과 학교를 적어 가입 신청을 합니다.'),
    h('div', null, login),
    h('p', { class: 'muted' }, '학생이 낸 파일을 모아 둘 구글 드라이브는 여기서 정하지 않습니다. 로그인한 뒤 수업 아틀리에 교사용 화면의 "드라이브 연결"에서 원하는 계정으로 따로 연결합니다.'));
}

/* ───────────── 교사: 바로 가기 + 학급 · 학생 ───────────── */
async function renderTeacher(a) {
  const classesBox = h('div', { class: 'stack' }, h('p', { class: 'muted' }, '학급을 불러오는 중…'));
  view.append(h('h1', null, `${a.name} 선생님`),
    h('h3', null, '교사용 화면'),
    h('div', { class: 'stack' },
      h('a', { class: 'card row-card', href: MUSEUM + 'teacher.html' + (demo ? '?demo' : '') }, h('div', { class: 'text' }, h('h2', null, '가상미술관 교사용'), h('p', null, '전시실과 작품을 관리하고, 학생에게 선물을 줍니다.')), h('span', { class: 'go' }, '열기 →')),
      h('a', { class: 'card row-card', href: MUSEUM + 'atelier/teacher.html' + (demo ? '?demo' : '') }, h('div', { class: 'text' }, h('h2', null, '수업 아틀리에 교사용'), h('p', null, '과제와 공지를 내고 제출 현황을 봅니다. 구글 드라이브 연결도 여기서 정합니다.')), h('span', { class: 'go' }, '열기 →'))),
    h('h3', null, '학급 · 학생'),
    h('p', { class: 'muted' }, '명렬표로 만든 학급과 가입한 학생은 가상미술관(학급 전용 전시실 · 선물)과 수업 아틀리에(과제 · 공지를 낼 반)에서 함께 씁니다.'),
    classesBox);
  if (!tapi) {
    const mod = await import(MUSEUM + 'src/teacher/api.js').catch(() => null);
    if (!mod) { classesBox.replaceChildren(h('p', { class: 'warn' }, '학급 기능을 불러오지 못했습니다. 새로 고친 뒤 다시 해 주세요.')); return; }
    tapi = await mod.createApi(); planRoster = mod.planRoster;
  }
  await run(null, () => renderClasses(classesBox));
}

async function renderClasses(box) {
  const [list, entries, grads] = await Promise.all([tapi.listClasses(), tapi.rosterList(), tapi.graduates()]);
  const reload = () => run(null, () => renderClasses(box));
  if (current) current = list.find((c) => c.id === current.id) ?? null;
  box.replaceChildren();

  /* ── 명렬표 넣기: 학급 만들기와 진급을 한 번에 ── */
  const school = h('input', { type: 'text', maxLength: 60, placeholder: '예: 한빛초등학교', value: list[0]?.school ?? grads[0]?.school ?? '' });
  const text = h('textarea', { placeholder: '2312, 김하늘\n2313, 이도윤\n2401, 박서연' }), errors = h('p', { class: 'warn pre' });
  const apply = h('button', { class: 'btn', type: 'button', onclick: () => run(apply, async () => {
    const sch = school.value.trim();
    if (!sch) throw new Error('학교 이름을 적어 주세요');
    const plan = planRoster(text.value, sch, await tapi.listClasses(), await tapi.rosterList());
    errors.textContent = plan.errors.join('\n');
    if (plan.errors.length) throw new Error('명렬표에 고칠 곳이 있습니다. 아래 글을 확인해 주세요. (아직 아무것도 바꾸지 않았습니다)');
    if (!plan.entries.length) throw new Error(plan.count.same ? '명렬표가 지금과 같아서 바꿀 것이 없습니다' : '명렬표를 한 줄에 한 명씩 "학번, 이름"으로 적어 주세요');
    const lines = [
      plan.creates.length && `새 학급 ${plan.creates.length}개 만들기: ${plan.creates.map((c) => `${c.grade}학년 ${c.classNo}반`).join(', ')}`,
      plan.count.fresh && `새 학생 자리 ${plan.count.fresh}명 (학생이 구글로 가입하면 연결됩니다)`,
      plan.count.moved && `새 학번으로 옮기는 학생 ${plan.count.moved}명 (계정 · 캐릭터 · 선물 · 제출 기록이 이어집니다)`,
      plan.count.same && `그대로인 학생 ${plan.count.same}명`,
    ].filter(Boolean).join('\n');
    if (!await confirmBox(`명렬표를 반영할까요?\n\n${lines}`, '반영하기')) return;
    const ids = new Map();
    for (const c of plan.creates) ids.set(c.key, (await tapi.createClass(c.school, c.grade, c.classNo)).id);
    await tapi.rosterCommit(plan.entries.map((e) => ({ class_id: e.classId ?? ids.get(e.classKey), no: e.no, name: e.name, student_id: e.studentId })), plan.drops);
    text.value = ''; toast('명렬표를 반영했습니다'); reload();
  }) }, '확인하고 반영하기');
  box.append(h('div', { class: 'card stack' }, h('h2', null, '명렬표 넣기'),
    h('p', { class: 'muted' }, '한 줄에 한 명씩 "학번, 이름"을 적거나 엑셀에서 두 칸을 복사해 붙여 넣으세요("학년, 반, 번호, 이름" 네 칸도 됩니다). 학번의 학년 · 반대로 학급이 자동으로 만들어지고, 학생은 명렬표의 학번 · 이름과 같게 적어야 가입할 수 있습니다.'),
    h('p', { class: 'muted' }, '새 학년에는 새 학번으로 된 명렬표를 다시 넣으면 됩니다. 이름이 같은 학생은 새 반으로 옮겨지고 정보가 그대로 이어집니다. 동명이인이 있을 때만 이름 뒤에 이전 학번을 적습니다(예: 3105, 김하늘, 2312).'),
    h('label', { class: 'f' }, '학교 이름', school), text, errors, h('div', null, apply)));

  /* ── 내 학급 ── */
  const of = (c) => entries.filter((e) => e.class_id === c.id);
  box.append(list.length
    ? h('div', { class: 'row' }, list.map((c) => h('button', { class: 'pick' + (current?.id === c.id ? ' sel' : ''), type: 'button', onclick: () => { current = current?.id === c.id ? null : c; reload(); } },
        h('b', null, `${c.school} ${c.name}`), h('span', { class: 'muted' }, `가입 ${of(c).filter((e) => e.student_id).length} / ${of(c).length}명`))))
    : h('div', { class: 'empty' }, '아직 학급이 없습니다. 위에 명렬표를 넣으면 학급이 만들어집니다.'));
  if (current) box.append(classDetail(current, of(current), reload));

  /* ── 졸업생 아카이브 ── */
  if (grads.length) box.append(h('h3', null, '졸업생 아카이브'), ...grads.map((g) => archiveCard(g, reload)));
}

// 학급 한 개: 명렬표(가입 여부) + 졸업 처리 · 학급 삭제
function classDetail(c, seats, reload) {
  const rows = seats.map((e) => {
    const act = e.student_id
      ? h('button', { class: 'btn ghost small danger', type: 'button', onclick: async (ev) => {
          const btn = ev.currentTarget;
          if (!await confirmBox(`${e.no}번 ${e.name} 학생의 가입을 취소할까요?\n그 학생의 계정과 캐릭터 · 선물이 지워지고 되돌릴 수 없습니다.\n명렬표의 자리는 남아서, 본인이 구글로 다시 가입할 수 있습니다.`, '가입 취소', true)) return;
          await run(btn, async () => { await tapi.removeStudent(e.student_id); toast('가입을 취소했습니다'); reload(); });
        } }, '가입 취소')
      : h('button', { class: 'btn ghost small', type: 'button', onclick: (ev) => run(ev.currentTarget, async () => { await tapi.rosterCommit([], [{ class_id: c.id, no: e.no }]); toast('명렬표에서 뺐습니다'); reload(); }) }, '명렬표에서 빼기');
    return h('tr', null, h('td', null, String(e.no)), h('td', null, e.name), h('td', { class: e.student_id ? '' : 'muted' }, e.student_id ? (e.nickname || '(별명 없음)') : '아직 가입 안 함'), h('td', { class: 'muted' }, e.email || '–'), h('td', null, act));
  });
  const graduate = h('button', { class: 'btn ghost small', type: 'button', onclick: async () => {
    const joined = seats.filter((e) => e.student_id).length;
    if (!await confirmBox(`${c.school} ${c.name} 을 졸업 처리할까요?\n\n· 가입한 학생 ${joined}명이 "졸업생 아카이브"로 들어갑니다. 계정 · 캐릭터 · 선물 · 제출 자료는 그대로 남습니다.\n· 아직 가입하지 않은 자리 ${seats.length - joined}개와 이 학급은 지워집니다.\n· 졸업생에게는 과제와 공지가 더 이상 가지 않습니다.`, '졸업 처리')) return;
    await run(graduate, async () => { const r = await tapi.graduateClass(c.id); current = null; toast(`${r.graduated}명을 ${r.year}학년도 졸업생 아카이브로 보냈습니다`); reload(); });
  } }, '졸업 처리 → 아카이브');
  const wipe = h('button', { class: 'btn ghost small danger', type: 'button', onclick: async () => {
    const code = await askCode(`${c.school} ${c.name} 의 학생 계정 · 캐릭터 · 선물과 명렬표를 모두 지우고 학급도 삭제합니다. 되돌릴 수 없습니다.\n전시실과 작품, 드라이브의 파일은 지워지지 않습니다.`, c.code);
    if (code == null) return;
    await run(wipe, async () => { const res = await tapi.deleteClass(c.id, code); current = null; toast(`학급과 학생 ${res.deleted}명을 삭제했습니다`); reload(); });
  } }, '학급과 학생 모두 삭제');
  return h('div', { class: 'card stack' },
    h('h2', null, `${c.school} ${c.name}`, h('span', { class: 'muted', style: 'margin-left:10px;font-weight:400' }, `학급 코드 ${c.code}`)),
    seats.length
      ? h('div', { class: 'scroll' }, h('table', null, h('thead', null, h('tr', null, h('th', null, '번호'), h('th', null, '이름'), h('th', null, '별명 (가입 여부)'), h('th', null, '구글 계정'), h('th', null, ''))), h('tbody', null, rows)))
      : h('div', { class: 'empty' }, '명렬표가 비어 있습니다.'),
    h('p', { class: 'muted' }, '이름과 구글 계정은 선생님에게만 보입니다. 학생 화면에는 별명만 나옵니다.'),
    h('div', { class: 'row' }, graduate, wipe));
}

// 확인을 위해 코드를 그대로 입력받는 창 → 입력한 글 (취소하면 null)
const askCode = (message, code) => dialog((panel, close) => {
  const box = h('input', { type: 'text', autocomplete: 'off' });
  panel.append(h('p', { class: 'pre' }, `${message}\n\n확인을 위해 ${code} 를 그대로 입력해 주세요.`), box,
    h('div', { class: 'row end' }, h('button', { class: 'btn ghost', type: 'button', onclick: () => close(null) }, '취소'), h('button', { class: 'btn danger', type: 'button', onclick: () => close(box.value.trim()) }, '모두 삭제')));
});

// 졸업생 아카이브 한 묶음(학년도): 졸업생과 냈던 자료
function archiveCard(g, reload) {
  const rows = g.students.map((s) => {
    const files = h('button', { class: 'btn ghost small', type: 'button', disabled: !s.files, onclick: () => showGraduateFiles(s) }, s.files ? `자료 ${s.files}개 보기` : '낸 자료 없음');
    const del = h('button', { class: 'btn ghost small danger', type: 'button', onclick: async () => {
      if (!await confirmBox(`${s.name} 졸업생의 계정과 캐릭터 · 제출 기록을 지울까요? 되돌릴 수 없습니다.\n드라이브에 올라온 파일은 선생님 드라이브에 그대로 남습니다.`, '삭제', true)) return;
      await run(del, async () => { await tapi.removeStudent(s.id); toast('삭제했습니다'); reload(); });
    } }, '삭제');
    return h('tr', null, h('td', null, s.last_code || '–'), h('td', null, s.name), h('td', { class: 'muted' }, s.nickname || '–'), h('td', { class: 'muted' }, s.email || '–'), h('td', null, h('div', { class: 'row' }, files, del)));
  });
  const wipe = h('button', { class: 'btn ghost small danger', type: 'button', onclick: async () => {
    const code = await askCode(`${g.name} 아카이브의 졸업생 ${g.students.length}명의 계정 · 캐릭터 · 제출 기록을 모두 지웁니다. 되돌릴 수 없습니다.\n드라이브에 올라온 파일은 선생님 드라이브에 그대로 남습니다.`, g.code);
    if (code == null) return;
    await run(wipe, async () => { await tapi.deleteClass(g.class_id, code); toast('아카이브를 삭제했습니다'); reload(); });
  } }, '이 아카이브 삭제');
  return h('div', { class: 'card stack' },
    h('h2', null, `${g.school} ${g.name}`, h('span', { class: 'muted', style: 'margin-left:10px;font-weight:400' }, `${g.students.length}명`)),
    g.students.length
      ? h('div', { class: 'scroll' }, h('table', null, h('thead', null, h('tr', null, h('th', null, '졸업 때 학번'), h('th', null, '이름'), h('th', null, '별명'), h('th', null, '구글 계정'), h('th', null, ''))), h('tbody', null, rows)))
      : h('div', { class: 'empty' }, '졸업생이 없습니다.'),
    h('div', null, wipe));
}

// 졸업생 한 명이 냈던 자료: 과제별로 보여 주고, 누르면 내 컴퓨터에 저장한다
async function showGraduateFiles(s) {
  const groups = await run(null, () => tapi.graduateFiles(s.id));
  if (!groups) return;
  dialog((panel, close) => {
    panel.append(h('h2', null, `${s.name} 졸업생의 자료`),
      ...groups.map((a) => h('div', { class: 'stack' }, h('b', null, `${a.school_year}년도 ${a.semester}학기 · ${a.title}`),
        ...a.files.map((f) => { const b = h('button', { class: 'btn ghost small', type: 'button', onclick: () => run(b, () => saveFile(f)) }, `${f.name} 저장`); return h('div', null, b); }))),
      !groups.length && h('p', { class: 'muted' }, '낸 자료가 없습니다.'),
      h('p', { class: 'muted' }, '같은 파일이 선생님 구글 드라이브의 "아틀리에 / 학년도 / 학기 / 과제 이름" 폴더에도 있습니다.'),
      h('div', { class: 'row end' }, h('button', { class: 'btn', type: 'button', onclick: () => close() }, '닫기')));
  });
}
async function saveFile(f) {
  const [drive, backend] = await Promise.all([import(MUSEUM + 'atelier/src/drive.js'), import(MUSEUM + 'src/data/backend.js')]);
  const { name, blob } = await drive.downloadFile(await backend.getClient(), f.id);
  const url = URL.createObjectURL(blob), a = h('a', { href: url, download: name });
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000);
  toast(`"${name}" 을 저장했습니다`);
}

await render();
window.__hub = { get api() { return tapi; } };        // 점검용
