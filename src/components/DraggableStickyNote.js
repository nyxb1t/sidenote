/**
 * DraggableStickyNote
 *
 * Props:
 *   note        — full note data object
 *   isActive    — whether this note is currently selected
 *   onActivate  — (id) => void
 *   onUpdate    — (id, patch) => void
 *   onRemove    — (id) => void
 *   onDragStart — () => void  (disables ScrollView scroll)
 *   onDragEnd   — () => void  (re-enables ScrollView scroll)
 *
 * Characteristics:
 *   - Proportional scale-based resizing (scale = currentSize / BASE_SIZE)
 *   - Top-left scaling simulated via translate -> scale -> translate back
 *   - Outer container size remains dynamic for layout, hit-testing, and dragging
 *   - Resize handle on outer container bottom-right
 *   - Drag only via header strip
 *   - Text-only sticky notes (drawing mode removed)
 *   - Newly created notes auto-activate on mount via autoFocus
 *   - Multiple notes fully independent (no shared refs/state)
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Animated,
  PanResponder,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Base size constant for scale calculations
const BASE_SIZE = 200;
// Note size constraints
const MIN_SIZE = 100;
const MAX_SIZE = 360;

const DraggableStickyNote = ({
  note,
  isActive,
  onActivate,
  onUpdate,
  onRemove,
  onDragStart,
  onDragEnd,
}) => {
  const { id, offsetX, offsetY, width, height, text, color } = note;

  // ── Size state & ref (synchronized with note data) ───────────────────────
  const initialSize = width || BASE_SIZE;
  const [currentSize, setCurrentSize] = useState(initialSize);
  const sizeRef = useRef(initialSize);

  // ── Animated position (initialised from note data) ─────────────────────────
  const posX = useRef(new Animated.Value(offsetX)).current;
  const posY = useRef(new Animated.Value(offsetY)).current;
  const posRef = useRef({ x: offsetX, y: offsetY });

  // ── Sync animated values and size when note prop changes externally ───────
  useEffect(() => {
    posX.setValue(offsetX);
    posY.setValue(offsetY);
    posRef.current = { x: offsetX, y: offsetY };
  }, [offsetX, offsetY]);

  useEffect(() => {
    const s = note.width || BASE_SIZE;
    setCurrentSize(s);
    sizeRef.current = s;
  }, [note.width]);

  // ── PanResponder: DRAG (header only) ──────────────────────────────────────
  const dragBase = useRef({ x: 0, y: 0 });

  const dragResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 2 || Math.abs(gs.dy) > 2,

      onPanResponderGrant: () => {
        dragBase.current = { x: posRef.current.x, y: posRef.current.y };
        onDragStart?.();
      },

      onPanResponderMove: (_, gs) => {
        const nx = dragBase.current.x + gs.dx;
        const ny = dragBase.current.y + gs.dy;
        posX.setValue(nx);
        posY.setValue(ny);
        posRef.current = { x: nx, y: ny };
      },

      onPanResponderRelease: () => {
        onUpdate(id, { offsetX: posRef.current.x, offsetY: posRef.current.y });
        onDragEnd?.();
      },

      onPanResponderTerminate: () => {
        onDragEnd?.();
      },
    })
  ).current;

  // ── PanResponder: RESIZE (bottom-right handle) ────────────────────────────
  const resizeBase = useRef(initialSize);

  const resizeResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        resizeBase.current = sizeRef.current;
        onDragStart?.();
      },

      onPanResponderMove: (_, gs) => {
        const delta = Math.abs(gs.dx) > Math.abs(gs.dy) ? gs.dx : gs.dy;
        const newSize = Math.min(MAX_SIZE, Math.max(MIN_SIZE, Math.round(resizeBase.current + delta)));
        sizeRef.current = newSize;
        setCurrentSize(newSize);
      },

      onPanResponderRelease: () => {
        onUpdate(id, { width: sizeRef.current, height: sizeRef.current });
        onDragEnd?.();
      },

      onPanResponderTerminate: () => {
        onDragEnd?.();
      },
    })
  ).current;

  // ── Scale calculation & origin simulation ─────────────────────────────────
  const scale = currentSize / BASE_SIZE;
  const half = BASE_SIZE / 2;

  // ── Darken hex for header ─────────────────────────────────────────────────
  const headerColor = darkenHex(color, 18);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Animated.View
      style={[
        styles.container,
        {
          left: posX,
          top: posY,
          width: currentSize,
          height: currentSize,
          backgroundColor: color,
          borderColor: isActive ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.12)',
          borderWidth: isActive ? 1.5 : 1,
          zIndex: isActive ? 100 : 10,
          elevation: isActive ? 12 : 5,
          shadowOpacity: isActive ? 0.28 : 0.18,
        },
      ]}
    >
      {/* ── Scaled Content View (Top-left scale simulated via translate -> scale -> translate back) ── */}
      <View
        style={[
          styles.contentWrapper,
          {
            transform: [
              { translateX: -half },
              { translateY: -half },
              { scale: scale },
              { translateX: half },
              { translateY: half },
            ],
          },
        ]}
      >
        {/* ── DRAG HEADER: PanResponder scoped here only ── */}
        <View
          style={[styles.header, { backgroundColor: headerColor }]}
          {...dragResponder.panHandlers}
        >
          <View style={styles.gripWrap} pointerEvents="none">
            <Ionicons name="reorder-three-outline" size={16} color="rgba(0,0,0,0.4)" />
          </View>

          {/* Close */}
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => onRemove(id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={15} color="rgba(0,0,0,0.5)" />
          </TouchableOpacity>
        </View>

        {/* ── NOTE BODY: tap activates, but does NOT trigger drag ── */}
        <TouchableOpacity
          style={styles.body}
          activeOpacity={1}
          onPress={() => onActivate(id)}
        >
          <TextInput
            style={styles.textInput}
            value={text}
            onChangeText={(t) => onUpdate(id, { text: t })}
            placeholder="Type here…"
            placeholderTextColor="rgba(0,0,0,0.28)"
            multiline
            textAlignVertical="top"
            autoFocus={isActive && text === ''}
            scrollEnabled={false}
            onFocus={() => onActivate(id)}
          />
        </TouchableOpacity>
      </View>

      {/* ── RESIZE HANDLE (bottom-right of dynamic outer container) ── */}
      <View
        style={styles.resizeHandle}
        {...resizeResponder.panHandlers}
      >
        <View style={styles.resizeDot} />
      </View>
    </Animated.View>
  );
};

// ── Util: darken a hex color by `amount` per channel ────────────────────────
function darkenHex(hex, amount) {
  const h = (hex || '#FDEE87').replace('#', '');
  const full = h.length === 3
    ? h.split('').map((c) => c + c).join('')
    : h;
  const num = parseInt(full, 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0xff) - amount);
  const b = Math.max(0, (num & 0xff) - amount);
  return `rgb(${r},${g},${b})`;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    borderRadius: 3,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 3 },
    shadowRadius: 6,
    overflow: 'hidden',
  },
  contentWrapper: {
    width: BASE_SIZE,
    height: BASE_SIZE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 4,
  },
  gripWrap: {
    flex: 1,
  },
  headerBtn: {
    padding: 2,
  },
  body: {
    flex: 1,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 24,
    color: '#1a1a1a',
    fontFamily: 'PatrickHand',
    fontSize: 16,
    lineHeight: 22,
  },
  resizeHandle: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    padding: 6,
    zIndex: 20,
  },
  resizeDot: {
    width: 8,
    height: 8,
    borderRadius: 1,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.3)',
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
});

export default DraggableStickyNote;
