# Fluento AWS 설정 가이드

## 목차

1. [사전 준비](#1-사전-준비)
2. [IAM 설정](#2-iam-설정)
3. [Cognito User Pool (로그인)](#3-cognito-user-pool-로그인)
4. [S3 버킷 (이미지 업로드)](#4-s3-버킷-이미지-업로드)
5. [EC2 배포](#5-ec2-배포)
6. [설정 순서 요약](#6-설정-순서-요약)
7. [환경변수 총정리](#7-환경변수-총정리)

---

## 1. 사전 준비

| 항목 | 내용 |
|------|------|
| AWS 계정 | 개인 계정 |
| 리전 | `ap-northeast-2` (서울) |
| 로컬 환경 | JDK 25, Gradle 9, PostgreSQL 18, Redis |
| OpenAI API 키 | platform.openai.com에서 발급 (완료) |

---

## 2. IAM 설정

### 2.1 EC2 실행 역할 생성

- **역할 이름**: `fluento-ec2-role`
- **신뢰 정책**: EC2 서비스 (`ec2.amazonaws.com`)

### 2.2 연결할 인라인 정책

### S3 권한 (fluento-images 버킷 한정)

```json
{
  "Effect": "Allow",
  "Action": [
    "s3:GetObject",
    "s3:PutObject",
    "s3:DeleteObject",
    "s3:ListBucket"
  ],
  "Resource": [
    "arn:aws:s3:::fluento-images",
    "arn:aws:s3:::fluento-images/*"
  ]
}
```

### Cognito 권한 (토큰 검증용)

```json
{
  "Effect": "Allow",
  "Action": [
    "cognito-idp:GetUser",
    "cognito-idp:AdminGetUser"
  ],
  "Resource": "arn:aws:cognito-idp:ap-northeast-2:*:userpool/*"
}
```

### 2.3 콘솔 설정 경로

```
IAM > 역할 > 역할 생성
  → 신뢰할 수 있는 엔터티: AWS 서비스 > EC2
  → 권한 정책: 위 인라인 정책을 JSON으로 작성하여 연결
  → 역할 이름: fluento-ec2-role
```

---

## 3. Cognito User Pool (로그인)

### 3.1 User Pool 생성

| 항목 | 설정값 |
|------|--------|
| User Pool 이름 | `fluento-users` |
| 로그인 방식 | 이메일 |
| 소셜 로그인 | Google OAuth 연동 |
| 토큰 유효기간 (Access Token) | 1시간 |
| 토큰 유효기간 (Refresh Token) | 30일 |

### 3.2 App Client 설정

| 항목 | 설정값 |
|------|--------|
| App Client 이름 | `fluento-app` |
| 인증 흐름 | `ALLOW_USER_SRP_AUTH`, `ALLOW_REFRESH_TOKEN_AUTH` |
| OAuth 흐름 | Authorization code grant |
| Callback URL (개발) | `http://localhost:3000/auth/callback` |
| Callback URL (운영) | `https://fluento.com/auth/callback` |
| Logout URL | `http://localhost:3000`, `https://fluento.com` |

### 3.3 Google 소셜 로그인 연동

```
Google Cloud Console > OAuth 2.0 클라이언트 ID 생성
  → 애플리케이션 유형: 웹 애플리케이션
  → 승인된 리디렉션 URI:
    https://fluento-users.auth.ap-northeast-2.amazoncognito.com/oauth2/idpresponse
```

```
Cognito > fluento-users > 소셜 자격 증명 공급자 > Google 추가
  → Google 클라이언트 ID / 시크릿 입력
  → 속성 매핑: email → email, name → name
```

### 3.4 Cognito 호스팅 도메인 설정

Cognito에서 Google 로그인 페이지를 제공하려면 도메인이 필요함:

| 항목 | 설정값 |
|------|--------|
| 도메인 유형 | Cognito 도메인 (무료) |
| 도메인 이름 | `fluento-auth` |
| 전체 URL | `https://fluento-auth.auth.ap-northeast-2.amazoncognito.com` |

> 나중에 커스텀 도메인(`auth.fluento.com`)으로 변경 가능

```
Cognito > fluento-users > 앱 통합 > 도메인 > Cognito 도메인
  → 도메인 접두사: fluento-auth
```

### 3.5 발급받아야 할 정보

Cognito 생성 후 아래 값을 `application.yml`에 넣어야 함:

| 항목 | 위치 | 환경변수 |
|------|------|----------|
| User Pool ID | Cognito > 사용자 풀 > 개요 | `AWS_COGNITO_USER_POOL_ID` |
| 리전 | `ap-northeast-2` | `AWS_REGION` |
| JWK URI | `https://cognito-idp.{region}.amazonaws.com/{poolId}/.well-known/jwks.json` | (자동 조합) |

### 3.6 콘솔 설정 경로

```
Cognito > 사용자 풀 > 사용자 풀 생성
  → 공급자 유형: Cognito 사용자 풀
  → 로그인 옵션: 이메일
  → 암호 정책: 기본값
  → MFA: 없음 (선택)
  → 이메일 전송: Cognito 기본 이메일
  → 사용자 풀 이름: fluento-users
  → 앱 클라이언트 이름: fluento-app
```

---

## 4. S3 버킷 (이미지 업로드)

### 4.1 이미지 저장 버킷

| 항목 | 설정값 |
|------|--------|
| 버킷 이름 | `fluento-images` |
| 리전 | `ap-northeast-2` |
| 퍼블릭 액세스 | **모두 차단** |
| 버전 관리 | 비활성화 |
| 암호화 | SSE-S3 (기본 암호화) |

### 4.2 폴더 구조

```
fluento-images/
└── images/
    └── chat-{roomId}/     # 채팅방별 이미지
        └── {imageId}.jpg
```

### 4.3 이미지 접근 방식: Pre-signed URL

이미지는 퍼블릭으로 열지 않고, 서버에서 임시 URL을 발급해서 접근:

- 업로드: 클라이언트 → 서버에 업로드 요청 → 서버가 S3에 저장 → 이미지 URL 반환
- 조회: 서버가 Pre-signed URL 발급 (유효기간 1시간) → 클라이언트에 전달

### 4.4 CORS 설정

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["http://localhost:3000", "https://fluento.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### 4.5 콘솔 설정 경로

```
S3 > 버킷 만들기
  → 버킷 이름: fluento-images
  → 리전: 아시아 태평양(서울)
  → 퍼블릭 액세스 차단: 모두 체크
  → 기본 암호화: SSE-S3
  → 버킷 생성 후 > 권한 > CORS > 위 JSON 입력
```

---

## 5. EC2 배포

### 5.1 EC2 인스턴스 설정

| 항목 | 설정값 |
|------|--------|
| AMI | Amazon Linux 2023 |
| 인스턴스 유형 | `t3.small` (최소) / `t3.medium` (권장) |
| 스토리지 | 20GB gp3 |
| IAM 역할 | `fluento-ec2-role` |
| 보안 그룹 | 8080 (Spring Boot), 22 (SSH) |

### 5.2 보안 그룹 인바운드 규칙

| 유형 | 포트 | 소스 |
|------|------|------|
| SSH | 22 | 내 IP |
| 사용자 정의 TCP | 8080 | 0.0.0.0/0 |
| HTTP | 80 | 0.0.0.0/0 (추후 ALB 사용 시) |
| HTTPS | 443 | 0.0.0.0/0 (추후 ALB 사용 시) |

### 5.3 EC2 초기 설정 스크립트

```bash
# JDK 25 설치
sudo yum install -y java-25-amazon-corretto

# 앱 배포
scp -i {키파일}.pem build/libs/fluento-backend-0.0.1-SNAPSHOT.jar ec2-user@{EC2_IP}:~/

# 실행
java -jar fluento-backend-0.0.1-SNAPSHOT.jar \
  --spring.profiles.active=prod \
  --DB_HOST={RDS_ENDPOINT} \
  --OPENAI_API_KEY={키} \
  --AWS_COGNITO_USER_POOL_ID={풀ID}
```

### 5.4 콘솔 설정 경로

```
EC2 > 인스턴스 시작
  → AMI: Amazon Linux 2023
  → 인스턴스 유형: t3.small
  → 키 페어: 새로 생성 (fluento-key)
  → 네트워크: 보안 그룹 위 규칙대로 설정
  → 스토리지: 20GB gp3
  → 고급 세부 정보 > IAM 인스턴스 프로파일: fluento-ec2-role
```

---

## 6. 설정 순서 요약

아래 순서대로 진행하면 의존성 충돌 없이 설정할 수 있습니다.

```
1단계: 인증 (Cognito)
  ├── Google OAuth 클라이언트 ID/시크릿 발급 (Google Cloud Console)
  ├── Cognito User Pool 생성 (fluento-users)
  ├── App Client 생성 (fluento-app)
  └── Google 소셜 로그인 연동

2단계: 스토리지 (S3)
  └── S3 버킷 생성 (fluento-images) + CORS 설정

3단계: 권한 (IAM)
  └── EC2 역할 생성 (fluento-ec2-role) + S3/Cognito 정책 연결

4단계: 배포 (EC2)
  ├── EC2 인스턴스 생성
  ├── 환경변수 설정
  └── JAR 배포 및 실행
```

---

## 7. 환경변수 총정리

운영 서버에 설정해야 할 환경변수 모음:

| 변수명 | 예시 값 | 설명 |
|--------|---------|------|
| `DB_HOST` | `localhost` | PostgreSQL 호스트 |
| `DB_USER` | `jeongsua` | DB 유저명 |
| `DB_PASSWORD` | `****` | DB 비밀번호 |
| `REDIS_HOST` | `localhost` | Redis 호스트 |
| `OPENAI_API_KEY` | `sk-****` | OpenAI API 키 |
| `AWS_REGION` | `ap-northeast-2` | AWS 리전 |
| `AWS_COGNITO_USER_POOL_ID` | `ap-northeast-2_XXXXXXX` | Cognito User Pool ID |
| `AWS_S3_BUCKET` | `fluento-images` | S3 버킷 이름 |
