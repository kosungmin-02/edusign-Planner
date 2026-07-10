import React, { useState, useMemo } from 'react';
import { usePlannerStore } from '../../stores/plannerStore';
import {
  format,
  isSameDay,
  isAfter
} from 'date-fns';

interface BadgeDetail {
  id: 'd3' | 'd7' | 'd14' | 'd30' | 'd100';
  name: string;
  sub: string;
  days: number;
}

const BADGES: BadgeDetail[] = [
  { id: 'd3', name: '3일', sub: '새로운 시작', days: 3 },
  { id: 'd7', name: '7일', sub: '성장하는 습관', days: 7 },
  { id: 'd14', name: '2주', sub: '끈기 있는 러너', days: 14 },
  { id: 'd30', name: '30일', sub: '자기주도 마스터', days: 30 },
  { id: 'd100', name: '100일', sub: '위대한 창조자', days: 100 }
];

export const Attendance: React.FC = () => {
  const { streak, attendanceRecords, profile } = usePlannerStore();
  
  const isDemo = profile.name === '이지수';
  const today = isDemo ? new Date(2026, 6, 9) : new Date();
  
  const [hoverText, setHoverText] = useState('칸에 마우스를 올리면 날짜가 표시됩니다');

  // Heatmap Color Ramp
  // 0: empty, 1: manual, 2: math-app, 3: planner
  const RAMP = ['#e3dcc9', '#bcd8c4', '#7bb891', '#2f7d54'];

  const heatmapData = useMemo(() => {
    const weeksN = 53;
    const totalDays = weeksN * 7;
    
    // Find start date: Go back 53 weeks, align with Sunday start
    const start = new Date(today);
    start.setDate(today.getDate() - (totalDays - 1));
    while (start.getDay() !== 0) { // Align to Sunday
      start.setDate(start.getDate() - 1);
    }

    const weeks = [];
    let prevMonth = -1;
    let totalCount = 0;
    let thisMonthCount = 0;

    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    const cursor = new Date(start);

    for (let w = 0; w < weeksN; w++) {
      let label = '';
      if (cursor.getMonth() !== prevMonth) {
        label = `${cursor.getMonth() + 1}월`;
        prevMonth = cursor.getMonth();
      }

      const days = [];
      for (let d = 0; d < 7; d++) {
        const dt = new Date(cursor);
        dt.setDate(cursor.getDate() + d);

        const dateStr = format(dt, 'yyyy-MM-dd');
        const record = attendanceRecords.find(r => r.date === dateStr);
        const future = isAfter(dt, today) && !isSameDay(dt, today);

        let bg = 'transparent';
        let level = 0;

        if (!future) {
          if (record) {
            totalCount++;
            if (dt.getFullYear() === currentYear && dt.getMonth() === currentMonth) {
              thisMonthCount++;
            }
            // Map source to level
            if (record.source === 'planner') level = 3;
            else if (record.source === 'math-app') level = 2;
            else level = 1;
            bg = RAMP[level];
          } else {
            bg = RAMP[0];
          }
        }

        const title = future
          ? ''
          : `${format(dt, 'yyyy.M.d')} · ${record ? `출석 (${record.source === 'planner' ? '플래너' : record.source === 'math-app' ? '수학 앱' : '수동'})` : '미출석'}`;

        days.push({
          bg,
          border: future ? '1px solid transparent' : '1px solid rgba(43,39,32,.14)',
          title,
          future
        });
      }

      weeks.push({ label, days });
      cursor.setDate(cursor.getDate() + 7);
    }

    return {
      weeks,
      totalCount,
      thisMonthCount
    };
  }, [attendanceRecords, today]);

  return (
    <div className="attendance-page-container">
      {/* 1. Header */}
      <div className="card flex-between" style={{ padding: '18px 24px', borderBottom: '3px solid var(--line)', marginBottom: '0' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontFamily: 'var(--font-num)', fontWeight: '700' }}>출석 캘린더</h2>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--soft)' }}>
          플래너를 쓴 날 = 출석 · 소급 입력 불가
        </div>
      </div>

      {/* 2. Stat Cards Grid */}
      <div className="streak-dashboard-grid">
        <div className="card streak-large-card" style={{ gridColumn: 'span 3', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', padding: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--soft)', marginBottom: '8px' }}>현재 연속 출석</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '34px', fontFamily: 'var(--font-num)', color: 'var(--accent)', fontWeight: '700', lineHeight: 1 }}>{streak.current}</span>
              <span style={{ fontSize: '14px', color: 'var(--ink)' }}>일째</span>
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: '12px', color: 'var(--soft)', marginBottom: '8px' }}>최고 기록</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '34px', fontFamily: 'var(--font-num)', color: 'var(--ink)', fontWeight: '700', lineHeight: 1 }}>{streak.longest}</span>
              <span style={{ fontSize: '14px', color: 'var(--ink)' }}>일</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: 'var(--soft)', marginBottom: '8px' }}>이 달 / 올해 출석</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '34px', fontFamily: 'var(--font-num)', color: 'var(--ink)', fontWeight: '700', lineHeight: 1 }}>{heatmapData.thisMonthCount}</span>
              <span style={{ fontSize: '14px', color: 'var(--ink)' }}>일 · 올해 {heatmapData.totalCount}일</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Heatmap Grid Card */}
      <div className="card heatmap-card">
        <div className="card-header flex-between" style={{ borderBottom: 'none', paddingBottom: '0', marginBottom: '14px' }}>
          <span style={{ fontSize: '12px', color: 'var(--soft)' }}>
            2025 → 2026 · 활동 히트맵
          </span>
          <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: '600' }}>
            {hoverText}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
          {/* Weekday labels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', paddingTop: '19px', flexShrink: 0 }}>
            {['일', '', '화', '', '목', '', '토'].map((wd, i) => (
              <span key={i} style={{ height: '15px', lineHeight: '15px', fontSize: '9px', fontFamily: 'var(--font-mini)', color: 'var(--soft)', width: '16px', display: 'block' }}>
                {wd}
              </span>
            ))}
          </div>

          {/* Heatmap Grid */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Month labels */}
            <div style={{ display: 'flex', gap: '3px', height: '16px', marginBottom: '3px' }}>
              {heatmapData.weeks.map((w, idx) => (
                <span key={idx} style={{ width: '15px', flexShrink: 0, fontSize: '9px', fontFamily: 'var(--font-mini)', color: 'var(--soft)', whiteSpace: 'nowrap' }}>
                  {w.label}
                </span>
              ))}
            </div>

            {/* Matrix */}
            <div style={{ display: 'flex', gap: '3px' }}>
              {heatmapData.weeks.map((w, wIdx) => (
                <div key={wIdx} style={{ display: 'flex', flexDirection: 'column', gap: '3px', flexShrink: 0 }}>
                  {w.days.map((day, dIdx) => (
                    <span
                      key={dIdx}
                      onMouseEnter={() => !day.future && setHoverText(day.title)}
                      title={day.title}
                      style={{
                        width: '15px',
                        height: '15px',
                        backgroundColor: day.bg,
                        border: day.border,
                        cursor: day.future ? 'default' : 'pointer'
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: '10px', color: 'var(--soft)' }}>적음</span>
          {RAMP.map((c, i) => (
            <span key={i} className="legend-box" style={{ backgroundColor: c }} />
          ))}
          <span style={{ fontSize: '10px', color: 'var(--soft)' }}>많음</span>
        </div>
      </div>

      {/* 4. Milestone Badges */}
      <div className="card streak-milestone-card" style={{ padding: '18px' }}>
        <div className="card-header" style={{ borderBottom: 'none', paddingBottom: '0', marginBottom: '14px' }}>
          <h3>마일스톤 배지</h3>
        </div>
        <div style={{ display: 'flex', gap: '14px' }}>
          {BADGES.map(badge => {
            const isEarned = streak.longest >= badge.days;
            return (
              <div
                key={badge.id}
                style={{
                  flex: 1,
                  border: isEarned ? '2px solid var(--line)' : '2px solid #c3b79b',
                  backgroundColor: isEarned ? 'var(--accent)' : 'var(--panel)',
                  padding: '16px 12px',
                  textAlign: 'center'
                }}
              >
                <div
                  style={{
                    fontSize: '22px',
                    fontFamily: 'var(--font-num)',
                    fontWeight: '700',
                    color: isEarned ? 'var(--paper)' : 'var(--ink)',
                    lineHeight: 1,
                    marginBottom: '8px'
                  }}
                >
                  {badge.name}
                </div>
                <div style={{ fontSize: '11px', color: isEarned ? 'var(--paper)' : 'var(--soft)' }}>
                  {isEarned ? '달성' : '잠김'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
