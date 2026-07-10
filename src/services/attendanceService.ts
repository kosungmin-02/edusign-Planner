import { parseISO, format, differenceInCalendarDays, subDays } from 'date-fns';
import type { AttendanceRecord, StreakState } from '../types';

export const calculateStreak = (records: AttendanceRecord[], todayStr: string): StreakState => {
  if (records.length === 0) {
    return { current: 0, longest: 0, freezesLeft: 0, badges: [] };
  }

  // 1. Unique sorted dates (yyyy-mm-dd)
  const uniqueDates = Array.from(new Set(records.map(r => r.date))).sort();
  const today = parseISO(todayStr);

  // 2. Calculate current streak
  let currentStreak = 0;

  // If today has attendance
  const hasToday = uniqueDates.includes(todayStr);
  // If yesterday has attendance
  const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');
  const hasYesterday = uniqueDates.includes(yesterdayStr);

  if (hasToday || hasYesterday) {
    // Start counting back from today (if attended today) or yesterday (if attended yesterday but not yet today)
    let startPoint = hasToday ? today : subDays(today, 1);
    let tempDateStr = format(startPoint, 'yyyy-MM-dd');

    while (uniqueDates.includes(tempDateStr)) {
      currentStreak++;
      startPoint = subDays(startPoint, 1);
      tempDateStr = format(startPoint, 'yyyy-MM-dd');
    }
  }

  // 3. Calculate longest streak ever
  let longestStreak = 0;
  let currentLen = 0;
  let prevDate: Date | null = null;

  for (const dateStr of uniqueDates) {
    const currentDate = parseISO(dateStr);
    if (prevDate === null) {
      currentLen = 1;
    } else {
      const diff = differenceInCalendarDays(currentDate, prevDate);
      if (diff === 1) {
        currentLen++;
      } else if (diff > 1) {
        if (currentLen > longestStreak) {
          longestStreak = currentLen;
        }
        currentLen = 1;
      }
    }
    prevDate = currentDate;
  }
  if (currentLen > longestStreak) {
    longestStreak = currentLen;
  }

  // 4. Badges logic (based on longest streak)
  const badges: ('d3' | 'd7' | 'd14' | 'd30' | 'd100')[] = [];
  if (longestStreak >= 3) badges.push('d3');
  if (longestStreak >= 7) badges.push('d7');
  if (longestStreak >= 14) badges.push('d14');
  if (longestStreak >= 30) badges.push('d30');
  if (longestStreak >= 100) badges.push('d100');

  return {
    current: currentStreak,
    longest: longestStreak,
    freezesLeft: 0,
    badges
  };
};

export const checkAttendance = (
  records: AttendanceRecord[],
  date: string,
  source: 'planner' | 'manual' | 'math-app'
): { success: boolean; newRecords: AttendanceRecord[] } => {
  // Check if attendance already exists for this date
  const exists = records.some(r => r.date === date);
  if (exists) {
    return { success: false, newRecords: records };
  }

  const newRecord: AttendanceRecord = { date, source };
  return {
    success: true,
    newRecords: [...records, newRecord]
  };
};
