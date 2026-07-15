import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePlannerStore } from '../../stores/plannerStore';
import type { Area, Weekday, WeeklyPlanItem } from '../../types';
import {
  format,
  startOfWeek,
  addDays,
  subWeeks,
  addWeeks
} from 'date-fns';
import { Trash2 } from 'lucide-react';

const WEEKDAYS_WD: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri'];
const WEEKDAYS_WE: Weekday[] = ['sat', 'sun'];

const WEEKDAY_NAMES: Record<Weekday, string> = {
  mon: '월',
  tue: '화',
  wed: '수',
  thu: '목',
  fri: '금',
  sat: '토',
  sun: '일'
};

const AREA_LABELS: Record<Area, string> = {
  study: '학습',
  portfolio: '포트폴리오',
  health: '건강·운동',
  serving: '나눔·섬김'
};

export const Weekly: React.FC = () => {
  const navigate = useNavigate();
  const { yyyyWww } = useParams<{ yyyyWww?: string }>();
  const {
    weeklyPlans,
    addWeeklyPlanItem,
    updateWeeklyPlanItem,
    deleteWeeklyPlanItem,
    addAttendance
  } = usePlannerStore();

  const [activeTab, setActiveTab] = useState<'weekday' | 'weekend'>('weekday');

  const getBaseDate = (): Date => {
    if (yyyyWww) {
      const parts = yyyyWww.split('-W');
      if (parts.length === 2) {
        const year = parseInt(parts[0], 10);
        const week = parseInt(parts[1], 10);
        const jan4 = new Date(year, 0, 4);
        const startOfJan4Week = startOfWeek(jan4, { weekStartsOn: 1 });
        return addWeeks(startOfJan4Week, week - 1);
      }
    }
    return new Date();
  };

  const [currentDate, setCurrentDate] = useState(getBaseDate());

  const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
  const year = format(start, 'yyyy');
  const weekNum = format(start, 'I');
  const weekStr = `${year}-W${weekNum.padStart(2, '0')}`;

  const thisWeekPlans = weeklyPlans.filter(item => item.week === weekStr);

  // States for new item form
  const [newContent, setNewContent] = useState('');
  const [newArea, setNewArea] = useState<Area>('study');
  const [newActiveDays, setNewActiveDays] = useState<Weekday[]>(['mon', 'wed', 'fri']);

  const handlePrevWeek = () => {
    const prev = subWeeks(currentDate, 1);
    setCurrentDate(prev);
    navigate(`/weekly/${formatStr(prev)}`);
  };

  const handleNextWeek = () => {
    const next = addWeeks(currentDate, 1);
    setCurrentDate(next);
    navigate(`/weekly/${formatStr(next)}`);
  };

  const formatStr = (d: Date) => {
    const s = startOfWeek(d, { weekStartsOn: 1 });
    const y = format(s, 'yyyy');
    const w = format(s, 'I');
    return `${y}-W${w.padStart(2, '0')}`;
  };

  const toggleDayInNewActive = (day: Weekday) => {
    if (newActiveDays.includes(day)) {
      setNewActiveDays(newActiveDays.filter(d => d !== day));
    } else {
      setNewActiveDays([...newActiveDays, day]);
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    // Auto assign active days based on selected tab if not touched
    const targetDays: Weekday[] = newActiveDays.length > 0 
      ? newActiveDays 
      : (activeTab === 'weekday' ? (['mon', 'wed', 'fri'] as Weekday[]) : (['sat', 'sun'] as Weekday[]));

    addWeeklyPlanItem(weekStr, newArea, newContent.trim(), targetDays);
    setNewContent('');
    setNewActiveDays(activeTab === 'weekday' ? (['mon', 'wed', 'fri'] as Weekday[]) : (['sat', 'sun'] as Weekday[]));
  };

  const handleCheckToggle = (item: WeeklyPlanItem, day: Weekday, currentCheck: 'O' | '△' | 'X' | undefined) => {
    let nextCheck: 'O' | '△' | 'X' | undefined = undefined;
    if (!currentCheck) nextCheck = 'O';
    else if (currentCheck === 'O') nextCheck = '△';
    else if (currentCheck === '△') nextCheck = 'X';
    else nextCheck = undefined;

    const newChecks = { ...item.checks, [day]: nextCheck };
    updateWeeklyPlanItem(item.id, { checks: newChecks });

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todayIdx = new Date().getDay();
    const todayKey = (['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as Weekday[])[todayIdx];
    
    if (day === todayKey && nextCheck) {
      addAttendance(todayStr, 'planner');
    }
  };

  // Group plans by area
  const getGroupedPlans = (daysSubset: Weekday[]) => {
    const plansWithActiveSubset = thisWeekPlans.filter(item =>
      item.activeDays.some(day => daysSubset.includes(day))
    );

    return (Object.keys(AREA_LABELS) as Area[]).map(area => {
      const items = plansWithActiveSubset.filter(item => item.area === area);
      return {
        area,
        items
      };
    }).filter(g => g.items.length > 0);
  };

  // Calculate ratio for each item (e.g. "2/3")
  const getItemRatio = (item: WeeklyPlanItem, daysSubset: Weekday[]) => {
    let activeCount = 0;
    let checkedCount = 0;
    daysSubset.forEach(day => {
      if (item.activeDays.includes(day)) {
        activeCount++;
        if (item.checks[day] === 'O') {
          checkedCount++;
        }
      }
    });
    return `${checkedCount}/${activeCount}`;
  };

  const activeDaysSubset = activeTab === 'weekday' ? WEEKDAYS_WD : WEEKDAYS_WE;
  const groupedPlans = getGroupedPlans(activeDaysSubset);

  return (
    <div className="weekly-container">
      {/* 1. Navigation Header */}
      <div className="card weekly-header-card flex-between" style={{ borderBottom: '3px solid var(--line)' }}>
        <div className="nav-week">
          <button onClick={handlePrevWeek} className="btn-icon">
            ◀
          </button>
          <div style={{ fontSize: '24px', fontFamily: 'var(--font-num)', fontWeight: '700' }}>
            주간 계획 <span style={{ color: 'var(--accent)' }}>{year}년 {format(start, 'M월')} {parseInt(weekNum, 10)}주차</span>
          </div>
          <button onClick={handleNextWeek} className="btn-icon">
            ▶
          </button>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => {
              setActiveTab('weekday');
              setNewActiveDays(['mon', 'wed', 'fri']);
            }}
            className={`btn btn-sm ${activeTab === 'weekday' ? 'btn-primary' : 'btn-outline'}`}
          >
            주중형 (월~금)
          </button>
          <button
            onClick={() => {
              setActiveTab('weekend');
              setNewActiveDays(['sat', 'sun']);
            }}
            className={`btn btn-sm ${activeTab === 'weekend' ? 'btn-primary' : 'btn-outline'}`}
          >
            주말형 (토·일)
          </button>
        </div>
      </div>

      {/* 2. Add form */}
      <div className="card add-weekly-card no-print">
        <div className="card-header">
          <h3>새 실천 항목 추가 ({activeTab === 'weekday' ? '주중' : '주말'})</h3>
        </div>
        <form onSubmit={handleAddItem} className="card-body weekly-form">
          <div className="form-row">
            <div className="form-group flex-1">
              <label htmlFor="plan-content">실천 목표</label>
              <input
                id="plan-content"
                type="text"
                placeholder={activeTab === 'weekday' ? "예: 영어 단어 30개 암기, 개념서 풀이" : "예: 복싱장 가기, 동아리 연습"}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="plan-area">영역</label>
              <select
                id="plan-area"
                value={newArea}
                onChange={(e) => setNewArea(e.target.value as Area)}
              >
                {Object.keys(AREA_LABELS).map(a => (
                  <option key={a} value={a}>{AREA_LABELS[a as Area]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>실천 요일</label>
            <div className="days-picker-group">
              {activeDaysSubset.map(day => {
                const isActive = newActiveDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDayInNewActive(day)}
                    className={`day-picker-btn ${isActive ? 'active' : ''}`}
                  >
                    {WEEKDAY_NAMES[day]}
                  </button>
                );
              })}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '16px' }}>
            + 계획 추가
          </button>
        </form>
      </div>

      {/* 3. Weekly Matrix Table */}
      <div className="card weekly-matrix-card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h3>{activeTab === 'weekday' ? '주중 실천 및 점검 매트릭스' : '주말 실천 및 점검 매트릭스'}</h3>
          <span className="text-secondary text-xs">셀을 탭하면 ○ → △ → ✕ 순환 · 요일 헤더 클릭 시 일일 페이지 이동</span>
        </div>
        
        {activeTab === 'weekday' ? (
          /* WEEKDAY MATRIX (300px 70px repeat(5, 1fr)) */
          <table className="matrix-table" style={{ width: '100%' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--panel)' }}>
                <th style={{ width: '300px', padding: '10px 12px', fontSize: '12px', color: 'var(--soft)', borderRight: '2px solid var(--line)' }}>영역 · 주간 계획</th>
                <th style={{ width: '70px', padding: '10px', fontSize: '12px', color: 'var(--soft)', borderRight: '2px solid var(--line)', textAlign: 'center' }}>점검</th>
                {WEEKDAYS_WD.map((day, idx) => {
                  const dayDate = addDays(start, idx);
                  const dayStr = format(dayDate, 'yyyy-MM-dd');
                  return (
                    <th
                      key={day}
                      onClick={() => navigate(`/daily/${dayStr}`)}
                      style={{ textAlign: 'center', cursor: 'pointer', borderRight: '1px solid var(--line)' }}
                    >
                      <div className="day-header-clickable">
                        <span className="day-name">{WEEKDAY_NAMES[day]}</span>
                        <span className="day-date">{format(dayDate, 'M/d')}</span>
                      </div>
                    </th>
                  );
                })}
                <th style={{ width: '60px', textAlign: 'center' }} className="no-print">삭제</th>
              </tr>
            </thead>
            <tbody>
              {groupedPlans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="matrix-empty">등록된 주중 실천 항목이 없습니다.</td>
                </tr>
              ) : (
                groupedPlans.map(g => (
                  <React.Fragment key={g.area}>
                    {/* Area Header Row */}
                    <tr style={{ background: 'var(--bg-header)' }}>
                      <td colSpan={8} style={{ padding: '7px 12px', fontWeight: '600', fontSize: '13px', borderBottom: '1px solid var(--line)' }}>
                        <span style={{ width: '9px', height: '9px', backgroundColor: 'var(--accent)', display: 'inline-block', marginRight: '8px' }}></span>
                        {AREA_LABELS[g.area]}
                      </td>
                    </tr>
                    {/* Items */}
                    {g.items.map(item => (
                      <tr key={item.id} style={{ background: 'var(--panel)' }}>
                        <td style={{ padding: '11px 12px', fontSize: '14px', borderRight: '2px solid var(--line)' }}>{item.content}</td>
                        <td style={{ padding: '11px', textAlign: 'center', fontSize: '12px', color: 'var(--soft)', borderRight: '2px solid var(--line)' }}>
                          {getItemRatio(item, WEEKDAYS_WD)}
                        </td>
                        {WEEKDAYS_WD.map((day) => {
                          const isActive = item.activeDays.includes(day);
                          const checkVal = item.checks[day];
                          return (
                            <td
                              key={day}
                              className={`matrix-cell ${isActive ? 'active' : 'inactive'}`}
                            >
                              {isActive ? (
                                <button
                                  onClick={() => handleCheckToggle(item, day, checkVal)}
                                  className={`btn-matrix-check state-${checkVal || 'none'}`}
                                >
                                  {checkVal === 'O' && '○'}
                                  {checkVal === '△' && '△'}
                                  {checkVal === 'X' && '✕'}
                                  {!checkVal && '·'}
                                </button>
                              ) : null}
                            </td>
                          );
                        })}
                        <td style={{ textAlign: 'center' }} className="no-print">
                          <button onClick={() => deleteWeeklyPlanItem(item.id)} className="btn-delete">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        ) : (
          /* WEEKEND MATRIX (430px 1fr 1fr) */
          <table className="matrix-table" style={{ width: '100%' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--panel)' }}>
                <th style={{ width: '430px', padding: '10px 12px', fontSize: '12px', color: 'var(--soft)', borderRight: '2px solid var(--line)' }}>영역 · 주말 계획</th>
                <th style={{ width: '70px', padding: '10px', fontSize: '12px', color: 'var(--soft)', borderRight: '2px solid var(--line)', textAlign: 'center' }}>점검</th>
                {WEEKDAYS_WE.map((day, idx) => {
                  const dayDate = addDays(start, idx + 5); // Saturday & Sunday are indices 5 and 6
                  const dayStr = format(dayDate, 'yyyy-MM-dd');
                  return (
                    <th
                      key={day}
                      onClick={() => navigate(`/daily/${dayStr}`)}
                      style={{ textAlign: 'center', cursor: 'pointer', borderRight: '1px solid var(--line)' }}
                    >
                      <div className="day-header-clickable">
                        <span className="day-name">{WEEKDAY_NAMES[day]}</span>
                        <span className="day-date">{format(dayDate, 'M/d')}</span>
                      </div>
                    </th>
                  );
                })}
                <th style={{ width: '60px', textAlign: 'center' }} className="no-print">삭제</th>
              </tr>
            </thead>
            <tbody>
              {groupedPlans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="matrix-empty">등록된 주말 실천 항목이 없습니다.</td>
                </tr>
              ) : (
                groupedPlans.map(g => (
                  <React.Fragment key={g.area}>
                    {/* Area Header Row */}
                    <tr style={{ background: 'var(--bg-header)' }}>
                      <td colSpan={5} style={{ padding: '7px 12px', fontWeight: '600', fontSize: '13px', borderBottom: '1px solid var(--line)' }}>
                        <span style={{ width: '9px', height: '9px', backgroundColor: 'var(--accent)', display: 'inline-block', marginRight: '8px' }}></span>
                        {AREA_LABELS[g.area]}
                      </td>
                    </tr>
                    {/* Items */}
                    {g.items.map(item => (
                      <tr key={item.id} style={{ background: 'var(--panel)' }}>
                        <td style={{ padding: '11px 12px', fontSize: '14px', borderRight: '2px solid var(--line)' }}>{item.content}</td>
                        <td style={{ padding: '11px', textAlign: 'center', fontSize: '12px', color: 'var(--soft)', borderRight: '2px solid var(--line)' }}>
                          {getItemRatio(item, WEEKDAYS_WE)}
                        </td>
                        {WEEKDAYS_WE.map((day) => {
                          const isActive = item.activeDays.includes(day);
                          const checkVal = item.checks[day];
                          return (
                            <td
                              key={day}
                              className={`matrix-cell ${isActive ? 'active' : 'inactive'}`}
                            >
                              {isActive ? (
                                <button
                                  onClick={() => handleCheckToggle(item, day, checkVal)}
                                  className={`btn-matrix-check state-${checkVal || 'none'}`}
                                >
                                  {checkVal === 'O' && '○'}
                                  {checkVal === '△' && '△'}
                                  {checkVal === 'X' && '✕'}
                                  {!checkVal && '·'}
                                </button>
                              ) : null}
                            </td>
                          );
                        })}
                        <td style={{ textAlign: 'center' }} className="no-print">
                          <button onClick={() => deleteWeeklyPlanItem(item.id)} className="btn-delete">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
