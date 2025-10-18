import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, Appearance, Dimensions, PanResponder, Platform, Pressable, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';

// Helper functions
const pad2 = (n) => n < 10 ? `0${n}` : String(n);
const formatYYYYMMDD = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const formatMonthYear = (year, monthIndex) => new Date(year, monthIndex, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' });
const parseISO = (iso) => new Date(iso);
const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60000);
const isAfter = (a, b) => a.getTime() > b.getTime();
const diffMinutes = (a, b) => Math.max(0, Math.round((b.getTime() - a.getTime()) / 60000));

const endOfDayPlusTick = (d) => {
  const next = new Date(d);
  next.setHours(23, 59, 59, 999);
  return addMinutes(next, 0.001);
};

const getMonthDays = (year, monthIndex) => {
  const total = new Date(year, monthIndex + 1, 0).getDate();
  return Array.from({ length: total }, (_, i) => formatYYYYMMDD(new Date(year, monthIndex, i + 1)));
};

const dayOfWeek = (dateKey) => new Date(dateKey + 'T00:00:00').getDay();

const groupByWeeks = (days) => {
  const weeks = [];
  let current = [];
  days.forEach((d) => {
    current.push(d);
    if (dayOfWeek(d) === 0) {
      weeks.push(current);
      current = [];
    }
  });
  if (current.length) weeks.push(current);
  return weeks;
};

const splitSessionAcrossMidnight = (startISO, endISO) => {
  const result = {};
  let cursor = parseISO(startISO);
  const end = parseISO(endISO);
  if (!isAfter(end, cursor)) return result;

  while (cursor.getTime() < end.getTime()) {
    const dayKey = formatYYYYMMDD(cursor);
    const eod = endOfDayPlusTick(cursor);
    const sliceEnd = end.getTime() < eod.getTime() ? end : eod;
    const hours = diffMinutes(cursor, sliceEnd) / 60;
    result[dayKey] = (result[dayKey] ?? 0) + hours;
    cursor = sliceEnd;
  }
  return result;
};

// Storage (fallback in-memory for environments without localStorage)
const memoryStore = {};
const storage = {
  async getItem(key) {
    try {
      if (globalThis?.localStorage) return globalThis.localStorage.getItem(key);
    } catch {}
    return memoryStore[key] || null;
  },
  async setItem(key, value) {
    try {
      if (globalThis?.localStorage) return globalThis.localStorage.setItem(key, value);
    } catch {}
    memoryStore[key] = value;
  },
};

// Colors
const Colors = {
  light: { text: '#0a0f1a', background: '#ffffff', tint: '#6ea8ff', icon: '#7083a1' },
  dark: { text: '#E6EAEE', background: '#0b1220', tint: '#8fbaff', icon: '#a8b4c6' },
};

const useLocalColorScheme = () => Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';

export default function SleepScreen() {
  const colorMode = useLocalColorScheme();
  const theme = Colors[colorMode];
  const screenWidth = Dimensions.get('window').width - 32;
  const topInset = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 24;

  const [sessions, setSessions] = useState([]);
  const [schedule, setSchedule] = useState({ bedtime: '22:30', wakeTime: '07:00' });

  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(null);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [monthIndex, setMonthIndex] = useState(now.getMonth());

  const STORAGE_KEYS = {
    SESSIONS: 'sleep.sessions.v1',
    SCHEDULE: 'sleep.schedule.v1',
    SEEDED: 'sleep.seeded.v1',
  };

  const loadData = useCallback(async () => {
    try {
      const [sRaw, schRaw] = await Promise.all([
        storage.getItem(STORAGE_KEYS.SESSIONS),
        storage.getItem(STORAGE_KEYS.SCHEDULE),
      ]);
      if (sRaw) setSessions(JSON.parse(sRaw));
      if (schRaw) setSchedule(JSON.parse(schRaw));
      const seeded = await storage.getItem(STORAGE_KEYS.SEEDED);
      const parsed = sRaw ? JSON.parse(sRaw) : [];
      if ((!parsed || parsed.length === 0) && !seeded) {
        const now = new Date();
        const seeds = [];
        for (let i = 30; i >= 1; i--) {
          const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
          const startHourBase = 22 + (Math.random() < 0.3 ? -1 : 0);
          const startHour = Math.min(23, Math.max(21, startHourBase));
          const startMin = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
          const durationMinutes = Math.round((6.5 * 60) + Math.random() * (2 * 60));
          const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), startHour, startMin, 0, 0);
          const end = addMinutes(start, durationMinutes);
          seeds.push({ id: `${Date.now()}-${i}`, startISO: start.toISOString(), endISO: end.toISOString(), stage: 'asleep' });
        }
        setSessions(seeds);
        await storage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(seeds));
        await storage.setItem(STORAGE_KEYS.SEEDED, '1');
      }
    } catch {}
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const monthDays = useMemo(() => getMonthDays(year, monthIndex), [year, monthIndex]);

  const sleepByDay = useMemo(() => {
    const acc = {};
    sessions.forEach((s) => {
      const parts = splitSessionAcrossMidnight(s.startISO, s.endISO);
      Object.entries(parts).forEach(([d, h]) => {
        acc[d] = (acc[d] ?? 0) + h;
      });
    });
    return acc;
  }, [sessions]);

  const weeks = useMemo(() => groupByWeeks(monthDays), [monthDays]);
  const weeklyAverages = useMemo(() => {
    return weeks.map((w) => {
      const total = w.reduce((sum, d) => sum + (sleepByDay[d] ?? 0), 0);
      return Number((total / w.length).toFixed(2));
    });
  }, [weeks, sleepByDay]);

  const [nowStr, setNowStr] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  useEffect(() => {
    const id = setInterval(() => {
      setNowStr(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 30000);
    return () => clearInterval(id);
  }, []);

  const monthlyAvg = useMemo(() => {
    const total = monthDays.reduce((sum, d) => sum + (sleepByDay[d] ?? 0), 0);
    return Number((total / (monthDays.length || 1)).toFixed(2));
  }, [monthDays, sleepByDay]);

  function getLatestNonZero(arr) {
    for (let i = arr.length - 1; i >= 0; i--) if (arr[i] > 0) return arr[i];
    return null;
  }

  const targetAvg = useMemo(() => {
    const lastWeek = getLatestNonZero(weeklyAverages);
    return lastWeek ?? monthlyAvg;
  }, [weeklyAverages, monthlyAvg]);

  const [avgAnimated, setAvgAnimated] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const duration = 800;
    const from = 0;
    const to = targetAvg;
    let raf = 0;
    const step = (t) => {
      const p = Math.min(1, (t - start) / duration);
      setAvgAnimated(Number((from + (to - from) * p).toFixed(2)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [targetAvg]);

  const saveSchedule = useCallback(async (next) => {
    const merged = { ...schedule, ...next };
    setSchedule(merged);
    await storage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(merged));
  }, [schedule]);

  const scheduleAnalysis = useMemo(() => {
    if (sessions.length === 0) return null;
    const recent = sessions.slice(0, 14);
    const bedtimes = recent.map(s => parseISO(s.startISO).getHours() * 60 + parseISO(s.startISO).getMinutes());
    const wakeTimes = recent.map(s => parseISO(s.endISO).getHours() * 60 + parseISO(s.endISO).getMinutes());
    const [schedBed, schedWake] = [schedule.bedtime, schedule.wakeTime].map(t => parseInt(t.split(':')[0]) * 60 + parseInt(t.split(':')[1]));
    const [avgBed, avgWake] = [bedtimes, wakeTimes].map(arr => arr.reduce((a, b) => a + b, 0) / arr.length);
    const variance = bedtimes.reduce((s, t) => s + Math.abs(t - schedBed), 0) / bedtimes.length +
                    wakeTimes.reduce((s, t) => s + Math.abs(t - schedWake), 0) / wakeTimes.length;
    return {
      avgBedtime: avgBed, avgWakeTime: avgWake, scheduledBedtime: schedBed, scheduledWakeTime: schedWake,
      consistencyScore: Math.max(0, Math.round(100 - variance / 2)), totalSessions: recent.length
    };
  }, [sessions, schedule]);

  const getScheduleRecommendations = useCallback(() => {
    if (!scheduleAnalysis) return [];
    const { avgBedtime, avgWakeTime, scheduledBedtime, scheduledWakeTime, consistencyScore } = scheduleAnalysis;
    const recs = [];
    if (consistencyScore < 50) recs.push("Try to go to bed at the same time each night for better sleep quality");
    if (Math.abs(avgBedtime - scheduledBedtime) > 30) {
      const time = `${Math.floor(avgBedtime / 60)}:${String(Math.round(avgBedtime % 60)).padStart(2, '0')}`;
      recs.push(`Consider adjusting bedtime to ${time} based on your actual patterns`);
    }
    if (Math.abs(avgWakeTime - scheduledWakeTime) > 30) {
      const time = `${Math.floor(avgWakeTime / 60)}:${String(Math.round(avgWakeTime % 60)).padStart(2, '0')}`;
      recs.push(`Consider adjusting wake time to ${time} based on your actual patterns`);
    }
    if (consistencyScore > 80) recs.push("Great job! You're maintaining a consistent sleep schedule");
    return recs;
  }, [scheduleAnalysis]);

  const changeMonth = useCallback((delta) => {
    const base = new Date(year, monthIndex + delta, 1);
    setYear(base.getFullYear());
    setMonthIndex(base.getMonth());
  }, [year, monthIndex]);

  // Styles
  const styles = {
    sectionTitle: { fontSize: 20, fontWeight: '600', color: theme.text, marginBottom: 8 },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 12, borderWidth: 2, borderColor: '#D6E4FF', marginBottom: 16 },
    button: { backgroundColor: theme.tint, borderRadius: 10, paddingVertical: 6, paddingHorizontal: 10 },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
    numberText: { color: theme.text, fontSize: 18, fontWeight: '700', minWidth: 36, textAlign: 'center' },
    backButton: { padding: 8, marginRight: 8 },
    backText: { fontSize: 24, color: theme.tint, fontWeight: '700' },
  };

  // Number rotator component
  const NumberRotator = ({ value, onChange, min, max, step = 1 }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Pressable onPress={() => onChange(value <= min ? max : Math.max(min, value - step))} style={styles.button}>
        <Text style={styles.buttonText}>-</Text>
      </Pressable>
      <Text style={styles.numberText}>{String(value).padStart(2, '0')}</Text>
      <Pressable onPress={() => onChange(value >= max ? min : Math.min(max, value + step))} style={styles.button}>
        <Text style={styles.buttonText}>+</Text>
      </Pressable>
    </View>
  );

  const TimeRotator = ({ value, onChange }) => {
    const parts = value.split(':').map((n) => parseInt(n, 10));
    const h = parts[0] ?? 0;
    const m = parts[1] ?? 0;
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <NumberRotator value={h} onChange={(nextH) => onChange(`${String(nextH).padStart(2, '0')}:${String(m).padStart(2, '0')}`)} min={0} max={23} />
        <Text style={{ color: theme.text, fontSize: 18, fontWeight: '700' }}>:</Text>
        <NumberRotator value={m} onChange={(nextM) => onChange(`${String(h).padStart(2, '0')}:${String(nextM).padStart(2, '0')}`)} min={0} max={55} step={5} />
      </View>
    );
  };

  // Chart helpers
  const totalMinutesForDateKey = (dateKey) => Math.round((sleepByDay[dateKey] ?? 0) * 60);
  const findWeekRangeFromOffset = (offset) => {
    const today = new Date();
    const current = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const start = new Date(current);
    start.setDate(current.getDate() - current.getDay() + offset * 7);
    return Array.from({ length: 7 }, (_, i) => formatYYYYMMDD(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)));
  };

  const StackedWeekChart = ({ labels, sleepByDay, width, height, panHandlers, onSelect, selectedIndex, animatedTranslateX }) => {
    const weekKeys = findWeekRangeFromOffset(weekOffset);
    const values = weekKeys.map((k) => totalMinutesForDateKey(k));
    const maxMin = Math.max(480, ...values);
    const plotH = height - 40;
    const barW = Math.max(14, Math.floor((width - 100) / 7));
    return (
      <Animated.View style={{ width, height, transform: [{ translateX: animatedTranslateX }] }} {...panHandlers}>
        <View style={{ position: 'absolute', right: 20, width: 48, top: 10, bottom: 24, justifyContent: 'space-between', alignItems: 'flex-end' }}>
          {['8h', '4h', '0h'].map((label, i) => <Text key={i} style={{ color: '#5b6a82', fontSize: 10 }}>{label}</Text>)}
        </View>
        <View style={{ position: 'absolute', left: 12, right: 48, top: 10, bottom: 24, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          {values.map((mins, i) => {
            const h = Math.round(((mins / maxMin) || 0) * plotH);
            const asleepH = Math.round(h * 0.6);
            const coreH = Math.round(h * 0.2);
            const deepH = Math.round(h * 0.15);
            const remH = Math.max(0, h - asleepH - coreH - deepH);
            const dimmed = selectedIndex != null && selectedIndex !== i;
            const colors = selectedIndex === i ? ['#4e97ff', '#86adff', '#3a78ff', '#b9cfff'] : ['#6ea8ff', '#9bb7ff', '#5b8bff', '#c6d8ff'];
            return (
              <Pressable key={i} onPress={() => onSelect?.(i)} style={{ width: barW, height: h, backgroundColor: 'transparent', justifyContent: 'flex-end', borderWidth: selectedIndex === i ? 2 : 0, borderColor: selectedIndex === i ? '#6ea8ff' : 'transparent', borderRadius: 6, opacity: dimmed ? 0.4 : 1 }}>
                <View style={{ height: asleepH, backgroundColor: colors[0], borderTopLeftRadius: 6, borderTopRightRadius: 6 }} />
                <View style={{ height: coreH, backgroundColor: colors[1] }} />
                <View style={{ height: deepH, backgroundColor: colors[2] }} />
                <View style={{ height: remH, backgroundColor: colors[3], borderBottomLeftRadius: 6, borderBottomRightRadius: 6 }} />
              </Pressable>
            );
          })}
        </View>
        <View style={{ position: 'absolute', left: 12, right: 48, bottom: 0, height: 24, flexDirection: 'row', justifyContent: 'space-between' }}>
          {labels.map((d, i) => <Text key={i} style={{ color: '#5b6a82', fontSize: 12, fontWeight: '600' }}>{d}</Text>)}
        </View>
      </Animated.View>
    );
  };

  const SelectedWeekDayCard = () => {
    if (selectedWeekIndex == null) return null;
    const weekKeys = findWeekRangeFromOffset(weekOffset);
    const dateKey = weekKeys[selectedWeekIndex];
    if (!dateKey) return null;
    const totalHrs = sleepByDay[dateKey] ?? 0;
    const totalMins = Math.round(totalHrs * 60);
    const sessionsForDay = sessions.filter((s) => {
      const sDay = formatYYYYMMDD(parseISO(s.startISO));
      const eDay = formatYYYYMMDD(parseISO(s.endISO));
      return sDay === dateKey || eDay === dateKey;
    });
    return (
      <View style={styles.card}>
        <Text style={{ color: theme.text, fontSize: 18, fontWeight: '700', marginBottom: 6 }}>
          {new Date(dateKey + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
        </Text>
        <Text style={{ color: theme.icon, marginBottom: 8 }}>Total: {Math.floor(totalMins/60)}h {String(totalMins%60).padStart(2,'0')}m</Text>
        {sessionsForDay.length === 0 ? (
          <Text style={{ color: theme.icon }}>No sessions logged.</Text>
        ) : (
          sessionsForDay.map((s) => (
            <View key={s.id} style={{ paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#EEF3F7' }}>
              <Text style={{ color: theme.text }}>
                {new Date(s.startISO).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {' '}→{' '}
                {new Date(s.endISO).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {s.stage ? ` • ${s.stage}` : ''}
              </Text>
            </View>
          ))
        )}
      </View>
    );
  };

  // Pan responder
  const weekTranslateX = useMemo(() => new Animated.Value(0), []);
  const weekPanResponder = useMemo(() => {
    const threshold = Math.max(80, Math.floor(screenWidth / 4));
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dy) < 20,
      onPanResponderMove: (_, g) => weekTranslateX.setValue(g.dx),
      onPanResponderRelease: (_, g) => {
        setSelectedWeekIndex(null);
        if (g.dx <= -threshold) {
          Animated.timing(weekTranslateX, { toValue: -screenWidth, duration: 150, useNativeDriver: true }).start(() => {
            setWeekOffset((o) => o - 1);
            weekTranslateX.setValue(screenWidth);
            Animated.timing(weekTranslateX, { toValue: 0, duration: 150, useNativeDriver: true }).start();
          });
        } else if (g.dx >= threshold) {
          Animated.timing(weekTranslateX, { toValue: screenWidth, duration: 150, useNativeDriver: true }).start(() => {
            setWeekOffset((o) => o + 1);
            weekTranslateX.setValue(-screenWidth);
            Animated.timing(weekTranslateX, { toValue: 0, duration: 150, useNativeDriver: true }).start();
          });
        } else {
          Animated.spring(weekTranslateX, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
        }
      },
      onPanResponderTerminate: () => Animated.spring(weekTranslateX, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start(),
    });
  }, [screenWidth]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background, paddingTop: topInset }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => router.push("/(tabs)/home")} style={styles.backButton}>
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
            <Text style={{ color: '#000', fontSize: 24, fontWeight: '800' }}>Sleep</Text>
          </View>
        </View>

        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 12, borderWidth: 2, borderColor: '#D6E4FF', marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View><Text style={{ color: theme.icon, fontSize: 12 }}>Time</Text><Text style={{ color: theme.text, fontSize: 20, fontWeight: '700' }}>{nowStr}</Text></View>
          <View style={{ alignItems: 'center' }}><Text style={{ color: theme.icon, fontSize: 12 }}>Avg Sleep</Text><Text style={{ color: theme.tint, fontSize: 22, fontWeight: '800' }}>{Math.floor(avgAnimated)}h {String(Math.round((avgAnimated%1)*60)).padStart(2,'0')}m</Text></View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Pressable onPress={() => changeMonth(-1)} style={{ padding: 8 }}><Text style={{ color: theme.tint, fontSize: 16 }}>{'<'} Prev</Text></Pressable>
          <Text style={{ color: theme.text, fontSize: 16, fontWeight: '600' }}>{formatMonthYear(year, monthIndex)}</Text>
          <Pressable onPress={() => changeMonth(1)} style={{ padding: 8 }}><Text style={{ color: theme.tint, fontSize: 16 }}>Next {'>'}</Text></Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Weekly Breakdown</Text>
          <StackedWeekChart labels={['Sun','Mon','Tue','Wed','Thu','Fri','Sat']} sleepByDay={sleepByDay} width={screenWidth} height={220} panHandlers={weekPanResponder.panHandlers} onSelect={(i) => setSelectedWeekIndex((prev) => (prev === i ? null : i))} selectedIndex={selectedWeekIndex} animatedTranslateX={weekTranslateX} />
        </View>

        <SelectedWeekDayCard />

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Sleep Schedule</Text>
          <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ color: theme.icon, fontSize: 16, width: 80, flex: 1}}>Bedtime</Text>
            <TimeRotator value={schedule.bedtime} onChange={(v) => saveSchedule({ bedtime: v })} />
          </View>
          <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ color: theme.icon, fontSize: 16, width: 80, flex: 1 }}>Wake</Text>
            <TimeRotator value={schedule.wakeTime} onChange={(v) => saveSchedule({ wakeTime: v })} />
          </View>

          {scheduleAnalysis && scheduleAnalysis.totalSessions > 0 && (
            <>
              <View style={{ backgroundColor: '#F8FAFF', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E6EEF5' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ color: theme.text, fontSize: 16, fontWeight: '600' }}>Schedule Consistency</Text>
                  <Text style={{ color: scheduleAnalysis.consistencyScore >= 70 ? '#4CAF50' : scheduleAnalysis.consistencyScore >= 50 ? '#FF9800' : '#F44336', fontSize: 18, fontWeight: '700' }}>{scheduleAnalysis.consistencyScore}%</Text>
                </View>
                <View style={{ height: 8, backgroundColor: '#E6EEF5', borderRadius: 4, overflow: 'hidden' }}>
                  <View style={{ height: '100%', width: `${scheduleAnalysis.consistencyScore}%`, backgroundColor: scheduleAnalysis.consistencyScore >= 70 ? '#4CAF50' : scheduleAnalysis.consistencyScore >= 50 ? '#FF9800' : '#F44336', borderRadius: 4 }} />
                </View>
                <Text style={{ color: theme.icon, fontSize: 12, marginTop: 4 }}>Based on last {scheduleAnalysis.totalSessions} sleep sessions</Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                <View style={{ flex: 1, backgroundColor: '#F8FAFF', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#E6EEF5' }}>
                  <Text style={{ color: theme.icon, fontSize: 12, marginBottom: 4 }}>Actual Bedtime</Text>
                  <Text style={{ color: theme.text, fontSize: 16, fontWeight: '600' }}>{Math.floor(scheduleAnalysis.avgBedtime / 60)}:{String(Math.round(scheduleAnalysis.avgBedtime % 60)).padStart(2, '0')}</Text>
                  <Text style={{ color: theme.icon, fontSize: 10 }}>vs {schedule.bedtime} scheduled</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: '#F8FAFF', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#E6EEF5' }}>
                  <Text style={{ color: theme.icon, fontSize: 12, marginBottom: 4 }}>Actual Wake Time</Text>
                  <Text style={{ color: theme.text, fontSize: 16, fontWeight: '600' }}>{Math.floor(scheduleAnalysis.avgWakeTime / 60)}:{String(Math.round(scheduleAnalysis.avgWakeTime % 60)).padStart(2, '0')}</Text>
                  <Text style={{ color: theme.icon, fontSize: 10 }}>vs {schedule.wakeTime} scheduled</Text>
                </View>
              </View>

              {getScheduleRecommendations().length > 0 && (
                <View style={{ backgroundColor: '#FFF8E1', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#FFE082' }}>
                  <Text style={{ color: '#E65100', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>💡 Recommendations</Text>
                  {getScheduleRecommendations().map((rec, index) => <Text key={index} style={{ color: '#E65100', fontSize: 12, lineHeight: 18, marginBottom: 4 }}>• {rec}</Text>)}
                </View>
              )}
            </>
          )}

          {(!scheduleAnalysis || scheduleAnalysis.totalSessions === 0) && (
            <Text style={{ color: theme.icon, fontSize: 14, textAlign: 'center', paddingVertical: 20 }}>Log some sleep sessions to see schedule analysis and recommendations</Text>
          )}
        </View>

        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#E6EEF5', marginBottom: 100 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text, marginBottom: 10 }}>🌙 About Sleep</Text>
          <Text style={{ color: theme.icon, lineHeight: 22 }}>
            😴 <Text style={{ fontWeight: '600', color: theme.text }}>Sleep</Text> isn't just rest — it's your body's nightly reset. During deep sleep, your brain clears waste, rebuilds memory connections, and restores energy.{"\n\n"}
            🕰️ Keeping a <Text style={{ fontWeight: '600', color: theme.text }}>consistent bedtime</Text> and wake-up time helps balance your internal clock, improving focus, energy, and mood.{"\n\n"}
            🌤️ Even small habits — like dimming lights, avoiding screens, or stretching — can help you fall asleep faster and wake up refreshed.{"\n\n"}
            💡 Use your <Text style={{ fontWeight: '600', color: theme.text }}>Sleep Schedule</Text> below to track your patterns and build better nights, one dream at a time.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
