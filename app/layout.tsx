import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DesignFit-AI V4 | 공차 완화 검토 워크벤치",
  description: "도면 공차의 제조 리스크와 완화 후보를 검토하는 DesignFit-AI V4 MVP",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
