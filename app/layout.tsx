import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DesignFit-AI V6 | 공차 계산 기반 제조성 검토",
  description:
    "단품 도면과 어셈블리 관계를 연결해 치수 범위, 공차 누적, 간극/간섭, CAE 필요 여부를 계산하는 DesignFit-AI V6",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
