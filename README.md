# Hamster Private Room

문장과 이미지를 페이지 단위로 편집하고 GitHub Pages에 무료로 배포할 수 있는 React 북메이커입니다. `mybook.html`은 초기 아이디어를 확인하기 위한 참고 프로토타입이며, 실제 앱은 `src/` 아래의 React + TypeScript 코드로 구성됩니다.

## 실행

```bash
npm install
npm run dev
```

프로덕션 빌드는 다음 명령으로 확인합니다.

```bash
npm run build
```

## 주요 기능

- 큰 6프레임 정면 햄스터가 춤추는 메인 서재와 새 책, 최근 작업, 파일 불러오기
- 페이지 위 본문 직접 편집과 원고 분량에 따른 페이지 자동 생성·축소
- 원클릭 전체 테마와 사용자 테마 저장
- 이미지 드래그 앤 드롭, 이동, 크기, 회전, 투명도, 삭제
- 움직이는 GIF 스티커: 프레임을 그대로 보존한 채 위치·크기(가로세로 비율 유지)·투명도·회전 조절
- 글과 스티커 애니메이션을 함께 담는 선택 페이지 움직이는 GIF 내보내기
- 멤버별 이름, 색상, 좌우 프로필 사진을 쓰는 이동식 말풍선과 페이지 위 대사 직접 편집
- 따옴표와 괄호 스마트 하이라이트, 선택 영역 토글 서식과 형광펜
- 기본 글꼴, 로컬 글꼴, 굵기, 자간, 장평, 행간, 문단 간격 조절
- 표지 모드, 페이지별 꼬리말, 전체 페이지 일괄 적용
- 브라우저 자동 저장, `.hamsterbook` 작업 파일 저장과 복원, 실행 취소와 다시 실행
- 선택 페이지 클립보드 복사, 낱장 전체, 양면 펼침 PNG 내보내기
- 데스크톱 편집 패널과 모바일 하단 도구 시트

## GitHub Pages 배포

1. 저장소의 `Settings > Pages`에서 Source를 `GitHub Actions`로 선택합니다.
2. `main` 브랜치에 push하면 `.github/workflows/deploy-pages.yml`이 앱을 빌드하고 배포합니다.
3. 배포 주소는 `https://hobi2k.github.io/hamster-private-room/`입니다.

Vite의 `base`가 `/hamster-private-room/`으로 설정되어 있어 하위 경로에서도 이미지와 번들이 정상 로드됩니다.

## 햄스터 스프라이트 재생성

현재 `public/assets/hamster-walk.png`는 OpenRouter로 만든 투명 배경의 6프레임 정면 춤 RGBA 스프라이트입니다. API 키는 저장소에 포함되지 않습니다.

```bash
python3 scripts/generate_hamster_sprite.py \
  --env-file /path/to/.env.backend.docker \
  --output public/assets/hamster-walk.png
```

환경 파일에는 `PROMPTMAKER_OPENROUTER_API_KEY`가 있어야 하며 Pillow가 필요합니다.

## 구조

```text
src/App.tsx                 상태, 저장, 실행 취소, 내보내기 연결
src/components/            편집 패널, 지면, 도구막대, 햄스터
src/lib/pagination.ts      자동 페이지 분할과 스마트 하이라이트
src/lib/export.ts          낱장과 양면 PNG 내보내기
src/lib/gif.ts             GIF 판별과 프레임 수 파싱, 원본 바이트 보존
src/lib/sticker.ts         스티커 크기·비율·투명도 정규화
src/lib/animatedGif.ts     GIF 프레임을 되살려 페이지를 움직이는 GIF로 인코딩
public/assets/             배포에 포함되는 정적 이미지
scripts/                   OpenRouter 자산 생성 도구
mybook.html                참고용 초기 프로토타입
```
