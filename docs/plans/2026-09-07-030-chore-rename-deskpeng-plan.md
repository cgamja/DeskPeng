---
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
execution: code
title: "chore: 이름을 DeskPeng으로 바꾼다"
date: 2026-09-07
type: chore
depth: lightweight
---

# chore: 이름을 DeskPeng으로 바꾼다

**Goal Capsule** — 레포·폴더·앱 이름을 `individual-manager`/`Penguin`에서
**DeskPeng**으로 통일한다. 기능 변경은 없다.

- **출처** — 2026-09-07 사용자 지시.
- **실행 프로필** — 브랜치 `chore/rename-deskpeng-01`. 두 러너 + 타입 검사 +
  번들 빌드로 확인하고, 레포·폴더 이름은 머지 뒤에 손으로 바꾼다.

## 왜 이름이 셋이었나

`individual-manager`는 v1.0 "개인 총괄 비서"에서 온 레포 이름이고, `Penguin`은
M2.5에서 붙인 앱 이름이다. v3.0으로 방향을 튼 뒤로 레포 이름은 앱과 아무 상관이
없어졌다. **DeskPeng 하나로 모은다.**

## KTD1 — `penguin`을 전부 바꾸지 않는다

이 레포에서 `penguin`은 **두 가지**다: 제품 이름이고, 동시에 화면에 사는 동물이다.
바꾸는 것은 제품 쪽뿐이다.

| 바꾼다 | 그대로 둔다 |
|---|---|
| `package.json`·`Cargo.toml`의 패키지 이름, `penguin_lib` | `src/assets/penguin/`, `.penguin` CSS 클래스, `<Penguin>` 컴포넌트 |
| `tauri.conf.json`의 `productName`·창 제목 | `pet.html`의 `Penguin Pet` (펭귄 창이지 제품이 아니다) |
| `CLAUDE.md` 제목, `PRD.md`의 식별자, `develop` 스킬 설명 | `docs/plans/*` — **지나간 기록이라 손대지 않는다** |

## KTD2 — 번들 식별자도 바꾸고, 설정은 손으로 옮긴다

`com.kangr.penguin` → `com.kangr.deskpeng`. 식별자에 옛 이름이 남으면 절반만 바꾼
것이 된다. 대신 설정 저장소 경로가 따라 움직이므로
`~/Library/Application Support/`에서 옛 폴더를 새 이름으로 **복사**해야 대사·마릿수·
크기·테마가 살아남는다. (앱이 완전히 죽은 뒤에 복사한다 — 종료 중인 프로세스가
덮어쓴다.)

## 구현 단위

### U1. 매니페스트 — `package.json`·`package-lock.json`·`Cargo.toml`(+`Cargo.lock`)·`main.rs`
### U2. 앱 이름 — `tauri.conf.json`(productName·identifier·창 제목), `index.html` 제목
### U3. 문서 — `CLAUDE.md` 제목·crate 이름, `PRD.md` 식별자, `develop` 스킬 설명·검증 절차
### U4. 머지 뒤 손으로 — GitHub 레포 이름, `git remote`, 폴더 이름, 설치본 교체

## 검증
`npm test` + `cargo test` + `npm run build` + `npm run tauri build`.
번들이 `DeskPeng.app`으로 나오고, 띄웠을 때 트레이·펭귄이 그대로 뜨는지 육안 확인.

## 위험
| 위험 | 완화 |
|---|---|
| `penguin`을 통째로 치환해 동물까지 바꾼다 | KTD1의 표대로 자리마다 따로 고쳤다. `src/`의 Rust·CSS·TSX는 한 줄도 안 건드린다 |
| 식별자가 바뀌어 설정이 초기화된다 | U4에서 저장소 폴더를 복사한다 |
| `Penguin.app`과 `DeskPeng.app`이 둘 다 남아 옛 것이 뜬다 | U4에서 옛 설치본을 지운다 (사용자 확인 후) |
