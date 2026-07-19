/* @ds-bundle: {"format":3,"namespace":"TopToonDesignSystem_0292a1","components":[],"sourceHashes":{"preview/CollectionComponents.jsx":"59ef5a158c5e","preview/CollectionFixtures.jsx":"ccccd3f45edd","preview/CollectionScreens.jsx":"fc0510647194","preview/design-canvas.jsx":"5d0e39003628","ui_kits/toptoon-web/Components.jsx":"2485639603e5","ui_kits/toptoon-web/Fixtures.jsx":"1c349c835687","ui_kits/toptoon-web/Screens.jsx":"b407636766ec"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.TopToonDesignSystem_0292a1 = window.TopToonDesignSystem_0292a1 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// preview/CollectionComponents.jsx
try { (() => {
// Collection Page — components
const {
  useState: useStateC,
  useEffect: useEffectC
} = React;

// ── Sort chips (최신순 / 인기순) ─────────────────────────────
const CSort = ({
  sort,
  onSort,
  count
}) => /*#__PURE__*/React.createElement("div", {
  className: "cp-toolbar"
}, /*#__PURE__*/React.createElement("div", {
  className: "cp-sort"
}, ['latest', 'popular'].map(k => /*#__PURE__*/React.createElement("button", {
  key: k,
  className: sort === k ? 'on' : '',
  onClick: () => onSort(k)
}, k === 'latest' ? '최신순' : '인기순'))), /*#__PURE__*/React.createElement("div", {
  className: "cp-count"
}, "\uC804\uCCB4 ", /*#__PURE__*/React.createElement("b", null, count), "\uAC1C \uCEEC\uB809\uC158"));

// ── Modal: works inside a collection ────────────────────────
const CModal = ({
  collection,
  onClose
}) => {
  if (!collection) return null;
  useEffectC(() => {
    const h = e => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    className: "cp-modal",
    onClick: e => e.target === e.currentTarget && onClose()
  }, /*#__PURE__*/React.createElement("div", {
    className: "cp-modal__box"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cp-modal__head",
    style: {
      backgroundImage: `url(${collection.cover})`
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "cp-modal__close",
    onClick: onClose
  }, "\xD7"), /*#__PURE__*/React.createElement("div", {
    className: "cp-modal__head-body"
  }, /*#__PURE__*/React.createElement("div", null, collection.flag && /*#__PURE__*/React.createElement("span", {
    className: "flag"
  }, collection.flag), /*#__PURE__*/React.createElement("h2", null, collection.title), /*#__PURE__*/React.createElement("p", null, collection.curation)), /*#__PURE__*/React.createElement("div", {
    className: "cp-modal__meta"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, collection.works), " \uC791\uD488"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 2,
      opacity: .7
    }
  }, "\uC804 ", collection.episodes, "\uD654")))), /*#__PURE__*/React.createElement("div", {
    className: "cp-modal__toolbar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "count"
  }, "\uD3EC\uD568 \uC791\uD488 ", /*#__PURE__*/React.createElement("b", null, collection.works)), /*#__PURE__*/React.createElement("div", {
    className: "cp-sort"
  }, /*#__PURE__*/React.createElement("button", {
    className: "on"
  }, "\uC778\uAE30\uC21C"), /*#__PURE__*/React.createElement("button", null, "\uCD5C\uC2E0\uC21C"))), /*#__PURE__*/React.createElement("div", {
    className: "cp-worklist"
  }, TT_COLLECTION_WORKS.slice(0, collection.works).map((w, i) => /*#__PURE__*/React.createElement("div", {
    key: w.id + i,
    className: "cp-work"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cp-work__thumb",
    style: {
      backgroundImage: `url(${w.cover})`
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "cp-work__adult"
  }, "19"), /*#__PURE__*/React.createElement("div", {
    className: "cp-work__badges"
  }, w.badges.map(b => /*#__PURE__*/React.createElement("img", {
    key: b,
    src: `../assets/badge-${b}.png`,
    alt: b
  })))), /*#__PURE__*/React.createElement("div", {
    className: "cp-work__info"
  }, /*#__PURE__*/React.createElement("p", {
    className: "cp-work__title"
  }, w.title), /*#__PURE__*/React.createElement("p", {
    className: "cp-work__meta"
  }, /*#__PURE__*/React.createElement("span", null, w.eps), /*#__PURE__*/React.createElement("span", {
    className: "dot"
  }), /*#__PURE__*/React.createElement("span", null, w.meta))))))));
};

// ── Empty state ─────────────────────────────────────────────
const CEmpty = () => /*#__PURE__*/React.createElement("div", {
  className: "cp-empty"
}, /*#__PURE__*/React.createElement("div", {
  className: "cp-empty__icon"
}, "\u2726"), /*#__PURE__*/React.createElement("h3", null, "\uC544\uC9C1 \uC5F4\uB78C\uD55C \uCEEC\uB809\uC158\uC774 \uC5C6\uC5B4\uC694"), /*#__PURE__*/React.createElement("p", null, "\uC9C0\uAE08 \uACF5\uAC1C\uB41C \uCEEC\uB809\uC158\uC5D0\uC11C \uB098\uB9CC\uC758 \uCDE8\uD5A5\uC744 \uBC1C\uACAC\uD574 \uBCF4\uC138\uC694.", /*#__PURE__*/React.createElement("br", null), "\uD050\uB808\uC774\uD130\uAC00 \uC5C4\uC120\uD55C \uC791\uD488\uB4E4\uC774 \uAE30\uB2E4\uB9AC\uACE0 \uC788\uC5B4\uC694."), /*#__PURE__*/React.createElement("button", {
  className: "cp-empty__cta"
}, "\uC9C0\uAE08 \uACF5\uAC1C\uB41C \uCEEC\uB809\uC158 \uBCF4\uAE30 \u2192"));

// ── V1 Card: Stealth Neon ───────────────────────────────────
const V1Card = ({
  c,
  onClick
}) => /*#__PURE__*/React.createElement("div", {
  className: "v1-card",
  onClick: onClick
}, /*#__PURE__*/React.createElement("div", {
  className: "v1-card__thumb",
  style: {
    backgroundImage: `url(${c.cover})`
  }
}, c.flag && /*#__PURE__*/React.createElement("div", {
  className: `v1-card__flag ${c.flag === 'NEW' ? 'new' : ''}`
}, c.flag), /*#__PURE__*/React.createElement("div", {
  className: "v1-card__stack"
}, c.previews.slice(0, 4).map((p, i) => /*#__PURE__*/React.createElement("span", {
  key: i,
  style: {
    backgroundImage: `url(${p})`
  }
})))), /*#__PURE__*/React.createElement("div", {
  className: "v1-card__body"
}, /*#__PURE__*/React.createElement("h3", {
  className: "v1-card__title"
}, c.title), /*#__PURE__*/React.createElement("p", {
  className: "v1-card__curation"
}, c.curation), /*#__PURE__*/React.createElement("div", {
  className: "v1-card__foot"
}, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", null, c.works), "\uC791\uD488", /*#__PURE__*/React.createElement("span", {
  className: "dot"
}), /*#__PURE__*/React.createElement("b", null, c.episodes), "\uD654"), /*#__PURE__*/React.createElement("span", {
  style: {
    color: '#5a5a60',
    fontFamily: 'Roboto'
  }
}, c.period.split(' — ')[1]))));

// ── V2 Card: Editorial ──────────────────────────────────────
const V2Card = ({
  c,
  onClick
}) => /*#__PURE__*/React.createElement("div", {
  className: "v2-card",
  onClick: onClick
}, /*#__PURE__*/React.createElement("div", {
  className: "v2-card__thumb",
  style: {
    backgroundImage: `url(${c.cover})`
  }
}, /*#__PURE__*/React.createElement("div", {
  className: "v2-card__over"
}, c.flag && /*#__PURE__*/React.createElement("span", {
  className: `v2-card__flag ${c.flag === 'NEW' ? 'new' : ''}`
}, c.flag), /*#__PURE__*/React.createElement("h3", null, c.title))), /*#__PURE__*/React.createElement("div", {
  className: "v2-card__body"
}, /*#__PURE__*/React.createElement("p", {
  className: "v2-card__curation"
}, c.curation), /*#__PURE__*/React.createElement("div", {
  className: "v2-card__foot"
}, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", null, c.works), " \uC791\uD488 \xB7 ", /*#__PURE__*/React.createElement("b", null, c.episodes), "\uD654"), /*#__PURE__*/React.createElement("div", {
  className: "v2-card__pips"
}, c.previews.slice(0, 4).map((p, i) => /*#__PURE__*/React.createElement("span", {
  key: i,
  style: {
    backgroundImage: `url(${p})`
  }
}))))));

// ── V3 Card: Holographic Poster ─────────────────────────────
const V3Card = ({
  c,
  onClick,
  i
}) => /*#__PURE__*/React.createElement("div", {
  className: "v3-card",
  onClick: onClick
}, /*#__PURE__*/React.createElement("div", {
  className: "v3-card__bg",
  style: {
    backgroundImage: `url(${c.cover})`
  }
}), /*#__PURE__*/React.createElement("div", {
  className: "v3-card__border"
}), c.flag && /*#__PURE__*/React.createElement("div", {
  className: `v3-card__flag ${c.flag === 'NEW' ? 'new' : ''}`
}, c.flag), /*#__PURE__*/React.createElement("div", {
  className: "v3-card__corner"
}, "NO.", String(i + 1).padStart(2, '0')), /*#__PURE__*/React.createElement("div", {
  className: "v3-card__info"
}, /*#__PURE__*/React.createElement("h3", {
  className: "v3-card__title"
}, c.title), /*#__PURE__*/React.createElement("p", {
  className: "v3-card__curation"
}, c.curation), /*#__PURE__*/React.createElement("div", {
  className: "v3-card__meta"
}, /*#__PURE__*/React.createElement("b", null, c.works), "\uC791\uD488 ", /*#__PURE__*/React.createElement("span", {
  className: "dot"
}), " ", /*#__PURE__*/React.createElement("b", null, c.episodes), "\uD654")));
Object.assign(window, {
  CSort,
  CModal,
  CEmpty,
  V1Card,
  V2Card,
  V3Card
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "preview/CollectionComponents.jsx", error: String((e && e.message) || e) }); }

// preview/CollectionFixtures.jsx
try { (() => {
// Collection page — fixtures
// Uses existing banner artwork from assets/banners as cover + preview thumbs.

const _B = '../assets/banners';

// The Collection cards — each is a curated bundle of works
const TT_COLLECTIONS = [{
  id: 'c01',
  title: '사내연애의 온도차',
  cover: `${_B}/bg07.jpg`,
  curation: '출근 30분 뒤 시작되는 비밀 · 오피스 로맨스가 이렇게 짜릿할 줄이야',
  works: 12,
  episodes: 486,
  flag: 'HOT',
  period: '25.04.01 — 25.07.31',
  previews: [`${_B}/bg07.jpg`, `${_B}/bg04.jpg`, `${_B}/bg05.jpg`, `${_B}/bg01.jpg`]
}, {
  id: 'c02',
  title: '옆집이 수상해',
  cover: `${_B}/bg04.jpg`,
  curation: '벽 너머에서 들려오는 소리.. 그 집엔 무슨 일이 있는 걸까',
  works: 8,
  episodes: 324,
  flag: 'NEW',
  period: '25.05.10 — 25.08.10',
  previews: [`${_B}/bg04.jpg`, `${_B}/bg07.jpg`, `${_B}/bg01.jpg`, `${_B}/bg05.jpg`]
}, {
  id: 'c03',
  title: '차마 못 해본 말',
  cover: `${_B}/bg05.jpg`,
  curation: '입 밖으로 꺼내지 못한 마음, 눈빛이 먼저 들켜버린 순간들',
  works: 15,
  episodes: 612,
  flag: null,
  period: '25.03.20 — 25.06.20',
  previews: [`${_B}/bg05.jpg`, `${_B}/bg01.jpg`, `${_B}/bg07.jpg`, `${_B}/bg04.jpg`]
}, {
  id: 'c04',
  title: '한 번뿐인 밤',
  cover: `${_B}/bg01.jpg`,
  curation: '다음 날 아침이 되면 없었던 일이 되는 그런 하룻밤',
  works: 10,
  episodes: 402,
  flag: null,
  period: '25.04.15 — 25.07.15',
  previews: [`${_B}/bg01.jpg`, `${_B}/bg05.jpg`, `${_B}/bg04.jpg`, `${_B}/bg07.jpg`]
}, {
  id: 'c05',
  title: '선을 넘은 관계',
  cover: `${_B}/bg07.jpg`,
  curation: '친구였던 우리, 어쩌다 이렇게까지 와버렸는지',
  works: 9,
  episodes: 287,
  flag: 'HOT',
  period: '25.05.01 — 25.08.01',
  previews: [`${_B}/bg07.jpg`, `${_B}/bg05.jpg`, `${_B}/bg04.jpg`, `${_B}/bg01.jpg`]
}, {
  id: 'c06',
  title: '상사님 오늘따라',
  cover: `${_B}/bg04.jpg`,
  curation: '퇴근 후 회식 자리, 평소와 다른 눈빛을 발견했다',
  works: 11,
  episodes: 445,
  flag: null,
  period: '25.02.14 — 25.05.14',
  previews: [`${_B}/bg04.jpg`, `${_B}/bg01.jpg`, `${_B}/bg05.jpg`, `${_B}/bg07.jpg`]
}, {
  id: 'c07',
  title: '연상녀의 유혹',
  cover: `${_B}/bg05.jpg`,
  curation: '어린 너를 가르쳐주고 싶은 게 너무 많아',
  works: 14,
  episodes: 578,
  flag: 'NEW',
  period: '25.06.01 — 25.09.01',
  previews: [`${_B}/bg05.jpg`, `${_B}/bg07.jpg`, `${_B}/bg04.jpg`, `${_B}/bg01.jpg`]
}, {
  id: 'c08',
  title: '불온한 수업시간',
  cover: `${_B}/bg01.jpg`,
  curation: '교실 맨 뒷자리, 아무도 모르는 우리만의 규칙',
  works: 7,
  episodes: 256,
  flag: null,
  period: '25.03.01 — 25.06.01',
  previews: [`${_B}/bg01.jpg`, `${_B}/bg04.jpg`, `${_B}/bg07.jpg`, `${_B}/bg05.jpg`]
}, {
  id: 'c09',
  title: '결혼한 뒤에야',
  cover: `${_B}/bg07.jpg`,
  curation: '그 여자의 진짜 얼굴을 알게 된 건 혼인신고 이후의 일이었다',
  works: 13,
  episodes: 520,
  flag: 'HOT',
  period: '25.04.20 — 25.07.20',
  previews: [`${_B}/bg07.jpg`, `${_B}/bg01.jpg`, `${_B}/bg04.jpg`, `${_B}/bg05.jpg`]
}, {
  id: 'c10',
  title: '새 룸메이트',
  cover: `${_B}/bg04.jpg`,
  curation: '원룸에 여자가 한 명 더, 좁아진 공간만큼 가까워진 거리',
  works: 8,
  episodes: 312,
  flag: null,
  period: '25.05.05 — 25.08.05',
  previews: [`${_B}/bg04.jpg`, `${_B}/bg05.jpg`, `${_B}/bg07.jpg`, `${_B}/bg01.jpg`]
}, {
  id: 'c11',
  title: '소꿉친구의 변화',
  cover: `${_B}/bg05.jpg`,
  curation: '오랜만에 본 그 애, 몰라보게 달라져 있었다',
  works: 12,
  episodes: 468,
  flag: null,
  period: '25.04.10 — 25.07.10',
  previews: [`${_B}/bg05.jpg`, `${_B}/bg04.jpg`, `${_B}/bg01.jpg`, `${_B}/bg07.jpg`]
}, {
  id: 'c12',
  title: '회식이 끝난 뒤',
  cover: `${_B}/bg01.jpg`,
  curation: '택시에서 어깨에 기대오던 순간, 그 다음은 기억에 없다',
  works: 10,
  episodes: 398,
  flag: 'NEW',
  period: '25.06.15 — 25.09.15',
  previews: [`${_B}/bg01.jpg`, `${_B}/bg07.jpg`, `${_B}/bg05.jpg`, `${_B}/bg04.jpg`]
}];

// The works inside a collection (for modal/layer)
const TT_COLLECTION_WORKS = [{
  id: 'w1',
  title: '구멍일지 : 문단속',
  cover: `${_B}/bg07.jpg`,
  author: '박다영',
  eps: '전 200화',
  meta: '358.3K 열람',
  badges: ['up']
}, {
  id: 'w2',
  title: '청소부K',
  cover: `${_B}/bg04.jpg`,
  author: '홍비',
  eps: '전 56화',
  meta: '1.4M 열람',
  badges: ['new']
}, {
  id: 'w3',
  title: '코트 위의 전쟁',
  cover: `${_B}/bg05.jpg`,
  author: '김민채',
  eps: '전 42화',
  meta: '982K 열람',
  badges: []
}, {
  id: 'w4',
  title: '숨겨진 이야기',
  cover: `${_B}/bg01.jpg`,
  author: '이소영',
  eps: '전 28화',
  meta: '245K 열람',
  badges: ['new']
}, {
  id: 'w5',
  title: '옆집 그녀',
  cover: `${_B}/bg07.jpg`,
  author: '박다영',
  eps: '전 75화',
  meta: '672K 열람',
  badges: ['up']
}, {
  id: 'w6',
  title: '밤의 방문객',
  cover: `${_B}/bg04.jpg`,
  author: '홍비',
  eps: '전 33화',
  meta: '411K 열람',
  badges: []
}, {
  id: 'w7',
  title: '비밀의 방',
  cover: `${_B}/bg05.jpg`,
  author: '김민채',
  eps: '전 61화',
  meta: '523K 열람',
  badges: []
}, {
  id: 'w8',
  title: '그녀의 취향',
  cover: `${_B}/bg01.jpg`,
  author: '이소영',
  eps: '전 89화',
  meta: '1.1M 열람',
  badges: ['up']
}];
Object.assign(window, {
  TT_COLLECTIONS,
  TT_COLLECTION_WORKS
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "preview/CollectionFixtures.jsx", error: String((e && e.message) || e) }); }

// preview/CollectionScreens.jsx
try { (() => {
// Collection Page — 3 variations
const {
  useState: useStateS
} = React;

// ── V1 — Stealth Neon ───────────────────────────────────────
function V1Screen({
  data,
  sort,
  onSort,
  onOpen
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "cp-page v1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cp-stage"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cp-pagetitle"
  }, /*#__PURE__*/React.createElement("div", {
    className: "crumb"
  }, "\uB0B4\uC11C\uC7AC \xB7 ", /*#__PURE__*/React.createElement("b", null, "\uCEEC\uB809\uC158")), /*#__PURE__*/React.createElement("h1", null, /*#__PURE__*/React.createElement("span", {
    className: "em"
  }, "\uCEEC\uB809\uC158"), "\uC73C\uB85C \uB9CC\uB098\uB294 \uD0D1\uD230"), /*#__PURE__*/React.createElement("p", null, "\uAC19\uC740 \uCDE8\uD5A5\uC744 \uAC00\uC9C4 \uC5EC\uB7EC\uBD84\uC744 \uC704\uD574 \uD050\uB808\uC774\uD130\uAC00 \uC5EE\uC740 \uD14C\uB9C8\uBCC4 \uC791\uD488 \uBAA8\uC74C. \uD55C \uBC88\uC758 \uD074\uB9AD\uC73C\uB85C \uC624\uB298 \uBC24\uC758 \uC815\uC8FC\uD589\uC744 \uC2DC\uC791\uD558\uC138\uC694.")), /*#__PURE__*/React.createElement("div", {
    className: "v1-hero",
    style: {
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "v1-hero__bg",
    style: {
      backgroundImage: `url(${data[0].cover})`
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "v1-hero__body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "v1-hero__eyebrow"
  }, "Collection of the Week"), /*#__PURE__*/React.createElement("h2", {
    className: "v1-hero__title"
  }, data[0].title), /*#__PURE__*/React.createElement("p", {
    className: "v1-hero__desc"
  }, data[0].curation, ". \uC774\uBC88 \uC8FC\uB9CC \uBCFC \uC218 \uC788\uB294 \uD050\uB808\uC774\uD130 \uCD94\uCC9C\uC791 \uBAA8\uC74C."), /*#__PURE__*/React.createElement("button", {
    className: "v1-hero__cta",
    onClick: () => onOpen(data[0])
  }, "\uCEEC\uB809\uC158 \uB4E4\uC5B4\uAC00\uAE30 \u2192")), /*#__PURE__*/React.createElement("div", {
    className: "v1-hero__meta"
  }, data[0].period)), /*#__PURE__*/React.createElement("div", {
    className: "cp-sec-head"
  }, /*#__PURE__*/React.createElement("h2", null, "\uACF5\uAC1C\uB41C \uCEEC\uB809\uC158"), /*#__PURE__*/React.createElement("span", {
    className: "cp-sub"
  }, "\uB9E4\uC8FC \uAE08\uC694\uC77C \uC2E0\uADDC \uC5C5\uB370\uC774\uD2B8")), /*#__PURE__*/React.createElement(CSort, {
    sort: sort,
    onSort: onSort,
    count: data.length
  }), /*#__PURE__*/React.createElement("div", {
    className: "v1-grid"
  }, data.map(c => /*#__PURE__*/React.createElement(V1Card, {
    key: c.id,
    c: c,
    onClick: () => onOpen(c)
  })))));
}

// ── V2 — Editorial Magazine ─────────────────────────────────
function V2Screen({
  data,
  sort,
  onSort,
  onOpen
}) {
  const [feat, m1, m2, ...rest] = data;
  return /*#__PURE__*/React.createElement("div", {
    className: "cp-page v2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cp-stage"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cp-pagetitle"
  }, /*#__PURE__*/React.createElement("div", {
    className: "crumb"
  }, "\uB0B4\uC11C\uC7AC \xB7 ", /*#__PURE__*/React.createElement("b", null, "\uCEEC\uB809\uC158")), /*#__PURE__*/React.createElement("h1", null, "\uCDE8\uD5A5\uC744 ", /*#__PURE__*/React.createElement("span", {
    className: "em"
  }, "\uBC1C\uACAC"), "\uD558\uB294 \uC2DC\uAC04"), /*#__PURE__*/React.createElement("p", null, "\uC5D0\uB514\uD130\uAC00 \uC5EE\uC740 \uC774\uBC88 \uC2DC\uC98C \uCD5C\uACE0\uC758 \uD14C\uB9C8. \uC9C0\uAE08 \uAC00\uC7A5 \uB728\uAC70\uC6B4 \uC791\uD488\uB4E4\uC744 \uD55C \uBC88\uC5D0 \uB9CC\uB098\uBCF4\uC138\uC694.")), /*#__PURE__*/React.createElement("div", {
    className: "v2-hero"
  }, /*#__PURE__*/React.createElement("div", {
    className: "v2-hero__main",
    onClick: () => onOpen(feat),
    style: {
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg",
    style: {
      backgroundImage: `url(${feat.cover})`
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "v2-hero__kicker"
  }, "Featured Collection \xB7 ", feat.flag || 'EDITOR\'S PICK'), /*#__PURE__*/React.createElement("h2", {
    className: "v2-hero__title"
  }, feat.title), /*#__PURE__*/React.createElement("p", {
    className: "v2-hero__desc"
  }, feat.curation), /*#__PURE__*/React.createElement("div", {
    className: "v2-hero__foot"
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", null, feat.works), " \uC791\uD488"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", null, feat.episodes), " \uD654"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'Roboto',
      letterSpacing: '0.04em'
    }
  }, feat.period)))), /*#__PURE__*/React.createElement("div", {
    className: "v2-hero__side"
  }, [m1, m2].map(c => /*#__PURE__*/React.createElement("div", {
    key: c.id,
    className: "v2-hero__mini",
    onClick: () => onOpen(c)
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg",
    style: {
      backgroundImage: `url(${c.cover})`
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "body"
  }, c.flag && /*#__PURE__*/React.createElement("span", {
    className: `tag ${c.flag === 'HOT' ? 'hot' : ''}`
  }, c.flag), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, c.title), /*#__PURE__*/React.createElement("p", null, c.curation))))))), /*#__PURE__*/React.createElement("div", {
    className: "cp-sec-head"
  }, /*#__PURE__*/React.createElement("h2", null, "\uC774\uBC88 \uC2DC\uC98C\uC758 \uCEEC\uB809\uC158"), /*#__PURE__*/React.createElement("span", {
    className: "cp-sub"
  }, "\uCD1D ", data.length, "\uAC1C \xB7 \uB9E4\uC8FC \uBAA9\uC694\uC77C \uC5C5\uB370\uC774\uD2B8")), /*#__PURE__*/React.createElement(CSort, {
    sort: sort,
    onSort: onSort,
    count: data.length
  }), /*#__PURE__*/React.createElement("div", {
    className: "v2-grid"
  }, rest.map(c => /*#__PURE__*/React.createElement(V2Card, {
    key: c.id,
    c: c,
    onClick: () => onOpen(c)
  })))));
}

// ── V3 — Holographic Poster ─────────────────────────────────
function V3Screen({
  data,
  sort,
  onSort,
  onOpen
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "cp-page v3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cp-stage"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cp-pagetitle"
  }, /*#__PURE__*/React.createElement("div", {
    className: "crumb"
  }, "\uB0B4\uC11C\uC7AC \xB7 ", /*#__PURE__*/React.createElement("b", null, "\uCEEC\uB809\uC158")), /*#__PURE__*/React.createElement("h1", null, "TOPTOON ", /*#__PURE__*/React.createElement("span", {
    className: "em"
  }, "COLLECTION")), /*#__PURE__*/React.createElement("p", null, "\uC218\uC9D1 \uAC00\uCE58\uAC00 \uC788\uB294 \uD14C\uB9C8\uB9CC \uC5C4\uC120\uD588\uC2B5\uB2C8\uB2E4. \uD55C \uC7A5 \uD55C \uC7A5 \uBAA8\uC73C\uB294 \uC7AC\uBBF8, \uC774\uBC88 \uC2DC\uC98C \uB193\uCE58\uC9C0 \uB9C8\uC138\uC694.")), /*#__PURE__*/React.createElement("div", {
    className: "v3-hero"
  }, /*#__PURE__*/React.createElement("div", {
    className: "v3-hero__stars"
  }), /*#__PURE__*/React.createElement("div", {
    className: "v3-hero__body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "v3-hero__kicker"
  }, "Collection Season 03"), /*#__PURE__*/React.createElement("h2", {
    className: "v3-hero__title"
  }, data[0].title), /*#__PURE__*/React.createElement("p", {
    className: "v3-hero__desc"
  }, data[0].curation, ". \uD55C\uC815 \uAE30\uAC04 \uACF5\uAC1C, \uB193\uCE58\uBA74 \uB2E4\uC74C \uC2DC\uC98C\uAE4C\uC9C0 \uAE30\uB2E4\uB824\uC57C \uD574\uC694."), /*#__PURE__*/React.createElement("button", {
    className: "v3-hero__cta",
    onClick: () => onOpen(data[0])
  }, "\uC9C0\uAE08 \uC5F4\uB78C\uD558\uAE30 \u2192")), /*#__PURE__*/React.createElement("div", {
    className: "v3-hero__card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg",
    style: {
      backgroundImage: `url(${data[0].cover})`
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "stamp"
  }, /*#__PURE__*/React.createElement("span", null, "TOPTOON", /*#__PURE__*/React.createElement("br", null), "COLLECTION"), /*#__PURE__*/React.createElement("span", null, "2025", /*#__PURE__*/React.createElement("br", null), "SEASON 03")))), /*#__PURE__*/React.createElement("div", {
    className: "cp-sec-head"
  }, /*#__PURE__*/React.createElement("h2", null, "SEASON 03 \xB7 \uC804\uCCB4 \uCEEC\uB809\uC158"), /*#__PURE__*/React.createElement("span", {
    className: "cp-sub"
  }, data[0].period)), /*#__PURE__*/React.createElement(CSort, {
    sort: sort,
    onSort: onSort,
    count: data.length
  }), /*#__PURE__*/React.createElement("div", {
    className: "v3-grid"
  }, data.map((c, i) => /*#__PURE__*/React.createElement(V3Card, {
    key: c.id,
    c: c,
    i: i,
    onClick: () => onOpen(c)
  })))));
}

// ── V1 Empty — same shell as V1, empty state ────────────────
function V1Empty() {
  return /*#__PURE__*/React.createElement("div", {
    className: "cp-page v1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cp-stage"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cp-pagetitle"
  }, /*#__PURE__*/React.createElement("div", {
    className: "crumb"
  }, "\uB0B4\uC11C\uC7AC \xB7 ", /*#__PURE__*/React.createElement("b", null, "\uCEEC\uB809\uC158")), /*#__PURE__*/React.createElement("h1", null, /*#__PURE__*/React.createElement("span", {
    className: "em"
  }, "\uCEEC\uB809\uC158"), "\uC73C\uB85C \uB9CC\uB098\uB294 \uD0D1\uD230"), /*#__PURE__*/React.createElement("p", null, "\uAC19\uC740 \uCDE8\uD5A5\uC744 \uAC00\uC9C4 \uC5EC\uB7EC\uBD84\uC744 \uC704\uD574 \uD050\uB808\uC774\uD130\uAC00 \uC5EE\uC740 \uD14C\uB9C8\uBCC4 \uC791\uD488 \uBAA8\uC74C.")), /*#__PURE__*/React.createElement("div", {
    className: "cp-sec-head"
  }, /*#__PURE__*/React.createElement("h2", null, "\uB0B4\uAC00 \uBCF8 \uCEEC\uB809\uC158")), /*#__PURE__*/React.createElement(CEmpty, null)));
}
Object.assign(window, {
  V1Screen,
  V2Screen,
  V3Screen,
  V1Empty
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "preview/CollectionScreens.jsx", error: String((e && e.message) || e) }); }

// preview/design-canvas.jsx
try { (() => {
// DesignCanvas.jsx — Figma-ish design canvas wrapper
// Warm gray grid bg + Sections + Artboards + PostIt notes.
// Artboards are reorderable (grip-drag), labels/titles are inline-editable,
// and any artboard can be opened in a fullscreen focus overlay (←/→/Esc).
// State persists to a .design-canvas.state.json sidecar via the host
// bridge. No assets, no deps.
//
// Usage:
//   <DesignCanvas>
//     <DCSection id="onboarding" title="Onboarding" subtitle="First-run variants">
//       <DCArtboard id="a" label="A · Dusk" width={260} height={480}>…</DCArtboard>
//       <DCArtboard id="b" label="B · Minimal" width={260} height={480}>…</DCArtboard>
//     </DCSection>
//   </DesignCanvas>

const DC = {
  bg: '#f0eee9',
  grid: 'rgba(0,0,0,0.06)',
  label: 'rgba(60,50,40,0.7)',
  title: 'rgba(40,30,20,0.85)',
  subtitle: 'rgba(60,50,40,0.6)',
  postitBg: '#fef4a8',
  postitText: '#5a4a2a',
  font: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif'
};

// One-time CSS injection (classes are dc-prefixed so they don't collide with
// the hosted design's own styles).
if (typeof document !== 'undefined' && !document.getElementById('dc-styles')) {
  const s = document.createElement('style');
  s.id = 'dc-styles';
  s.textContent = ['.dc-editable{cursor:text;outline:none;white-space:nowrap;border-radius:3px;padding:0 2px;margin:0 -2px}', '.dc-editable:focus{background:#fff;box-shadow:0 0 0 1.5px #c96442}', '[data-dc-slot]{transition:transform .18s cubic-bezier(.2,.7,.3,1)}', '[data-dc-slot].dc-dragging{transition:none;z-index:10;pointer-events:none}', '[data-dc-slot].dc-dragging .dc-card{box-shadow:0 12px 40px rgba(0,0,0,.25),0 0 0 2px #c96442;transform:scale(1.02)}', '.dc-card{transition:box-shadow .15s,transform .15s}', '.dc-card *{scrollbar-width:none}', '.dc-card *::-webkit-scrollbar{display:none}', '.dc-labelrow{display:flex;align-items:center;gap:4px;height:24px}', '.dc-grip{cursor:grab;display:flex;align-items:center;padding:5px 4px;border-radius:4px;transition:background .12s}', '.dc-grip:hover{background:rgba(0,0,0,.08)}', '.dc-grip:active{cursor:grabbing}', '.dc-labeltext{cursor:pointer;border-radius:4px;padding:3px 6px;display:flex;align-items:center;transition:background .12s}', '.dc-labeltext:hover{background:rgba(0,0,0,.05)}', '.dc-expand{position:absolute;bottom:100%;right:0;margin-bottom:5px;z-index:2;opacity:0;transition:opacity .12s,background .12s;', '  width:22px;height:22px;border-radius:5px;border:none;cursor:pointer;padding:0;', '  background:transparent;color:rgba(60,50,40,.7);display:flex;align-items:center;justify-content:center}', '.dc-expand:hover{background:rgba(0,0,0,.06);color:#2a251f}', '[data-dc-slot]:hover .dc-expand{opacity:1}'].join('\n');
  document.head.appendChild(s);
}
const DCCtx = React.createContext(null);

// ─────────────────────────────────────────────────────────────
// DesignCanvas — stateful wrapper around the pan/zoom viewport.
// Owns runtime state (per-section order, renamed titles/labels, focused
// artboard). Order/titles/labels persist to a .design-canvas.state.json
// sidecar next to the HTML. Reads go via plain fetch() so the saved
// arrangement is visible anywhere the HTML + sidecar are served together
// (omelette preview, direct link, downloaded zip). Writes go through the
// host's window.omelette bridge — editing requires the omelette runtime.
// Focus is ephemeral.
// ─────────────────────────────────────────────────────────────
const DC_STATE_FILE = '.design-canvas.state.json';
function DesignCanvas({
  children,
  minScale,
  maxScale,
  style
}) {
  const [state, setState] = React.useState({
    sections: {},
    focus: null
  });
  // Hold rendering until the sidecar read settles so the saved order/titles
  // appear on first paint (no source-order flash). didRead gates writes until
  // the read settles so the empty initial state can't clobber a slow read;
  // skipNextWrite suppresses the one echo-write that would otherwise follow
  // hydration.
  const [ready, setReady] = React.useState(false);
  const didRead = React.useRef(false);
  const skipNextWrite = React.useRef(false);
  React.useEffect(() => {
    let off = false;
    fetch('./' + DC_STATE_FILE).then(r => r.ok ? r.json() : null).then(saved => {
      if (off || !saved || !saved.sections) return;
      skipNextWrite.current = true;
      setState(s => ({
        ...s,
        sections: saved.sections
      }));
    }).catch(() => {}).finally(() => {
      didRead.current = true;
      if (!off) setReady(true);
    });
    const t = setTimeout(() => {
      if (!off) setReady(true);
    }, 150);
    return () => {
      off = true;
      clearTimeout(t);
    };
  }, []);
  React.useEffect(() => {
    if (!didRead.current) return;
    if (skipNextWrite.current) {
      skipNextWrite.current = false;
      return;
    }
    const t = setTimeout(() => {
      window.omelette?.writeFile(DC_STATE_FILE, JSON.stringify({
        sections: state.sections
      })).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [state.sections]);

  // Build registries synchronously from children so FocusOverlay can read
  // them in the same render. Only direct DCSection > DCArtboard children are
  // walked — wrapping them in other elements opts out of focus/reorder.
  const registry = {}; // slotId -> { sectionId, artboard }
  const sectionMeta = {}; // sectionId -> { title, subtitle, slotIds[] }
  const sectionOrder = [];
  React.Children.forEach(children, sec => {
    if (!sec || sec.type !== DCSection) return;
    const sid = sec.props.id ?? sec.props.title;
    if (!sid) return;
    sectionOrder.push(sid);
    const persisted = state.sections[sid] || {};
    const srcIds = [];
    React.Children.forEach(sec.props.children, ab => {
      if (!ab || ab.type !== DCArtboard) return;
      const aid = ab.props.id ?? ab.props.label;
      if (!aid) return;
      registry[`${sid}/${aid}`] = {
        sectionId: sid,
        artboard: ab
      };
      srcIds.push(aid);
    });
    const kept = (persisted.order || []).filter(k => srcIds.includes(k));
    sectionMeta[sid] = {
      title: persisted.title ?? sec.props.title,
      subtitle: sec.props.subtitle,
      slotIds: [...kept, ...srcIds.filter(k => !kept.includes(k))]
    };
  });
  const api = React.useMemo(() => ({
    state,
    section: id => state.sections[id] || {},
    patchSection: (id, p) => setState(s => ({
      ...s,
      sections: {
        ...s.sections,
        [id]: {
          ...s.sections[id],
          ...(typeof p === 'function' ? p(s.sections[id] || {}) : p)
        }
      }
    })),
    setFocus: slotId => setState(s => ({
      ...s,
      focus: slotId
    }))
  }), [state]);

  // Esc exits focus; any outside pointerdown commits an in-progress rename.
  React.useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') api.setFocus(null);
    };
    const onPd = e => {
      const ae = document.activeElement;
      if (ae && ae.isContentEditable && !ae.contains(e.target)) ae.blur();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPd, true);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPd, true);
    };
  }, [api]);
  return /*#__PURE__*/React.createElement(DCCtx.Provider, {
    value: api
  }, /*#__PURE__*/React.createElement(DCViewport, {
    minScale: minScale,
    maxScale: maxScale,
    style: style
  }, ready && children), state.focus && registry[state.focus] && /*#__PURE__*/React.createElement(DCFocusOverlay, {
    entry: registry[state.focus],
    sectionMeta: sectionMeta,
    sectionOrder: sectionOrder
  }));
}

// ─────────────────────────────────────────────────────────────
// DCViewport — transform-based pan/zoom (internal)
//
// Input mapping (Figma-style):
//   • trackpad pinch  → zoom   (ctrlKey wheel; Safari gesture* events)
//   • trackpad scroll → pan    (two-finger)
//   • mouse wheel     → zoom   (notched; distinguished from trackpad scroll)
//   • middle-drag / primary-drag-on-bg → pan
//
// Transform state lives in a ref and is written straight to the DOM
// (translate3d + will-change) so wheel ticks don't go through React —
// keeps pans at 60fps on dense canvases.
// ─────────────────────────────────────────────────────────────
function DCViewport({
  children,
  minScale = 0.1,
  maxScale = 8,
  style = {}
}) {
  const vpRef = React.useRef(null);
  const worldRef = React.useRef(null);
  const tf = React.useRef({
    x: 0,
    y: 0,
    scale: 1
  });
  const apply = React.useCallback(() => {
    const {
      x,
      y,
      scale
    } = tf.current;
    const el = worldRef.current;
    if (el) el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
  }, []);
  React.useEffect(() => {
    const vp = vpRef.current;
    if (!vp) return;
    const zoomAt = (cx, cy, factor) => {
      const r = vp.getBoundingClientRect();
      const px = cx - r.left,
        py = cy - r.top;
      const t = tf.current;
      const next = Math.min(maxScale, Math.max(minScale, t.scale * factor));
      const k = next / t.scale;
      // keep the world point under the cursor fixed
      t.x = px - (px - t.x) * k;
      t.y = py - (py - t.y) * k;
      t.scale = next;
      apply();
    };

    // Mouse-wheel vs trackpad-scroll heuristic. A physical wheel sends
    // line-mode deltas (Firefox) or large integer pixel deltas with no X
    // component (Chrome/Safari, typically multiples of 100/120). Trackpad
    // two-finger scroll sends small/fractional pixel deltas, often with
    // non-zero deltaX. ctrlKey is set by the browser for trackpad pinch.
    const isMouseWheel = e => e.deltaMode !== 0 || e.deltaX === 0 && Number.isInteger(e.deltaY) && Math.abs(e.deltaY) >= 40;
    const onWheel = e => {
      e.preventDefault();
      if (isGesturing) return; // Safari: gesture* owns the pinch — discard concurrent wheels
      if (e.ctrlKey) {
        // trackpad pinch (or explicit ctrl+wheel)
        zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.01));
      } else if (isMouseWheel(e)) {
        // notched mouse wheel — fixed-ratio step per click
        zoomAt(e.clientX, e.clientY, Math.exp(-Math.sign(e.deltaY) * 0.18));
      } else {
        // trackpad two-finger scroll — pan
        tf.current.x -= e.deltaX;
        tf.current.y -= e.deltaY;
        apply();
      }
    };

    // Safari sends native gesture* events for trackpad pinch with a smooth
    // e.scale; preferring these over the ctrl+wheel fallback gives a much
    // better feel there. No-ops on other browsers. Safari also fires
    // ctrlKey wheel events during the same pinch — isGesturing makes
    // onWheel drop those entirely so they neither zoom nor pan.
    let gsBase = 1;
    let isGesturing = false;
    const onGestureStart = e => {
      e.preventDefault();
      isGesturing = true;
      gsBase = tf.current.scale;
    };
    const onGestureChange = e => {
      e.preventDefault();
      zoomAt(e.clientX, e.clientY, gsBase * e.scale / tf.current.scale);
    };
    const onGestureEnd = e => {
      e.preventDefault();
      isGesturing = false;
    };

    // Drag-pan: middle button anywhere, or primary button on canvas
    // background (anything that isn't an artboard or an inline editor).
    let drag = null;
    const onPointerDown = e => {
      const onBg = !e.target.closest('[data-dc-slot], .dc-editable');
      if (!(e.button === 1 || e.button === 0 && onBg)) return;
      e.preventDefault();
      vp.setPointerCapture(e.pointerId);
      drag = {
        id: e.pointerId,
        lx: e.clientX,
        ly: e.clientY
      };
      vp.style.cursor = 'grabbing';
    };
    const onPointerMove = e => {
      if (!drag || e.pointerId !== drag.id) return;
      tf.current.x += e.clientX - drag.lx;
      tf.current.y += e.clientY - drag.ly;
      drag.lx = e.clientX;
      drag.ly = e.clientY;
      apply();
    };
    const onPointerUp = e => {
      if (!drag || e.pointerId !== drag.id) return;
      vp.releasePointerCapture(e.pointerId);
      drag = null;
      vp.style.cursor = '';
    };
    vp.addEventListener('wheel', onWheel, {
      passive: false
    });
    vp.addEventListener('gesturestart', onGestureStart, {
      passive: false
    });
    vp.addEventListener('gesturechange', onGestureChange, {
      passive: false
    });
    vp.addEventListener('gestureend', onGestureEnd, {
      passive: false
    });
    vp.addEventListener('pointerdown', onPointerDown);
    vp.addEventListener('pointermove', onPointerMove);
    vp.addEventListener('pointerup', onPointerUp);
    vp.addEventListener('pointercancel', onPointerUp);
    return () => {
      vp.removeEventListener('wheel', onWheel);
      vp.removeEventListener('gesturestart', onGestureStart);
      vp.removeEventListener('gesturechange', onGestureChange);
      vp.removeEventListener('gestureend', onGestureEnd);
      vp.removeEventListener('pointerdown', onPointerDown);
      vp.removeEventListener('pointermove', onPointerMove);
      vp.removeEventListener('pointerup', onPointerUp);
      vp.removeEventListener('pointercancel', onPointerUp);
    };
  }, [apply, minScale, maxScale]);
  const gridSvg = `url("data:image/svg+xml,%3Csvg width='120' height='120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M120 0H0v120' fill='none' stroke='${encodeURIComponent(DC.grid)}' stroke-width='1'/%3E%3C/svg%3E")`;
  return /*#__PURE__*/React.createElement("div", {
    ref: vpRef,
    className: "design-canvas",
    style: {
      height: '100vh',
      width: '100vw',
      background: DC.bg,
      overflow: 'hidden',
      overscrollBehavior: 'none',
      touchAction: 'none',
      position: 'relative',
      fontFamily: DC.font,
      boxSizing: 'border-box',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    ref: worldRef,
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      transformOrigin: '0 0',
      willChange: 'transform',
      width: 'max-content',
      minWidth: '100%',
      minHeight: '100%',
      padding: '60px 0 80px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: -6000,
      backgroundImage: gridSvg,
      backgroundSize: '120px 120px',
      pointerEvents: 'none',
      zIndex: -1
    }
  }), children));
}

// ─────────────────────────────────────────────────────────────
// DCSection — editable title + h-row of artboards in persisted order
// ─────────────────────────────────────────────────────────────
function DCSection({
  id,
  title,
  subtitle,
  children,
  gap = 48
}) {
  const ctx = React.useContext(DCCtx);
  const sid = id ?? title;
  const all = React.Children.toArray(children);
  const artboards = all.filter(c => c && c.type === DCArtboard);
  const rest = all.filter(c => !(c && c.type === DCArtboard));
  const srcOrder = artboards.map(a => a.props.id ?? a.props.label);
  const sec = ctx && sid && ctx.section(sid) || {};
  const order = React.useMemo(() => {
    const kept = (sec.order || []).filter(k => srcOrder.includes(k));
    return [...kept, ...srcOrder.filter(k => !kept.includes(k))];
  }, [sec.order, srcOrder.join('|')]);
  const byId = Object.fromEntries(artboards.map(a => [a.props.id ?? a.props.label, a]));
  return /*#__PURE__*/React.createElement("div", {
    "data-dc-section": sid,
    style: {
      marginBottom: 80,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 60px 56px'
    }
  }, /*#__PURE__*/React.createElement(DCEditable, {
    tag: "div",
    value: sec.title ?? title,
    onChange: v => ctx && sid && ctx.patchSection(sid, {
      title: v
    }),
    style: {
      fontSize: 28,
      fontWeight: 600,
      color: DC.title,
      letterSpacing: -0.4,
      marginBottom: 6,
      display: 'inline-block'
    }
  }), subtitle && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      color: DC.subtitle
    }
  }, subtitle)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap,
      padding: '0 60px',
      alignItems: 'flex-start',
      width: 'max-content'
    }
  }, order.map(k => /*#__PURE__*/React.createElement(DCArtboardFrame, {
    key: k,
    sectionId: sid,
    artboard: byId[k],
    order: order,
    label: (sec.labels || {})[k] ?? byId[k].props.label,
    onRename: v => ctx && ctx.patchSection(sid, x => ({
      labels: {
        ...x.labels,
        [k]: v
      }
    })),
    onReorder: next => ctx && ctx.patchSection(sid, {
      order: next
    }),
    onFocus: () => ctx && ctx.setFocus(`${sid}/${k}`)
  }))), rest);
}

// DCArtboard — marker; rendered by DCArtboardFrame via DCSection.
function DCArtboard() {
  return null;
}
function DCArtboardFrame({
  sectionId,
  artboard,
  label,
  order,
  onRename,
  onReorder,
  onFocus
}) {
  const {
    id: rawId,
    label: rawLabel,
    width = 260,
    height = 480,
    children,
    style = {}
  } = artboard.props;
  const id = rawId ?? rawLabel;
  const ref = React.useRef(null);

  // Live drag-reorder: dragged card sticks to cursor; siblings slide into
  // their would-be slots in real time via transforms. DOM order only
  // changes on drop.
  const onGripDown = e => {
    e.preventDefault();
    e.stopPropagation();
    const me = ref.current;
    // translateX is applied in local (pre-scale) space but pointer deltas and
    // getBoundingClientRect().left are screen-space — divide by the viewport's
    // current scale so the dragged card tracks the cursor at any zoom level.
    const scale = me.getBoundingClientRect().width / me.offsetWidth || 1;
    const peers = Array.from(document.querySelectorAll(`[data-dc-section="${sectionId}"] [data-dc-slot]`));
    const homes = peers.map(el => ({
      el,
      id: el.dataset.dcSlot,
      x: el.getBoundingClientRect().left
    }));
    const slotXs = homes.map(h => h.x);
    const startIdx = order.indexOf(id);
    const startX = e.clientX;
    let liveOrder = order.slice();
    me.classList.add('dc-dragging');
    const layout = () => {
      for (const h of homes) {
        if (h.id === id) continue;
        const slot = liveOrder.indexOf(h.id);
        h.el.style.transform = `translateX(${(slotXs[slot] - h.x) / scale}px)`;
      }
    };
    const move = ev => {
      const dx = ev.clientX - startX;
      me.style.transform = `translateX(${dx / scale}px)`;
      const cur = homes[startIdx].x + dx;
      let nearest = 0,
        best = Infinity;
      for (let i = 0; i < slotXs.length; i++) {
        const d = Math.abs(slotXs[i] - cur);
        if (d < best) {
          best = d;
          nearest = i;
        }
      }
      if (liveOrder.indexOf(id) !== nearest) {
        liveOrder = order.filter(k => k !== id);
        liveOrder.splice(nearest, 0, id);
        layout();
      }
    };
    const up = () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      const finalSlot = liveOrder.indexOf(id);
      me.classList.remove('dc-dragging');
      me.style.transform = `translateX(${(slotXs[finalSlot] - homes[startIdx].x) / scale}px)`;
      // After the settle transition, kill transitions + clear transforms +
      // commit the reorder in the same frame so there's no visual snap-back.
      setTimeout(() => {
        for (const h of homes) {
          h.el.style.transition = 'none';
          h.el.style.transform = '';
        }
        if (liveOrder.join('|') !== order.join('|')) onReorder(liveOrder);
        requestAnimationFrame(() => requestAnimationFrame(() => {
          for (const h of homes) h.el.style.transition = '';
        }));
      }, 180);
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement("div", {
    ref: ref,
    "data-dc-slot": id,
    style: {
      position: 'relative',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "dc-labelrow",
    style: {
      position: 'absolute',
      bottom: '100%',
      left: -4,
      marginBottom: 4,
      color: DC.label
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "dc-grip",
    onPointerDown: onGripDown,
    title: "Drag to reorder"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "9",
    height: "13",
    viewBox: "0 0 9 13",
    fill: "currentColor"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "2",
    cy: "2",
    r: "1.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "7",
    cy: "2",
    r: "1.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "2",
    cy: "6.5",
    r: "1.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "7",
    cy: "6.5",
    r: "1.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "2",
    cy: "11",
    r: "1.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "7",
    cy: "11",
    r: "1.1"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "dc-labeltext",
    onClick: onFocus,
    title: "Click to focus"
  }, /*#__PURE__*/React.createElement(DCEditable, {
    value: label,
    onChange: onRename,
    onClick: e => e.stopPropagation(),
    style: {
      fontSize: 15,
      fontWeight: 500,
      color: DC.label,
      lineHeight: 1
    }
  }))), /*#__PURE__*/React.createElement("button", {
    className: "dc-expand",
    onClick: onFocus,
    onPointerDown: e => e.stopPropagation(),
    title: "Focus"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 12 12",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M7 1h4v4M5 11H1V7M11 1L7.5 4.5M1 11l3.5-3.5"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "dc-card",
    style: {
      borderRadius: 2,
      boxShadow: '0 1px 3px rgba(0,0,0,.08),0 4px 16px rgba(0,0,0,.06)',
      overflow: 'hidden',
      width,
      height,
      background: '#fff',
      ...style
    }
  }, children || /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#bbb',
      fontSize: 13,
      fontFamily: DC.font
    }
  }, id)));
}

// Inline rename — commits on blur or Enter.
function DCEditable({
  value,
  onChange,
  style,
  tag = 'span',
  onClick
}) {
  const T = tag;
  return /*#__PURE__*/React.createElement(T, {
    className: "dc-editable",
    contentEditable: true,
    suppressContentEditableWarning: true,
    onClick: onClick,
    onPointerDown: e => e.stopPropagation(),
    onBlur: e => onChange && onChange(e.currentTarget.textContent),
    onKeyDown: e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.currentTarget.blur();
      }
    },
    style: style
  }, value);
}

// ─────────────────────────────────────────────────────────────
// Focus mode — overlay one artboard; ←/→ within section, ↑/↓ across
// sections, Esc or backdrop click to exit.
// ─────────────────────────────────────────────────────────────
function DCFocusOverlay({
  entry,
  sectionMeta,
  sectionOrder
}) {
  const ctx = React.useContext(DCCtx);
  const {
    sectionId,
    artboard
  } = entry;
  const sec = ctx.section(sectionId);
  const meta = sectionMeta[sectionId];
  const peers = meta.slotIds;
  const aid = artboard.props.id ?? artboard.props.label;
  const idx = peers.indexOf(aid);
  const secIdx = sectionOrder.indexOf(sectionId);
  const go = d => {
    const n = peers[(idx + d + peers.length) % peers.length];
    if (n) ctx.setFocus(`${sectionId}/${n}`);
  };
  const goSection = d => {
    const ns = sectionOrder[(secIdx + d + sectionOrder.length) % sectionOrder.length];
    const first = sectionMeta[ns] && sectionMeta[ns].slotIds[0];
    if (first) ctx.setFocus(`${ns}/${first}`);
  };
  React.useEffect(() => {
    const k = e => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        go(-1);
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        go(1);
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        goSection(-1);
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        goSection(1);
      }
    };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  });
  const {
    width = 260,
    height = 480,
    children
  } = artboard.props;
  const [vp, setVp] = React.useState({
    w: window.innerWidth,
    h: window.innerHeight
  });
  React.useEffect(() => {
    const r = () => setVp({
      w: window.innerWidth,
      h: window.innerHeight
    });
    window.addEventListener('resize', r);
    return () => window.removeEventListener('resize', r);
  }, []);
  const scale = Math.max(0.1, Math.min((vp.w - 200) / width, (vp.h - 260) / height, 2));
  const [ddOpen, setDd] = React.useState(false);
  const Arrow = ({
    dir,
    onClick
  }) => /*#__PURE__*/React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      onClick();
    },
    style: {
      position: 'absolute',
      top: '50%',
      [dir]: 28,
      transform: 'translateY(-50%)',
      border: 'none',
      background: 'rgba(255,255,255,.08)',
      color: 'rgba(255,255,255,.9)',
      width: 44,
      height: 44,
      borderRadius: 22,
      fontSize: 18,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background .15s'
    },
    onMouseEnter: e => e.currentTarget.style.background = 'rgba(255,255,255,.18)',
    onMouseLeave: e => e.currentTarget.style.background = 'rgba(255,255,255,.08)'
  }, /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 18 18",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: dir === 'left' ? 'M11 3L5 9l6 6' : 'M7 3l6 6-6 6'
  })));

  // Portal to body so position:fixed is the real viewport regardless of any
  // transform on DesignCanvas's ancestors (including the canvas zoom itself).
  return ReactDOM.createPortal(/*#__PURE__*/React.createElement("div", {
    onClick: () => ctx.setFocus(null),
    onWheel: e => e.preventDefault(),
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      background: 'rgba(24,20,16,.6)',
      backdropFilter: 'blur(14px)',
      fontFamily: DC.font,
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 72,
      display: 'flex',
      alignItems: 'flex-start',
      padding: '16px 20px 0',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setDd(o => !o),
    style: {
      border: 'none',
      background: 'transparent',
      color: '#fff',
      cursor: 'pointer',
      padding: '6px 8px',
      borderRadius: 6,
      textAlign: 'left',
      fontFamily: 'inherit'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 18,
      fontWeight: 600,
      letterSpacing: -0.3
    }
  }, meta.title), /*#__PURE__*/React.createElement("svg", {
    width: "11",
    height: "11",
    viewBox: "0 0 11 11",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    style: {
      opacity: .7
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M2 4l3.5 3.5L9 4"
  }))), meta.subtitle && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 13,
      opacity: .6,
      fontWeight: 400,
      marginTop: 2
    }
  }, meta.subtitle)), ddOpen && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: '100%',
      left: 0,
      marginTop: 4,
      background: '#2a251f',
      borderRadius: 8,
      boxShadow: '0 8px 32px rgba(0,0,0,.4)',
      padding: 4,
      minWidth: 200,
      zIndex: 10
    }
  }, sectionOrder.map(sid => /*#__PURE__*/React.createElement("button", {
    key: sid,
    onClick: () => {
      setDd(false);
      const f = sectionMeta[sid].slotIds[0];
      if (f) ctx.setFocus(`${sid}/${f}`);
    },
    style: {
      display: 'block',
      width: '100%',
      textAlign: 'left',
      border: 'none',
      cursor: 'pointer',
      background: sid === sectionId ? 'rgba(255,255,255,.1)' : 'transparent',
      color: '#fff',
      padding: '8px 12px',
      borderRadius: 5,
      fontSize: 14,
      fontWeight: sid === sectionId ? 600 : 400,
      fontFamily: 'inherit'
    }
  }, sectionMeta[sid].title)))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => ctx.setFocus(null),
    onMouseEnter: e => e.currentTarget.style.background = 'rgba(255,255,255,.12)',
    onMouseLeave: e => e.currentTarget.style.background = 'transparent',
    style: {
      border: 'none',
      background: 'transparent',
      color: 'rgba(255,255,255,.7)',
      width: 32,
      height: 32,
      borderRadius: 16,
      fontSize: 20,
      cursor: 'pointer',
      lineHeight: 1,
      transition: 'background .12s'
    }
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 64,
      bottom: 56,
      left: 100,
      right: 100,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: width * scale,
      height: height * scale,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width,
      height,
      transform: `scale(${scale})`,
      transformOrigin: 'top left',
      background: '#fff',
      borderRadius: 2,
      overflow: 'hidden',
      boxShadow: '0 20px 80px rgba(0,0,0,.4)'
    }
  }, children || /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#bbb'
    }
  }, aid))), /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      fontSize: 14,
      fontWeight: 500,
      opacity: .85,
      textAlign: 'center'
    }
  }, (sec.labels || {})[aid] ?? artboard.props.label, /*#__PURE__*/React.createElement("span", {
    style: {
      opacity: .5,
      marginLeft: 10,
      fontVariantNumeric: 'tabular-nums'
    }
  }, idx + 1, " / ", peers.length))), /*#__PURE__*/React.createElement(Arrow, {
    dir: "left",
    onClick: () => go(-1)
  }), /*#__PURE__*/React.createElement(Arrow, {
    dir: "right",
    onClick: () => go(1)
  }), /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      position: 'absolute',
      bottom: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: 8
    }
  }, peers.map((p, i) => /*#__PURE__*/React.createElement("button", {
    key: p,
    onClick: () => ctx.setFocus(`${sectionId}/${p}`),
    style: {
      border: 'none',
      padding: 0,
      cursor: 'pointer',
      width: 6,
      height: 6,
      borderRadius: 3,
      background: i === idx ? '#fff' : 'rgba(255,255,255,.3)'
    }
  })))), document.body);
}

// ─────────────────────────────────────────────────────────────
// Post-it — absolute-positioned sticky note
// ─────────────────────────────────────────────────────────────
function DCPostIt({
  children,
  top,
  left,
  right,
  bottom,
  rotate = -2,
  width = 180
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top,
      left,
      right,
      bottom,
      width,
      background: DC.postitBg,
      padding: '14px 16px',
      fontFamily: '"Comic Sans MS", "Marker Felt", "Segoe Print", cursive',
      fontSize: 14,
      lineHeight: 1.4,
      color: DC.postitText,
      boxShadow: '0 2px 8px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
      transform: `rotate(${rotate}deg)`,
      zIndex: 5
    }
  }, children);
}
Object.assign(window, {
  DesignCanvas,
  DCSection,
  DCArtboard,
  DCPostIt
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "preview/design-canvas.jsx", error: String((e && e.message) || e) }); }

// ui_kits/toptoon-web/Components.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// TopToon UI Kit — atomic components
const {
  useState
} = React;
const ASSET = '../../assets';
const ICON = `${ASSET}/icons`;
const BANNER = `${ASSET}/banners`;

// --- Icon helper --------------------------------------------------
const Icon = ({
  name,
  size = 22,
  invert = true,
  ...rest
}) => /*#__PURE__*/React.createElement("img", _extends({
  src: `${ICON}/${name}`,
  style: {
    height: size,
    filter: invert ? 'brightness(0) invert(1)' : 'none'
  }
}, rest));

// --- Logo ---------------------------------------------------------
const Logo = ({
  variant = 'white'
}) => /*#__PURE__*/React.createElement("img", {
  src: `${ASSET}/logo-toptoon-${variant}.png`,
  style: {
    height: 30
  },
  alt: "\uD0D1\uD230"
});

// --- Top nav ------------------------------------------------------
const TOP_TABS = ['연재', '영상', '신작', '완결', '세일', '갤러리/쇼츠', '내서재', '선물함'];
const TopNav = ({
  activeTab,
  onTab,
  onLogo
}) => /*#__PURE__*/React.createElement("nav", {
  className: "tt-nav"
}, /*#__PURE__*/React.createElement("div", {
  className: "tt-nav__top"
}, /*#__PURE__*/React.createElement("div", {
  className: "tt-nav__menu"
}, /*#__PURE__*/React.createElement("div", {
  style: {
    cursor: 'pointer'
  },
  onClick: onLogo
}, /*#__PURE__*/React.createElement(Logo, null))), /*#__PURE__*/React.createElement("div", {
  className: "tt-nav__util"
}, /*#__PURE__*/React.createElement("span", {
  className: "tt-nav__checkin"
}, "\uCD9C\uCCB5"), /*#__PURE__*/React.createElement(Icon, {
  name: "ico-search-white.png",
  size: 20,
  invert: false
}), /*#__PURE__*/React.createElement(Icon, {
  name: "ico-coin-white.png",
  size: 22,
  invert: false
}), /*#__PURE__*/React.createElement(Icon, {
  name: "ico-menu-white.png",
  size: 22,
  invert: false
}))), /*#__PURE__*/React.createElement("div", {
  className: "tt-nav__tabs"
}, TOP_TABS.map(t => /*#__PURE__*/React.createElement("div", {
  key: t,
  className: `tt-nav__tab ${activeTab === t ? 'active' : ''}`,
  onClick: () => onTab && onTab(t)
}, t))));

// --- Section header -----------------------------------------------
const SectionHeader = ({
  title,
  syncing,
  onSync,
  right
}) => /*#__PURE__*/React.createElement("div", {
  className: "tt-section__head"
}, /*#__PURE__*/React.createElement("div", {
  className: "tt-section__title"
}, title), /*#__PURE__*/React.createElement("div", {
  className: "tt-section__right"
}, right, onSync && /*#__PURE__*/React.createElement("img", {
  src: `${ICON}/ico-fix.svg`,
  className: syncing ? 'tt-sync' : '',
  onClick: onSync
})));

// --- Badges -------------------------------------------------------
const Badge = ({
  kind
}) => {
  const map = {
    up: 'badge-up.png',
    new: 'badge-new.png',
    delay: 'badge-delay.png',
    zzz: 'badge-zzz.png',
    freepass: 'badge-freepass.png'
  };
  return /*#__PURE__*/React.createElement("img", {
    src: `${ASSET}/${map[kind]}`,
    style: {
      height: kind === 'freepass' ? 22 : 14
    }
  });
};

// --- Work card ----------------------------------------------------
const WorkCard = ({
  work,
  rank,
  onClick,
  showAdult = true,
  badges = []
}) => /*#__PURE__*/React.createElement("div", {
  className: "tt-work",
  onClick: onClick
}, /*#__PURE__*/React.createElement("div", {
  className: "tt-work__thumb",
  style: {
    backgroundImage: `url(${work.cover})`
  }
}, showAdult && /*#__PURE__*/React.createElement("img", {
  src: `${ICON}/ico-adult.png`,
  className: "tt-work__adult"
}), badges.length > 0 && /*#__PURE__*/React.createElement("div", {
  className: "tt-work__badges"
}, badges.map(b => /*#__PURE__*/React.createElement(Badge, {
  key: b,
  kind: b
})))), /*#__PURE__*/React.createElement("div", {
  className: "tt-work__info"
}, rank != null && /*#__PURE__*/React.createElement("div", {
  className: "tt-work__rank"
}, rank), /*#__PURE__*/React.createElement("div", {
  className: "tt-work__title",
  style: rank != null ? {
    paddingLeft: 30
  } : {}
}, work.title), /*#__PURE__*/React.createElement("div", {
  className: "tt-work__meta",
  style: rank != null ? {
    paddingLeft: 30
  } : {}
}, /*#__PURE__*/React.createElement("span", {
  className: "views"
}, work.views), /*#__PURE__*/React.createElement("span", {
  className: "dot"
}), /*#__PURE__*/React.createElement("span", null, work.episode))));

// --- Banner -------------------------------------------------------
const Banner = ({
  banner,
  total,
  index,
  onDot
}) => /*#__PURE__*/React.createElement("div", {
  className: "tt-banner"
}, /*#__PURE__*/React.createElement("div", {
  className: "tt-banner__bg",
  style: {
    backgroundImage: `url(${banner.img})`
  }
}), /*#__PURE__*/React.createElement("div", {
  className: "tt-banner__overlay"
}), /*#__PURE__*/React.createElement("div", {
  className: "tt-banner__tags"
}, /*#__PURE__*/React.createElement("span", null, banner.tag || '신작')), /*#__PURE__*/React.createElement("div", {
  className: "tt-banner__title"
}, /*#__PURE__*/React.createElement("h3", null, banner.title), /*#__PURE__*/React.createElement("p", {
  dangerouslySetInnerHTML: {
    __html: (banner.sub || '').replace(/<br>/g, ' ')
  }
})), /*#__PURE__*/React.createElement("div", {
  className: "tt-banner__dots"
}, Array.from({
  length: total
}).map((_, i) => /*#__PURE__*/React.createElement("span", {
  key: i,
  className: i === index ? 'on' : '',
  onClick: () => onDot && onDot(i)
}))));

// --- Buttons ------------------------------------------------------
const Button = ({
  variant = 'pri',
  children,
  ...rest
}) => /*#__PURE__*/React.createElement("button", _extends({
  className: `tt-btn tt-btn--${variant}`
}, rest), children);

// --- Episode row --------------------------------------------------
const EP_STATE_LABEL = {
  waitfree: '기다리면 무료',
  freepass: '무료이용권',
  oneplus: '1+1',
  buy: '모두 구매',
  rental: '대여',
  normal: '',
  locked: '구매'
};
const EpisodeRow = ({
  ep,
  onClick
}) => /*#__PURE__*/React.createElement("div", {
  className: `tt-eprow tt-eprow--${ep.state}`,
  onClick: onClick
}, /*#__PURE__*/React.createElement("div", {
  className: "tt-eprow__n"
}, ep.n), /*#__PURE__*/React.createElement("div", {
  className: "tt-eprow__thumb",
  style: {
    backgroundImage: `url(${ep.thumb})`
  }
}), /*#__PURE__*/React.createElement("div", {
  className: "tt-eprow__body"
}, /*#__PURE__*/React.createElement("div", {
  className: "tt-eprow__title"
}, "\uC81C", ep.n, "\uD654 ", ep.title), /*#__PURE__*/React.createElement("div", {
  className: "tt-eprow__meta"
}, ep.date, " \xB7 ", ep.views)), /*#__PURE__*/React.createElement("div", {
  className: "tt-eprow__tag"
}, EP_STATE_LABEL[ep.state]));

// --- Coin pack ----------------------------------------------------
const CoinPack = ({
  pack,
  active,
  onClick
}) => /*#__PURE__*/React.createElement("div", {
  className: `tt-coin ${active ? 'active' : ''}`,
  onClick: onClick
}, /*#__PURE__*/React.createElement("div", {
  className: "tt-coin__left"
}, /*#__PURE__*/React.createElement("img", {
  src: `${ICON}/ico-coin.svg`,
  style: {
    filter: 'brightness(0) invert(1)'
  }
}), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
  className: "tt-coin__price"
}, pack.coins, "\uCF54\uC778"), /*#__PURE__*/React.createElement("div", {
  className: "tt-coin__sub"
}, pack.sub))), /*#__PURE__*/React.createElement("div", {
  className: "tt-coin__right"
}, pack.was && /*#__PURE__*/React.createElement("span", {
  className: "tt-coin__was"
}, "\u20A9", pack.was.toLocaleString()), "\u20A9", pack.price.toLocaleString()));

// --- Bottom tab bar (mobile) --------------------------------------
const BOTTOM_TABS = [{
  id: 'home',
  label: '홈',
  icon: 'ico-home'
}, {
  id: 'weekly',
  label: '연재',
  icon: 'ico-weekly'
}, {
  id: 'sale',
  label: '세일',
  icon: 'ico-sale'
}, {
  id: 'library',
  label: '내서재',
  icon: 'ico-library'
}, {
  id: 'giftbox',
  label: '선물함',
  icon: 'ico-giftbox'
}];
const BottomTabBar = ({
  active,
  onTab
}) => /*#__PURE__*/React.createElement("div", {
  className: "tt-bottomtab"
}, BOTTOM_TABS.map(t => /*#__PURE__*/React.createElement("div", {
  key: t.id,
  className: `tt-bottomtab__item ${active === t.id ? 'active' : ''}`,
  onClick: () => onTab && onTab(t.id)
}, /*#__PURE__*/React.createElement("img", {
  src: `${ICON}/${t.icon}-${active === t.id ? 'active' : 'white'}.png`
}), /*#__PURE__*/React.createElement("span", null, t.label))));

// --- Toast --------------------------------------------------------
const Toast = ({
  msg
}) => msg ? /*#__PURE__*/React.createElement("div", {
  className: "tt-toast"
}, msg) : null;

// --- Footer -------------------------------------------------------
const Footer = () => /*#__PURE__*/React.createElement("footer", {
  className: "tt-footer"
}, /*#__PURE__*/React.createElement("div", {
  className: "tt-footer__inner"
}, /*#__PURE__*/React.createElement("div", {
  className: "tt-footer__links"
}, /*#__PURE__*/React.createElement("a", null, "\uD68C\uC0AC\uC18C\uAC1C"), /*#__PURE__*/React.createElement("a", null, "\uC774\uC6A9\uC57D\uAD00"), /*#__PURE__*/React.createElement("a", null, "\uAC1C\uC778\uC815\uBCF4\uCC98\uB9AC\uBC29\uCE68"), /*#__PURE__*/React.createElement("a", null, "\uCCAD\uC18C\uB144\uBCF4\uD638\uC815\uCC45"), /*#__PURE__*/React.createElement("a", null, "\uACE0\uAC1D\uC13C\uD130")), /*#__PURE__*/React.createElement("div", null, "(\uC8FC)\uD0D1\uCF54\uBBF8\uB514\uC5B4 | \uB300\uD45C\uC774\uC0AC: \uC720\uC815\uC11D | \uC0AC\uC5C5\uC790\uB4F1\uB85D\uBC88\uD638: 123-45-67890"), /*#__PURE__*/React.createElement("div", {
  style: {
    marginTop: 8
  }
}, "Copyright \xA9 TOPCO MEDIA Inc. All rights reserved.")));
Object.assign(window, {
  TTIcon: Icon,
  TTLogo: Logo,
  TTTopNav: TopNav,
  TTSectionHeader: SectionHeader,
  TTBadge: Badge,
  TTWorkCard: WorkCard,
  TTBanner: Banner,
  TTButton: Button,
  TTEpisodeRow: EpisodeRow,
  TTCoinPack: CoinPack,
  TTBottomTabBar: BottomTabBar,
  TTToast: Toast,
  TTFooter: Footer,
  TT_ASSET: ASSET,
  TT_ICON: ICON,
  TT_BANNER: BANNER
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/toptoon-web/Components.jsx", error: String((e && e.message) || e) }); }

// ui_kits/toptoon-web/Fixtures.jsx
try { (() => {
// Fixture data for the UI kit
const TT_BANNERS = [{
  id: 1,
  title: '구멍일지 : 문단속',
  sub: '이런 걸 빨면..<br>무슨 느낌일까..❤',
  img: `${TT_BANNER}/bg07.jpg`,
  tag: '신작'
}, {
  id: 2,
  title: '청소부K',
  sub: '들어가게 해주이소.<br>그 안으로..',
  img: `${TT_BANNER}/bg04.jpg`,
  tag: '연재'
}, {
  id: 3,
  title: '코트 위에선 경기',
  sub: '코트 위에선 경기!<br>침대 위에선 전쟁❤',
  img: `${TT_BANNER}/bg05.jpg`,
  tag: '화제작'
}, {
  id: 4,
  title: '숨겨진 이야기',
  sub: '다시 돌아온 그 남자<br>이번엔 다를까?',
  img: `${TT_BANNER}/bg01.jpg`,
  tag: '인기'
}];
const TT_WORKS = [{
  id: 'w1',
  title: '구멍일지 : 문단속',
  cover: `${TT_BANNER}/bg07.jpg`,
  views: '358.3K',
  episode: '제200화',
  author: '박다영'
}, {
  id: 'w2',
  title: '청소부K',
  cover: `${TT_BANNER}/bg04.jpg`,
  views: '1.4M',
  episode: '제56화',
  author: '홍비'
}, {
  id: 'w3',
  title: '코트 위의 전쟁',
  cover: `${TT_BANNER}/bg05.jpg`,
  views: '982.1K',
  episode: '제42화',
  author: '김민채'
}, {
  id: 'w4',
  title: '숨겨진 이야기',
  cover: `${TT_BANNER}/bg01.jpg`,
  views: '245.6K',
  episode: '제28화',
  author: '이소영'
}, {
  id: 'w5',
  title: '옆집 그녀',
  cover: `${TT_BANNER}/bg07.jpg`,
  views: '672.8K',
  episode: '제75화',
  author: '박다영'
}, {
  id: 'w6',
  title: '밤의 방문객',
  cover: `${TT_BANNER}/bg04.jpg`,
  views: '411.2K',
  episode: '제33화',
  author: '홍비'
}, {
  id: 'w7',
  title: '비밀의 방',
  cover: `${TT_BANNER}/bg05.jpg`,
  views: '523.5K',
  episode: '제61화',
  author: '김민채'
}, {
  id: 'w8',
  title: '그녀의 취향',
  cover: `${TT_BANNER}/bg01.jpg`,
  views: '1.1M',
  episode: '제89화',
  author: '이소영'
}, {
  id: 'w9',
  title: '위험한 동거',
  cover: `${TT_BANNER}/bg07.jpg`,
  views: '834.5K',
  episode: '제45화',
  author: '박다영'
}, {
  id: 'w10',
  title: '금지된 사랑',
  cover: `${TT_BANNER}/bg04.jpg`,
  views: '295.3K',
  episode: '제22화',
  author: '홍비'
}];
const TT_EPS = [{
  n: 1,
  title: '사건의 시작',
  date: '24.01.12',
  views: '125K',
  thumb: `${TT_BANNER}/bg07.jpg`,
  state: 'freepass'
}, {
  n: 2,
  title: '새로운 이웃',
  date: '24.01.19',
  views: '98K',
  thumb: `${TT_BANNER}/bg04.jpg`,
  state: 'freepass'
}, {
  n: 3,
  title: '그날 밤의 소리',
  date: '24.01.26',
  views: '112K',
  thumb: `${TT_BANNER}/bg05.jpg`,
  state: 'waitfree'
}, {
  n: 4,
  title: '돌아온 그녀',
  date: '24.02.02',
  views: '87K',
  thumb: `${TT_BANNER}/bg01.jpg`,
  state: 'oneplus'
}, {
  n: 5,
  title: '다음 아침',
  date: '24.02.09',
  views: '76K',
  thumb: `${TT_BANNER}/bg07.jpg`,
  state: 'rental'
}, {
  n: 6,
  title: '밝혀지는 진실',
  date: '24.02.16',
  views: '82K',
  thumb: `${TT_BANNER}/bg04.jpg`,
  state: 'buy'
}, {
  n: 7,
  title: '예상치 못한 방문자',
  date: '24.02.23',
  views: '94K',
  thumb: `${TT_BANNER}/bg05.jpg`,
  state: 'normal'
}, {
  n: 8,
  title: '갈등의 시작',
  date: '24.03.01',
  views: '71K',
  thumb: `${TT_BANNER}/bg01.jpg`,
  state: 'normal'
}, {
  n: 9,
  title: '폭풍전야',
  date: '24.03.08',
  views: '68K',
  thumb: `${TT_BANNER}/bg07.jpg`,
  state: 'locked'
}, {
  n: 10,
  title: '결정적 순간',
  date: '24.03.15',
  views: '0',
  thumb: `${TT_BANNER}/bg04.jpg`,
  state: 'locked'
}];
const TT_COIN_PACKS = [{
  id: 'p1',
  coins: 10,
  price: 1100,
  was: null,
  sub: '일반충전'
}, {
  id: 'p2',
  coins: 30,
  price: 3300,
  was: null,
  sub: '일반충전'
}, {
  id: 'p3',
  coins: 50,
  price: 5500,
  was: null,
  sub: '+ 보너스 3코인'
}, {
  id: 'p4',
  coins: 100,
  price: 9900,
  was: 11000,
  sub: '자동충전 · + 보너스 10코인'
}, {
  id: 'p5',
  coins: 200,
  price: 19800,
  was: 22000,
  sub: '자동충전 · + 보너스 25코인'
}, {
  id: 'p6',
  coins: 500,
  price: 49500,
  was: 55000,
  sub: '자동충전 · + 보너스 75코인'
}];
const TT_WEEKDAYS = [{
  id: 'mon',
  label: '월'
}, {
  id: 'tue',
  label: '화'
}, {
  id: 'wed',
  label: '수'
}, {
  id: 'thu',
  label: '목'
}, {
  id: 'fri',
  label: '금'
}, {
  id: 'sat',
  label: '토'
}, {
  id: 'sun',
  label: '일'
}, {
  id: 'all',
  label: '전체'
}];
Object.assign(window, {
  TT_BANNERS,
  TT_WORKS,
  TT_EPS,
  TT_COIN_PACKS,
  TT_WEEKDAYS
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/toptoon-web/Fixtures.jsx", error: String((e && e.message) || e) }); }

// ui_kits/toptoon-web/Screens.jsx
try { (() => {
// Screens — modern refresh
const {
  useState: useState2,
  useEffect
} = React;

// --- HOME ---------------------------------------------------------
function Home({
  nav
}) {
  const [bannerIdx, setBannerIdx] = useState2(0);
  useEffect(() => {
    const t = setInterval(() => setBannerIdx(i => (i + 1) % TT_BANNERS.length), 6000);
    return () => clearInterval(t);
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    className: "tt-app"
  }, /*#__PURE__*/React.createElement(TTBanner, {
    banner: TT_BANNERS[bannerIdx],
    total: TT_BANNERS.length,
    index: bannerIdx,
    onDot: setBannerIdx
  }), /*#__PURE__*/React.createElement("section", {
    className: "tt-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tt-section__head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tt-section__title"
  }, "\uC2E4\uC2DC\uAC04 \uB7AD\uD0B9"), /*#__PURE__*/React.createElement("div", {
    className: "tt-section__right"
  }, "\uC804\uCCB4\uBCF4\uAE30 \u2192")), /*#__PURE__*/React.createElement("div", {
    className: "tt-workgrid"
  }, TT_WORKS.slice(0, 5).map((w, i) => /*#__PURE__*/React.createElement(TTWorkCard, {
    key: w.id,
    work: w,
    rank: i + 1,
    onClick: () => nav('epList', w)
  })))), /*#__PURE__*/React.createElement("section", {
    className: "tt-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tt-section__head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tt-section__title"
  }, "\uC774\uBC88\uC8FC \uC2E0\uC791"), /*#__PURE__*/React.createElement("div", {
    className: "tt-section__right"
  }, "\uC804\uCCB4\uBCF4\uAE30 \u2192")), /*#__PURE__*/React.createElement("div", {
    className: "tt-workgrid"
  }, TT_WORKS.slice(5, 10).map(w => /*#__PURE__*/React.createElement(TTWorkCard, {
    key: w.id,
    work: w,
    badges: ['new'],
    onClick: () => nav('epList', w)
  })))), /*#__PURE__*/React.createElement("section", {
    className: "tt-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tt-section__head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tt-section__title"
  }, "\uBB34\uB8CC\uC774\uC6A9\uAD8C\uC73C\uB85C \uC815\uC8FC\uD589"), /*#__PURE__*/React.createElement("div", {
    className: "tt-section__right"
  }, "\uC804\uCCB4\uBCF4\uAE30 \u2192")), /*#__PURE__*/React.createElement("div", {
    className: "tt-workgrid"
  }, TT_WORKS.slice(0, 5).map(w => /*#__PURE__*/React.createElement(TTWorkCard, {
    key: w.id,
    work: w,
    badges: ['freepass'],
    onClick: () => nav('epList', w)
  })))));
}

// --- WEEKLY -------------------------------------------------------
function Weekly({
  nav
}) {
  const [day, setDay] = useState2('mon');
  return /*#__PURE__*/React.createElement("div", {
    className: "tt-app"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tt-weekday-tabs"
  }, TT_WEEKDAYS.map(d => /*#__PURE__*/React.createElement(TTButton, {
    key: d.id,
    variant: day === d.id ? 'pill active' : 'pill',
    onClick: () => setDay(d.id)
  }, d.label))), /*#__PURE__*/React.createElement("section", {
    className: "tt-section",
    style: {
      marginTop: 32
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "tt-section__head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tt-section__title"
  }, TT_WEEKDAYS.find(d => d.id === day).label, "\uC694\uC77C \uC5F0\uC7AC"), /*#__PURE__*/React.createElement("div", {
    className: "tt-section__right"
  }, "\uC5C5\uB370\uC774\uD2B8\uC21C \u2193")), /*#__PURE__*/React.createElement("div", {
    className: "tt-workgrid"
  }, TT_WORKS.map((w, i) => /*#__PURE__*/React.createElement(TTWorkCard, {
    key: w.id,
    work: w,
    badges: i % 3 === 0 ? ['up'] : [],
    onClick: () => nav('epList', w)
  })))));
}

// --- EPISODE LIST -------------------------------------------------
function EpisodeList({
  work,
  nav
}) {
  const [sort, setSort] = useState2('desc');
  const eps = sort === 'desc' ? [...TT_EPS].reverse() : TT_EPS;
  const w = work || TT_WORKS[0];
  return /*#__PURE__*/React.createElement("div", {
    className: "tt-app"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tt-series"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tt-series__cover",
    style: {
      backgroundImage: `url(${w.cover})`
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "tt-series__body"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "tt-series__title"
  }, w.title), /*#__PURE__*/React.createElement("div", {
    className: "tt-series__author"
  }, w.author, " \xB7 \uB4DC\uB77C\uB9C8 \xB7 \uB85C\uB9E8\uC2A4"), /*#__PURE__*/React.createElement("div", {
    className: "tt-series__tags"
  }, /*#__PURE__*/React.createElement("span", {
    className: "tag"
  }, "\uB85C\uB9E8\uC2A4"), /*#__PURE__*/React.createElement("span", {
    className: "tag"
  }, "\uC131\uC778"), /*#__PURE__*/React.createElement("span", {
    className: "tag"
  }, "\uB4DC\uB77C\uB9C8")), /*#__PURE__*/React.createElement("div", {
    className: "tt-series__actions"
  }, /*#__PURE__*/React.createElement(TTButton, {
    variant: "pri",
    onClick: () => nav('viewer', w)
  }, "1\uD654\uBD80\uD130 \uBCF4\uAE30"), /*#__PURE__*/React.createElement(TTButton, {
    variant: "sec"
  }, "\uAD00\uC2EC +")))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 32
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--tt-fg)',
      fontSize: 14,
      fontWeight: 600
    }
  }, "\uC804\uCCB4 ", TT_EPS.length, "\uD654"), /*#__PURE__*/React.createElement(TTButton, {
    variant: "ghost",
    onClick: () => setSort(sort === 'desc' ? 'asc' : 'desc')
  }, sort === 'desc' ? '최신순 ↓' : '첫화부터 ↑')), /*#__PURE__*/React.createElement("div", {
    className: "tt-eplist"
  }, eps.map(ep => /*#__PURE__*/React.createElement(TTEpisodeRow, {
    key: ep.n,
    ep: ep,
    onClick: () => ep.state !== 'locked' && nav('viewer', w, ep)
  }))));
}

// --- VIEWER -------------------------------------------------------
function Viewer({
  work,
  nav
}) {
  const w = work || TT_WORKS[0];
  return /*#__PURE__*/React.createElement("div", {
    className: "tt-viewer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tt-viewer__top"
  }, /*#__PURE__*/React.createElement("img", {
    src: `${TT_ICON}/ico-back.svg`,
    onClick: () => nav('epList', w)
  }), /*#__PURE__*/React.createElement("span", {
    className: "title"
  }, w.title, " \xB7 \uC81C1\uD654"), /*#__PURE__*/React.createElement("img", {
    src: `${TT_ICON}/ico-keep.svg`
  }), /*#__PURE__*/React.createElement("img", {
    src: `${TT_ICON}/ico-menu.svg`
  })), /*#__PURE__*/React.createElement("div", {
    className: "tt-viewer__pages"
  }, [w.cover, TT_BANNERS[1].img, TT_BANNERS[2].img, w.cover].map((src, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "tt-viewer__page",
    style: {
      backgroundImage: `url(${src})`
    }
  }))), /*#__PURE__*/React.createElement("div", {
    className: "tt-viewer__bottom"
  }, /*#__PURE__*/React.createElement("img", {
    src: `${TT_ICON}/ico-arrow-right.svg`,
    style: {
      transform: 'rotate(180deg)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "ctrls"
  }, /*#__PURE__*/React.createElement("img", {
    src: `${TT_ICON}/ico-like.svg`
  }), /*#__PURE__*/React.createElement("img", {
    src: `${TT_ICON}/ico-chat.svg`
  }), /*#__PURE__*/React.createElement("img", {
    src: `${TT_ICON}/ico_share.png`,
    style: {
      filter: 'brightness(0) invert(1)'
    }
  })), /*#__PURE__*/React.createElement("img", {
    src: `${TT_ICON}/ico-arrow-right.svg`
  })));
}

// --- PAYMENT ------------------------------------------------------
function Payment() {
  const [sel, setSel] = useState2('p4');
  const [auto, setAuto] = useState2(true);
  const packs = auto ? TT_COIN_PACKS.filter(p => p.sub.includes('자동')) : TT_COIN_PACKS.filter(p => !p.sub.includes('자동'));
  const selPack = TT_COIN_PACKS.find(p => p.id === sel);
  return /*#__PURE__*/React.createElement("div", {
    className: "tt-app"
  }, /*#__PURE__*/React.createElement("section", {
    className: "tt-section",
    style: {
      marginTop: 32
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      color: 'var(--tt-fg)',
      fontSize: 32,
      fontWeight: 700,
      margin: '0 0 8px',
      letterSpacing: '-0.02rem'
    }
  }, "\uCDA9\uC804\uC18C"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--tt-fg-muted)',
      fontSize: 14,
      margin: 0
    }
  }, "\uC790\uB3D9\uCDA9\uC804 \uC2DC \uCD5C\uB300 25% \uBCF4\uB108\uC2A4 \uCF54\uC778 \uC9C0\uAE09"), /*#__PURE__*/React.createElement("div", {
    className: "tt-paytabs"
  }, /*#__PURE__*/React.createElement("button", {
    className: auto ? 'active' : '',
    onClick: () => setAuto(true)
  }, "\uC790\uB3D9\uCDA9\uC804"), /*#__PURE__*/React.createElement("button", {
    className: !auto ? 'active' : '',
    onClick: () => setAuto(false)
  }, "\uC77C\uBC18\uCDA9\uC804")), /*#__PURE__*/React.createElement("div", {
    className: "tt-coingrid"
  }, packs.map(p => /*#__PURE__*/React.createElement(TTCoinPack, {
    key: p.id,
    pack: p,
    active: sel === p.id,
    onClick: () => setSel(p.id)
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 40,
      padding: 24,
      background: 'var(--tt-surface)',
      borderRadius: 'var(--tt-radius-md)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: 10,
      fontSize: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--tt-fg-muted)'
    }
  }, "\uC120\uD0DD \uD328\uD0A4\uC9C0"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--tt-fg)',
      fontWeight: 600
    }
  }, selPack?.coins, "\uCF54\uC778")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: 20,
      fontSize: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--tt-fg-muted)'
    }
  }, "\uACB0\uC81C \uAE08\uC561"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--tt-fg)',
      fontWeight: 700,
      fontFamily: 'Roboto',
      fontSize: 18
    }
  }, "\u20A9", selPack?.price.toLocaleString())), /*#__PURE__*/React.createElement(TTButton, {
    variant: "pri",
    style: {
      width: '100%',
      padding: 14,
      fontSize: 15
    }
  }, "\uACB0\uC81C\uD558\uAE30"))));
}
Object.assign(window, {
  Home,
  Weekly,
  EpisodeList,
  Viewer,
  Payment
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/toptoon-web/Screens.jsx", error: String((e && e.message) || e) }); }

})();
