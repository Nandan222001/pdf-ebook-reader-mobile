// app/reader.tsx
// Reader screen — full-screen PDF reader with navigation, zoom, and annotations

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  TextInput, ScrollView, Alert, Share,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  X, ChevronLeft, ChevronRight, Bookmark, BookmarkCheck,
  ZoomIn, ZoomOut, StickyNote, Highlighter, Download,
  ChevronFirst, ChevronLast,
} from 'lucide-react-native';
import Pdf from 'react-native-pdf';
import { useStore } from '../src/store/useStore';
import { getThemeColors, exportAnnotationsMarkdown, debounce } from '../src/lib/utils';
import { bookRepo, bookmarkRepo, highlightRepo, annotationRepo } from '../src/db/repositories';
import ReaderSidebar from '../src/components/ReaderSidebar';
import HighlightPopup from '../src/components/HighlightPopup';
import type { HighlightColor } from '../src/shared/types';

export default function ReaderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    currentBook, currentPage, setCurrentPage, totalPages, setTotalPages,
    theme, bookmarks, setBookmarks, addBookmark, removeBookmark,
    highlights, setHighlights, addHighlight,
    annotations, setAnnotations, addAnnotation,
    startSession, endSession, updateBook,
  } = useStore();
  const colors = getThemeColors(theme);

  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState(1.0);
  const [showToolbar, setShowToolbar] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'bookmarks' | 'highlights' | 'notes'>('bookmarks');
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [showHighlightPopup, setShowHighlightPopup] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const sessionStartRef = useRef<number>(0);

  // Load book data
  useEffect(() => {
    if (!currentBook) {
      router.back();
      return;
    }

    (async () => {
      try {
        const [bms, hls, anns] = await Promise.all([
          bookmarkRepo.getByBook(currentBook.id),
          highlightRepo.getByBook(currentBook.id),
          annotationRepo.getByBook(currentBook.id),
        ]);
        setBookmarks(bms);
        setHighlights(hls);
        setAnnotations(anns);
        startSession(currentBook.last_read_page || 1);
        sessionStartRef.current = Date.now();
      } catch (error) {
        console.error('Failed to load book data:', error);
      } finally {
        setIsLoading(false);
      }
    })();

    return () => {
      if (sessionStartRef.current > 0) {
        endSession();
      }
    };
  }, [currentBook?.id]);

  // Save progress (debounced)
  const saveProgress = useCallback(
    debounce((page: number, total: number) => {
      if (currentBook) {
        bookRepo.updateProgress(currentBook.id, page, total);
        updateBook(currentBook.id, {
          last_read_page: page,
          progress: total > 0 ? (page / total) * 100 : 0,
        });
      }
    }, 1000),
    [currentBook]
  );

  const handlePageChange = useCallback((page: number) => {
    if (page < 1 || (totalPages > 0 && page > totalPages)) return;
    setCurrentPage(page);
    saveProgress(page, totalPages);
  }, [totalPages, setCurrentPage, saveProgress]);

  const handleToggleBookmark = useCallback(async () => {
    if (!currentBook) return;
    const existing = bookmarks.find((b) => b.page_number === currentPage);
    if (existing) {
      await bookmarkRepo.delete(existing.id);
      removeBookmark(existing.id);
    } else {
      const bm = await bookmarkRepo.add(currentBook.id, currentPage, `Page ${currentPage}`, null);
      addBookmark(bm);
    }
  }, [currentBook, currentPage, bookmarks, addBookmark, removeBookmark]);

  const handleCreateHighlight = useCallback(async (color: HighlightColor) => {
    if (!currentBook || !selectedText) return;
    const hl = await highlightRepo.add({
      book_id: currentBook.id,
      page_number: currentPage,
      text: selectedText,
      color,
      note: null,
      start_position: 0,
      end_position: selectedText.length,
    });
    addHighlight(hl);
    setSelectedText(null);
    setShowHighlightPopup(false);
  }, [currentBook, currentPage, selectedText, addHighlight]);

  const handleAddNote = useCallback(async () => {
    if (!currentBook || !noteInput.trim()) return;
    const ann = await annotationRepo.add({
      book_id: currentBook.id,
      page_number: currentPage,
      type: 'note',
      content: noteInput.trim(),
    });
    addAnnotation(ann);
    setNoteInput('');
    setShowNoteInput(false);
  }, [currentBook, currentPage, noteInput, addAnnotation]);

  const handleExport = useCallback(async () => {
    if (!currentBook) return;
    const md = exportAnnotationsMarkdown(currentBook.title, currentBook.author, highlights, bookmarks, annotations);
    try {
      await Share.share({ message: md, title: `${currentBook.title}_annotations.md` });
    } catch (e) {
      Alert.alert('Export Failed', 'Could not share annotations.');
    }
  }, [currentBook, highlights, bookmarks, annotations]);

  const handleExit = useCallback(() => {
    if (sessionStartRef.current > 0) {
      endSession();
    }
    router.back();
  }, [router, endSession]);

  const isBookmarked = bookmarks.some((b) => b.page_number === currentPage);

  if (!currentBook) return null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={[]}>
      {/* PDF Viewer */}
      <View style={styles.pdfContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.loadingText, { color: colors.muted }]}>Loading book...</Text>
          </View>
        ) : (
          <Pdf
            source={{ uri: currentBook.file_path, cache: true }}
            page={currentPage}
            scale={zoom}
            minScale={0.5}
            maxScale={3}
            horizontal={false}
            onLoadComplete={(numberOfPages) => {
              setTotalPages(numberOfPages);
              if (currentBook.page_count === 0) {
                bookRepo.update(currentBook.id, { page_count: numberOfPages });
                updateBook(currentBook.id, { page_count: numberOfPages });
              }
            }}
            onPageChanged={(page) => {
              setCurrentPage(page);
              saveProgress(page, totalPages);
            }}
            onError={(error) => console.error('PDF error:', error)}
            style={styles.pdf}
            enablePaging={true}
            fitPolicy={0}
            spacing={0}
          />
        )}

        {/* Tap zone to toggle toolbar */}
        <TouchableOpacity
          style={styles.tapZone}
          onPress={() => setShowToolbar(!showToolbar)}
          activeOpacity={1}
        />
      </View>

      {/* Top Toolbar */}
      {showToolbar && (
        <View style={[styles.toolbar, { backgroundColor: colors.surface, paddingTop: insets.top }]}>
          <View style={styles.toolbarRow}>
            <TouchableOpacity onPress={handleExit} style={styles.toolbarBtn}>
              <X color={colors.text} size={22} />
            </TouchableOpacity>
            <View style={styles.toolbarTitle}>
              <Text style={[styles.bookTitle, { color: colors.text }]} numberOfLines={1}>
                {currentBook.title}
              </Text>
              <Text style={[styles.bookAuthor, { color: colors.muted }]} numberOfLines={1}>
                {currentBook.author || 'Unknown Author'}
              </Text>
            </View>
            <TouchableOpacity onPress={handleToggleBookmark} style={styles.toolbarBtn}>
              {isBookmarked ? (
                <BookmarkCheck color={colors.accent} size={22} />
              ) : (
                <Bookmark color={colors.text} size={22} />
              )}
            </TouchableOpacity>
          </View>

          {/* Navigation row */}
          <View style={styles.navRow}>
            <TouchableOpacity
              onPress={() => handlePageChange(1)}
              disabled={currentPage <= 1}
              style={styles.navBtn}
            >
              <ChevronFirst color={currentPage <= 1 ? colors.border : colors.text} size={20} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              style={styles.navBtn}
            >
              <ChevronLeft color={currentPage <= 1 ? colors.border : colors.text} size={20} />
            </TouchableOpacity>
            <Text style={[styles.pageText, { color: colors.text }]}>
              {currentPage} / {totalPages || '?'}
            </Text>
            <TouchableOpacity
              onPress={() => handlePageChange(currentPage + 1)}
              disabled={totalPages > 0 && currentPage >= totalPages}
              style={styles.navBtn}
            >
              <ChevronRight color={totalPages > 0 && currentPage >= totalPages ? colors.border : colors.text} size={20} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handlePageChange(totalPages)}
              disabled={totalPages > 0 && currentPage >= totalPages}
              style={styles.navBtn}
            >
              <ChevronLast color={totalPages > 0 && currentPage >= totalPages ? colors.border : colors.text} size={20} />
            </TouchableOpacity>

            <View style={styles.spacer} />

            <TouchableOpacity onPress={() => setZoom(Math.max(0.5, zoom - 0.25))} style={styles.navBtn}>
              <ZoomOut color={colors.text} size={18} />
            </TouchableOpacity>
            <Text style={[styles.zoomText, { color: colors.muted }]}>{Math.round(zoom * 100)}%</Text>
            <TouchableOpacity onPress={() => setZoom(Math.min(3, zoom + 0.25))} style={styles.navBtn}>
              <ZoomIn color={colors.text} size={18} />
            </TouchableOpacity>

            <View style={styles.spacer} />

            <TouchableOpacity
              onPress={() => { setSidebarTab('highlights'); setShowHighlightPopup(true); }}
              style={styles.navBtn}
            >
              <Highlighter color={colors.text} size={18} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setSidebarTab('notes'); setShowNoteInput(true); }}
              style={styles.navBtn}
            >
              <StickyNote color={colors.text} size={18} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setSidebarTab('bookmarks'); setSidebarOpen(!sidebarOpen); }}
              style={styles.navBtn}
            >
              <Bookmark color={sidebarOpen ? colors.accent : colors.text} size={18} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleExport} style={styles.navBtn}>
              <Download color={colors.text} size={18} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Bottom progress bar */}
      {showToolbar && (
        <View style={[styles.bottomBar, { backgroundColor: colors.surface, paddingBottom: insets.bottom }]}>
          <View style={styles.progressRow}>
            <Text style={[styles.progressText, { color: colors.muted }]}>
              {totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0}%
            </Text>
            <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${totalPages > 0 ? (currentPage / totalPages) * 100 : 0}%`,
                    backgroundColor: colors.accent,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      )}

      {/* Sidebar */}
      {sidebarOpen && (
        <ReaderSidebar
          activeTab={sidebarTab}
          onTabChange={setSidebarTab}
          onClose={() => setSidebarOpen(false)}
          onNavigatePage={(page) => {
            handlePageChange(page);
            setSidebarOpen(false);
          }}
        />
      )}

      {/* Highlight popup */}
      {showHighlightPopup && (
        <HighlightPopup
          onSelectColor={handleCreateHighlight}
          onClose={() => setShowHighlightPopup(false)}
          accentColor={colors.accent}
        />
      )}

      {/* Note input modal */}
      {showNoteInput && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.noteOverlay}
        >
          <View style={[styles.noteModal, { backgroundColor: colors.surface }]}>
            <Text style={[styles.noteModalTitle, { color: colors.text }]}>
              Add Note — Page {currentPage}
            </Text>
            <TextInput
              autoFocus
              multiline
              value={noteInput}
              onChangeText={setNoteInput}
              placeholder="Type your note..."
              placeholderTextColor={colors.muted}
              style={[styles.noteTextInput, { backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }]}
            />
            <View style={styles.noteModalButtons}>
              <TouchableOpacity
                onPress={() => { setShowNoteInput(false); setNoteInput(''); }}
                style={[styles.noteBtn, { borderColor: colors.border }]}
              >
                <Text style={{ color: colors.muted }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddNote}
                disabled={!noteInput.trim()}
                style={[styles.noteBtn, { backgroundColor: colors.accent, opacity: noteInput.trim() ? 1 : 0.5 }]}
              >
                <Text style={{ color: 'white', fontWeight: '600' }}>Add Note</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const { height, width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1 },
  pdfContainer: { flex: 1 },
  pdf: { flex: 1, width: width, height: height },
  tapZone: { position: 'absolute', top: height * 0.3, left: 0, right: 0, height: height * 0.4 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontFamily: 'Georgia', fontSize: 16 },
  toolbar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  toolbarRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  toolbarBtn: { padding: 8 },
  toolbarTitle: { flex: 1, alignItems: 'center' },
  bookTitle: { fontSize: 14, fontWeight: '600', fontFamily: 'Georgia' },
  bookAuthor: { fontSize: 12, marginTop: 2 },
  navRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 8, gap: 4 },
  navBtn: { padding: 6 },
  pageText: { fontSize: 14, fontWeight: '500', marginHorizontal: 8 },
  zoomText: { fontSize: 12, marginHorizontal: 4 },
  spacer: { width: 8 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10 },
  progressRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 12 },
  progressBarBg: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 12, fontWeight: '500' },
  noteOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20 },
  noteModal: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 30 },
  noteModalTitle: { fontSize: 16, fontWeight: '600', fontFamily: 'Georgia', marginBottom: 12 },
  noteTextInput: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15, minHeight: 80, textAlignVertical: 'top' },
  noteModalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12 },
  noteBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
});
