# Fluento Frontend

## 오늘의 목표 — 자동 달성 조건

| 목표 | 달성 조건 | 추적 위치 |
|------|-----------|-----------|
| 10분간 영어학습 진행하기 | ChatPage 체류 시간 누적 ≥ 600초 | `localStorage: dailyChatSeconds_YYYY-MM-DD` |
| 단어 20개 완벽하게 암기하기 | 당일 채팅 메시지에서 입력한 영단어 수 ≥ 20개 | `localStorage: dailyLearnedWords_YYYY-MM-DD` |
| 오답노트 다시 확인하기 | WrongAnswerPage 방문 | `localStorage: wrongAnswerReviewDate` |

- HomePage는 5초마다 localStorage를 재조회해 상태를 갱신한다.
- 날짜가 바뀌면 새 키가 생성되므로 목표는 매일 자동 초기화된다.
