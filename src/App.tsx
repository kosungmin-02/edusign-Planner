import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { usePlannerStore } from './stores/plannerStore';
import { Sidebar } from './components/Sidebar';
import { Onboarding } from './features/onboarding/Onboarding';
import { Dashboard } from './features/dashboard/Dashboard';
import { Monthly } from './features/monthly/Monthly';
import { Weekly } from './features/weekly/Weekly';
import { Daily } from './features/daily/Daily';
import { Attendance } from './features/attendance/Attendance';
import { Economy } from './features/economy/Economy';
import { Settings } from './features/settings/Settings';

const AppContent: React.FC = () => {
  const { profile, theme } = usePlannerStore();
  const location = useLocation();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const isProfileEmpty = !profile.name;
  const isOnboardingPath = location.pathname === '/onboarding';

  // Redirect to onboarding if profile is empty and user is not on onboarding page
  if (isProfileEmpty && !isOnboardingPath) {
    return <Navigate to="/onboarding" replace />;
  }

  // If user has profile but tries to go to onboarding, redirect to dashboard
  if (!isProfileEmpty && isOnboardingPath) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={isOnboardingPath ? 'app-onboarding-only' : 'app-layout'}>
      {!isOnboardingPath && <Sidebar />}
      <main className={isOnboardingPath ? 'onboarding-main' : 'main-content'}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/monthly" element={<Monthly />} />
          <Route path="/weekly" element={<Weekly />} />
          <Route path="/weekly/:yyyyWww" element={<Weekly />} />
          <Route path="/daily" element={<Daily />} />
          <Route path="/daily/:date" element={<Daily />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/economy" element={<Economy />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
