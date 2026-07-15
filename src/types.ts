export type Area = 'study' | 'portfolio' | 'health' | 'serving';

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface Profile {
  name: string;
  grade: string;              // "중3" 등 자유 입력
  mode: 'general' | 'faith';  // 일반/신앙 모드
  qLinked: boolean;           // Q 연동 여부
  attnRule?: 'use' | 'manual' | 'math'; // 출석 인정 기준
}

export interface QProfile {
  missionStatement?: string;  // 나의 목표(사명문)
  futureJobs?: string[];      // 장래 직업/봉사
  majorsSchools?: string[];   // 전공학과/대학교
}

export interface YearGoals {
  year: number;
  goals: Record<Area, string>;
}

export interface MonthlyPlan {
  month: string; // yyyy-mm
  plans: Record<Area, string>;
  calendarMemos: Record<string, string>; // key: yyyy-mm-dd
}

export interface WeeklyPlanItem {
  id: string;
  week: string; // yyyy-Www (예: 2026-W28)
  area: Area;
  content: string;
  activeDays: Weekday[];
  checks: Partial<Record<Weekday, 'O' | '△' | 'X'>>;
}

export interface SubjectNote {
  subject: string;
  notes: string;
}

export interface TimeBlock {
  start: string; // HH:mm
  end: string;   // HH:mm
  plan: string;
}

export interface DailyLog {
  date: string; // yyyy-mm-dd
  verse?: string; // 신앙 모드 (FOC 말씀)
  prayer?: string; // 신앙 모드 (FOC 기도)
  resolution?: string; // 오늘의 다짐 (일반 모드는 verse/prayer 대신 다짐/명언이 주된 용도)
  subjects?: SubjectNote[]; // 주중형
  timeBlocks: TimeBlock[];
  memo?: string;
}

export interface AttendanceRecord {
  date: string; // yyyy-mm-dd
  source: 'planner' | 'manual' | 'math-app';
}

export interface StreakState {
  current: number;
  longest: number;
  freezesLeft: number; // MVP에선 항상 0
  badges: ('d3' | 'd7' | 'd14' | 'd30' | 'd100')[];
}

export type SpendCategory = 'tithe' | 'donation' | 'saving' | 'personal';

export type SelfRating = 'good' | 'ok' | 'bad';

export interface ServingItem {
  date?: string; // yyyy-mm-dd (선택 입력)
  content: string;
  unitPrice: number;
  count: number;
  rating?: SelfRating; // 항목별 활동 성실도 자가평가
}

export interface SpendingPlanItem {
  date?: string;
  category: SpendCategory;
  label: string;
  amount: number;
}

export interface SpendingActualItem {
  date: string;
  category: SpendCategory;
  label: string;
  amount: number;
}

export interface EconomyMonth {
  month: string; // yyyy-mm
  serving: {
    period: string;
    items: ServingItem[];
    rating?: 'good' | 'ok' | 'bad';
  };
  spendingPlan: SpendingPlanItem[];
  spendingActual: SpendingActualItem[];
  review: {
    satisfied?: string;
    improve?: string;
  };
}
