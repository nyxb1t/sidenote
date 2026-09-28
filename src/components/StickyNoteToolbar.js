/**
 * StickyNoteToolbar
 *
 * Floating toolbar shown ONLY when a sticky note is active (activeNote !== null).
 * Rendered inside bottomFixed, above the action panel.
 *
 * Props:
 *   activeNote     — the currently active note object (or null)
 *   onUpdate       — (id, patch) => void
 *   onDeactivate   — () => void  (called when toolbar dismiss is tapped)
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ── Note background color palette ─────────────────────────────────────────────
const NOTE_COLORS = [
  { key: 'yellow', value: '#FDEE87' },
  { key: 'pink',   value: '#FFB3BA' },
  { key: 'blue',   value: '#AED6F1' },
  { key: 'green',  value: '#ABEBC6' },
  { key: 'orange', value: '#FAD7A0' },
];

const StickyNoteToolbar = ({ activeNote, onUpdate, onDeactivate }) => {
  if (!activeNote) return null;

  const { id, color } = activeNote;

  return (
    <View style={styles.container}>
      {/* ── Row: Note color + dismiss ── */}
      <View style={styles.row}>
        {/* Background color swatches */}
        <View style={styles.swatchRow}>
          {NOTE_COLORS.map((c) => (
            <TouchableOpacity
              key={c.key}
              style={[
                styles.swatch,
                { backgroundColor: c.value },
                color === c.value && styles.swatchActive,
              ]}
              onPress={() => onUpdate(id, { color: c.value })}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            />
          ))}
        </View>

        <View style={styles.divider} />

        {/* Dismiss toolbar (deactivate note) */}
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={onDeactivate}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons name="checkmark" size={16} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(28,28,30,0.97)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
  },
  swatch: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  swatchActive: {
    borderColor: '#E8D44D',
    borderWidth: 2,
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 2,
  },
  iconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
});

export default StickyNoteToolbar;
