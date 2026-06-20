import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DesignFit-AI V3 | PDF 도면 공차 최적화 Copilot",
  description:
    "PDF 도면을 업로드하면 과도한 공차를 자동 탐지하고, 기능 확인 질문을 통해 완화 가능성을 제안하는 제조 설계 AI Copilot",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-slate-50">{children}</body>
    </html>
  );
}
