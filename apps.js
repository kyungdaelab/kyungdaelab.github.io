// 포털에 보이는 카드 목록. 새 공간을 더하려면 여기에 한 덩어리만 추가하면 된다.
//   status     : 'open' (들어갈 수 있음) | 'soon' (준비 중 — 눌러도 이동하지 않음)
//   path       : 눌렀을 때 갈 곳 (가상미술관 사이트 안의 길. 맨 앞 주소는 main.js 가 붙인다)
//   teacherPath: 교사로 로그인했을 때 대신 갈 곳 (없으면 path 와 같음)
//   art        : 카드 그림 (아래 ART 에서 고른다. 나중에 실제 화면 캡처 이미지로 바꿀 수 있다)
const line = (inner) => `<svg viewBox="0 0 240 150" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;

const ART = {
  museum: line(`
    <path d="M12 116h216"/>
    <rect x="30" y="36" width="46" height="56" rx="2"/>
    <path d="M37 82l11-15 9 10 6-7 6 12"/>
    <rect x="98" y="24" width="60" height="46" rx="2"/>
    <circle cx="128" cy="47" r="11" fill="var(--accent)" stroke="none"/>
    <rect x="178" y="42" width="34" height="48" rx="2"/>
    <path d="M186 78v-22m9 22v-14m9 14v-26"/>
    <path d="M112 136v-22h32v22"/>
    <path d="M120 114v-13l8-5 8 5v13"/>`),
  files: line(`
    <rect x="78" y="22" width="84" height="60" rx="4"/>
    <path d="M92 40h56M92 52h40"/>
    <path d="M44 62a6 6 0 0 1 6-6h42l12 12h86a6 6 0 0 1 6 6v50a6 6 0 0 1-6 6H50a6 6 0 0 1-6-6z" fill="var(--art-fill)"/>
    <path d="M120 116V88m0 0l-11 11m11-11l11 11" stroke="var(--accent)" stroke-width="2.5"/>`),
  plus: line(`
    <circle cx="120" cy="75" r="40" stroke-dasharray="4 8"/>
    <path d="M120 60v30M105 75h30"/>`),
};

export const APPS = [
  {
    id: 'museum',
    title: '가상미술관',
    desc: '캐릭터를 꾸미고 전시실을 걸어 다니며 친구들의 작품을 감상합니다. 로그인하지 않아도 관람객으로 구경할 수 있어요.',
    path: '',
    status: 'open',
    art: ART.museum,
  },
  {
    id: 'atelier',
    title: '수업 아틀리에',
    desc: '화가의 작업실이라는 뜻이에요. 선생님이 낸 과제와 공지를 확인하고, 참고 자료를 보고, 내 작품을 제출합니다.',
    path: 'atelier/',
    teacherPath: 'atelier/teacher.html',
    needLogin: true,
    status: 'open',
    art: ART.files,
  },
  {
    id: 'next',
    title: '새 공간',
    desc: '앞으로 만들어지는 수업 공간이 이 자리에 추가됩니다.',
    path: '',
    status: 'soon',
    art: ART.plus,
  },
];
