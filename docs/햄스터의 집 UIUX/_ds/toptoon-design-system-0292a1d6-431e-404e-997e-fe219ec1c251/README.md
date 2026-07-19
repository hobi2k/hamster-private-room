# TopToon Design System

This folder is a living design system for **TopToon (탑툰)**, Korea's leading adult webtoon
platform (operated by Topco Media / 탑코미디어). It contains the brand's colors, typography,
iconography, imagery conventions, and UI components — extracted from the production HTML/CSS
codebase — so design agents can produce on-brand screens, prototypes, slides and marketing
assets without starting from scratch.

> **Default mode: Dark.** The app ships with `data-bs-theme="dark"` and reads mostly as a
> moody, after-dark reading room. Light mode is supported but secondary.

---

## Sources

- **Codebase (attached, read-only):** `html/` — production-equivalent markup
  - Theme tokens: `html/css/theme.css`
  - Global/component CSS: `html/css/common.css`, `main.css`, `ep_list.css`, `epi.css`,
    `viewer.css`, `payment.css`, `login.css`, `giftbox-v2.css`, `mypage.css`, `search.css`
  - Rendered pages: `html/index.html` (home), `html/weekly.html` (요일별 연재),
    `html/ep_list.html` (회차리스트), `html/viewer.html` (뷰어), `html/payment.html` (충전소),
    `html/40_01_login.html` (로그인), `html/giftbox.html`, `html/sale.html`, `html/mypage.html`,
    `html/myList.html`
  - Icon & image libraries: `html/img/svg/`, `html/img/common/`, `html/img/banner/`,
    `html/img/badge/`
- **No Figma attached.** No slide deck attached.
- Logos, icons, banners, badges have been copied into `assets/` (see ICONOGRAPHY below).

---

## Product context

TopToon is an **adult webtoon (19+) subscription/coin-purchase platform**. Core surfaces:

| Surface | Purpose | Key HTML |
|---|---|---|
| **메인 (Home)** | Hero banner carousel, rankings, curated rails, promos | `index.html` |
| **연재 (Weekly)** | Day-of-week serial listings | `weekly.html` |
| **회차 리스트 (Episode list)** | Per-series episode grid with purchase states | `ep_list.html` |
| **뷰어 (Viewer)** | Vertical-scroll comic reader + remote control overlay | `viewer.html` |
| **충전소 (Payment)** | Coin purchase + auto-charge plans | `payment.html` |
| **선물함 (Giftbox)** | Received coupons / bonus coins | `giftbox.html` |
| **내서재 (My Library)** | Recently read / favorites / notifications | `myList.html`, `notification.html` |
| **로그인 / 가입** | Email + social auth, captcha | `40_01_login.html`, `40_02_signup.html` |
| **세일 / 행사 (Sale)** | Discount / 1-coin / freepass promotions | `sale.html` |
| **마이페이지** | Account, coin history, settings | `mypage.html`, `coin-history.html` |

There is **one core product** — the responsive web app (PC + tablet + mobile breakpoints).
It serves as both the website and the in-app webview for the native apps.

---

## Index — files in this project

| File / Folder | What it is |
|---|---|
| `README.md` | ← you are here |
| `SKILL.md` | Agent-Skill contract for using this system |
| `colors_and_type.css` | All design tokens (colors, type, radii) + semantic classes |
| `assets/` | Logos, icons, badges, banner imagery |
| `assets/icons/` | SVG + PNG iconography lifted from the codebase |
| `assets/banners/` | Sample main-banner artwork (characters, backgrounds, titles) |
| `preview/` | Card-sized HTML specimens that populate the Design System tab |
| `ui_kits/toptoon-web/` | React/JSX UI kit re-creation of the web product |
| `ui_kits/toptoon-web/index.html` | Clickable prototype entry — home, weekly, episode list, viewer, payment |
| `ui_kits/toptoon-web/Components.jsx` | Atomic components (TopNav, WorkCard, EpisodeRow, Badge, Button, CoinPack, etc.) |
| `ui_kits/toptoon-web/Screens.jsx` | Screen compositions (Home, Weekly, EpisodeList, Viewer, Payment) |
| `ui_kits/toptoon-web/Fixtures.jsx` | Sample works, banners, episodes, coin packs |
| `ui_kits/toptoon-web/styles.css` | UI-kit-local styles layered on top of the global tokens |

---

## CONTENT FUNDAMENTALS

TopToon is a Korean-language product. Copy is **casual, punchy, and slightly
over-the-top** — written like a loud friend running the sale counter. It leans into
urgency, scarcity, exclamation, and teasing come-ons for 성인(adult) content.

**Language & voice**
- **Korean first**, always. Short sentences. Frequent `!` and `~`.
- Uses honorific endings (`-요`, `-세요`) on calls-to-action and system text, but
  drops honorifics for yelling promos ("미친 무료 됐어요!!!", "지금이 기회!").
- Addresses the user as **"여러분"** or omits pronouns entirely (Korean norm).
- Never "I / you" in English-voice style — don't translate literally.
- Numbers and prices use Korean units: `코인`, `원`, `일` (days), `화` (episode).

**Tone checklist (real examples from the codebase)**
- Hype & urgency: `🚨여러분 저희 됐어요🚨`, `미친 무료 됐어요!!!`, `딱 30분 동안만! 지금이 기회!`
- Sultry tease (on banner sub-text): `이런 걸 빨면.. 무슨 느낌일까..❤`,
  `들어가게 해주이소. 그 안으로..`, `코트 위에선 경기! 침대 위에선 전쟁❤`
- Sale-floor: `FEVER TIME ON`, `모든 작품 무료 열람`, `무료로 완결작 정주행 가능!`
- Functional/system: `실시간 랭킹`, `내가 보던 작품`, `회차 리스트`, `충전소`, `선물함`

**Casing & punctuation**
- Korean Hangul is the norm; English words appear as **UPPERCASE** accents (`FEVER TIME`,
  `UP`, `NEW`, `2UP`).
- Ellipses use `..` or `...` freely; exclamation with 2–3 marks for hype.
- Heart and alert emoji are used sparingly in promo copy (`❤`, `🚨`, `🎉`) — **never** in
  system UI chrome. Emoji are promo dressing, not an icon system.
- Tight letter-spacing (`-0.01rem`) for Korean readability; tighter (`-0.02rem`) for digits.

**Don'ts**
- Don't translate Korean section names to English in the UI (use `연재` not "Serial").
- Don't write long paragraphs; two lines with `<br>` is the banner ceiling.
- Don't mix bullet styles — the app uses `•`-style separators rendered as 2×2 dots.

---

## VISUAL FOUNDATIONS

### The overall vibe
Dark, dense, retail-energetic. Think **late-night Korean shopping channel meets neon
noir comic kiosk**. Imagery does the heavy lifting — artwork is saturated, often with
crimson/rose skin tones and high-contrast character cutouts floating over blurred,
gradient-wash backgrounds. Chrome (nav, cards, buttons) is intentionally restrained so
the artwork dominates.

### Color
- **Primary brand red:** `#E63740` (`--color-red-primary`). Used for alerts, counts
  (gift badge), price animation, the 19+ adult-toggle active state, discount pricing,
  and UI selection states.
- **Promo free red:** `#F05255` (`--color-promo-free`) — slightly lighter, used on the
  circular "free" badge and the 19+ border ring.
- **New-release mint:** `#33dfce` (`--color-new-release`) — accent tag on brand-new
  series ("이번주 신작"). Used only for tags/badges.
- **Dark surface:** `#1E1F21` (page bg), `#2a2b2d` (top nav), `#2e2e2e` (cards/footer).
- **Fg text:** `#fff` → `#ccc` → `#bbb` → `#aaa` (title → subtitle → menu → describe).
- **Semantic list-row backgrounds** (epi-list cells): waitfree `#713F12`, freepass
  `#203653`, allbuy `#574916`, rental `#1f3d31`, one-plus `#500724`.
- **Gradients are RARE.** The only production gradient is the main banner's
  `linear-gradient(to bottom, var(--color-bg-nav-dark) 54%, var(--color-light) 45%)`
  transition strip, plus a subtle shimmer skeleton. **Avoid bluish-purple gradients.**

### Typography
- **Pretendard** is the default family for everything. Korean-optimized sans-serif
  with tight metrics.
- **Roboto** is loaded for numeric/latin — used mostly incidentally on counts/prices.
- Tight letter-spacing (`-0.01rem`) on Korean, even tighter (`-0.02rem`) on digits.
- Weights in use: 400 / 500 / 600 / 700. No thin weights, no italic.
- Sizes are expressed in `rem` against a 16–20px root that shrinks by breakpoint
  (20px desktop → 18px tablet → 16px mobile).

### Spacing & layout
- Max content width: **1024px** (`#subContent`, `.header__wrapper`, `.section`), padded
  `0 10px` → `0 15px` on tablet.
- Gutter between rails: `1.5rem` vertical.
- Section headers sit on their own `2.5rem` band with an 18px semibold title + optional
  right-aligned sync/arrow button.
- Fixed bottom tab bar on mobile (60px, `rgba(0,0,0,1)` backdrop-blur 2px).

### Cards & shapes
- **Corner radii are small and consistent:** `--border-radius-sm: 3px`,
  `--border-radius-md: 5px` (cards, thumbnails), `--border-radius-lg: 50px` (pills,
  utility icon buttons — fully rounded). Thumbnails use `5px`. Rails/banner use `6px`.
  Hero images use `25px` (the big floating artwork inside the main-banner frame).
- **Borders over shadows.** Components rely on `1px solid` hairlines (light: `#eee`,
  dark: `rgba(238,238,238,0.2)`) rather than drop shadows.
- The only outer shadows appear on the survey-floating pill (`3px 3px 15px rgba(0,0,0,.1)`)
  and the attendance toast. **No multi-layer shadow system.**

### Imagery
- Warm, high-contrast artwork. Character renders often composited with a **blurred
  230%-zoom version of the same image** as the banner background.
- Thumbnails are `300:420` aspect (vertical cover), `300:300` for square curations,
  `300:500` for shorts.
- Skeleton loaders use a left→right shimmer: `linear-gradient(90deg, #2e2e2e 20%, #1e1e1e 50%, #2e2e2e 80%)`.

### Badges
- All badges are **tiny raster PNGs** (12–22px) served from `/assets/img/responsive/common/badge/`.
  `UP`, `2UP`, `NEW`, `지연`, `휴재`, 무료이용권 (freepass circle).
- 19+/연령 icons are also raster PNGs positioned absolutely top-right of the thumbnail
  with `z-index: 1`.

### Animation & motion
- **Subtle, quick, cubic-bezier.** Primary easing: `cubic-bezier(.33,1,.68,1)` and
  `cubic-bezier(.165,.84,.44,1)` — ease-out-back-ish. Duration 200ms–350ms.
- Banner char slide-up entrance, 350ms.
- Skeleton shimmer: 2s linear infinite.
- "Sync" icon: rotate-360 infinite when loading.
- Crazy-banner tooltip float: `downBul` 1.5s ease-in-out infinite.
- **Global button transition:** `var(--button-transition)` = `all 0.2s ease-in-out`.
- No bounce/overshoot on default buttons. No page-transition animations.

### Hover / pressed states
- Buttons: `background-color: var(--color-btn-hover)` (dark: `#3b3b3b`, light: `#eee`).
- Tab-menu items: `background: var(--color-bg-footer)` on hover (disabled on mobile).
- Anchors and menu items show weight change (500 → 600) + color shift to
  `var(--color-text-title)` when `.active`.
- No pressed/shrink transform — the app does not use active-state compression.

### Transparency & blur
- **Backdrop-blur** is used twice: shorts card info strip (`blur(40px)` with a vertical
  mask) and the mobile bottom tab bar (`blur(2px)` on black 100%).
- Translucent overlays: `.dim` is `rgba(0,0,0,0.5)`; toasts are `rgba(0,0,0,0.8)`.
- Header of home page goes transparent over the main banner on mobile
  (`header { background: transparent; border: none; }`).

### Layout rules & fixed elements
- **Sticky top nav** (`#nav__menu__wrapper { position: sticky; top: 0; z-index: 3; }`).
- **Fixed bottom tab bar** on mobile only.
- **Floating banners** (crazy-free timer, survey prompt) live in the bottom-right on
  desktop, bottom-center on mobile; always above z-index 3.
- Overlays (`.alert_layer`, `#toast`) pop centrally at `top: 70%` and cap at 90vw.

### Age gate
- A 30px rounded switch in the header (`.header__theme-switch`) flips `isAdult`. The
  handle has a red border; when ON, the track turns `--color-red-primary`. The handle
  reads **"19"** in 9px semibold.

---

## ICONOGRAPHY

TopToon **does not use a proper icon font** and has no external icon library (no
Lucide, no Heroicons, no Material Icons). Iconography is a hand-rolled mix of:

1. **Inline SVGs** (`html/img/svg/`) — the "interactive" set: arrows, search, coin,
   bell, keep/bookmark, like, lock, view, menu, chat, reply, play/pause, filter, fix,
   social (facebook, blog).
2. **Raster PNGs** (`html/img/`) — the "navigation" set: home/weekly/sale/library/
   giftbox/menu in **two states** (`-white` inactive, `-active` filled) plus `-black`
   for the light-bg payment page.
3. **Badge PNGs** (`html/img/badge/`) — `UP`, `2UP`, `NEW`, `지연`, `휴재`, freepass.

### Style characteristics
- **Stroke weight:** consistent ~2px, rounded caps.
- **Fill style:** primarily **linear / outlined** (not solid-filled). Exceptions: coin
  icon is filled; active-state nav icons are filled.
- **Color strategy:** SVGs are theme-agnostic — the app applies
  `.theme-invert` to brightness/invert them between light and dark modes.
- **Size:** 24px for header utilities, 20–22px for section arrows, 14–16px inline.
- **Emoji:** used as **promo decoration only** (`❤`, `🚨`, `🎉`, `🚨`). Never in system
  chrome, nav, or metadata.
- **Unicode as icons:** bullet dots between meta items are rendered as CSS pseudo-
  element `::after` with `width:2px; height:2px; border-radius:50%;` — not `•`.

### What's copied into `assets/icons/`
All the SVGs from `html/img/svg/` (minus one invalid `ico-youtube.svg` which was
malformed in source) + all the nav PNGs in both `-white` and `-active` states + utility
PNGs (`ico_bookmark`, `ico_share`, `ico_donate`, `ico-coin-*`, `ico-search-*`,
`ico-back-black`, `ico-attendance*`, `ico-adult`). Brand logos live directly in
`assets/`.

### When designing new screens
- **First** look for an existing icon in `assets/icons/`.
- **If not there**, substitute from **Lucide** (same stroke weight) at 1.5–2px stroke
  and flag the substitution in the design note. Lucide is the closest match for
  TopToon's outlined-rounded style.
- **Never draw a new icon as a one-off SVG** unless the user explicitly asks.
- **Never introduce emoji into system UI**; keep them to marketing-promo banners only.

---

## Caveats & open questions

- No Figma file was provided — all tokens are extracted from CSS.
- The codebase has dozens of `_bak` / `백업` CSS files; we used only the "current"
  ones (no `_bak` suffix).
- `ico-youtube.svg` in the source is malformed (root `<li>` element, not `<svg>`) and
  could not be safely copied — if YouTube is needed in new designs, use Lucide.
- Korean-specific measurements (tight letter-spacing, 16–20px root) are baked in —
  designs intended for other scripts will need to relax these.
