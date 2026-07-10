import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlannerStore } from '../../stores/plannerStore';
import { getDailyContent } from '../../services/contentService';
import { format, startOfWeek, getDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Area, Weekday, WeeklyPlanItem } from '../../types';

const AREA_LABELS: Record<Area, string> = {
  study: '학습',
  portfolio: '포트폴리오',
  health: '건강·운동',
  serving: '나눔·섬김'
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    profile,
    streak,
    weeklyPlans,
    dailyLogs,
    attendanceRecords,
    updateDailyLog,
    addAttendance,
    updateWeeklyPlanItem
  } = usePlannerStore();

  const isDemo = profile.name === '이지수';
  const todayDate = isDemo ? new Date(2026, 6, 9) : new Date();
  const todayStr = format(todayDate, 'yyyy-MM-dd');
  const dayIdx = getDay(todayDate);
  const weekdayKey = (['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as Weekday[])[dayIdx];

  const dailyLog = dailyLogs.find(l => l.date === todayStr) || { date: todayStr, timeBlocks: [] };
  const dailyContent = getDailyContent(todayStr, profile.mode);

  const [resolution, setResolution] = useState(dailyLog.resolution || '');
  const [prayer, setPrayer] = useState(dailyLog.prayer || '');
  const [isSaved, setIsSaved] = useState(!!(dailyLog.resolution || dailyLog.prayer));

  useEffect(() => {
    setResolution(dailyLog.resolution || '');
    setPrayer(dailyLog.prayer || '');
    setIsSaved(!!(dailyLog.resolution || dailyLog.prayer));
  }, [dailyLog.resolution, dailyLog.prayer]);

  // Navigate to onboarding if profile is empty
  useEffect(() => {
    if (!profile.name) {
      navigate('/onboarding');
    }
  }, [profile.name, navigate]);

  const getWeekStr = (date: Date) => {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const year = format(start, 'yyyy');
    const weekNum = format(start, 'I');
    return `${year}-W${weekNum.padStart(2, '0')}`;
  };
  const currentWeekStr = getWeekStr(todayDate);

  const thisWeekPlans = weeklyPlans.filter(item => item.week === currentWeekStr);
  const todaysPlans = thisWeekPlans.filter(item => item.activeDays.includes(weekdayKey));

  const hasAttendedToday = attendanceRecords.some(r => r.date === todayStr);

  const handleSaveResolution = (e: React.FormEvent) => {
    e.preventDefault();
    const updates: any = {};
    if (profile.mode === 'faith') {
      updates.prayer = prayer;
      updates.verse = dailyContent.text;
    }
    updates.resolution = resolution;

    updateDailyLog(todayStr, updates);
    setIsSaved(true);

    addAttendance(todayStr, 'planner');
  };

  const handleCheckToggle = (item: WeeklyPlanItem, day: Weekday, currentCheck: 'O' | '△' | 'X' | undefined) => {
    let nextCheck: 'O' | '△' | 'X' | undefined = undefined;
    if (!currentCheck) nextCheck = 'O';
    else if (currentCheck === 'O') nextCheck = '△';
    else if (currentCheck === '△') nextCheck = 'X';
    else nextCheck = undefined;

    const newChecks = { ...item.checks, [day]: nextCheck };
    updateWeeklyPlanItem(item.id, { checks: newChecks });

    if (day === weekdayKey && nextCheck) {
      addAttendance(todayStr, 'planner');
    }
  };

  // Stats calculation
  const stats = React.useMemo(() => {
    const areaStats: Record<Area, { total: number; score: number }> = {
      study: { total: 0, score: 0 },
      portfolio: { total: 0, score: 0 },
      health: { total: 0, score: 0 },
      serving: { total: 0, score: 0 }
    };

    let totalActiveTasks = 0;
    let totalScore = 0;

    thisWeekPlans.forEach(item => {
      item.activeDays.forEach(day => {
        totalActiveTasks++;
        const check = item.checks[day];
        let val = 0;
        if (check === 'O') val = 1;
        else if (check === '△') val = 0.5;
        
        totalScore += val;
        areaStats[item.area].total++;
        areaStats[item.area].score += val;
      });
    });

    const completionRate = totalActiveTasks > 0 ? Math.round((totalScore / totalActiveTasks) * 100) : 0;

    const areaPercentages = (Object.keys(areaStats) as Area[]).reduce((acc, key) => {
      const s = areaStats[key];
      acc[key] = s.total > 0 ? Math.round((s.score / s.total) * 100) : 0;
      return acc;
    }, {} as Record<Area, number>);

    return {
      completionRate,
      areaPercentages,
      totalActiveTasks
    };
  }, [thisWeekPlans]);

  // Segment generator for 10-block pixels
  const renderSegments = (percentage: number, onColor: string, offColor: string = 'transparent') => {
    const activeBlocks = Math.round(percentage / 10);
    return Array.from({ length: 10 }, (_, i) => (
      <span
        key={i}
        className="progress-segment"
        style={{
          backgroundColor: i < activeBlocks ? onColor : offColor,
          borderColor: 'var(--line)'
        }}
      />
    ));
  };

  const streakBlocks = Array.from({ length: 14 }, (_, i) => {
    const isActive = i < streak.current;
    return (
      <span
        key={i}
        className="streak-block-dot"
        style={{
          backgroundColor: isActive ? 'var(--accent)' : 'transparent'
        }}
      />
    );
  });

  return (
    <div className="dashboard-container">
      {/* 1. Header (Date + Streak) */}
      <div className="dashboard-welcome">
        <div className="welcome-info">
          <div className="text-secondary text-xs" style={{ letterSpacing: '0.1em', marginBottom: '6px' }}>
            EDUZINE PLANNER / {profile.mode === 'faith' ? '신앙 모드' : '일반 모드'}
          </div>
          <h1>{format(todayDate, 'yyyy. MM. dd', { locale: ko })} <span style={{ color: 'var(--accent)' }}>{format(todayDate, 'EEEE', { locale: ko })}</span></h1>
        </div>

        {/* Streak card (Ink on Paper Style) */}
        <div className="streak-badge-container" onClick={() => navigate('/attendance')}>
          <div className="streak-details">
            <span className="streak-label">연속 출석</span>
            <span className="streak-best">최고 {streak.longest}일</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '10px' }}>
            <span className="streak-count">{streak.current}</span>
            <span style={{ fontSize: '13px', color: 'var(--ink)' }}>일째</span>
          </div>
          <div className="streak-blocks-row">
            {streakBlocks}
          </div>
          <div
            className="streak-message"
            style={{
              color: hasAttendedToday ? 'var(--accent)' : 'var(--soft)'
            }}
          >
            {hasAttendedToday ? '오늘 출석 완료! 🔥' : '다짐을 쓰거나 할 일 1개를 점검하면 출석'}
          </div>
        </div>
      </div>

      {/* 2. Body Grid */}
      <div className="dashboard-grid">
        {/* Left Column */}
        <div className="dashboard-left">
          {/* Quote */}
          <div className="card quote-card">
            <div className="card-header">
              <h3>{profile.mode === 'faith' ? '오늘의 FOC 말씀' : '오늘의 새김글'}</h3>
            </div>
            <div className="card-body">
              <blockquote className="quote-text">"{dailyContent.text}"</blockquote>
              <cite className="quote-author">— {dailyContent.author}</cite>
            </div>
          </div>

          {/* Resolutions & Prayers */}
          <div className="card resolution-card">
            <div className="card-header">
              <h3>
                {profile.mode === 'faith' ? '꿈을 그리는 기도 / 다짐' : '오늘의 다짐'}
              </h3>
              <span className="date-display">{hasAttendedToday ? '출석 완료' : '쓰면 출석 완료'}</span>
            </div>
            <form onSubmit={handleSaveResolution} className="card-body">
              {profile.mode === 'faith' ? (
                <>
                  <div className="form-group mb-12">
                    <label htmlFor="prayer-input">나의 기도</label>
                    <textarea
                      id="prayer-input"
                      rows={2}
                      placeholder="오늘 하루의 기도 제목을 작성해 보세요."
                      value={prayer}
                      onChange={(e) => {
                        setPrayer(e.target.value);
                        setIsSaved(false);
                      }}
                      disabled={isSaved}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="resolution-input">실행을 위한 다짐</label>
                    <input
                      id="resolution-input"
                      type="text"
                      placeholder="실행 다짐을 한 줄 입력하세요."
                      value={resolution}
                      onChange={(e) => {
                        setResolution(e.target.value);
                        setIsSaved(false);
                      }}
                      disabled={isSaved}
                      required
                    />
                  </div>
                </>
              ) : (
                <div className="form-group">
                  <textarea
                    placeholder="오늘 하루의 다짐을 한 줄 적어보세요..."
                    value={resolution}
                    onChange={(e) => {
                      setResolution(e.target.value);
                      setIsSaved(false);
                    }}
                    disabled={isSaved}
                    required
                  />
                </div>
              )}
              
              {!isSaved ? (
                <button type="submit" className="btn btn-primary w-full">
                  다짐하고 오늘 출석하기
                </button>
              ) : (
                <div className="attendance-stamp">
                  <span>다짐이 기록되었습니다. 출석 체크 완료!</span>
                  <button type="button" onClick={() => setIsSaved(false)} className="btn-edit-inline">수정</button>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Right Column */}
        <div className="dashboard-right">
          {/* Today's Tasks */}
          <div className="card todays-tasks-card">
            <div className="card-header">
              <h3>오늘 할 일</h3>
              <span className="text-secondary text-xs">주간 계획에서 · 탭하여 ○△✕</span>
            </div>
            <div className="card-body">
              {todaysPlans.length === 0 ? (
                <div className="empty-state">
                  <p>오늘 계획된 할 일이 없습니다.</p>
                  <p className="sub">주간 플래너에서 요일 실천 계획을 추가해 보세요!</p>
                  <button onClick={() => navigate(`/weekly/${currentWeekStr}`)} className="btn btn-sm btn-outline mt-12">계획 세우러 가기</button>
                </div>
              ) : (
                <div className="todays-plan-list">
                  {todaysPlans.map(item => {
                    const checkState = item.checks[weekdayKey];
                    return (
                      <div key={item.id} className="task-check-row">
                        <button
                          onClick={() => handleCheckToggle(item, weekdayKey, checkState)}
                          className={`btn-check-icon state-${checkState || 'none'}`}
                          title="점검 변경 (O -> △ -> X -> 취소)"
                        >
                          {checkState === 'O' && '○'}
                          {checkState === '△' && '△'}
                          {checkState === 'X' && '✕'}
                          {!checkState && ''}
                        </button>
                        <div className="task-info">
                          <span className="area-badge">
                            {AREA_LABELS[item.area]}
                          </span>
                          <span className="task-content">{item.content}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Grid: Progress & Balance */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '18px', marginTop: '18px' }}>
        {/* Weekly Completion Bar */}
        <div className="card progress-card">
          <div className="flex-between mb-12">
            <span className="font-mono text-secondary" style={{ fontSize: '12px' }}>오늘 달성률</span>
            <span className="stat-percentage">{stats.completionRate}%</span>
          </div>
          <div className="progress-track">
            {renderSegments(stats.completionRate, 'var(--accent)')}
          </div>
          <p className="text-secondary text-xs mt-12">△ 는 0.5로 집계</p>
        </div>

        {/* 4 Areas Balanced Growth as Horizontal Segments */}
        <div className="card balance-card">
          <div className="card-header">
            <h3>4영역 균형 · 이번 주</h3>
          </div>
          <div className="card-body">
            {(Object.keys(AREA_LABELS) as Area[]).map(area => (
              <div key={area} className="balance-row">
                <span className="balance-label">{AREA_LABELS[area]}</span>
                <div className="balance-track">
                  {renderSegments(stats.areaPercentages[area], 'var(--accent)')}
                </div>
                <span className="balance-pct">{stats.areaPercentages[area]}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
