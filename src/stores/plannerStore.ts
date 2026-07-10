import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Profile,
  QProfile,
  YearGoals,
  MonthlyPlan,
  WeeklyPlanItem,
  DailyLog,
  AttendanceRecord,
  StreakState,
  EconomyMonth,
  Area,
  Weekday
} from '../types';
import { calculateStreak, checkAttendance } from '../services/attendanceService';
import { mockQProfile } from '../mocks/qMock';

interface PlannerState {
  profile: Profile;
  qProfile: QProfile;
  yearGoals: YearGoals[];
  monthlyPlans: MonthlyPlan[];
  weeklyPlans: WeeklyPlanItem[];
  dailyLogs: DailyLog[];
  attendanceRecords: AttendanceRecord[];
  economyMonths: EconomyMonth[];
  streak: StreakState;
  theme: 'light' | 'dark';
  
  // Actions
  setProfile: (profile: Profile) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  linkQProfile: () => void;
  unlinkQProfile: () => void;
  updateYearGoals: (year: number, goals: Record<Area, string>) => void;
  updateMonthlyPlan: (month: string, plans: Record<Area, string>, calendarMemos: Record<string, string>) => void;
  addWeeklyPlanItem: (week: string, area: Area, content: string, activeDays: Weekday[]) => void;
  updateWeeklyPlanItem: (id: string, updates: Partial<WeeklyPlanItem>) => void;
  deleteWeeklyPlanItem: (id: string) => void;
  updateDailyLog: (date: string, updates: Partial<DailyLog>) => void;
  addAttendance: (date: string, source: 'planner' | 'manual' | 'math-app') => boolean;
  updateEconomyMonth: (month: string, updates: Partial<EconomyMonth>) => void;
  
  // Helpers/Getters
  getYearGoals: (year: number) => YearGoals;
  getMonthlyPlan: (month: string) => MonthlyPlan;
  getWeeklyPlan: (week: string) => WeeklyPlanItem[];
  getDailyLog: (date: string) => DailyLog;
  getEconomyMonth: (month: string) => EconomyMonth;
  
  // Data actions
  importData: (jsonData: string) => boolean;
  exportData: () => string;
  resetData: () => void;
  loadDemoData: () => void;
}

const defaultProfile: Profile = {
  name: '',
  grade: '',
  mode: 'general',
  qLinked: false
};

const getInitialStreak = (): StreakState => ({
  current: 0,
  longest: 0,
  freezesLeft: 0,
  badges: []
});

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set, get) => ({
      profile: defaultProfile,
      qProfile: {},
      yearGoals: [],
      monthlyPlans: [],
      weeklyPlans: [],
      dailyLogs: [],
      attendanceRecords: [],
      economyMonths: [],
      streak: getInitialStreak(),
      theme: 'light',

      setProfile: (profile) => set({ profile }),
      setTheme: (theme) => set({ theme }),
      
      linkQProfile: () => set((state) => {
        const updatedProfile = { ...state.profile, qLinked: true };
        
        // Populate goals and plan templates if empty
        const year = 2026;
        const existingYearGoal = state.yearGoals.find(g => g.year === year);
        const yearGoals = [...state.yearGoals];
        
        const qGoals: Record<Area, string> = {
          study: '스스로 수학 오답 분석 및 예술사 도서 읽기',
          portfolio: '공연 무대 모형 제작 3작품 완성하기',
          health: '주 3회 조깅 및 자세 교정 스트레칭',
          serving: '양로원 시설 무대 재능 기부 및 주말 청소 돕기'
        };

        if (!existingYearGoal) {
          yearGoals.push({ year, goals: qGoals });
        }

        return {
          profile: updatedProfile,
          qProfile: mockQProfile,
          yearGoals
        };
      }),

      unlinkQProfile: () => set((state) => ({
        profile: { ...state.profile, qLinked: false },
        qProfile: {}
      })),

      updateYearGoals: (year, goals) => set((state) => {
        const index = state.yearGoals.findIndex(g => g.year === year);
        const newGoals = [...state.yearGoals];
        if (index >= 0) {
          newGoals[index] = { year, goals };
        } else {
          newGoals.push({ year, goals });
        }
        return { yearGoals: newGoals };
      }),

      updateMonthlyPlan: (month, plans, calendarMemos) => set((state) => {
        const index = state.monthlyPlans.findIndex(p => p.month === month);
        const newPlans = [...state.monthlyPlans];
        if (index >= 0) {
          newPlans[index] = { month, plans, calendarMemos: { ...newPlans[index].calendarMemos, ...calendarMemos } };
        } else {
          newPlans.push({ month, plans, calendarMemos });
        }
        return { monthlyPlans: newPlans };
      }),

      addWeeklyPlanItem: (week, area, content, activeDays) => set((state) => {
        const newItem: WeeklyPlanItem = {
          id: Math.random().toString(36).substr(2, 9),
          week,
          area,
          content,
          activeDays,
          checks: {}
        };
        return { weeklyPlans: [...state.weeklyPlans, newItem] };
      }),

      updateWeeklyPlanItem: (id, updates) => set((state) => {
        const updated = state.weeklyPlans.map(item => {
          if (item.id === id) {
            return { ...item, ...updates };
          }
          return item;
        });

        return { weeklyPlans: updated };
      }),

      deleteWeeklyPlanItem: (id) => set((state) => ({
        weeklyPlans: state.weeklyPlans.filter(item => item.id !== id)
      })),

      updateDailyLog: (date, updates) => set((state) => {
        const index = state.dailyLogs.findIndex(l => l.date === date);
        const newLogs = [...state.dailyLogs];
        if (index >= 0) {
          newLogs[index] = { ...newLogs[index], ...updates };
        } else {
          newLogs.push({
            date,
            timeBlocks: [],
            ...updates
          });
        }
        return { dailyLogs: newLogs };
      }),

      addAttendance: (date, source) => {
        const state = get();
        const { success, newRecords } = checkAttendance(state.attendanceRecords, date, source);
        if (success) {
          const newStreak = calculateStreak(newRecords, date);
          set({
            attendanceRecords: newRecords,
            streak: newStreak
          });
          return true;
        }
        return false;
      },

      updateEconomyMonth: (month, updates) => set((state) => {
        const index = state.economyMonths.findIndex(e => e.month === month);
        const newMonths = [...state.economyMonths];
        const defaultEconomy: EconomyMonth = {
          month,
          serving: { period: '', items: [] },
          spendingPlan: [],
          spendingActual: [],
          review: {}
        };

        if (index >= 0) {
          newMonths[index] = { ...defaultEconomy, ...newMonths[index], ...updates };
        } else {
          newMonths.push({ ...defaultEconomy, ...updates });
        }
        return { economyMonths: newMonths };
      }),

      getYearGoals: (year) => {
        const state = get();
        return state.yearGoals.find(g => g.year === year) || { year, goals: { study: '', portfolio: '', health: '', serving: '' } };
      },

      getMonthlyPlan: (month) => {
        const state = get();
        return state.monthlyPlans.find(p => p.month === month) || { month, plans: { study: '', portfolio: '', health: '', serving: '' }, calendarMemos: {} };
      },

      getWeeklyPlan: (week) => {
        const state = get();
        return state.weeklyPlans.filter(item => item.week === week);
      },

      getDailyLog: (date) => {
        const state = get();
        return state.dailyLogs.find(l => l.date === date) || { date, timeBlocks: [] };
      },

      getEconomyMonth: (month) => {
        const state = get();
        return state.economyMonths.find(e => e.month === month) || {
          month,
          serving: { period: '', items: [] },
          spendingPlan: [],
          spendingActual: [],
          review: {}
        };
      },

      importData: (jsonData) => {
        try {
          const parsed = JSON.parse(jsonData);
          if (parsed && typeof parsed === 'object' && 'profile' in parsed) {
            set({
              profile: parsed.profile || defaultProfile,
              qProfile: parsed.qProfile || {},
              yearGoals: parsed.yearGoals || [],
              monthlyPlans: parsed.monthlyPlans || [],
              weeklyPlans: parsed.weeklyPlans || [],
              dailyLogs: parsed.dailyLogs || [],
              attendanceRecords: parsed.attendanceRecords || [],
              economyMonths: parsed.economyMonths || [],
              streak: parsed.streak || getInitialStreak()
            });
            return true;
          }
          return false;
        } catch (e) {
          console.error(e);
          return false;
        }
      },

      exportData: () => {
        const state = get();
        return JSON.stringify({
          profile: state.profile,
          qProfile: state.qProfile,
          yearGoals: state.yearGoals,
          monthlyPlans: state.monthlyPlans,
          weeklyPlans: state.weeklyPlans,
          dailyLogs: state.dailyLogs,
          attendanceRecords: state.attendanceRecords,
          economyMonths: state.economyMonths,
          streak: state.streak
        }, null, 2);
      },

      resetData: () => set({
        profile: defaultProfile,
        qProfile: {},
        yearGoals: [],
        monthlyPlans: [],
        weeklyPlans: [],
        dailyLogs: [],
        attendanceRecords: [],
        economyMonths: [],
        streak: getInitialStreak()
      }),

      loadDemoData: () => {
        // 1. Set Profile
        const demoProfile: Profile = {
          name: '이지수',
          grade: '중3',
          mode: 'faith',
          qLinked: true
        };

        // 2. Set Q Profile
        const demoQProfile = mockQProfile;

        // 3. Set Year Goals
        const demoYearGoals: YearGoals = {
          year: 2026,
          goals: {
            study: '수학 기출문제 분석 완료 및 한 달에 예술학 독서 1권 읽기',
            portfolio: '대극장 무대 모형 포트폴리오 2개 완성',
            health: '주 3회 30분 조깅 & 목/어깨 코어 필라테스',
            serving: '교회 주일학교 교사 보조 및 매달 1회 연극반 소품 정리 봉사'
          }
        };

        // 4. Set Monthly Plan (July 2026)
        const demoMonthlyPlan: MonthlyPlan = {
          month: '2026-07',
          plans: {
            study: '수학 2단원 오답 총정리, 예술사 1-3장 독파',
            portfolio: '셰익스피어 템페스트 무대 3D 디자인 스케치 완료',
            health: '더운 날씨 피해 저녁 8시 야외 조깅 6회 목표',
            serving: '여름 성경학교 주차/배식 봉사 2회 참여'
          },
          calendarMemos: {
            '2026-07-01': '기말고사 끝! 플래너 시작',
            '2026-07-04': '무대 스케치 아이디어 구상 회의',
            '2026-07-07': '수학 학원 레벨 테스트',
            '2026-07-12': '친구 연극 발표회 관람 예정'
          }
        };

        // 5. Weekly Plans (2026-W28: 2026-07-06 ~ 2026-07-12)
        const demoWeeklyPlans: WeeklyPlanItem[] = [
          {
            id: 'demo-w1',
            week: '2026-W28',
            area: 'study',
            content: '수학 개념서 2단원 오답 노트 정리',
            activeDays: ['mon', 'wed', 'fri'],
            checks: { mon: 'O', wed: 'O' }
          },
          {
            id: 'demo-w2',
            week: '2026-W28',
            area: 'portfolio',
            content: '템페스트 1막 무대 스케치 그리기',
            activeDays: ['tue', 'thu', 'sat'],
            checks: { tue: 'O', thu: 'O' }
          },
          {
            id: 'demo-w3',
            week: '2026-W28',
            area: 'health',
            content: '저녁 조깅 30분 & 스트레칭',
            activeDays: ['mon', 'wed', 'fri', 'sun'],
            checks: { mon: 'O', wed: '△' }
          },
          {
            id: 'demo-w4',
            week: '2026-W28',
            area: 'serving',
            content: '방 정리정돈 및 거실 청소',
            activeDays: ['sat', 'sun'],
            checks: {}
          }
        ];

        // 6. Attendance Records (Last 6 days: July 3 to July 8)
        const demoAttendance: AttendanceRecord[] = [
          { date: '2026-07-03', source: 'planner' },
          { date: '2026-07-04', source: 'math-app' },
          { date: '2026-07-05', source: 'planner' },
          { date: '2026-07-06', source: 'planner' },
          { date: '2026-07-07', source: 'math-app' },
          { date: '2026-07-08', source: 'planner' }
        ];

        // 7. Daily Logs for previous days
        const demoDailyLogs: DailyLog[] = [
          {
            date: '2026-07-08',
            verse: '지혜를 얻는 것이 은을 얻는 것보다 낫고 그 이익이 정금보다 나음이니라 (잠언 3:14)',
            prayer: '지혜를 구하며 공부에 집중하게 하소서.',
            resolution: '공부 계획을 다 실천해보자!',
            subjects: [
              { subject: '수학', notes: '오답노트 5개 풀이 완료' },
              { subject: '영어', notes: '단어 30개 암기' }
            ],
            timeBlocks: [
              { start: '14:00', end: '15:30', plan: '수학 오답노트 작성' },
              { start: '16:00', end: '17:00', plan: '영어 단어 암기 및 독해' }
            ],
            memo: '어제보다 몰입도가 좋았음.'
          }
        ];

        // 8. Economy Month (July 2026)
        const demoEconomy: EconomyMonth = {
          month: '2026-07',
          serving: {
            period: '7월 1주차 ~ 4주차',
            items: [
              { content: '교회 주일학교 청소 돕기', unitPrice: 5000, count: 2 },
              { content: '가족 신발장 정리', unitPrice: 3000, count: 3 }
            ],
            rating: 'good'
          },
          spendingPlan: [
            { category: 'tithe', label: '7월 십일조', amount: 2000 },
            { category: 'donation', label: '컴패션 아동 후원', amount: 3000 },
            { category: 'saving', label: '카카오뱅크 저금통', amount: 5000 },
            { category: 'personal', label: '학용품 및 스케치북', amount: 8000 }
          ],
          spendingActual: [
            { date: '2026-07-05', category: 'donation', label: '컴패션 아동 후원', amount: 3000 },
            { date: '2026-07-07', category: 'personal', label: '크로키용 4B 연필', amount: 1500 }
          ],
          review: {
            satisfied: '주일학교 봉사를 통해 섬김의 의미를 배우고 계획적으로 지출하고 있다.',
            improve: '스케치북 살 때 조금 더 꼼꼼히 가격 비교를 해야겠다.'
          }
        };

        const calculatedStreak = calculateStreak(demoAttendance, '2026-07-09');

        set({
          profile: demoProfile,
          qProfile: demoQProfile,
          yearGoals: [demoYearGoals],
          monthlyPlans: [demoMonthlyPlan],
          weeklyPlans: demoWeeklyPlans,
          attendanceRecords: demoAttendance,
          dailyLogs: demoDailyLogs,
          economyMonths: [demoEconomy],
          streak: calculatedStreak
        });
      }
    }),
    {
      name: 'edp:v1:store'
    }
  )
);
