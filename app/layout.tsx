import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DesignFit-AI V5 | 도면 제조성 AI 검토",
  description:
    "도면의 공차, GD&T, 재질, 공정 리스크, 비용 영향, CAE 검증 필요성을 정리하는 DesignFit-AI MVP",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
