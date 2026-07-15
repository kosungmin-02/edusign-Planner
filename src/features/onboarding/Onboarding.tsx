import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlannerStore } from '../../stores/plannerStore';
import type { Profile } from '../../types';

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { setProfile, linkQProfile, loadDemoData } = usePlannerStore();
  
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('중3');
  const [mode, setMode] = useState<'general' | 'faith'>('general');

  const handleDirectStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    const profile: Profile = {
      name: name.trim(),
      grade,
      mode,
      qLinked: false
    };
    setProfile(profile);
    // Add initial empty goals for current year
    usePlannerStore.getState().updateYearGoals(new Date().getFullYear(), {
      study: '',
      portfolio: '',
      health: '',
      serving: ''
    });
    
    navigate('/');
  };

  const handleQLiknedStart = () => {
    const profile: Profile = {
      name: name.trim() || '홍길동(Q)',
      grade: grade,
      mode: mode,
      qLinked: true
    };
    setProfile(profile);
    linkQProfile();
    navigate('/');
  };

  const handleDemoStart = () => {
    loadDemoData();
    navigate('/');
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card animate-fade-in">
        <div className="onboarding-header">
          <div className="logo-badge">EDUSIGN</div>
          <h1>에듀자인 플래너</h1>
          <p>월간, 주간, 일일 계획과 함께 성장의 기록을 채워보세요.</p>
        </div>

        <div className="demo-tip-box">
          <p>💡 빠른 체험을 원하시나요?</p>
          <button type="button" onClick={handleDemoStart} className="btn-demo">
            데모 데이터 로드하고 바로 시작하기
          </button>
        </div>

        <form onSubmit={handleDirectStart} className="onboarding-form">
          <div className="form-group">
            <label htmlFor="name-input">이름</label>
            <input
              id="name-input"
              type="text"
              placeholder="이름을 입력하세요"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="grade-select">학년</label>
            <select
              id="grade-select"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
            >
              <option value="초1">초등학교 1학년</option>
              <option value="초2">초등학교 2학년</option>
              <option value="초3">초등학교 3학년</option>
              <option value="초4">초등학교 4학년</option>
              <option value="초5">초등학교 5학년</option>
              <option value="초6">초등학교 6학년</option>
              <option value="중1">중학교 1학년</option>
              <option value="중2">중학교 2학년</option>
              <option value="중3">중학교 3학년</option>
              <option value="고1">고등학교 1학년</option>
              <option value="고2">고등학교 2학년</option>
              <option value="고3">고등학교 3학년</option>
            </select>
          </div>

          <div className="form-group">
            <label>플래너 모드 선택</label>
            <div className="mode-toggle-group">
              <button
                type="button"
                className={`mode-btn ${mode === 'general' ? 'active' : ''}`}
                onClick={() => setMode('general')}
              >
                <h3>일반 모드</h3>
                <span>명언과 스스로의 다짐 중심의 자기주도 학습</span>
              </button>
              <button
                type="button"
                className={`mode-btn ${mode === 'faith' ? 'active' : ''}`}
                onClick={() => setMode('faith')}
              >
                <h3>신앙 모드 (FOC)</h3>
                <span>성경 말씀과 꿈을 향한 기도 중심의 신앙 훈련</span>
              </button>
            </div>
          </div>

          <div className="action-divider"><span>시작 방법 선택</span></div>

          <div className="action-buttons">
            <button
              type="submit"
              disabled={!name.trim()}
              className="btn btn-primary"
            >
              직접 시작하기
            </button>
            
            <button
              type="button"
              className="btn btn-qlink"
              onClick={handleQLiknedStart}
            >
              <div className="qlink-badge">추천</div>
              <span>에듀자인 Q에서 가져오기</span>
              <small>Q 사명문, 전공/학교 목표 자동 연동</small>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
