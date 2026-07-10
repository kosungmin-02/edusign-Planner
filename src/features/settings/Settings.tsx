import React, { useState } from 'react';
import { usePlannerStore } from '../../stores/plannerStore';

export const Settings: React.FC = () => {
  const {
    profile,
    setProfile,
    linkQProfile,
    unlinkQProfile,
    resetData,
    exportData,
    importData
  } = usePlannerStore();

  const [name, setName] = useState(profile.name || '');
  const [grade, setGrade] = useState(profile.grade || '');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSaveProfile = () => {
    setProfile({
      ...profile,
      name: name.trim(),
      grade: grade.trim()
    });
  };

  const handleModeChange = (mode: 'general' | 'faith') => {
    setProfile({
      ...profile,
      mode
    });
  };

  const handleQSyncToggle = () => {
    if (profile.qLinked) {
      unlinkQProfile();
    } else {
      linkQProfile();
    }
  };

  const handleExport = () => {
    try {
      const dataStr = exportData();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `edusign-planner-backup-${formatDate(new Date())}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setSuccessMsg('플래너 데이터가 JSON 파일로 다운로드되었습니다.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch {
      setErrorMsg('데이터 내보내기에 실패했습니다.');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const success = importData(json);
        if (success) {
          setSuccessMsg('데이터를 성공적으로 불러왔습니다. 플래너가 초기화됩니다.');
          setTimeout(() => window.location.reload(), 1500);
        } else {
          setErrorMsg('유효하지 않은 플래너 백업 파일입니다.');
          setTimeout(() => setErrorMsg(''), 4000);
        }
      } catch {
        setErrorMsg('JSON 형식이 올바르지 않습니다.');
        setTimeout(() => setErrorMsg(''), 4000);
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (window.confirm('🚨 정말 모든 플래너 기록을 지우고 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      resetData();
      window.location.href = '/onboarding';
    }
  };

  const handleAttnRule = (rule: 'use' | 'manual' | 'math') => {
    setProfile({
      ...profile,
      attnRule: rule
    });
  };

  const currentAttn = profile.attnRule || 'use';

  const getSegStyle = (isActive: boolean) => ({
    backgroundColor: isActive ? 'var(--accent)' : 'transparent',
    color: isActive ? 'var(--paper)' : 'var(--ink)'
  });

  return (
    <div className="settings-container card" style={{ width: '720px', padding: '24px', margin: '0 auto' }}>
      <div style={{ fontSize: '24px', fontFamily: 'var(--font-num)', borderBottom: '3px solid var(--line)', paddingBottom: '14px', marginBottom: '18px', fontWeight: '700' }}>
        설정
      </div>

      {successMsg && <div className="alert alert-success">{successMsg}</div>}
      {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

      {/* 1. Profile Grid (1fr 160px) */}
      <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', fontFamily: 'var(--font-mini)', color: 'var(--soft)', marginBottom: '12px' }}>프로필</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: '12px' }}>
          <div className="form-group">
            <label style={{ fontSize: '11px', fontFamily: 'var(--font-mini)', color: 'var(--soft)', marginBottom: '5px' }}>이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleSaveProfile}
              style={{ width: '100%', height: '40px' }}
            />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '11px', fontFamily: 'var(--font-mini)', color: 'var(--soft)', marginBottom: '5px' }}>학년</label>
            <input
              type="text"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              onBlur={handleSaveProfile}
              style={{ width: '100%', height: '40px' }}
            />
          </div>
        </div>
      </div>

      {/* 2. Mode Segment Toggle */}
      <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mini)', color: 'var(--soft)' }}>모드</span>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mini)', color: 'var(--soft)' }}>새김글·경제훈련 항목·시간표 프리셋이 바뀝니다</span>
        </div>
        <div style={{ display: 'flex', border: '2px solid var(--line)' }}>
          <button
            onClick={() => handleModeChange('general')}
            style={{
              flex: 1,
              height: '44px',
              border: 'none',
              borderRight: '2px solid var(--line)',
              cursor: 'pointer',
              boxShadow: 'none',
              borderRadius: '0',
              ...getSegStyle(profile.mode === 'general')
            }}
          >
            일반 모드
          </button>
          <button
            onClick={() => handleModeChange('faith')}
            style={{
              flex: 1,
              height: '44px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: 'none',
              borderRadius: '0',
              ...getSegStyle(profile.mode === 'faith')
            }}
          >
            신앙 모드
          </button>
        </div>
      </div>

      {/* 3. Q Sync */}
      <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', fontFamily: 'var(--font-mini)', color: 'var(--soft)', marginBottom: '10px' }}>에듀자인 Q 연동</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px' }}>
          <div style={{ fontSize: '12px', lineHeight: 1.5, color: 'var(--ink)', flex: 1 }}>
            {profile.qLinked
              ? '에듀자인 Q 계정과 연동됨 · 나의 목표·직업·전공이 자동 채워집니다'
              : '미연동 · 모든 목표를 직접 입력합니다'}
          </div>
          <button
            onClick={handleQSyncToggle}
            style={{
              flexShrink: 0,
              height: '44px',
              padding: '0 16px',
              border: '2px solid var(--line)',
              boxShadow: '3px 3px 0 var(--shadow)',
              backgroundColor: profile.qLinked ? 'var(--accent)' : 'var(--panel)',
              color: profile.qLinked ? 'var(--paper)' : 'var(--ink)'
            }}
          >
            {profile.qLinked ? '연동됨 · 갱신' : 'Q에서 가져오기'}
          </button>
        </div>
      </div>

      {/* 4. Attendance Rules */}
      <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', fontFamily: 'var(--font-mini)', color: 'var(--soft)', marginBottom: '12px' }}>출석 인정 기준</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => handleAttnRule('use')}
            style={{
              textAlign: 'left',
              height: '44px',
              padding: '0 14px',
              border: '2px solid var(--line)',
              boxShadow: 'none',
              borderRadius: '0',
              ...getSegStyle(currentAttn === 'use')
            }}
          >
            다짐 작성 또는 점검 1개 이상 (기본)
          </button>
          <button
            onClick={() => handleAttnRule('manual')}
            style={{
              textAlign: 'left',
              height: '44px',
              padding: '0 14px',
              border: '2px solid var(--line)',
              boxShadow: 'none',
              borderRadius: '0',
              ...getSegStyle(currentAttn === 'manual')
            }}
          >
            ＋ 수동 ‘오늘 출석’ 버튼 허용
          </button>
          <button
            onClick={() => handleAttnRule('math')}
            style={{
              textAlign: 'left',
              height: '44px',
              padding: '0 14px',
              border: '2px solid var(--line)',
              boxShadow: 'none',
              borderRadius: '0',
              ...getSegStyle(currentAttn === 'math')
            }}
          >
            ＋ 수학 앱 학습 완료 시 (3차 · 준비 중)
          </button>
        </div>
      </div>

      {/* 5. Data Actions */}
      <div className="card" style={{ padding: '16px' }}>
        <div style={{ fontSize: '11px', fontFamily: 'var(--font-mini)', color: 'var(--soft)', marginBottom: '12px' }}>데이터 관리</div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleExport} style={{ flex: 1, height: '44px' }}>
            JSON 내보내기
          </button>
          <button
            onClick={() => document.getElementById('import-file')?.click()}
            style={{ flex: 1, height: '44px' }}
          >
            JSON 가져오기
          </button>
          <input
            id="import-file"
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
          <button
            onClick={handleReset}
            style={{
              flexShrink: 0,
              height: '44px',
              padding: '0 16px',
              border: '2px solid var(--color-error)',
              color: 'var(--color-error)',
              backgroundColor: 'var(--panel)'
            }}
          >
            전체 초기화
          </button>
        </div>
      </div>
    </div>
  );
};
