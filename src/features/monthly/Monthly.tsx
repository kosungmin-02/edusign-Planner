import React, { useState } from 'react';
import { usePlannerStore } from '../../stores/plannerStore';
import type { Area } from '../../types';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameDay,
  getDay,
  startOfWeek,
  endOfWeek,
  isSameMonth
} from 'date-fns';
import { Sparkles } from 'lucide-react';

const AREA_LABELS: Record<Area, string> = {
  study: '학습',
  portfolio: '포트폴리오',
  health: '건강·운동',
  serving: '나눔·섬김'
};

export const Monthly: React.FC = () => {
  const {
    profile,
    qProfile,
    linkQProfile,
    unlinkQProfile,
    getYearGoals,
    updateYearGoals,
    getMonthlyPlan,
    updateMonthlyPlan,
    attendanceRecords
  } = usePlannerStore();

  const isDemo = profile.name === '이지수';
  const [currentDate, setCurrentDate] = useState(isDemo ? new Date(2026, 6, 9) : new Date());
  const monthStr = format(currentDate, 'yyyy-MM');
  const yearNum = currentDate.getFullYear();

  const yearGoals = getYearGoals(yearNum);
  const monthlyPlan = getMonthlyPlan(monthStr);

  const [mission, setMission] = useState(profile.qLinked ? qProfile.missionStatement || '' : '');
  const [jobs, setJobs] = useState(profile.qLinked ? qProfile.futureJobs?.join(', ') || '' : '');
  const [school, setSchool] = useState(profile.qLinked ? qProfile.majorsSchools?.join(', ') || '' : '');

  const [editingGoals, setEditingGoals] = useState({ ...yearGoals.goals });
  const [editingPlans, setEditingPlans] = useState({ ...monthlyPlan.plans });
  const [isEditingBoard, setIsEditingBoard] = useState(false);

  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [memoText, setMemoText] = useState('');

  // Sync edits
  React.useEffect(() => {
    setEditingGoals({ ...yearGoals.goals });
    setEditingPlans({ ...monthlyPlan.plans });
    if (profile.qLinked) {
      setMission(qProfile.missionStatement || '');
      setJobs(qProfile.futureJobs?.join(', ') || '');
      setSchool(qProfile.majorsSchools?.join(', ') || '');
    }
  }, [monthStr, yearNum, JSON.stringify(yearGoals.goals), JSON.stringify(monthlyPlan.plans), profile.qLinked]);

  const handleQSyncToggle = () => {
    if (profile.qLinked) {
      unlinkQProfile();
      setMission('');
      setJobs('');
      setSchool('');
    } else {
      linkQProfile();
    }
  };

  const handleSaveBoard = () => {
    updateYearGoals(yearNum, editingGoals);
    updateMonthlyPlan(monthStr, editingPlans, {});
    setIsEditingBoard(false);
  };

  // Calendar setup (match design document layout)
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  
  // Standard date-fns logic for calendar grid (Monday start)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    setSelectedDateStr(dateStr);
    setMemoText(monthlyPlan.calendarMemos[dateStr] || '');
  };

  const handleSaveMemo = () => {
    if (!selectedDateStr) return;
    const updatedMemos = { ...monthlyPlan.calendarMemos, [selectedDateStr]: memoText };
    updateMonthlyPlan(monthStr, monthlyPlan.plans, updatedMemos);
    setSelectedDateStr(null);
  };

  return (
    <div className="monthly-container">
      {/* 1. Header Navigation */}
      <div className="card flex-between" style={{ padding: '18px 24px', marginBottom: '0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="btn-icon">
            ◀
          </button>
          <div style={{ fontStyle: 'normal', fontSize: '26px', fontFamily: 'var(--font-num)', fontWeight: '700' }}>
            {format(currentDate, 'yyyy')} · <span style={{ color: 'var(--accent)' }}>{format(currentDate, 'M월')}</span> {format(currentDate, 'MMMM')}
          </div>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="btn-icon">
            ▶
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleQSyncToggle}
            className={`btn btn-sm ${profile.qLinked ? 'btn-primary' : 'btn-outline'}`}
            style={{ display: 'flex', gap: '6px', alignItems: 'center' }}
          >
            <Sparkles size={12} />
            <span>{profile.qLinked ? 'Q 연동 완료' : 'Q에서 가져오기'}</span>
          </button>
          <span style={{ fontSize: '11px', color: 'var(--soft)', border: '1px solid var(--line)', padding: '3px 8px' }}>
            {profile.qLinked ? 'Q 연동형' : 'Q 미연동 · 직접 입력'}
          </span>
          <span style={{ fontSize: '14px', color: 'var(--ink)' }}>{profile.grade || '중학교 3학년'}</span>
        </div>
      </div>

      {/* 2. Top Section: My Goals (Vision Board) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '14px' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="goal-label" style={{ marginBottom: '10px' }}>나의 목표 (사명문)</div>
          <div className="goal-box" style={{ flex: 1 }}>
            <textarea
              value={mission}
              onChange={(e) => setMission(e.target.value)}
              placeholder="내 인생의 목표를 적거나 Q 연동을 진행해 보세요."
              disabled={profile.qLinked}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="card" style={{ flex: 1, padding: '14px' }}>
            <div className="goal-label" style={{ marginBottom: '8px' }}>장래 직업 / 봉사</div>
            <input
              type="text"
              value={jobs}
              onChange={(e) => setJobs(e.target.value)}
              placeholder="장래 직업이나 봉사 계획..."
              disabled={profile.qLinked}
              style={{ width: '100%', height: '40px' }}
            />
          </div>

          <div className="card" style={{ flex: 1, padding: '14px' }}>
            <div className="goal-label" style={{ marginBottom: '8px' }}>장래 전공 / 학교</div>
            <input
              type="text"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="목표 대학교 혹은 전공 학과..."
              disabled={profile.qLinked}
              style={{ width: '100%', height: '40px' }}
            />
          </div>
        </div>
      </div>

      {/* 3. 4 Areas Goals/Plans Table */}
      <div className="card goals-table-card">
        <div className="card-header flex-between">
          <h3>4대 영역 목표 보드</h3>
          {!isEditingBoard ? (
            <button onClick={() => setIsEditingBoard(true)} className="btn btn-outline btn-sm">
              목표 수정
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleSaveBoard} className="btn btn-primary btn-sm">저장</button>
              <button onClick={() => setIsEditingBoard(false)} className="btn btn-outline btn-sm">취소</button>
            </div>
          )}
        </div>
        <table className="goals-table">
          <thead>
            <tr>
              <th className="col-area">항 목</th>
              <th className="col-year-goal">올해의 목표</th>
              <th className="col-month-plan">이 달의 계획</th>
            </tr>
          </thead>
          <tbody>
            {(Object.keys(AREA_LABELS) as Area[]).map((area) => (
              <tr key={area}>
                <td className="cell-area">
                  {AREA_LABELS[area]}
                </td>
                <td className="cell-content">
                  <input
                    type="text"
                    value={editingGoals[area] || ''}
                    onChange={(e) => setEditingGoals({ ...editingGoals, [area]: e.target.value })}
                    disabled={!isEditingBoard}
                    placeholder="목표를 작성해보세요."
                  />
                </td>
                <td className="cell-content">
                  <input
                    type="text"
                    value={editingPlans[area] || ''}
                    onChange={(e) => setEditingPlans({ ...editingPlans, [area]: e.target.value })}
                    disabled={!isEditingBoard}
                    placeholder="계획을 수립해보세요."
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 4. Monthly Calendar */}
      <div className="card calendar-card">
        <div className="card-header flex-between" style={{ borderBottom: 'none' }}>
          <h3>월간 일정 및 출석</h3>
          <span className="text-secondary text-xs">날짜 칸을 누르면 메모 등록 · ⭕️는 출석 도장</span>
        </div>
        
        <div className="calendar-grid">
          {/* Weekday Headers starting Monday */}
          {['월', '화', '수', '목', '금', '토', '일'].map((day) => (
            <div key={day} className="calendar-header-cell">{day}</div>
          ))}

          {/* Actual days (including outside month) */}
          {calendarDays.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const memo = monthlyPlan.calendarMemos[dateStr];
            const isToday = isSameDay(day, isDemo ? new Date(2026, 6, 9) : new Date());
            const isCurrentMonth = isSameMonth(day, monthStart);
            const attendance = attendanceRecords.find(r => r.date === dateStr);
            const wdIdx = getDay(day); // 0: Sun, 6: Sat

            let numColor = 'var(--ink)';
            if (isToday) numColor = 'var(--accent)';
            else if (wdIdx === 0) numColor = 'var(--color-error)'; // Sunday
            else if (wdIdx === 6) numColor = 'var(--color-info)';  // Saturday

            return (
              <div
                key={dateStr}
                onClick={() => handleDateClick(day)}
                className={`calendar-day-cell ${isToday ? 'today' : ''} ${!isCurrentMonth ? 'outside-month' : ''}`}
              >
                <div className="day-header">
                  <span className="day-number" style={{ color: numColor }}>{format(day, 'd')}</span>
                  {attendance && (
                    <span className="attendance-stamp-dot" title={`출석: ${attendance.source}`} />
                  )}
                </div>
                <div className="day-memo-preview">
                  {memo && <span className="memo-dot">{memo}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mini Edit Memo Modal Overlay */}
      {selectedDateStr && (
        <div className="modal-backdrop">
          <div className="modal-content card max-w-sm animate-scale-up">
            <div className="modal-header">
              <h3>{selectedDateStr} 일정 메모 등록</h3>
            </div>
            <div className="modal-body">
              <textarea
                placeholder="일정 또는 회고를 등록하세요."
                rows={3}
                value={memoText}
                onChange={(e) => setMemoText(e.target.value)}
              />
            </div>
            <div className="modal-footer">
              <button onClick={handleSaveMemo} className="btn btn-primary">저장</button>
              <button onClick={() => setSelectedDateStr(null)} className="btn btn-outline">취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
