import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { usePlannerStore } from '../stores/plannerStore';
import { format } from 'date-fns';
import {
  LayoutDashboard,
  CalendarDays,
  CalendarRange,
  ClipboardList,
  CalendarCheck,
  Coins,
  Settings as SettingsIcon,
  Printer,
  Moon,
  Sun
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { profile, streak, attendanceRecords, theme, setTheme } = usePlannerStore();
  
  const isDemo = profile.name === '이지수';
  const todayStr = format(isDemo ? new Date(2026, 6, 9) : new Date(), 'yyyy-MM-dd');
  
  const hasAttendedToday = attendanceRecords.some(r => r.date === todayStr);

  const activeStyle = ({ isActive }: { isActive: boolean }) => 
    `sidebar-link-item ${isActive ? 'active' : ''}`;

  return (
    <aside className="sidebar no-print">
      <div className="sidebar-brand" onClick={() => navigate('/')}>
        <div className="brand-logo">ED</div>
        <span className="brand-name">에듀자인 플래너</span>
      </div>

      {profile.name && (
        <div className="sidebar-profile-box">
          <div className="profile-avatar-row">
            <div className="profile-avatar">
              {profile.name.charAt(0)}
            </div>
            <div>
              <div className="profile-name">{profile.name}</div>
              <div className="profile-grade">{profile.grade || '중학교 3학년'}</div>
            </div>
          </div>
          <div className={`status-stamp-badge ${hasAttendedToday ? 'done' : 'pending'}`}>
            <span>{hasAttendedToday ? '● 출석' : '○ 미출석'}</span>
          </div>
        </div>
      )}

      <nav className="sidebar-nav-links">
        <NavLink to="/" className={activeStyle}>
          <LayoutDashboard size={16} />
          <span>오늘 대시보드</span>
        </NavLink>
        
        <NavLink to="/monthly" className={activeStyle}>
          <CalendarDays size={16} />
          <span>월간 목표보드</span>
        </NavLink>
        
        <NavLink to="/weekly" className={activeStyle}>
          <CalendarRange size={16} />
          <span>주간 플래너</span>
        </NavLink>
        
        <NavLink to={`/daily/${todayStr}`} className={activeStyle}>
          <ClipboardList size={16} />
          <span>일일 플래너</span>
        </NavLink>
        
        <NavLink to="/attendance" className={activeStyle}>
          <CalendarCheck size={16} />
          <span>출석 & 스트릭</span>
        </NavLink>
        
        <NavLink to="/economy" className={activeStyle}>
          <Coins size={16} />
          <span>경제 훈련</span>
        </NavLink>
        
        <NavLink to="/settings" className={activeStyle}>
          <SettingsIcon size={16} />
          <span>설정 관리</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
          className="btn btn-outline w-full flex-center mb-8"
        >
          {theme === 'dark' ? (
            <><Sun size={14} className="mr-8" /><span>라이트 모드</span></>
          ) : (
            <><Moon size={14} className="mr-8" /><span>다크 모드</span></>
          )}
        </button>
        <button onClick={() => window.print()} className="btn btn-print w-full flex-center">
          <Printer size={14} className="mr-8" />
          <span>플래너 인쇄 (PDF)</span>
        </button>
        <div className="streak-brief">
          <span>🔥</span>
          <span>{streak.current}일 연속 실천 중</span>
        </div>
      </div>
    </aside>
  );
};
