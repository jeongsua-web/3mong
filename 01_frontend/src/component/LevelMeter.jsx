import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, ChevronUp, ChevronDown } from 'lucide-react';

// 백엔드 LevelAdjustmentService 규칙과 일치시킨 상수
const UPGRADE_THRESHOLD = 90;
const UPGRADE_COUNT = 3;
const DOWNGRADE_THRESHOLD = 50;
const DOWNGRADE_COUNT = 2;
const MAX_SCORES = 5;

const LEVELS = [
  { key: 'beginner', label: '초급', color: '#059669' },
  { key: 'intermediate', label: '중급', color: '#0891B2' },
  { key: 'advanced', label: '고급', color: '#7C3AED' },
];

const levelIndex = (key) => LEVELS.findIndex((l) => l.key === key);

const scoreColor = (s) => {
  if (s >= UPGRADE_THRESHOLD) return '#059669';
  if (s <= DOWNGRADE_THRESHOLD) return '#DC2626';
  return '#94A3B8';
};

// 끝에서부터 조건을 만족하는 연속 개수
const trailingStreak = (scores, predicate) => {
  let n = 0;
  for (let i = scores.length - 1; i >= 0; i--) {
    if (predicate(scores[i])) n++;
    else break;
  }
  return n;
};

const LevelMeter = ({ currentLevel, recentScores, detected, adjusting }) => {
  const [open, setOpen] = useState(false);
  const idx = Math.max(0, levelIndex(currentLevel));
  const upStreak = Math.min(trailingStreak(recentScores, (s) => s >= UPGRADE_THRESHOLD), UPGRADE_COUNT);
  const downStreak = Math.min(trailingStreak(recentScores, (s) => s <= DOWNGRADE_THRESHOLD), DOWNGRADE_COUNT);

  // 레벨 변경 직후 강조 (부모가 adjusting 신호를 일정 시간 유지)
  const pulse = !!adjusting;

  const canUp = idx < LEVELS.length - 1;
  const canDown = idx > 0;

  // 진행 상태 메시지
  let hint = { icon: Minus, color: 'var(--t3)', text: '레벨 유지 중' };
  if (canDown && downStreak > 0) {
    hint = { icon: TrendingDown, color: '#DC2626', text: `강등 위험 ${downStreak}/${DOWNGRADE_COUNT}` };
  } else if (canUp && upStreak > 0) {
    hint = { icon: TrendingUp, color: '#059669', text: `레벨업까지 ${upStreak}/${UPGRADE_COUNT}` };
  }
  const HintIcon = hint.icon;
  const activeColor = LEVELS[idx].color;

  // 접힌 상태: 현재 레벨 + 진행 아이콘만 보이는 작은 알약 (채팅 가림 최소화)
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="학습 레벨 보기"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '5px 10px',
          borderRadius: 9999,
          cursor: 'pointer',
          background: 'var(--surface)',
          border: `1px solid ${pulse ? 'var(--accent)' : 'var(--border)'}`,
          boxShadow: pulse
            ? '0 0 0 3px var(--accent-l), 0 4px 16px rgba(0,0,0,0.12)'
            : '0 2px 8px rgba(0,0,0,0.06)',
          transition: 'box-shadow 0.4s, border-color 0.4s',
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: 9999, background: activeColor, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: activeColor }}>{LEVELS[idx].label}</span>
        {hint.icon !== Minus && <HintIcon size={12} color={hint.color} />}
        <ChevronDown size={13} color="var(--t3)" />
      </button>
    );
  }

  return (
    <div
      style={{
        width: 188,
        background: 'var(--surface)',
        border: `1px solid ${pulse ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 12,
        padding: '10px 12px',
        boxShadow: pulse
          ? '0 0 0 3px var(--accent-l), 0 4px 16px rgba(0,0,0,0.12)'
          : '0 2px 10px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.4s, border-color 0.4s',
      }}
    >
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          학습 레벨
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, color: hint.color }}>
            <HintIcon size={11} />
            {hint.text}
          </span>
          <button
            onClick={() => setOpen(false)}
            title="접기"
            style={{ display: 'flex', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--t3)' }}
          >
            <ChevronUp size={14} />
          </button>
        </div>
      </div>

      {/* 레벨 사다리 */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 9 }}>
        {LEVELS.map((lv, i) => {
          const active = i === idx;
          const passed = i < idx;
          return (
            <div key={lv.key} style={{ flex: 1, textAlign: 'center' }}>
              <div
                style={{
                  height: 6,
                  borderRadius: 3,
                  background: active || passed ? lv.color : 'var(--border)',
                  opacity: passed ? 0.45 : 1,
                  transition: 'background 0.3s',
                }}
              />
              <div
                style={{
                  marginTop: 4,
                  fontSize: 11,
                  fontWeight: active ? 700 : 500,
                  color: active ? lv.color : 'var(--t3)',
                }}
              >
                {lv.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* 최근 점수 히스토리 */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 30, marginBottom: 4 }}>
        {Array.from({ length: MAX_SCORES }).map((_, i) => {
          const score = recentScores[recentScores.length - MAX_SCORES + i];
          const has = score !== undefined;
          return (
            <div
              key={i}
              title={has ? `${score}점` : '대기'}
              style={{
                flex: 1,
                height: has ? `${Math.max(12, (score / 100) * 30)}px` : 4,
                borderRadius: 3,
                background: has ? scoreColor(score) : 'var(--border)',
                opacity: has ? 1 : 0.5,
                transition: 'height 0.35s, background 0.35s',
              }}
            />
          );
        })}
      </div>

      {/* 최근 점수 / 감지 레벨 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, color: 'var(--t3)' }}>
        <span>
          최근 점수{' '}
          <strong style={{ color: 'var(--t2)' }}>
            {recentScores.length ? recentScores[recentScores.length - 1] : '–'}
          </strong>
        </span>
        {detected && (
          <span>
            감지 <strong style={{ color: LEVELS[Math.max(0, levelIndex(detected.level))].color }}>
              {LEVELS[Math.max(0, levelIndex(detected.level))].label}
            </strong>
            {detected.confidence != null && ` ${Math.round(detected.confidence * 100)}%`}
          </span>
        )}
      </div>

      {adjusting && (
        <div
          style={{
            marginTop: 8,
            fontSize: 11,
            fontWeight: 700,
            textAlign: 'center',
            color: adjusting.direction === 'up' ? '#059669' : '#DC2626',
          }}
        >
          {adjusting.direction === 'up' ? '🎉 레벨 상승!' : '📉 레벨 하향'} {adjusting.label}
        </div>
      )}
    </div>
  );
};

export default LevelMeter;
