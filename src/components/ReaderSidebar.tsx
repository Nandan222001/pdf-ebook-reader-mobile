// src/components/ReaderSidebar.tsx
// Sidebar panel in reading mode — bookmarks, highlights, notes

import { View, Text, TouchableOpacity, FlatList, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { BookMarked, Highlighter, StickyNote, Trash2, X, Plus } from 'lucide-react-native';
import { useStore } from '../store/useStore';
import { getThemeColors } from '../lib/utils';
import { bookmarkRepo, highlightRepo, annotationRepo } from '../db/repositories';

interface ReaderSidebarProps {
  activeTab: 'bookmarks' | 'highlights' | 'notes';
  onTabChange: (tab: 'bookmarks' | 'highlights' | 'notes') => void;
  onClose: () => void;
  onNavigatePage: (page: number) => void;
}

export default function ReaderSidebar({ activeTab, onTabChange, onClose, onNavigatePage }: ReaderSidebarProps) {
  const {
    bookmarks, removeBookmark, highlights, removeHighlight,
    annotations, removeAnnotation, currentBook, currentPage, theme,
  } = useStore();
  const colors = getThemeColors(theme);

  const tabs = [
    { id: 'bookmarks' as const, label: 'Bookmarks', icon: BookMarked, count: bookmarks.length },
    { id: 'highlights' as const, label: 'Highlights', icon: Highlighter, count: highlights.length },
    { id: 'notes' as const, label: 'Notes', icon: StickyNote, count: annotations.length },
  ];

  const handleDeleteBookmark = async (id: number) => {
    await bookmarkRepo.delete(id);
    removeBookmark(id);
  };

  const handleDeleteHighlight = async (id: number) => {
    await highlightRepo.delete(id);
    removeHighlight(id);
  };

  const handleDeleteAnnotation = async (id: number) => {
    await annotationRepo.delete(id);
    removeAnnotation(id);
  };

  return (
    <View style={[styles.overlay]}>
      <View style={[styles.sidebar, { backgroundColor: colors.surface }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Annotations</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X color={colors.text} size={20} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => onTabChange(tab.id)}
                style={[styles.tab, isActive && { borderBottomColor: colors.accent, borderBottomWidth: 2 }]}
              >
                <Icon color={isActive ? colors.accent : colors.muted} size={18} />
                <Text style={[styles.tabLabel, { color: isActive ? colors.accent : colors.muted }]}>
                  {tab.count}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Content */}
        <ScrollView style={styles.content} contentContainerStyle={{ padding: 16 }}>
          {activeTab === 'bookmarks' && (
            bookmarks.length === 0 ? (
              <EmptyState icon={BookMarked} message="No bookmarks yet." color={colors.muted} />
            ) : (
              bookmarks.sort((a, b) => a.page_number - b.page_number).map((bm) => (
                <View key={bm.id} style={[styles.itemCard, { backgroundColor: colors.bg }]}>
                  <TouchableOpacity
                    style={styles.itemContent}
                    onPress={() => onNavigatePage(bm.page_number)}
                  >
                    <Text style={[styles.itemTitle, { color: colors.text }]}>{bm.title}</Text>
                    <Text style={[styles.itemMeta, { color: colors.muted }]}>Page {bm.page_number}</Text>
                    {bm.note && <Text style={[styles.itemNote, { color: colors.muted }]}>{bm.note}</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteBookmark(bm.id)} style={styles.deleteBtn}>
                    <Trash2 color={colors.muted} size={16} />
                  </TouchableOpacity>
                </View>
              ))
            )
          )}

          {activeTab === 'highlights' && (
            highlights.length === 0 ? (
              <EmptyState icon={Highlighter} message="No highlights yet." color={colors.muted} />
            ) : (
              highlights.sort((a, b) => a.page_number - b.page_number).map((hl) => (
                <View key={hl.id} style={[styles.itemCard, { backgroundColor: colors.bg }]}>
                  <TouchableOpacity
                    style={styles.itemContent}
                    onPress={() => onNavigatePage(hl.page_number)}
                  >
                    <View style={styles.highlightHeader}>
                      <View style={[styles.colorDot, { backgroundColor: getHighlightColor(hl.color) }]} />
                      <Text style={[styles.itemMeta, { color: colors.muted }]}>Page {hl.page_number}</Text>
                    </View>
                    <Text style={[styles.highlightText, { color: colors.text }]}>"{hl.text}"</Text>
                    {hl.note && <Text style={[styles.itemNote, { color: colors.muted }]}>{hl.note}</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteHighlight(hl.id)} style={styles.deleteBtn}>
                    <Trash2 color={colors.muted} size={16} />
                  </TouchableOpacity>
                </View>
              ))
            )
          )}

          {activeTab === 'notes' && (
            annotations.length === 0 ? (
              <EmptyState icon={StickyNote} message="No notes yet." color={colors.muted} />
            ) : (
              annotations.sort((a, b) => a.page_number - b.page_number).map((ann) => (
                <View key={ann.id} style={[styles.itemCard, { backgroundColor: colors.bg }]}>
                  <TouchableOpacity
                    style={styles.itemContent}
                    onPress={() => onNavigatePage(ann.page_number)}
                  >
                    <Text style={[styles.itemMeta, { color: colors.muted }]}>Page {ann.page_number}</Text>
                    <Text style={[styles.noteText, { color: colors.text }]}>{ann.content}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteAnnotation(ann.id)} style={styles.deleteBtn}>
                    <Trash2 color={colors.muted} size={16} />
                  </TouchableOpacity>
                </View>
              ))
            )
          )}
        </ScrollView>
      </View>
    </View>
  );
}

function getHighlightColor(color: string): string {
  const colors: Record<string, string> = {
    yellow: '#facc15', green: '#22c55e', blue: '#3b82f6', pink: '#ec4899', orange: '#f97316',
  };
  return colors[color] ?? '#facc15';
}

function EmptyState({ icon: Icon, message, color }: { icon: any; message: string; color: string }) {
  return (
    <View style={styles.emptyState}>
      <Icon color={color} size={32} strokeWidth={1.5} />
      <Text style={[styles.emptyText, { color }]}>{message}</Text>
    </View>
  );
}

const sidebarWidth = Dimensions.get('window').width * 0.85;

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, bottom: 0, right: 0, width: sidebarWidth, zIndex: 30, backgroundColor: 'rgba(0,0,0,0.3)' },
  sidebar: { flex: 1, marginLeft: 'auto', width: sidebarWidth * 0.9 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: '600', fontFamily: 'Georgia' },
  closeBtn: { padding: 4 },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14 },
  tabLabel: { fontSize: 13, fontWeight: '600' },
  content: { flex: 1 },
  itemCard: { flexDirection: 'row', borderRadius: 12, padding: 14, marginBottom: 10 },
  itemContent: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: '500', fontFamily: 'Georgia' },
  itemMeta: { fontSize: 12, marginTop: 4 },
  itemNote: { fontSize: 12, marginTop: 6, fontStyle: 'italic' },
  highlightHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  colorDot: { width: 10, height: 10, borderRadius: 5 },
  highlightText: { fontSize: 14, fontStyle: 'italic', fontFamily: 'Georgia' },
  noteText: { fontSize: 14, marginTop: 6 },
  deleteBtn: { padding: 8 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, marginTop: 12, textAlign: 'center' },
});
