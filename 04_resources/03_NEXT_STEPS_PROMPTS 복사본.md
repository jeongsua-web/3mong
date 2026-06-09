# FLUENTO 백엔드 - 다음 단계 프롬프트

---

## STEP 1: OpenAI API 연동 테스트

### Step 1-1: OpenAI Key 환경변수 설정 및 실제 AI 응답 테스트

**선행 조건:** OpenAI API Key 발급 완료 (sk-...)

**프롬프트:**
```
OpenAI API Key를 발급받았어. 실제로 AI 응답이 동작하는지 확인하고 싶어.

1. IntelliJ Run Configuration에 환경변수 추가:
   OPENAI_API_KEY=sk-...
   SPRING_PROFILES_ACTIVE=dev

2. dev 프로필로 앱 실행 후 아래 순서로 테스트:
   - POST /api/v1/chat/rooms 로 채팅방 생성
   - POST /api/v1/chat/rooms/{roomId}/messages 로 메시지 전송
   - GET /api/v1/chat/rooms/{roomId}/stream?messageId={id} 로 SSE 스트림 확인

3. SSE 스트림이 실제로 동작하는지 curl로 테스트하는 명령어도 알려줘.

혹시 에러가 나면 같이 해결해줘.
```

---

## STEP 2: AWS S3 이미지 업로드 연동

### Step 2-1: S3 버킷 생성 (직접 해야 함)

**AWS 콘솔에서 직접:**
```
1. AWS Console → S3 → 버킷 생성
   - 버킷 이름: fluento-images (또는 원하는 이름)
   - 리전: ap-northeast-2 (서울)
   - 퍼블릭 액세스 차단: 유지 (Presigned URL 사용 예정)

2. IAM → 사용자 생성 또는 기존 사용자에 정책 추가:
   - AmazonS3FullAccess (또는 버킷 한정 정책)
   - Access Key ID, Secret Access Key 발급

3. 발급된 값 메모:
   - AWS_ACCESS_KEY_ID=...
   - AWS_SECRET_ACCESS_KEY=...
   - S3_BUCKET_NAME=fluento-images
```

### Step 2-2: S3 이미지 업로드 코드 구현

**프롬프트:**
```
AWS S3 이미지 업로드를 구현해줘.

환경변수:
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_REGION=ap-northeast-2
- S3_BUCKET_NAME=fluento-images

구현할 것:
1. S3Config 클래스 - S3Client Bean 등록
2. S3Service 클래스:
   - uploadImage(MultipartFile file, String userId) → String (S3 URL 반환)
   - 파일 검증: jpg, png, gif, webp만 허용, 최대 10MB
   - 파일명: {userId}/{UUID}.{확장자}
3. ChatMessageController에 multipart/form-data 이미지 업로드 연동
4. 에러 처리:
   - INVALID_IMAGE (400): 지원하지 않는 형식
   - IMAGE_TOO_LARGE (413): 10MB 초과

build.gradle에 필요한 의존성도 추가해줘.
```

---

## STEP 3: AWS Cognito 설정

### Step 3-1: Cognito User Pool 생성 (직접 해야 함)

**AWS 콘솔에서 직접:**
```
1. AWS Console → Cognito → User Pool 생성
   - 로그인 방식: 이메일
   - MFA: 없음 (개발 단계)
   - 앱 클라이언트 생성:
     - 이름: fluento-app
     - 인증 흐름: ALLOW_USER_SRP_AUTH, ALLOW_REFRESH_TOKEN_AUTH

2. Google OAuth 연동:
   - Cognito → Federated Identity → Google 추가
   - Google Cloud Console에서 OAuth 클라이언트 ID 발급 필요
   - 콜백 URL: https://your-domain.auth.ap-northeast-2.amazoncognito.com/oauth2/idpresponse

3. 발급된 값 메모:
   - AWS_COGNITO_USER_POOL_ID=ap-northeast-2_xxxxxx
   - AWS_COGNITO_CLIENT_ID=xxxxxxxxxx
   - AWS_REGION=ap-northeast-2
```

### Step 3-2: Cognito JWT 연동 코드 완성

**프롬프트:**
```
AWS Cognito JWT 연동을 완성해줘.

환경변수:
- AWS_REGION=ap-northeast-2
- AWS_COGNITO_USER_POOL_ID=ap-northeast-2_xxxxxx

1. application.yml의 Cognito 설정 확인 및 보완
2. JWT에서 사용자 정보 추출 확인:
   - sub → googleId
   - email → email
   - name → name (없을 수도 있음)
3. 첫 로그인 시 자동 회원가입 흐름 테스트:
   - Cognito JWT로 POST /api/v1/auth/register 호출
   - DB에 유저 자동 생성 확인
4. Postman 또는 curl로 실제 Cognito 토큰으로 테스트하는 방법 알려줘.
```

---

## STEP 4: 프론트엔드 연동

### Step 4-1: CORS 설정 업데이트

**프롬프트:**
```
프론트엔드팀이랑 연동 준비를 해줘.

프론트 정보:
- 프레임워크: [프론트팀에서 확인 - React/Next.js 등]
- 개발 주소: [프론트팀에서 확인 - http://localhost:3000 등]
- 배포 주소: [추후 확인]

SecurityConfig의 CORS 설정에 프론트 주소 추가해줘.
allowedOrigins에 개발/운영 주소 모두 포함.
```

### Step 4-2: API 명세서 최종 검토

**프롬프트:**
```
프론트엔드팀이 아래 API를 사용할 때 문제가 있다고 해.
[프론트팀 피드백 내용 붙여넣기]

명세서 기준으로 수정하거나 보완해줘.
```

---

## STEP 5: 배포 (Phase 6)

### Step 5-1: Docker 이미지 생성

**프롬프트:**
```
AWS 배포를 위한 Dockerfile을 작성해줘.

조건:
- Multi-stage build (빌드 최적화)
- JDK 25 기반
- 환경변수로 모든 설정 주입
- 포트 8080

docker build 및 docker run 테스트 명령어도 알려줘.
```

### Step 5-2: AWS EC2 또는 ECS 배포

**프롬프트:**
```
AWS에 배포하고 싶어.

현재 인프라:
- RDS PostgreSQL (또는 로컬 DB → RDS 마이그레이션)
- ElastiCache Redis (또는 로컬 Redis → ElastiCache)
- Cognito User Pool
- S3 버킷

배포 방법 두 가지 중 추천해줘:
1. EC2에 Docker 직접 배포
2. ECS Fargate로 컨테이너 배포

선택한 방법으로 배포 스크립트 및 환경변수 설정 방법 알려줘.
```

---

## 진행 순서 요약

```
[지금 당장]
1. OpenAI Key 발급 → Step 1-1 진행
2. AWS S3 버킷 생성 → Step 2-1 진행

[다음]
3. AWS Cognito User Pool 생성 → Step 3-1 진행
4. 프론트팀이랑 CORS 확인 → Step 4-1 진행

[마지막]
5. Docker + AWS 배포 → Step 5 진행
```
