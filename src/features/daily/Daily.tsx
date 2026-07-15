import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlannerStore } from '../../stores/plannerStore';
import { getDailyContent } from '../../services/contentService';
import type { DailyLog } from '../../types';
import { format, parseISO, addDays, subDays, getDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Trash2 } from 'lucide-react';

export const Daily: React.FC = () => {
  const { date } = useParams<{ date?: string }>();
  const navigate = useNavigate();
  const { profile, dailyLogs, updateDailyLog, addAttendance } = usePlannerStore();

  const defaultDateStr = format(new Date(), 'yyyy-MM-dd');
  const dateStr = date || defaultDateStr;

  const currentParsedDate = parseISO(dateStr);
  const dayOfWeek = getDay(currentParsedDate); // 0 = Sun, 6 = Sat
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const dailyLog = dailyLogs.find(l => l.date === dateStr) || { date: dateStr, timeBlocks: [] };
  const dailyContent = getDailyContent(dateStr, profile.mode);

  const [resolution, setResolution] = useState('');
  const [prayer, setPrayer] = useState('');
  const [memo, setMemo] = useState('');

  useEffect(() => {
    setResolution(dailyLog.resolution || '');
    setPrayer(dailyLog.prayer || '');
    setMemo(dailyLog.memo || '');
  }, [dateStr, dailyLog.resolution, dailyLog.prayer, dailyLog.memo]);

  const handlePrevDay = () => {
    const prev = subDays(currentParsedDate, 1);
    navigate(`/daily/${format(prev, 'yyyy-MM-dd')}`);
  };

  const handleNextDay = () => {
    const next = addDays(currentParsedDate, 1);
    navigate(`/daily/${format(next, 'yyyy-MM-dd')}`);
  };

  const handleSaveField = (field: keyof DailyLog, value: any) => {
    const updates: Partial<DailyLog> = { [field]: value };
    if (profile.mode === 'faith') {
      updates.verse = dailyContent.text;
    }
    updateDailyLog(dateStr, updates);

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    if (dateStr === todayStr && (field === 'resolution' || field === 'prayer') && value) {
      addAttendance(dateStr, 'planner');
    }
  };

  // Subjects
  const [newSubj, setNewSubj] = useState('');
  const [newNote, setNewNote] = useState('');

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubj.trim()) return;
    const list = dailyLog.subjects || [];
    const updated = [...list, { subject: newSubj.trim(), notes: newNote.trim() }];
    updateDailyLog(dateStr, { subjects: updated });
    setNewSubj('');
    setNewNote('');
    
    // Auto attendance
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    if (dateStr === todayStr) addAttendance(dateStr, 'planner');
  };

  const handleDeleteSubject = (idx: number) => {
    const list = dailyLog.subjects || [];
    updateDailyLog(dateStr, { subjects: list.filter((_, i) => i !== idx) });
  };

  // Time blocks
  const [newTime, setNewTime] = useState('09:00–10:00');
  const [newPlan, setNewPlan] = useState('');

  const handleAddTimeBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlan.trim()) return;
    const list = dailyLog.timeBlocks || [];
    // Standard mock done flag is false by default
    const updated = [...list, { start: newTime.split('–')[0] || '09:00', end: newTime.split('–')[1] || '10:00', plan: newPlan.trim(), done: false } as any];
    updateDailyLog(dateStr, { timeBlocks: updated });
    setNewPlan('');

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    if (dateStr === todayStr) addAttendance(dateStr, 'planner');
  };

  const handleToggleBlockDone = (idx: number) => {
    const list = dailyLog.timeBlocks || [];
    const updated = list.map((b, i) => i === idx ? { ...b, done: !(b as any).done } : b);
    updateDailyLog(dateStr, { timeBlocks: updated });
  };

  const handleDeleteTimeBlock = (idx: number) => {
    const list = dailyLog.timeBlocks || [];
    updateDailyLog(dateStr, { timeBlocks: list.filter((_, i) => i !== idx) });
  };

  return (
    <div className="daily-container">
      {/* 1. Date Header */}
      <div className="card daily-header-card flex-between">
        <div className="nav-date">
          <button onClick={handlePrevDay} className="btn-icon">◀</button>
          <h2 style={{ display: 'inline', margin: '0 16px', fontFamily: 'var(--font-num)' }}>
            {format(currentParsedDate, 'M월 d일', { locale: ko })}{' '}
            <span style={{ color: 'var(--accent)' }}>({format(currentParsedDate, 'EEEEEE', { locale: ko })})</span>
          </h2>
          <button onClick={handleNextDay} className="btn-icon">▶</button>
        </div>
        <div className="day-type-badge">
          {isWeekend ? '주말형' : '주중형'}
        </div>
      </div>

      {/* 2. Affirmations / Quote */}
      <div className="card" style={{ padding: '14px' }}>
        <div className="text-secondary text-xs" style={{ marginBottom: '8px' }}>오늘의 새김글</div>
        <div style={{ fontSize: '15px', lineHeight: '1.5', marginBottom: '12px' }}>
          “{dailyContent.text}”
        </div>
        <div className="text-secondary text-xs" style={{ textAlign: 'right', marginBottom: '12px' }}>
          — {dailyContent.author}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: '12px', color: 'var(--soft)', fontWeight: '600' }}>오늘의 다짐</span>
          <span style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: '500' }}>쓰면 출석 완료</span>
        </div>
        
        {profile.mode === 'faith' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <textarea
              placeholder="꿈을 그리는 기도를 적어보세요..."
              value={prayer}
              onChange={(e) => setPrayer(e.target.value)}
              onBlur={() => handleSaveField('prayer', prayer)}
              style={{ width: '100%', minHeight: '60px', resize: 'none' }}
            />
            <input
              type="text"
              placeholder="실행 다짐을 한 줄 입력하세요..."
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              onBlur={() => handleSaveField('resolution', resolution)}
              style={{ width: '100%', height: '40px' }}
            />
          </div>
        ) : (
          <input
            type="text"
            placeholder="방학 동안 계획한 일 다 이루기..."
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            onBlur={() => handleSaveField('resolution', resolution)}
            style={{ width: '100%', height: '40px' }}
          />
        )}
      </div>

      {/* 3. Subjects list (Weekday only) */}
      {!isWeekend && (
        <div className="card subjects-card">
          <div className="card-header" style={{ borderBottom: 'none', paddingBottom: '0' }}>
            <h3>수업과목 & 주요사항</h3>
          </div>
          <div className="card-body">
            {/* Input list header */}
            <div className="subject-list">
              <div className="subject-header-row">
                <div className="sub-header-cell">수업 과목</div>
                <div className="sub-header-cell">주요 사항</div>
              </div>
              
              {(!dailyLog.subjects || dailyLog.subjects.length === 0) ? (
                <div style={{ padding: '16px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--soft)' }}>
                  등록된 수업 정보가 없습니다. 아래 입력창에서 추가하세요.
                </div>
              ) : (
                dailyLog.subjects.map((sub, idx) => (
                  <div key={idx} className="subject-item-row">
                    <input
                      type="text"
                      className="sub-name-input"
                      value={sub.subject}
                      readOnly
                    />
                    <input
                      type="text"
                      className="sub-notes-input"
                      value={sub.notes}
                      readOnly
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteSubject(idx)}
                      className="btn-delete-sm no-print"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Inline add form */}
            <form onSubmit={handleAddSubject} className="form-inline mt-12 no-print">
              <input
                type="text"
                placeholder="과목"
                value={newSubj}
                onChange={(e) => setNewSubj(e.target.value)}
                style={{ width: '90px' }}
                required
              />
              <input
                type="text"
                placeholder="주요 필기 및 과제"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary btn-square">+</button>
            </form>
          </div>
        </div>
      )}

      {/* 4. Time schedule block list */}
      <div className="card timeplan-card">
        <div className="card-header" style={{ borderBottom: 'none', paddingBottom: '0' }}>
          <h3>{isWeekend ? '토·일 주말 자율 시간표' : '수업 외 시간 계획'}</h3>
        </div>
        <div className="card-body">
          <div className="time-blocks-list">
            <div className="time-block-header-row">
              <div style={{ borderRight: '1px solid var(--line)', width: '38px' }} />
              <div style={{ padding: '8px 10px', fontSize: '0.75rem', color: 'var(--soft)', borderRight: '1px solid var(--line)', width: '108px' }}>시간</div>
              <div style={{ padding: '8px 10px', fontSize: '0.75rem', color: 'var(--soft)' }}>계획</div>
            </div>

            {(!dailyLog.timeBlocks || dailyLog.timeBlocks.length === 0) ? (
              <div style={{ padding: '16px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--soft)' }}>
                설정된 시간표 일정이 없습니다. 아래 양식에서 추가해 보세요.
              </div>
            ) : (
              dailyLog.timeBlocks.map((block: any, idx) => (
                <div key={idx} className="time-block-row">
                  <button
                    type="button"
                    onClick={() => handleToggleBlockDone(idx)}
                    className="btn-block-check"
                    style={{ color: block.done ? 'var(--accent)' : 'var(--ink)', width: '38px' }}
                  >
                    {block.done ? '○' : ''}
                  </button>
                  <div className="block-time" style={{ width: '108px' }}>
                    {block.start}–{block.end}
                  </div>
                  <input
                    type="text"
                    className="block-plan-input"
                    value={block.plan}
                    onChange={(e) => {
                      const updated = dailyLog.timeBlocks.map((b, i) => i === idx ? { ...b, plan: e.target.value } : b);
                      updateDailyLog(dateStr, { timeBlocks: updated });
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteTimeBlock(idx)}
                    className="btn-delete-sm no-print"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add time block inline */}
          <form onSubmit={handleAddTimeBlock} className="form-inline mt-12 no-print">
            <input
              type="text"
              placeholder="예: 09:00–12:00"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              style={{ width: '120px' }}
              required
            />
            <input
              type="text"
              placeholder="일정 내용을 적어주세요"
              value={newPlan}
              onChange={(e) => setNewPlan(e.target.value)}
              style={{ flex: 1 }}
              required
            />
            <button type="submit" className="btn btn-primary btn-square">+</button>
          </form>
        </div>
      </div>

      {/* 5. Memory */}
      <div className="card memo-card">
        <div className="text-secondary text-xs" style={{ marginBottom: '8px' }}>메모 · 하루를 마무리하며</div>
        <textarea
          placeholder="오늘 하루의 성찰이나 일기 등을 자유롭게 적어 보세요..."
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          onBlur={() => handleSaveField('memo', memo)}
          className="memo-textarea"
          style={{ width: '100%', minHeight: '60px', resize: 'none' }}
        />
      </div>
    </div>
  );
};
