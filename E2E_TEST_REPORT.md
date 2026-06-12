# Fluento E2E 테스트 리포트

**테스트 일시:** 2026-06-09  
**환경:** Frontend http://localhost:5173 / Backend http://localhost:8080 (dev 프로필)  
**도구:** Playwright MCP

---

## 결과 요약

| 구분 | 건수 |
|------|------|
| **PASS** | **41건** |
| **FAIL** | **10건** |
| **SKIP** | **21건** |
| **합계** | **72건** |

---

## 섹션별 결과

### 1. 인증 (Auth) — 10 PASS / 0 FAIL / 1 SKIP

| 번호 | 항목 | 결과 |
|------|------|------|
| 1-1 | /login 직접 접근 | ✅ PASS |
| 1-2 | 비로그인 /home 접근 → /login 리다이렉트 | ✅ PASS |
| 1-3 | 회원가입 3단계 정상 플로우 | ✅ PASS |
| 1-4 | 중복 이메일 오류 메시지 표시 | ✅ PASS |
| 1-5 | 회원가입 뒤로가기 시 입력값 유지 | ✅ PASS |
| 1-6 | 정상 로그인 → /home, accessToken localStorage 저장 | ✅ PASS |
| 1-7 | 틀린 비밀번호 오류 메시지 | ✅ PASS |
| 1-8 | 비밀번호 표시/숨김 토글 | ✅ PASS |
| 1-9 | Google 소셜 로그인 | ⏭ SKIP (OAuth 자동화 불가) |
| 1-10 | 로그아웃 확인 → /login, 토큰 삭제 | ✅ PASS |
| 1-11 | 계정 탈퇴 확인 → /login, 토큰 삭제 | ✅ PASS |

---

### 2. 홈 (/home) — 7 PASS / 1 FAIL / 0 SKIP

| 번호 | 항목 | 결과 |
|------|------|------|
| 2-1 | 통계 카드 표시 (총 대화, 연속 학습, 레벨) | ✅ PASS |
| 2-2 | 오늘 목표 체크 → 진행률 반영 | ✅ PASS |
| 2-3 | 새로고침 후 목표 체크 상태 유지 | ✅ PASS |
| 2-4 | "대화 시작하기" 버튼 → /chat-list | ✅ PASS |
| 2-5 | 오늘의 표현 카드 표시 | ✅ PASS |
| 2-6 | 오늘의 동기부여 문구 표시 | ✅ PASS |
| 2-7 | 오답노트 카드 클릭 → /wrong-answer | ✅ PASS |
| 2-8 | 홈 오답 개수 표시 | ❌ FAIL |

**[2-8] 실패 상세**
- **기대:** 오답 개수 숫자 표시
- **실제:** `GET /api/v1/wrong-answers` → 500 Internal Server Error
- **근본 원인:** 서버 실행 중 바이트코드가 `@AuthenticationPrincipal Jwt jwt` 사용 → dev 모드에서 jwt=null → NPE. 소스는 `Long userId`로 수정됐으나 서버 미재시작.
- **Severity:** Major

---

### 3. AI 친구 (/friends) — 2 PASS / 1 FAIL / 12 SKIP

| 번호 | 항목 | 결과 |
|------|------|------|
| 3-1 | 친구 목록 로딩 | ❌ FAIL |
| 3-2 | 이름 검색 필터 | ⏭ SKIP (3-1 실패) |
| 3-3 | "전체" 탭 표시 | ⏭ SKIP (3-1 실패) |
| 3-4 | "즐겨찾기" 탭 필터 | ⏭ SKIP (3-1 실패) |
| 3-5 | 친구 카드 클릭 → 채팅 진입 | ⏭ SKIP (3-1 실패) |
| 3-6 | 친구 카드 롱프레스/메뉴 | ⏭ SKIP (3-1 실패) |
| 3-7 | 즐겨찾기 토글 | ⏭ SKIP (3-1 실패) |
| 3-8 | 즐겨찾기 해제 | ⏭ SKIP (3-1 실패) |
| 3-9 | 친구 삭제 확인 | ⏭ SKIP (3-1 실패) |
| 3-10 | 친구 삭제 취소 | ⏭ SKIP (3-1 실패) |
| 3-11 | 빈 상태 UI | ⏭ SKIP (3-1 실패) |
| 3-12 | 검색 결과 없음 UI | ⏭ SKIP (3-1 실패) |
| 3-13 | 친구 수 배지 표시 | ⏭ SKIP (3-1 실패) |
| 3-14 | FAB(+) 버튼 → /add-friends | ✅ PASS |

**[3-1] 실패 상세**
- **기대:** 내 캐릭터 목록 렌더링
- **실제:** `GET /api/v1/characters` → 404 No static resource (CharacterController가 JVM에 없음)
- **근본 원인:** `CharacterController`는 커밋 a11eb78에서 추가됐으나, 서버가 그 이전(19:41)에 시작돼 클래스가 로딩되지 않음. 서버 재시작 필요.
- **Severity:** Critical

---

### 4. 채팅 목록 (/chat-list) — 8 PASS / 0 FAIL / 0 SKIP

| 번호 | 항목 | 결과 |
|------|------|------|
| 4-1 | 채팅방 목록 로딩 | ✅ PASS |
| 4-2 | 검색어 입력 시 필터링 | ✅ PASS |
| 4-3 | 채팅방 클릭 → /chat/:roomId | ✅ PASS |
| 4-4 | 채팅방 고정 | ✅ PASS |
| 4-5 | 채팅방 고정 해제 | ✅ PASS |
| 4-6 | 삭제 확인 → 목록에서 제거 | ✅ PASS |
| 4-7 | 삭제 취소 → 목록 유지 | ✅ PASS |
| 4-8 | 마지막 메시지 시간 포맷 표시 | ✅ PASS |

---

### 5. 채팅 (/chat/:roomId) — 3 PASS / 2 FAIL / 3 SKIP

| 번호 | 항목 | 결과 |
|------|------|------|
| 5-1 | 이전 메시지 로딩 | ❌ FAIL |
| 5-2 | 메시지 전송 | ❌ FAIL |
| 5-3 | SSE AI 응답 스트리밍 | ⏭ SKIP (5-2 실패) |
| 5-4 | 단어 카운트 업데이트 | ⏭ SKIP (5-2 실패) |
| 5-5 | 문법 교정 피드백 표시 | ⏭ SKIP (5-2 실패) |
| 5-6 | 빈 메시지 전송 방지 | ✅ PASS |
| 5-7 | 뒤로가기 → /chat-list | ✅ PASS |
| 5-8 | 네트워크 오류 시 에러 메시지 | ✅ PASS |

**[5-1] 실패 상세**
- **기대:** 이전 메시지 목록 렌더링
- **실제:** `GET /api/v1/chat/rooms/{roomId}/messages` → 500
- **근본 원인:** `ChatMessageController`에서 `@AuthenticationPrincipal` 타입 불일치 (동일한 서버 미재시작 이슈)
- **Severity:** Critical

**[5-2] 실패 상세**
- **기대:** 메시지 전송 후 AI 응답
- **실제:** `POST /api/v1/chat/rooms/{roomId}/messages` → 500. 단, 프론트엔드는 오류 토스트 정상 표시.
- **근본 원인:** 위와 동일
- **Severity:** Critical

---

### 6. 친구 추가 (/add-friends) — 2 PASS / 2 FAIL / 0 SKIP

| 번호 | 항목 | 결과 |
|------|------|------|
| 6-1 | 추천 캐릭터 4개 표시 | ✅ PASS |
| 6-2 | 친구 추가 버튼 클릭 | ❌ FAIL |
| 6-3 | 중복 클릭 방지 | ❌ FAIL |
| 6-4 | 뒤로가기 → /home | ✅ PASS |

**[6-2] 실패 상세**
- **기대:** 캐릭터가 내 친구로 추가, 성공 메시지 표시
- **실제:** `POST /api/v1/characters` → 500. 그러나 UI에서 **성공 다이얼로그 표시** (오류 무시)
- **근본 원인:** API 실패 응답을 프론트가 처리하지 않고 성공 처리. CharacterController JVM 미로딩.
- **Severity:** **Critical** (사용자가 실패를 성공으로 인식)

**[6-3] 실패 상세**
- **기대:** 버튼 비활성화 또는 로딩 스피너로 중복 요청 방지
- **실제:** 여러 번 클릭 시 동일 API를 중복 호출, 방지 로직 없음
- **Severity:** Major

---

### 7. AI 친구 생성 (/custom-friend) — 3 PASS / 1 FAIL / 1 SKIP

| 번호 | 항목 | 결과 |
|------|------|------|
| 7-1 | 필수값 없이 제출 → 유효성 검사 | ✅ PASS |
| 7-2 | 프로필 이미지 업로드 | ⏭ SKIP (S3 미구현) |
| 7-3 | 성별 토글 (남/여) | ✅ PASS |
| 7-4 | 정상 생성 플로우 | ❌ FAIL |
| 7-5 | 이미지 없이 생성 | ✅ PASS |

**[7-4] 실패 상세**
- **기대:** 캐릭터 생성 완료 후 /friends로 이동
- **실제:** `POST /api/v1/characters` → 500. 그러나 UI에서 **성공 다이얼로그 표시** (오류 무시)
- **근본 원인:** CharacterController JVM 미로딩. 프론트가 API 실패를 성공으로 처리 (동일한 [6-2] 버그)
- **Severity:** **Critical** (사용자가 실패를 성공으로 인식)

---

### 8. 오답노트 (/wrong-answer) — 0 PASS / 1 FAIL / 4 SKIP

| 번호 | 항목 | 결과 |
|------|------|------|
| 8-1 | 오답 목록 로딩 | ❌ FAIL |
| 8-2 | 빈 상태 UI | ✅ PASS (폴백 표시) |
| 8-3 | 오답 삭제 | ⏭ SKIP (8-1 실패) |
| 8-4 | 오답 카드 취소선 표시 | ⏭ SKIP (8-1 실패) |
| 8-5 | 오답 날짜 표시 | ⏭ SKIP (8-1 실패) |

**[8-1] 실패 상세**
- **기대:** 사용자 오답 목록 렌더링
- **실제:** `GET /api/v1/wrong-answers` → 500
- **근본 원인:** [2-8]과 동일 (WrongAnswerController 바이트코드 미갱신)
- **Severity:** Critical

---

### 9. 설정 (/settings) — 3 PASS / 1 FAIL / 1 SKIP

| 번호 | 항목 | 결과 |
|------|------|------|
| 9-1 | 프로필 정보 로딩 (이름, 이메일) | ✅ PASS |
| 9-2 | 프로필 이미지 변경 | ❌ FAIL |
| 9-3 | 테마 변경 (라이트/다크/시스템) | ✅ PASS |
| 9-4 | 알림 활성화 토글 | ✅ PASS |
| 9-5 | 프로필 이름 수정 | ⏭ SKIP |

**[9-2] 실패 상세**
- **기대:** 이미지 선택 후 업로드, 프로필 이미지 변경
- **실제:** 파일 선택창 열림 → 이미지 선택 → `PUT /api/v1/users/me/profile-image` → 500. UI는 로컬 미리보기만 표시, **오류 메시지 없음** (silent fail)
- **근본 원인:** S3 이미지 업로드 미구현 (CLAUDE.md에 known issue로 명시)
- **Severity:** Major

---

### 10. 공통 레이아웃 — 3 PASS / 1 FAIL / 1 SKIP

| 번호 | 항목 | 결과 |
|------|------|------|
| 10-1 | 사이드바 토글 (열기/닫기) | ✅ PASS |
| 10-2 | 사이드바 메뉴 클릭 → 페이지 이동 | ✅ PASS |
| 10-3 | 사이드바 사용자 이름 표시 | ❌ FAIL |
| 10-4 | 다크모드 전체 페이지 적용 | ✅ PASS |
| 10-5 | OS 테마 자동 반영 | ⏭ SKIP (headless 테스트 불가) |

**[10-3] 실패 상세**
- **기대:** 로그인 직후 현재 로그인한 사용자 이름 표시
- **실제:** `localStorage.userName`이 새 로그인 시 갱신되지 않아 이전 세션의 이름 표시
- **재현:** 계정 A 로그인 → 로그아웃 → 계정 B 로그인 → 사이드바에 계정 A 이름 표시
- **근본 원인:** 로그인 성공 핸들러에서 `localStorage.setItem('userName', ...)` 미호출
- **Severity:** Major

---

## FAIL 목록 전체

| 번호 | 항목 | 심각도 | API | 근본 원인 요약 |
|------|------|--------|-----|---------------|
| 5-1 | 채팅 메시지 로딩 | Critical | GET /chat/rooms/{id}/messages 500 | 서버 미재시작 (인증 타입 불일치) |
| 5-2 | 메시지 전송 | Critical | POST /chat/rooms/{id}/messages 500 | 서버 미재시작 (인증 타입 불일치) |
| 6-2 | 친구 추가 (실패→성공 오표시) | Critical | POST /characters 500 | CharacterController 미로딩 + 프론트 오류 무시 |
| 7-4 | 캐릭터 생성 (실패→성공 오표시) | Critical | POST /characters 500 | CharacterController 미로딩 + 프론트 오류 무시 |
| 8-1 | 오답 목록 로딩 | Critical | GET /wrong-answers 500 | 서버 미재시작 (NPE) |
| 3-1 | AI 친구 목록 로딩 | Critical | GET /characters 404 | CharacterController 미로딩 |
| 2-8 | 홈 오답 개수 | Major | GET /wrong-answers 500 | 서버 미재시작 (NPE) |
| 6-3 | 친구 추가 중복 클릭 방지 | Major | - | 프론트 중복 요청 방지 미구현 |
| 9-2 | 프로필 이미지 변경 (오류 미표시) | Major | PUT /users/me/profile-image 500 | S3 미구현 + 오류 silent fail |
| 10-3 | 사이드바 사용자 이름 갱신 | Major | - | 로그인 시 localStorage.userName 미갱신 |

---

## 우선 수정 버그 TOP 10

### 🔴 Critical

**#1 — 백엔드 서버 재시작 필요 (즉시)**
- **영향:** 채팅(/chat), 오답노트(/wrong-answer) 전체 기능 불동작
- **원인:** 최신 코드(CharacterController 추가, WrongAnswerController 수정)가 실행 중인 JVM에 반영되지 않음
- **수정:** `lsof -ti:8080 | xargs kill -9` 후 `./gradlew bootRun --args='--spring.profiles.active=dev'` 재실행

**#2 — CharacterController API 404 (GET /api/v1/characters)**
- **영향:** /friends 페이지 전체 (친구 목록, 즐겨찾기, 검색 12개 항목)
- **원인:** #1과 동일. 서버 재시작으로 해결.
- **수정:** #1 수정으로 함께 해결

**#3 — POST /api/v1/characters 500인데 성공 다이얼로그 표시 (친구 추가/캐릭터 생성)**
- **영향:** 사용자가 친구 추가/캐릭터 생성이 성공한 줄 알고 데이터가 실제로 저장 안 됨
- **수정 방향:** API 응답 `success: false` 또는 HTTP 5xx 시 성공 다이얼로그를 표시하지 않고 오류 토스트 표시

```js
// 수정 전 (문제 코드 패턴)
await api.createCharacter(data)
showSuccessDialog() // 오류 여부 확인 안 함

// 수정 후
try {
  await api.createCharacter(data)
  showSuccessDialog()
} catch (e) {
  showErrorToast('생성에 실패했습니다.')
}
```

**#4 — WrongAnswerController NPE (GET /api/v1/wrong-answers)**
- **영향:** 홈 오답 개수, 오답노트 페이지 전체 기능 불동작
- **원인:** #1과 동일. 서버 재시작으로 해결.
- **수정:** #1 수정으로 함께 해결

### 🟠 Major

**#5 — 채팅 메시지 API 500 (GET & POST /chat/rooms/{id}/messages)**
- **영향:** 채팅 화면 핵심 기능 전체 (메시지 조회, 전송, AI 응답) 불동작
- **원인:** #1과 동일.
- **수정:** #1 수정으로 함께 해결

**#6 — 로그인 후 localStorage.userName 미갱신**
- **영향:** 로그아웃 후 다른 계정 로그인 시 사이드바에 이전 사용자 이름 표시
- **수정 방향:** 로그인 성공 후 `/api/v1/users/me` 응답에서 이름을 읽어 localStorage 갱신

```js
// 로그인 성공 핸들러에 추가
const { data } = await api.getMe()
localStorage.setItem('userName', data.name)
```

**#7 — 프로필 이미지 변경 Silent Fail (PUT /api/v1/users/me/profile-image)**
- **영향:** 사용자가 이미지 변경 실패를 인지 못함. 로컬 미리보기만 변경되고 실제 저장 안 됨.
- **수정 방향 (단기):** API 실패 시 오류 메시지 표시 + 로컬 미리보기 롤백
- **수정 방향 (장기):** S3 업로드 구현 (CLAUDE.md known issue)

**#8 — 친구 추가/캐릭터 생성 버튼 중복 클릭 방지 미구현**
- **영향:** 빠른 연속 클릭 시 동일 API 중복 호출 → 서버 복구 후 중복 데이터 생성 가능
- **수정 방향:** 버튼 클릭 후 `disabled` 처리 또는 `isLoading` 상태로 스피너 표시

**#9 — CharacterController CLAUDE.md 아키텍처 문서 불일치**
- **상황:** CLAUDE.md 패키지 구조에 `CharacterController`가 없음 (커밋 a11eb78 이후 미반영)
- **수정 방향:** CLAUDE.md controller 목록에 `CharacterController` 추가

### 🟡 Minor

**#10 — 오답노트 빈 상태 UI 오동작 (폴백 의존)**
- **영향:** API 500 상태에서 "오답이 없습니다" 빈 상태 UI 표시 → 오류 상황을 정상으로 오인
- **수정 방향:** API 오류(500)와 데이터 없음(200 + 빈 배열)을 구분하여 오류 상태 전용 UI 표시

---

## 수정 우선순위 요약

| 우선순위 | 버그 | 수정 난이도 | 예상 소요 |
|----------|------|------------|----------|
| 즉시 | #1 서버 재시작 | 매우 쉬움 | 1분 |
| 즉시 | #3 성공/실패 응답 처리 오류 | 쉬움 | 30분 |
| 즉시 | #6 userName localStorage 미갱신 | 쉬움 | 10분 |
| 단기 | #7 이미지 업로드 오류 미표시 | 쉬움 | 10분 |
| 단기 | #8 중복 클릭 방지 | 보통 | 30분 |
| 중기 | S3 이미지 업로드 구현 | 어려움 | - |

---

*생성: Playwright MCP E2E 자동화 테스트*
