// app/(tabs)/stats.tsx
// Reading statistics screen

import { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookOpen, Clock, Flame, TrendingUp, Award, Calendar } from 'lucide-react-native';
import { useStore } from '../../src/store/useStore';
import { getThemeColors, formatDuration } from '../../src/lib/utils';

export default function StatsScreen() {
  const { stats, books, theme } = useStore();
  const colors = getThemeColors(theme);

  const statCards = [
    { label: 'Total Books', value: stats?.totalBooks.toString() ?? '0', icon: BookOpen, color: '#a855f7' },
    { label: 'Pages Read', value: (stats?.totalPagesRead ?? 0).toLocaleString(), icon: TrendingUp, color: '#3b82f6' },
    { label: 'Time Spent', value: formatDuration(stats?.totalTimeSpent ?? 0), icon: Clock, color: '#10b981' },
    { label: 'Current Streak', value: `${stats?.currentStreak ?? 0} days`, icon: Flame, color: '#f97316' },
  ];

  const maxPages = Math.max(...(stats?.dailyStats.map((d) => d.pagesRead) ?? [1]), 1);

  const topBooks = useMemo(() => {
    return [...books].sort((a, b) => b.progress - a.progress).slice(0, 5).filter((b) => b.progress > 0);
  }, [books]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Statistics</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Track your reading progress</Text>

        {/* Stat cards */}
        <View style={styles.statGrid}>
          {statCards.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <View key={idx} style={[styles.statCard, { backgroundColor: colors.surface }]}>
                <View style={[styles.statIcon, { backgroundColor: `${stat.color}20` }]}>
                  <Icon color={stat.color} size={20} strokeWidth={1.8} />
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>{stat.label}</Text>
              </View>
            );
          })}
        </View>

        {/* Streak card */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.streakRow}>
            <View style={[styles.statIcon, { backgroundColor: '#f9731620' }]}>
              <Flame color="#f97316" size={28} strokeWidth={1.8} />
            </View>
            <View style={styles.streakInfo}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Reading Streak</Text>
              <Text style={[styles.streakDetail, { color: colors.muted }]}>
                Current: {stats?.currentStreak ?? 0} days · Longest: {stats?.longestStreak ?? 0} days
              </Text>
              <Text style={[styles.streakDetail, { color: colors.muted }]}>
                Last read: {stats?.lastReadDate ?? 'Never'}
              </Text>
            </View>
            {(stats?.currentStreak ?? 0) > 0 && (
              <View style={styles.onFire}>
                <Award color="#f97316" size={20} />
                <Text style={{ color: '#f97316', fontSize: 12, fontWeight: '600' }}>On fire!</Text>
              </View>
            )}
          </View>
        </View>

        {/* Daily activity chart */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.chartHeader}>
            <Calendar color={colors.muted} size={20} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Daily Activity (30 Days)</Text>
          </View>
          {(stats?.dailyStats.length ?? 0) === 0 ? (
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              No reading activity yet. Start reading to see your stats!
            </Text>
          ) : (
            <View style={styles.chart}>
              {stats?.dailyStats.map((day, idx) => {
                const heightPct = (day.pagesRead / maxPages) * 100;
                return (
                  <View key={idx} style={styles.barContainer}>
                    <View
                      style={[styles.bar, { height: `${Math.max(heightPct, 3)}%`, backgroundColor: `${colors.accent}99` }]}
                    />
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Top books */}
        {topBooks.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Most Read Books</Text>
            <View style={styles.topBooksList}>
              {topBooks.map((book, idx) => (
                <View key={book.id} style={styles.topBookItem}>
                  <Text style={[styles.topBookRank, { color: colors.muted }]}>{idx + 1}.</Text>
                  <View style={styles.topBookInfo}>
                    <Text style={[styles.topBookTitle, { color: colors.text }]} numberOfLines={1}>
                      {book.title}
                    </Text>
                    <View style={styles.progressBarContainer}>
                      <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                        <View
                          style={[styles.progressBarFill, { width: `${book.progress}%`, backgroundColor: colors.accent }]}
                        />
                      </View>
                      <Text style={[styles.progressText, { color: colors.muted }]}>
                        {Math.round(book.progress)}%
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: 'bold', fontFamily: 'Georgia' },
  subtitle: { fontSize: 14, color: '#9494a8', marginTop: 2, marginBottom: 20 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, minWidth: '46%', padding: 16, borderRadius: 14 },
  statIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statValue: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 13, marginTop: 4 },
  card: { padding: 20, borderRadius: 14, marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: '600', fontFamily: 'Georgia' },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  streakInfo: { flex: 1 },
  streakDetail: { fontSize: 13, marginTop: 4 },
  onFire: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chartHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  emptyText: { textAlign: 'center', paddingVertical: 32, fontSize: 14 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 2 },
  barContainer: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 3 },
  topBooksList: { marginTop: 16, gap: 12 },
  topBookItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topBookRank: { fontSize: 14, width: 20 },
  topBookInfo: { flex: 1 },
  topBookTitle: { fontSize: 14, fontWeight: '500', marginBottom: 6 },
  progressBarContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressBarBg: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 12 },
});
