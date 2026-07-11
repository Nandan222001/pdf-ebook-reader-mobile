// app/(tabs)/settings.tsx
// Settings screen — profile, themes, reading preferences, data management

import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Switch,
  ScrollView, StyleSheet, Alert, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Palette, Volume2, BookOpen, Download, Save } from 'lucide-react-native';
import { useStore } from '../../src/store/useStore';
import { getThemeColors, exportAnnotationsMarkdown } from '../../src/lib/utils';
import { profileRepo } from '../../src/db/repositories';
import type { ThemeName } from '../../src/shared/types';

export default function SettingsScreen() {
  const { profile, theme, setTheme, updatePreferences, highlights, bookmarks, annotations, currentBook } = useStore();
  const colors = getThemeColors(theme);
  const [name, setName] = useState(profile?.name ?? 'Reader');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [savedMsg, setSavedMsg] = useState(false);

  if (!profile) return null;
  const prefs = profile.preferences;

  const handleSaveProfile = async () => {
    await profileRepo.update(name, email || null);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

  const handleExport = async () => {
    if (!currentBook) {
      Alert.alert('No Book Selected', 'Open a book first to export its annotations.');
      return;
    }
    const md = exportAnnotationsMarkdown(
      currentBook.title, currentBook.author, highlights, bookmarks, annotations
    );
    try {
      await Share.share({ message: md, title: `${currentBook.title}_annotations.md` });
    } catch (e) {
      Alert.alert('Export Failed', 'Could not share annotations.');
    }
  };

  const themes: { id: ThemeName; label: string; bg: string }[] = [
    { id: 'dark', label: 'Dark', bg: '#1a1a2e' },
    { id: 'light', label: 'Light', bg: '#f7f7f5' },
    { id: 'sepia', label: 'Sepia', bg: '#f4e9d2' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Customize your reading experience</Text>

        {/* Profile */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <User color={colors.accent} size={20} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Profile</Text>
          </View>
          <Text style={[styles.label, { color: colors.text }]}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]}
          />
          <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>Email (optional)</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="reader@example.com"
            placeholderTextColor={colors.muted}
            style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]}
          />
          <TouchableOpacity
            onPress={handleSaveProfile}
            style={[styles.saveBtn, { backgroundColor: colors.accent }]}
          >
            <Save color="white" size={16} />
            <Text style={styles.saveBtnText}>Save Profile</Text>
          </TouchableOpacity>
          {savedMsg && <Text style={styles.savedMsg}>Saved!</Text>}
        </View>

        {/* Theme */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Palette color={colors.accent} size={20} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
          </View>
          <View style={styles.themeRow}>
            {themes.map((t) => (
              <TouchableOpacity
                key={t.id}
                onPress={() => setTheme(t.id)}
                style={[
                  styles.themeCard,
                  { backgroundColor: colors.bg, borderColor: theme === t.id ? colors.accent : colors.border, borderWidth: 2 },
                ]}
              >
                <View style={[styles.themePreview, { backgroundColor: t.bg }]} />
                <Text style={[styles.themeLabel, { color: colors.text }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Reading Preferences */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <BookOpen color={colors.accent} size={20} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Reading</Text>
          </View>
          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: colors.text }]}>Show Page Numbers</Text>
            <Switch
              value={prefs.showPageNumbers}
              onValueChange={(v) => updatePreferences({ showPageNumbers: v })}
              trackColor={{ false: colors.border, true: colors.accent }}
            />
          </View>
          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: colors.text }]}>Page-Turn Sound</Text>
            <Switch
              value={prefs.pageFlipSound}
              onValueChange={(v) => updatePreferences({ pageFlipSound: v })}
              trackColor={{ false: colors.border, true: colors.accent }}
            />
          </View>
        </View>

        {/* Export */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Download color={colors.accent} size={20} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Export</Text>
          </View>
          <Text style={[styles.sectionDesc, { color: colors.muted }]}>
            Export annotations from the current book as Markdown.
          </Text>
          <TouchableOpacity
            onPress={handleExport}
            style={[styles.saveBtn, { backgroundColor: colors.accent }]}
          >
            <Download color="white" size={16} />
            <Text style={styles.saveBtnText}>Export Annotations</Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <Text style={[styles.about, { color: colors.muted }]}>
          PDF eBook Reader v1.0.0 · React Native + Expo
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: 'bold', fontFamily: 'Georgia' },
  subtitle: { fontSize: 14, marginTop: 2, marginBottom: 20 },
  section: { padding: 20, borderRadius: 14, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', fontFamily: 'Georgia' },
  sectionDesc: { fontSize: 14, marginBottom: 16, lineHeight: 20 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  saveBtnText: { color: 'white', fontSize: 14, fontWeight: '600' },
  savedMsg: { color: '#10b981', fontSize: 14, textAlign: 'center', marginTop: 8 },
  themeRow: { flexDirection: 'row', gap: 12 },
  themeCard: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center' },
  themePreview: { width: '100%', height: 50, borderRadius: 8, marginBottom: 8 },
  themeLabel: { fontSize: 14, fontWeight: '500' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  toggleLabel: { fontSize: 15 },
  about: { fontSize: 13, textAlign: 'center', marginTop: 16 },
});
