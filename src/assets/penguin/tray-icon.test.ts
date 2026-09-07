import { inflateSync } from "node:zlib";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * 메뉴바 트레이 아이콘의 정답지 — 원본 `tray.svg`와 구운 `tray.png` 둘 다 본다.
 *
 * 아이콘은 두 러너·타입 검사·스냅샷 어디에도 안 걸린다. 여기서 막는 것은 둘이다:
 * 실루엣이 `body.tsx`와 어긋나는 것, 그리고 PNG에 여백이 끼는 것 —
 * tray-icon이 이미지 *전체* 높이를 18pt로 늘리므로 여백만큼 펭귄이 작아진다.
 */

const SVG = readFileSync(resolve("src/assets/penguin/tray.svg"), "utf8");
const BODY = readFileSync(resolve("src/assets/penguin/body.tsx"), "utf8");
const PNG = readFileSync(resolve("src-tauri/icons/tray.png"));

/** 주석을 걷어낸 `<g>` 안쪽. 주석 속 좌표가 검사를 통과시키면 안 된다. */
const 도형들 = SVG.replace(/<!--[\s\S]*?-->/g, " ").slice(SVG.replace(/<!--[\s\S]*?-->/g, " ").indexOf("<g "));

const d들 = [...도형들.matchAll(/\sd="([^"]+)"/g)].map((m) => m[1]);

describe("트레이 아이콘 실루엣", () => {
  it("트레이_svg의_도형이_펭귄_몸과_같다", () => {
    expect(d들.length, "tray.svg에서 도형을 못 찾았다").toBe(7);
    for (const d of d들) {
      expect(BODY, `body.tsx에 없는 도형이다: ${d}`).toContain(d);
    }
  });

  it("트레이_svg는_템플릿_아이콘이다", () => {
    // macOS는 알파만 본다 — 흰 배·눈은 칠이 아니라 마스크로 뚫어야 보인다.
    expect(도형들).toMatch(/mask="url\(#tray-cut\)"/);
  });
});

describe("구운 트레이 PNG", () => {
  const { width, height, alpha } = pngAlpha(PNG);

  it("펭귄이_그림_전체를_채운다", () => {
    const 불투명 = (x: number, y: number) => alpha[y * width + x] > 8;
    const 행 = (y: number) => [...Array(width).keys()].some((x) => 불투명(x, y));
    const 열 = (x: number) => [...Array(height).keys()].some((y) => 불투명(x, y));

    expect(행(0), "위쪽에 빈 줄이 있다 — 여백만큼 펭귄이 작아진다").toBe(true);
    expect(행(height - 1), "아래쪽에 빈 줄이 있다").toBe(true);
    expect(열(0), "왼쪽에 빈 줄이 있다").toBe(true);
    expect(열(width - 1), "오른쪽에 빈 줄이 있다").toBe(true);
  });

  it("배와_눈이_뚫려_있다", () => {
    // 전부 불투명하면 통짜 덩어리다 — 마스크가 죽었다는 뜻이다.
    expect(alpha.some((a) => a === 0)).toBe(true);
  });
});

/** 8비트 RGBA·비인터레이스 PNG의 알파 채널. 아이콘 하나만 읽으므로 이 갈래만 안다. */
function pngAlpha(png: Buffer): { width: number; height: number; alpha: Uint8Array } {
  let i = 8;
  let width = 0;
  let height = 0;
  const idat: Buffer[] = [];
  while (i < png.length) {
    const len = png.readUInt32BE(i);
    const type = png.toString("ascii", i + 4, i + 8);
    const body = png.subarray(i + 8, i + 8 + len);
    if (type === "IHDR") {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      expect([body[8], body[9]], "8비트 RGBA PNG가 아니다").toEqual([8, 6]);
    } else if (type === "IDAT") idat.push(body);
    i += 12 + len;
  }

  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * 4;
  const alpha = new Uint8Array(width * height);
  let prev = new Uint8Array(stride);
  let pos = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = raw[pos];
    pos += 1;
    const line = new Uint8Array(raw.subarray(pos, pos + stride));
    pos += stride;
    for (let x = 0; x < stride; x += 1) {
      const a = x >= 4 ? line[x - 4] : 0;
      const b = prev[x];
      const c = x >= 4 ? prev[x - 4] : 0;
      if (filter === 1) line[x] = (line[x] + a) & 255;
      else if (filter === 2) line[x] = (line[x] + b) & 255;
      else if (filter === 3) line[x] = (line[x] + ((a + b) >> 1)) & 255;
      else if (filter === 4) line[x] = (line[x] + paeth(a, b, c)) & 255;
    }
    for (let x = 0; x < width; x += 1) alpha[y * width + x] = line[x * 4 + 3];
    prev = line;
  }
  return { width, height, alpha };
}

function paeth(a: number, b: number, c: number): number {
  const pa = Math.abs(b - c);
  const pb = Math.abs(a - c);
  const pc = Math.abs(a + b - 2 * c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}
