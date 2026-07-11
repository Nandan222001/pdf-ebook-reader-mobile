// src/components/HighlightPopup.tsx
// Color picker popup for creating highlights

import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { X } from 'lucide-react-native';
import type { HighlightColor } from '../shared/types';

interface HighlightPopupProps {
  onSelectColor: (color: HighlightColor) => void;
  onClose: () => void;
  accentColor: string;
}

const COLORS: { color: HighlightColor; bg: string; label: string }[] = [
  { color: 'yellow', bg: '#facc15', label: 'Yellow' },
  { color: 'green', bg: '#22c55e', label: 'Green' },
  { color: 'blue', bg: '#3b82f6', label: 'Blue' },
  { color: 'pink', bg: '#ec4899', label: 'Pink' },
  { color: 'orange', bg: '#f97316', label: 'Orange' },
];

export default function HighlightPopup({ onSelectColor, onClose, accentColor }: HighlightPopupProps) {
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.popup}>
          <View style={styles.header}>
            <Text style={styles.title}>Highlight Color</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color="#666" size={20} />
            </TouchableOpacity>
          </View>
          <View style={styles.colorRow}>
            {COLORS.map(({ color, bg, label }) => (
              <TouchableOpacity
                key={color}
                onPress={() => onSelectColor(color)}
                style={styles.colorBtn}
              >
                <View style={[styles.colorCircle, { backgroundColor: bg }]} />
                <Text style={styles.colorLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  popup: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '600', fontFamily: 'Georgia', color: '#1a1a2e' },
  closeBtn: { padding: 4 },
  colorRow: { flexDirection: 'row', justifyContent: 'space-around' },
  colorBtn: { alignItems: 'center', gap: 8 },
  colorCircle: { width: 44, height: 44, borderRadius: 22 },
  colorLabel: { fontSize: 12, color: '#666', fontWeight: '500' },
});
