// src/components/BookCard.tsx
// Book card for the library grid

import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen, Heart, Trash2, MoreVertical } from 'lucide-react-native';
import { useStore } from '../store/useStore';
import { getThemeColors, formatRelativeTime, generateCoverGradient, getInitials } from '../lib/utils';
import type { Book } from '../shared/types';

interface BookCardProps {
  book: Book;
  onOpen: (book: Book) => void;
  onDelete: (book: Book) => void;
  onToggleFavorite: (book: Book) => void;
}

export default function BookCard({ book, onOpen, onDelete, onToggleFavorite }: BookCardProps) {
  const { theme } = useStore();
  const colors = getThemeColors(theme);
  const [showMenu, setShowMenu] = useState(false);
  const gradient = generateCoverGradient(book.title);
  const initials = getInitials(book.title);
  const cardWidth = (Dimensions.get('window').width - 72) / 3;

  return (
    <>
      <TouchableOpacity
        style={{ width: cardWidth }}
        onPress={() => onOpen(book)}
        onLongPress={() => setShowMenu(true)}
        activeOpacity={0.8}
      >
        {/* Cover */}
        <View style={[styles.cover, { width: cardWidth, height: cardWidth * 1.33 }]}>
          {book.cover_thumbnail ? null : (
            <LinearGradient
              colors={[gradient.from, gradient.to]}
              style={styles.gradientCover}
            >
              <Text style={styles.initials}>{initials}</Text>
              <Text style={styles.coverTitle} numberOfLines={3}>{book.title}</Text>
            </LinearGradient>
          )}

          {/* Favorite badge */}
          {book.is_favorite && (
            <View style={styles.favoriteBadge}>
              <Heart color="white" size={12} fill="white" />
            </View>
          )}

          {/* Menu button */}
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => setShowMenu(true)}
          >
            <MoreVertical color="white" size={16} />
          </TouchableOpacity>

          {/* Open overlay hint */}
          <View style={styles.openHint}>
            <BookOpen color="white" size={24} />
          </View>
        </View>

        {/* Info */}
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {book.title}
        </Text>
        <Text style={[styles.author, { color: colors.muted }]} numberOfLines={1}>
          {book.author || 'Unknown'}
        </Text>

        {/* Progress */}
        <View style={styles.progressRow}>
          <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
            <View
              style={[styles.progressBarFill, { width: `${Math.min(book.progress, 100)}%`, backgroundColor: colors.accent }]}
            />
          </View>
          <Text style={[styles.progressText, { color: colors.muted }]}>
            {Math.round(book.progress)}%
          </Text>
        </View>
        <Text style={[styles.lastRead, { color: colors.muted }]}>
          {formatRelativeTime(book.last_opened)}
        </Text>
      </TouchableOpacity>

      {/* Context menu modal */}
      <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowMenu(false)}>
          <View style={[styles.menu, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => { onToggleFavorite(book); setShowMenu(false); }}
            >
              <Heart
                color={book.is_favorite ? colors.accent : colors.text}
                size={18}
                fill={book.is_favorite ? colors.accent : 'none'}
              />
              <Text style={[styles.menuText, { color: colors.text }]}>
                {book.is_favorite ? 'Unfavorite' : 'Favorite'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => { onDelete(book); setShowMenu(false); }}
            >
              <Trash2 color="#ef4444" size={18} />
              <Text style={[styles.menuText, { color: '#ef4444' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  cover: { borderRadius: 10, overflow: 'hidden', position: 'relative' },
  gradientCover: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 12 },
  initials: { fontSize: 32, fontWeight: 'bold', color: 'rgba(255,255,255,0.9)', fontFamily: 'Georgia', marginBottom: 4 },
  coverTitle: { fontSize: 10, color: 'rgba(255,255,255,0.7)', textAlign: 'center', fontFamily: 'Georgia' },
  favoriteBadge: {
    position: 'absolute', top: 6, right: 6,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(168,85,247,0.9)',
    justifyContent: 'center', alignItems: 'center',
  },
  menuBtn: {
    position: 'absolute', top: 6, left: 6,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  openHint: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 40, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center',
    opacity: 0,
  },
  title: { fontSize: 13, fontWeight: '500', marginTop: 8, fontFamily: 'Georgia' },
  author: { fontSize: 11, marginTop: 2 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  progressBarBg: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 2 },
  progressText: { fontSize: 10 },
  lastRead: { fontSize: 10, marginTop: 4 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  menu: { borderRadius: 14, padding: 8, minWidth: 160, elevation: 5, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16 },
  menuText: { fontSize: 15, fontWeight: '500' },
});
