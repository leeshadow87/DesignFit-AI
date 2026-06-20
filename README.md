# DesignFit-AI V3

**PDF 도면 기반 공차 최적화 AI Copilot**

비숙련 설계자가 근거 없이 타이트하게 잡은 공차를 기능 기준으로 재검토하여 제조비를 낮추는 DFM 검토 플랫폼.

## 핵심 원칙

- 공차 완화를 **단정하지 않는다**
- 기능 확인 질문 후 **조건부로 제안한다**
- 모든 판단에 **근거와 주의사항**을 포함한다
- CAE·선임 검토 필요 항목을 **명확히 표시**한다

## V3 기능

| 기능 | 설명 |
|------|------|
| PDF 업로드 | PDF.js 기반 뷰어 + text layer 추출 |
| 공차 자동 추출 | ±mm, GD&T, 끼워맞춤, 표면거칠기 정규식 파서 |
| 위험도 분류 | CRITICAL / HIGH / MEDIUM / LOW 룰엔진 |
| 기능 확인 | 베어링·씰링·체결 등 기능 선택 후 재판정 |
| 리포트 | PDF / CSV 내보내기 |
| 저장 | localStorage (향후 Supabase 교체 가능 구조) |

## 기술 스택

- **Frontend**: Next.js 14 App Router + TypeScript + Tailwind CSS
- **PDF**: PDF.js (pdfjs-dist)
- **Report**: jsPDF + jspdf-autotable, xlsx
- **Storage**: localStorage (IRepository 인터페이스로 DB 교체 가능)
- **Deploy**: Vercel

## 로컬 실행

```bash
npm install
npm run dev
```

브라우저: http://localhost:3000

## Vercel 배포

- Framework Preset: **Next.js**
- Build Command: `npm run build`
- Output Directory: `.next`
- Node.js Version: 18.x 이상

## 폴더 구조

```
app/                  Next.js App Router 페이지
components/
  layout/             Sidebar, AppShell
  dashboard/          대시보드
  projects/           프로젝트 목록/생성
  drawings/           도면 분석 (핵심 기능)
  ui/                 공통 컴포넌트
lib/
  toleranceParser.ts  공차 패턴 정규식 파서
  toleranceRules.ts   위험도 평가 룰엔진
  analysisEngine.ts   파이프라인 통합
  reportGenerator.ts  PDF/CSV 내보내기
  repository.ts       저장소 (IRepository 인터페이스)
types/
  index.ts            전체 도메인 타입 정의
```

## 다음 단계 (V3.1+)

- Supabase 저장소 연동
- OpenAI API 협의 문구 생성
- 공정/재질 데이터 편집 UI
- 도면 bbox 하이라이트 오버레이
- 치수공차 / 형상공차 분리 계산
