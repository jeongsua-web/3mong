# Claude Code 업데이트 정리 (2026년 4월)

## 개요

2026년 3~4월 기준 Claude Code의 주요 업데이트 내용을 정리한 문서입니다.

v2.1.69에서 v2.1.105까지 약 5주간 30회 이상의 릴리스가 이루어졌습니다.

---

## v2.1.105 (최신)

### 새 기능

- **EnterWorktree 도구**: `path` 파라미터 추가 — 기존 worktree로 전환 가능
- **PreCompact 훅**: 압축 차단 기능 (exit code 2 또는 `{"decision":"block"}` 반환)
- **백그라운드 모니터**: 플러그인이 최상위 `monitors` manifest 키로 자동 활성화
- `/proactive` 명령어 추가 (`/loop`의 별칭)

### 버그 수정

- 긴 단일 라인(예: minified JSON) 쓰기 시 UI 절단 개선
- `/doctor` 레이아웃 개선 (상태 아이콘 추가, `f` 키로 자동 수정)
- **선행 공백 제거 버그 수정** — ASCII art, 들여쓰기 다이어그램 손상 해결
- Alt+Enter가 일부 터미널에서 줄바꿈 삽입 실패하는 문제 수정
- 마켓플레이스 플러그인 자동 업데이트 시 의존성 설치 실패 수정
- 다수의 MCP 관련 버그 수정 (OAuth, 헤더 도우미)

---

## v2.1.101

### 새 기능

- **팀 온보딩 가이드**: `/team-onboarding` 명령으로 사용 현황 기반 팀원 가이드 자동 생성
- **OS CA 인증서 기본 지원**: 엔터프라이즈 TLS 프록시 환경 지원 (`CLAUDE_CODE_CERT_STORE=bundled`로 번들 CA만 사용 가능)
- **원격 세션 자동 설정**: `/ultraplan`이 자동으로 기본 클라우드 환경 생성

### 보안 수정

- **권한 우회 취약점 수정**: POSIX `which` 대체에서 발생하던 명령 주입(Command Injection) 취약점 패치

### 버그 수정

- 장시간 세션에서 가상 스크롤러가 과거 메시지 복사본을 유지하는 메모리 누수 수정
- `--resume` 체인 복구 불안정성 수정
- Bedrock SigV4 인증 실패 수정
- 플러그인 자동 업데이트 중 파일 열림 상태로 인한 문제 수정

---

## v2.1.98

### 새 기능

- **Google Vertex AI 설정 마법사**: GCP 인증 및 모델 핀 가이드
- **PERFORCE_MODE**: `CLAUDE_CODE_PERFORCE_MODE` 환경변수로 읽기 전용 파일에 `p4 edit` 힌트 제공
- **Monitor 도구**: 백그라운드 스크립트 이벤트 스트리밍
- **Linux 서브프로세스 샌드박싱**: PID 네임스페이스 격리 도입

### 보안 수정

- **Bash 권한 우회**: 백슬래시 이스케이프 플래그를 이용한 자동 허용 후 임의 코드 실행 가능한 취약점 패치
- 복합 Bash 명령이 강제 권한 프롬프트를 우회하는 문제 수정

### 버그 수정

- 읽기 전용 명령과 env-var 접두사 처리 개선
- 429 재시도 지수 백오프 최솟값 적용

---

## v2.1.94

### 새 기능

- **Amazon Bedrock Mantle 지원**: `CLAUDE_CODE_USE_MANTLE=1` 설정
- **기본 노력 수준 변경**: API, Bedrock/Vertex 사용자는 이제 기본값이 "high" (기존 "medium"에서 변경)
- **Slack 메시지 헤더 개선**: 간결한 `Slacked #channel` 포맷 및 클릭 가능한 링크
- **플러그인 스킬**: 디렉토리 basename 대신 frontmatter `name` 필드를 사용해 안정적인 호출명 지원

### 버그 수정

- 429 응답 후 에이전트가 stuck 상태에 빠지는 문제 (즉시 오류 표시로 개선)
- macOS Console 로그인 실패 (키체인 잠김 상황)
- 플러그인 스킬 훅이 YAML frontmatter에서 무시되는 문제
- 긴 세션의 다중바이트 텍스트 손상 (U+FFFD) 수정

---

## v2.1.92

### 새 기능

- **Bedrock 설정 마법사**: AWS 인증, 지역 및 모델 구성 가이드
- **강제 원격 설정 새로고침**: `forceRemoteSettingsRefresh` 정책 추가
- **비용 분석 개선**: `/cost` 명령에서 모델별, 캐시 히트별 분석 제공
- **대화형 릴리스 노트**: `/release-notes`에서 버전 선택 가능

### 버그 수정

- 서브에이전트 tmux 창 제거 후 "worktree count" 오류 수정
- 프롬프트 타입 Stop 훅 실패 수정
- 스트리밍 배열/객체 필드 JSON 인코딩 검증 실패 수정
- Extended thinking 공백 조용한 오류 수정

---

## v2.1.91

### 새 기능

- **MCP 도구 결과 영속성**: `_meta["anthropic/maxResultSizeChars"]` 최대 500K 지원 (DB 스키마 등 대용량 데이터 처리)
- **스킬 셸 실행 비활성화**: `disableSkillShellExecution` 설정 추가
- **플러그인 바이너리**: `bin/` 디렉토리 아래 실행 파일을 Bash 도구에서 명령으로 호출 가능

---

## v2.1.90

### 새 기능

- **`/powerup` 명령**: Claude Code 기능 학습용 인터랙티브 튜토리얼
- **`.husky` 보호 디렉토리 추가**: acceptEdits 모드

### 버그 수정

- 무한 루프: 레이트 한계 옵션 다이얼로그 반복 열림 문제 수정
- `--resume` 프롬프트 캐시 미스 (deferred 도구 포함) 수정
- PostToolUse 포맷-온-세이브 훅으로 인한 "파일 내용 변경됨" 오류 수정

---

## 주요 개선 트렌드 요약

| 영역 | 주요 개선사항 |
| --- | --- |
| **보안** | 권한 우회 취약점 패치, PID 네임스페이스 샌드박싱 강화 |
| **성능** | 메모리 누수 해결, Write 도구 속도 60% 향상 |
| **사용성** | 설정 마법사 추가(Bedrock/Vertex), 신규 명령어(`/powerup`, `/team-onboarding`) |
| **호환성** | Amazon Bedrock Mantle, Google Vertex AI, Perforce 지원 확대 |
| **안정성** | 오류 처리 및 폴백 메커니즘 강화, MCP 안정성 개선 |
| **UI/UX** | NO_FLICKER 렌더링 엔진, Focus View(Ctrl+O), 상태라인 개선 |

---

## 참고 링크

- [공식 GitHub 릴리스](https://github.com/anthropics/claude-code/releases)
- [공식 Changelog 문서](https://code.claude.com/docs/en/changelog)
- [Anthropic 플랫폼 릴리스 노트](https://platform.claude.com/docs/en/release-notes/overview)

> 마지막 업데이트: 2026-04-14
>