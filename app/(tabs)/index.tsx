// app/(tabs)/index.tsx
// Library screen — grid view of books with search, filters, and PDF import

import { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  RefreshControl, Alert, StyleSheet, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Upload, Library, Clock, Heart, Grid3x3 } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useStore } from '../../src/store/useStore';
import { bookRepo } from '../../src/db/repositories';
import { getThemeColors, formatRelativeTime, generateCoverGradient, getInitials } from '../../src/lib/utils';
import BookCard from '../../src/components/BookCard';
import type { Book } from '../../src/shared/types';

const { width } = Dimensions.get('window');
const numColumns = width > 600 ? 4 : 3;

export default function LibraryScreen() {
  const {
    books, searchQuery, setSearchQuery, filterMode, setFilterMode,
    addBook, updateBook, removeBook, setCurrentBook, setCurrentPage,
    setIsReading, theme,
  } = useStore();
  const colors = getThemeColors(theme);
  const [refreshing, setRefreshing] = useState(false);
  const [importing, setImporting] = useState(false);

  const filteredBooks = useMemo(() => {
    let result = [...books];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) => b.title.toLowerCase().includes(q) || (b.author?.toLowerCase().includes(q) ?? false)
      );
    }
    switch (filterMode) {
      case 'recent':
        result = result
          .filter((b) => b.last_opened !== null)
          .sort((a, b) => new Date(b.last_opened!).getTime() - new Date(a.last_opened!).getTime());
        break;
      case 'favorites':
        result = result.filter((b) => b.is_favorite);
        break;
      default:
        result = result.sort((a, b) => new Date(b.date_added).getTime() - new Date(a.date_added).getTime());
    }
    return result;
  }, [books, searchQuery, filterMode]);

  const handleOpenBook = useCallback(async (book: Book) => {
    setCurrentBook(book);
    setCurrentPage(book.last_read_page || 1);
    setIsReading(true);
    const now = new Date().toISOString();
    await bookRepo.update(book.id, { last_opened: now });
    updateBook(book.id, { last_opened: now });
  }, [setCurrentBook, setCurrentPage, setIsReading, updateBook]);

  const handleImportPdf = useCallback(async () => {
    try {
      setImporting(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets) return;

      for (const asset of result.assets) {
        try {
          // Copy PDF to app's document directory for persistent access
          const fileName = asset.name;
          const destPath = `${FileSystem.documentDirectory}pdfs/${fileName}`;
          const dirInfo = await FileSystem.getInfoAsync(`${FileSystem.documentDirectory}pdfs/`);
          if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}pdfs/`);
          }
          await FileSystem.copyAsync({ from: asset.uri, to: destPath });

          const title = fileName.replace(/\.pdf$/i, '').replace(/[_-]/g, ' ');
          const fileInfo = await FileSystem.getInfoAsync(destPath, { size: true });

          const book = await bookRepo.add({
            title,
            author: null,
            file_path: destPath,
            file_size: (fileInfo as any).size ?? 0,
            page_count: 0,
            cover_thumbnail: null,
          });
          addBook(book);
        } catch (error) {
          console.error(`Failed to import ${asset.name}:`, error);
          Alert.alert('Import Error', `Failed to import ${asset.name}`);
        }
      }
    } catch (error) {
      console.error('Document picker error:', error);
    } finally {
      setImporting(false);
    }
  }, [addBook]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    const allBooks = await bookRepo.getAll();
    useStore.getState().setBooks(allBooks);
    setRefreshing(false);
  }, []);

  const handleDeleteBook = useCallback((book: Book) => {
    Alert.alert(
      'Delete Book',
      `Remove "${book.title}" from your library?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await bookRepo.delete(book.id);
            removeBook(book.id);
          },
        },
      ]
    );
  }, [removeBook]);

  const handleToggleFavorite = useCallback(async (book: Book) => {
    const updated = await bookRepo.toggleFavorite(book.id);
    if (updated) updateBook(book.id, updated);
  }, [updateBook]);

  const filterTabs = [
    { id: 'all' as const, label: 'All', icon: Library },
    { id: 'recent' as const, label: 'Recent', icon: Clock },
    { id: 'favorites' as const, label: 'Favorites', icon: Heart },
  ];

  const renderItem = ({ item }: { item: Book }) => (
    <BookCard
      book={item}
      onOpen={handleOpenBook}
      onDelete={handleDeleteBook}
      onToggleFavorite={handleToggleFavorite}
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>My Library</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              {books.length} {books.length === 1 ? 'book' : 'books'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleImportPdf}
            disabled={importing}
            style={[styles.addButton, { backgroundColor: colors.accent }]}
          >
            <Upload color="white" size={18} strokeWidth={2} />
            <Text style={styles.addButtonText}>
              {importing ? 'Importing...' : 'Add PDF'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Search color={colors.muted} size={18} style={styles.searchIcon} />
          <TextInput
            placeholder="Search by title or author..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>

        {/* Filter tabs */}
        <View style={styles.filterRow}>
          {filterTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = filterMode === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setFilterMode(tab.id)}
                style={[
                  styles.filterTab,
                  isActive && { backgroundColor: `${colors.accent}25` },
                ]}
              >
                <Icon
                  color={isActive ? colors.accent : colors.muted}
                  size={16}
                  strokeWidth={1.8}
                />
                <Text
                  style={[
                    styles.filterText,
                    { color: isActive ? colors.accent : colors.muted },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Book grid */}
      <FlatList
        data={filteredBooks}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={numColumns}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.columnWrapper}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Grid3x3 color={colors.muted} size={48} strokeWidth={1.5} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Your library is empty
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
              Tap "Add PDF" to import your first book
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', fontFamily: 'Georgia' },
  subtitle: { fontSize: 14, marginTop: 2 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15 },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  filterText: { fontSize: 13, fontWeight: '500' },
  grid: { paddingHorizontal: 20, paddingBottom: 20 },
  columnWrapper: { gap: 16, marginBottom: 16 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 20, fontWeight: '600', fontFamily: 'Georgia', marginTop: 16 },
  emptySubtitle: { fontSize: 14, marginTop: 8, textAlign: 'center' },
});
