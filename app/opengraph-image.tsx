import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { DEFAULT_TITLE } from "@/lib/site-metadata";

export const alt = DEFAULT_TITLE;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logoBuffer = await readFile(
    join(process.cwd(), "public/parallax-gradient.png"),
  );
  const logoSrc = `data:image/png;base64,${logoBuffer.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #09090b 0%, #18181b 50%, #1e1b4b 100%)",
        padding: "72px",
      }}
    >
      <img src={logoSrc} width={88} height={88} alt="" />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginTop: 36,
          gap: 20,
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: "#fafafa",
            letterSpacing: "-0.03em",
          }}
        >
          Ceptly
        </div>
        <div
          style={{
            fontSize: 34,
            color: "#d4d4d8",
            lineHeight: 1.35,
            maxWidth: 920,
          }}
        >
          AI chief of staff for your team
        </div>
        <div
          style={{
            fontSize: 24,
            color: "#71717a",
            lineHeight: 1.4,
            maxWidth: 920,
          }}
        >
          app.ceptly.ai
        </div>
      </div>
    </div>,
    { ...size },
  );
}
