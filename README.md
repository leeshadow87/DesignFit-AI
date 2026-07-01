# DesignFit-AI V6

DesignFit-AI V6는 단순 도면 OCR/AI 리포트 앱이 아니라 공차 계산 모듈을 중심으로 한 제조성 AI 검토 콘솔입니다.

## V6 핵심 변화

- 공차 완화 검토가 1차 핵심 능력입니다.
- 단품 도면만으로 최종 완화 가능 여부를 확정하지 않습니다.
- 부품 공차가 상위 어셈블리의 간극, 간섭, 기능 치수 체인, 구조/회전/씰링 조건에 주는 영향을 계산합니다.
- AI 추출값, 사용자 검증 입력값, 계산 엔진 결과값을 분리합니다.
- 하중, 회전, 씰링, 변형 영향이 있으면 CAE/시험 필요 항목으로 분류합니다.

## MVP 계산 모듈

- 기본 치수 범위 계산: nominal, plus, minus 기반 min/max/width
- Worst Case 공차 누적 계산
- 구멍/축 간극 및 간섭 계산
- 단품-어셈블리 정보 유무에 따른 검토 상태 분류
- CAE 필요 여부 분류

## 보안 주의

현재 버전은 검증용 시제품입니다.

- 실제 고객 도면 업로드 금지
- 사내 도번, 고객명, 업체명, 프로젝트명 노출 금지
- 공개 도면 또는 합성 샘플 도면만 사용 권장
- localStorage 기반 저장이므로 운영용 보안 저장소가 아닙니다.

## 실행

```bash
pnpm install
pnpm dev
```

브라우저에서 `http://localhost:3000`으로 접속합니다.

## 배포

Vercel 기준:

- Framework Preset: Next.js
- Build Command: `pnpm build`
- Output Directory: `.next`
- Node.js: 18 이상
