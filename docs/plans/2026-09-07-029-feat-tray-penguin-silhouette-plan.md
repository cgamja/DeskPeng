---
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
execution: code
title: "feat: 트레이 아이콘을 SVG 펭귄 실루엣으로 꽉 채운다"
date: 2026-09-07
type: feat
depth: lightweight
---

# feat: 트레이 아이콘을 SVG 펭귄 실루엣으로 꽉 채운다

**Goal Capsule** — 메뉴바 아이콘을 `src/assets/penguin`의 펭귄 도형에서 새로 뽑아
여백 없이 채운다. 019에서 미룬 "모양이 마음에 안 들면 그때 별건으로 연다"가 여기다.

- **출처** — 2026-09-07 사용자 지시("노치바 펭귄을 SVG 펭귄으로 꽉 채워줘").
- **실행 프로필** — 브랜치 `feat/tray-penguin-icon-01`. 판정은 육안이지만
  **여백과 도형 어긋남은 테스트가 잡는다**(아래 U3).

## 왜 지금 아이콘이 작아 보였나

`tray-icon` 0.24의 macOS 구현은 이미지 **전체 높이**를 18pt로 맞춘다
(`platform_impl/macos/mod.rs`, `icon_height: f64 = 18.0`). 019가 물려받은
58×44 스캐폴딩 PNG는 펭귄이 왼쪽 귀퉁이에만 있고 오른쪽 3분의 2가 빈칸이라,
그 빈칸까지 18pt에 욱여넣느라 펭귄이 14pt로 줄고 뒤에 큰 구멍이 남았다.
**여백을 지우는 것이 곧 "꽉 채우는" 것이다.**

## KTD1 — 실루엣은 `body.tsx`의 도형을 그대로 옮긴다

새로 그리지 않는다. 꼬리·먼쪽 날개·두 발·몸통·머리·부리·가까운쪽 날개의
`d`·좌표를 그대로 가져와 `src/assets/penguin/tray.svg`에 둔다. 그림은 전부
`src/assets`에 있다는 규칙(CLAUDE.md 구조)을 따르고, 구운 PNG만
`src-tauri/icons/tray.png`에 남는다 — `include_bytes!` 경로가 거기라서다.

땅 그림자·얼음 구멍·훌라 차림·장비는 뺀다. 서 있는 펭귄 한 마리만 남긴다.

## KTD2 — 흰 배와 눈은 칠이 아니라 마스크로 뚫는다

템플릿 아이콘에서 macOS는 **알파만** 본다. `fill="#fff"`은 알파 1이라 검정으로
칠해질 뿐이다. 배·눈이 보이려면 실제로 구멍이어야 하므로 `<mask>`로 뺀다.
배 타원은 `body.tsx`(rx 14.5)보다 좁은 rx 10.2를 쓴다 — 18pt에서 몸통 테두리가
남아야 "O"가 아니라 펭귄으로 읽힌다.

## KTD3 — 굽는 것은 QuickLook + 잘라내기, 스크립트는 안 남긴다

019의 선례대로 레포에는 원본 SVG와 산출물 PNG만 넣는다. 재현 절차:

```sh
qlmanage -t -s 1024 -o <tmp> src/assets/penguin/tray.svg
# 1) QuickLook은 흰 배경에 굽는다 → 알파 = 255 - 밝기 로 되돌린다
# 2) 알파 경계 상자로 잘라낸다 (여백 = 작아짐)
# 3) sips -Z 72 로 줄여 src-tauri/icons/tray.png 에 쓴다
```

**두 곳에서 헛돌기 쉽다.** QuickLook은 SVG의 고유 크기를 무시하고 정사각
썸네일에 맞추면서 **정사각 밖을 잘라낸다** — 그래서 `tray.svg`의 viewBox가
정사각(`-5 14 106 106`)이고, 남는 여백은 3단계에서 잘라 없앤다.
그리고 QuickLook 산출물은 **알파가 전부 255**라 알파로 자르면 아무것도 안 잘린다.

높이 72px = 18pt의 4배다. Retina(2×)·3×에서 다시 줄여도 뭉개지지 않는다.

## 구현 단위

### U1. 원본 — `src/assets/penguin/tray.svg` (새 파일)
### U2. 산출물 — `src-tauri/icons/tray.png` 교체 (41×72), `lib.rs`에 원본 위치 주석
### U3. 검사 — `src/assets/penguin/tray-icon.test.ts` (새 파일)
- `tray.svg`의 `d` 일곱이 전부 `body.tsx`에 있다 (주석은 걷어내고 본다)
- 마스크가 붙어 있다
- **구운 PNG의 네 변에 빈 줄이 없다** — 이 PR이 고친 결함 그 자체다
- PNG에 알파 0인 픽셀이 있다 (마스크가 죽으면 통짜 덩어리가 된다)

### U4. 문서 — `TODO.md` 후속에 기록, `CLAUDE.md` 구조에 `tray.svg` 한 줄.

## 검증
`npm test` + `cargo test` + `npm run build`. 네 검사는 **돌연변이로 한 번씩
빨갛게 만들어 확인했다**(도형 비틀기 / 도형을 주석으로 옮기기 / 마스크 떼기 /
PNG에 여백 붙이기) — 소스 텍스트 검사는 주석에 걸려 헛돈다
(`docs/solutions/best-practices/source-text-tests-pass-on-comments.md`).
육안 확인은 메뉴바에서 라이트·다크 양쪽.

## 위험
| 위험 | 완화 |
|---|---|
| 18pt에서 꼬리·발이 실오라기로 뭉갠다 | 36px(2×) 확대로 미리 봤다 — 꼬리는 왼쪽 돌기, 발은 두 삼각으로 읽힌다 |
| `body.tsx`가 바뀌면 아이콘만 낡는다 | U3의 `d` 대조가 빨개진다 |
| SVG를 고치고 PNG를 안 구우면 조용히 어긋난다 | 막을 방법이 없다 — SVG 머리말과 이 문서에 굽는 법을 적어 둔다 |
