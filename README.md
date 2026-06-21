# DesignFit-AI V4

공차 완화 검토 워크벤치 MVP입니다.

## 제품 방향

DesignFit-AI는 비숙련 설계자가 과도하게 타이트한 공차를 지정해 제조 비용과 공정 난이도를 높이는 문제를 줄이기 위한 도구입니다.

V4는 AI가 최종 정답을 확정하는 제품이 아니라, 설계자와 제조 검토자가 다음 항목을 빠르게 판단하도록 돕는 워크벤치입니다.

- 도면에서 어떤 공차가 판독되었는가
- 어떤 공차가 제조 리스크를 높이는가
- 어떤 항목은 유지해야 하고, 어떤 항목은 조건부 완화 후보인가
- CAE, 조립성, 선임 검토가 필요한 항목은 무엇인가

## V4 MVP 범위

- Next.js 기반 웹 앱
- PDF 도면 업로드 및 뷰어
- PDF text layer 기반 공차 추출
- 수동 보정 입력
- 공차 위험도 분류
- 완화 후보 및 검증 질문 제안
- 고객 제출 전 리포트 초안 생성

## 보안 주의

현재 버전은 검증용 시제품입니다.

- 실제 고객 도면 업로드 금지
- 사내 도번, 고객명, 업체명, 프로젝트명 노출 금지
- 샘플 도면 또는 공개 도면만 사용 권장
- localStorage 기반 저장이므로 운영 보안 저장소가 아닙니다

운영 전에는 Supabase Auth, private storage, 접근 권한, 파일 삭제 정책을 적용해야 합니다.

## 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속합니다.

## 배포

Vercel 기준:

- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Node.js: 18 이상
