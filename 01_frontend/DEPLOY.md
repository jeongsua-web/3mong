# 프론트엔드 S3 배포 가이드

이 문서는 `01_frontend`(React + Vite) 빌드 결과물을 **AWS S3**에 올려서 정적 호스팅하는 방법을 정리한 거야.
백엔드(`02-backend`)는 EC2로 따로 배포되고, 프론트만 S3로 가. 같은 레포(monorepo)지만 배포 경로는 분리돼 있음.

```
fluento (레포 하나)
├── 01_frontend/  ──> S3 (이 문서)
└── 02-backend/   ──> EC2 (GitHub Actions deploy.yml)
```

배포는 "스냅샷"이라 **완성 안 해도 언제든 올리고, 고쳐서 또 올리면 됨.** 부담 갖지 말 것.

---

## 0. 사전 지식 (꼭 알고 갈 것)

### 빌드할 때 API 주소가 "박힌다"
이 프론트는 백엔드 주소를 코드에서 동적으로 읽는 게 아니라, **빌드하는 순간 `.env.production` 값이 결과물(`dist/`)에 그대로 새겨져.**

`01_frontend/.env.production`:
```env
VITE_API_BASE_URL=http://3.35.22.100:8080/api/v1   # 현재 EC2 백엔드 주소
VITE_SKIP_AUTH=false                                # 운영은 절대 true 금지
VITE_COGNITO_DOMAIN=...                             # 구글 로그인 쓰면 채워야 함
VITE_COGNITO_CLIENT_ID=...
```

➡️ **백엔드 EC2 주소가 바뀌면 이 파일을 고치고 다시 빌드해서 올려야 해.** (안 그러면 옛날 주소로 API를 때려서 화면이 안 뜸)

### SPA 라우팅 주의 (중요)
React Router를 써서 `/home`, `/login` 같은 경로가 있는데, S3는 이 경로에 해당하는 실제 파일이 없어서 새로고침하면 **403/404가 나.**
해결책은 아래 1-3에서 "오류 문서를 `index.html`로 지정"하는 거임. 빼먹으면 새로고침 시 화면이 깨짐.

---

## 1. 최초 1회 세팅 (S3 버킷 만들기)

> 이미 버킷이 있으면 이 섹션 건너뛰고 2번으로.

### 1-1. 버킷 생성
1. AWS 콘솔 → **S3** → **버킷 만들기**
2. 버킷 이름: 예) `fluento-frontend` (전 세계에서 유일해야 함. 겹치면 뒤에 숫자 붙이기)
3. 리전: **아시아 태평양(서울) ap-northeast-2**
4. **"모든 퍼블릭 액세스 차단" 체크 해제** (정적 웹사이트로 공개하려면 꺼야 함)
   - 경고 뜨면 "현재 설정으로 인해..." 확인란 체크
5. 나머지 기본값으로 생성

### 1-2. 정적 웹사이트 호스팅 켜기
1. 만든 버킷 → **속성** 탭 → 맨 아래 **정적 웹 사이트 호스팅** → **편집**
2. **활성화** 선택
3. 인덱스 문서: `index.html`
4. **오류 문서: `index.html`** ← SPA 라우팅 때문에 반드시 이렇게
5. 저장. 하단에 나오는 **버킷 웹사이트 엔드포인트 URL**을 메모 (이게 접속 주소)

### 1-3. 버킷 정책 (공개 읽기 허용)
1. 버킷 → **권한** 탭 → **버킷 정책** → **편집**
2. 아래 붙여넣기 (`fluento-frontend`를 실제 버킷 이름으로 교체):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::fluento-frontend/*"
    }
  ]
}
```
3. 저장

여기까지 하면 버킷 준비 끝.

---

## 2. 수동 배포 (CLI로 한 번에 올리기)

가장 간단한 방법. AWS CLI가 설치돼 있고 `aws configure`로 자격증명이 등록돼 있어야 함.

```bash
cd 01_frontend

# 1) 빌드 (.env.production 값이 박힘)
npm ci
npm run build

# 2) S3로 동기화 ('fluento-frontend'를 실제 버킷 이름으로 교체)
aws s3 sync dist/ s3://fluento-frontend --delete
```

- `--delete`: dist에 없는 파일은 S3에서도 지움 → 깔끔하게 동기화
- 수정할 때마다 위 2단계만 반복하면 됨
- 끝나면 1-2에서 메모한 **웹사이트 엔드포인트 URL**로 접속해서 확인

> CLI 자격증명이 없으면: `aws configure` 실행 후 Access Key / Secret Key / region(`ap-northeast-2`) 입력.
> 키는 AWS 콘솔 → IAM → 사용자 → 보안 자격 증명 → 액세스 키 만들기.

---

## 3. 자동 배포 (GitHub Actions — push만 하면 올라감)

백엔드 EC2 배포처럼, `01_frontend/`가 바뀌어 main에 push되면 자동으로 빌드+업로드되게 만드는 방법.

### 3-1. GitHub Secrets 등록
GitHub 레포 → **Settings** → **Secrets and variables** → **Actions** → **New repository secret** 로 아래 3개 등록:

| 이름 | 값 |
|------|-----|
| `AWS_ACCESS_KEY_ID` | IAM 액세스 키 ID |
| `AWS_SECRET_ACCESS_KEY` | IAM 시크릿 키 |
| `S3_BUCKET` | 버킷 이름 (예: `fluento-frontend`) |

> IAM 사용자는 S3 권한(`AmazonS3FullAccess` 또는 해당 버킷만 허용하는 정책)이 있어야 함.

### 3-2. 워크플로우 파일 추가
`.github/workflows/deploy-frontend.yml` 파일을 만들고 아래 내용 붙여넣기:

```yaml
name: Deploy Frontend to S3

on:
  push:
    branches: [ main ]
    paths:
      - '01_frontend/**'
      - '.github/workflows/deploy-frontend.yml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: 01_frontend

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: 01_frontend/package-lock.json

      - name: Install & Build
        run: |
          npm ci
          npm run build

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-2

      - name: Deploy to S3
        run: aws s3 sync dist/ s3://${{ secrets.S3_BUCKET }} --delete
```

### 3-3. 끝
이제 프론트 코드 고치고 `main`에 push하면 자동으로 빌드돼서 S3에 올라가. 백엔드랑 똑같은 사용감.
Actions 탭에서 진행 상황/성공 여부 확인 가능.

---

## 4. (선택) 나중에 HTTPS·도메인이 필요해지면 → CloudFront

S3 단독은 `http://`만 되고 속도/캐시 최적화가 없어. 실서비스로 갈 때 S3 앞에 **CloudFront(CDN)**를 얹으면:
- `https://` 지원, 커스텀 도메인 연결
- 전 세계 캐시로 빠름

대신 배포할 때마다 **캐시 비우기(invalidation)**를 해줘야 새 버전이 보임. 자동배포에 한 줄 추가:
```yaml
      - name: Invalidate CloudFront
        run: aws cloudfront create-invalidation --distribution-id ${{ secrets.CF_DISTRIBUTION_ID }} --paths "/*"
```
(지금 발표/데모 단계면 CloudFront 없이 S3만으로 충분함. 필요해지면 그때 추가.)

---

## 자주 나는 문제 (트러블슈팅)

| 증상 | 원인 / 해결 |
|------|------------|
| 새로고침하면 403/404 | 1-2에서 **오류 문서를 `index.html`로** 안 했음 |
| 화면은 뜨는데 로그인/API가 안 됨 | `.env.production`의 `VITE_API_BASE_URL`이 옛날 EC2 주소 → 고치고 재빌드·재업로드 |
| Access Denied (페이지 자체가 안 열림) | 1-1 퍼블릭 액세스 차단 해제 + 1-3 버킷 정책 확인 |
| 올렸는데 옛날 화면 그대로 | (CloudFront 쓸 때만) invalidation 안 함. S3 단독이면 브라우저 캐시 → 강력 새로고침 |
| 빌드는 됐는데 흰 화면 | 브라우저 콘솔(F12) 에러 확인. 보통 API 주소/CORS 문제 |
