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
  Text,
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

// ── Pen / ink colors ──────────────────────────────────────────────────────────
const PEN_COLORS = [
  { key: 'black',  value: '#1a1a1a' },
  { key: 'red',    value: '#C0392B' },
  { key: 'blue',   value: '#1A5276' },
  { key: 'green',  value: '#1E8449' },
  { key: 'purple', value: '#6C3483' },
];

// ── Pen thickness presets ─────────────────────────────────────────────────────
const THICKNESSES = [2, 4, 7];

const StickyNoteToolbar = ({ activeNote, onUpdate, onDeactivate }) => {
  if (!activeNote) return null;

  const { id, color, mode, penColor = '#1a1a1a', penThickness = 2, strokes } = activeNote;

  return (
    <View style={styles.container}>
      {/* ── Row 1: Note color + mode toggle + dismiss ── */}
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

        {/* Mode toggle */}
        <TouchableOpacity
          style={[styles.iconBtn, mode === 'draw' && styles.iconBtnActive]}
          onPress={() => onUpdate(id, { mode: mode === 'text' ? 'draw' : 'text' })}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons
            name={mode === 'text' ? 'pencil-outline' : 'text-outline'}
            size={16}
            color={mode === 'draw' ? '#1C1C1E' : 'rgba(255,255,255,0.7)'}
          />
          <Text style={[styles.iconBtnLabel, mode === 'draw' && styles.iconBtnLabelActive]}>
            {mode === 'text' ? 'Draw' : 'Text'}
          </Text>
        </TouchableOpacity>

        {/* Dismiss toolbar (deactivate note) */}
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={onDeactivate}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons name="checkmark" size={16} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>
      </View>

      {/* ── Row 2: Draw controls (only in draw mode) ── */}
      {mode === 'draw' && (
        <View style={styles.row}>
          {/* Pen color dots */}
          <View style={styles.swatchRow}>
            {PEN_COLORS.map((c) => (
              <TouchableOpacity
                key={c.key}
                style={[
                  styles.penSwatch,
                  { backgroundColor: c.value },
                  penColor === c.value && styles.penSwatchActive,
                ]}
                onPress={() => onUpdate(id, { penColor: c.value })}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              />
            ))}
          </View>

          <View style={styles.divider} />

          {/* Thickness presets */}
          {THICKNESSES.map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                styles.thickBtn,
                penThickness === t && styles.thickBtnActive,
              ]}
              onPress={() => onUpdate(id, { penThickness: t })}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <View
                style={[
                  styles.thickDot,
                  {
                    width: t * 2,
                    height: t * 2,
                    borderRadius: t,
                    backgroundColor:
                      penThickness === t
                        ? '#E8D44D'
                        : 'rgba(255,255,255,0.45)',
                  },
                ]}
              />
            </TouchableOpacity>
          ))}

          <View style={styles.divider} />

          {/* Clear drawing */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => onUpdate(id, { strokes: [] })}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            disabled={!strokes || strokes.length === 0}
          >
            <Ionicons
              name="trash-outline"
              size={15}
              color={strokes && strokes.length > 0 ? 'rgba(255,80,80,0.8)' : 'rgba(255,255,255,0.2)'}
            />
          </TouchableOpacity>
        </View>
      )}
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
  penSwatch: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  penSwatchActive: {
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
  iconBtnActive: {
    backgroundColor: '#E8D44D',
  },
  iconBtnLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '500',
  },
  iconBtnLabelActive: {
    color: '#1C1C1E',
  },
  thickBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thickBtnActive: {
    backgroundColor: 'rgba(232,212,77,0.15)',
  },
  thickDot: {
    // size set inline
  },
});

export default StickyNoteToolbar;
