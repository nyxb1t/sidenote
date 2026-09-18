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
 * Edge cases addressed:
 *   - Touch inside text/draw area does NOT trigger drag
 *   - Drag only via header strip
 *   - Resize only via bottom-right handle
 *   - Draw point density throttled (min 4px gap between points) to avoid UI freeze
 *   - Newly created notes auto-activate on mount via autoFocus
 *   - Multiple notes fully independent (no shared refs/state)
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Animated,
  PanResponder,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Minimum distance between recorded draw points (throttle for perf)
const MIN_POINT_GAP = 4;
// Note size constraints
const MIN_W = 120;
const MIN_H = 100;
const MAX_W = 320;
const MAX_H = 420;

const DraggableStickyNote = ({
  note,
  isActive,
  onActivate,
  onUpdate,
  onRemove,
  onDragStart,
  onDragEnd,
}) => {
  const { id, offsetX, offsetY, width, height, text, color, strokes, mode } = note;

  // ── Animated position & size (initialised from note data) ─────────────────
  const posX = useRef(new Animated.Value(offsetX)).current;
  const posY = useRef(new Animated.Value(offsetY)).current;
  const animW = useRef(new Animated.Value(width)).current;
  const animH = useRef(new Animated.Value(height)).current;

  // Keep raw JS values in sync for release callbacks
  const posRef = useRef({ x: offsetX, y: offsetY });
  const sizeRef = useRef({ w: width, h: height });

  // ── Sync animated values when note prop changes externally ────────────────
  useEffect(() => {
    posX.setValue(offsetX);
    posY.setValue(offsetY);
    posRef.current = { x: offsetX, y: offsetY };
  }, [offsetX, offsetY]);

  useEffect(() => {
    animW.setValue(width);
    animH.setValue(height);
    sizeRef.current = { w: width, h: height };
  }, [width, height]);

  // ── Current draw stroke being built ───────────────────────────────────────
  const [currentStroke, setCurrentStroke] = useState(null);

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
  const resizeBase = useRef({ w: 0, h: 0 });

  const resizeResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        resizeBase.current = { w: sizeRef.current.w, h: sizeRef.current.h };
        onDragStart?.();
      },

      onPanResponderMove: (_, gs) => {
        const nw = Math.min(MAX_W, Math.max(MIN_W, resizeBase.current.w + gs.dx));
        const nh = Math.min(MAX_H, Math.max(MIN_H, resizeBase.current.h + gs.dy));
        animW.setValue(nw);
        animH.setValue(nh);
        sizeRef.current = { w: nw, h: nh };
      },

      onPanResponderRelease: () => {
        onUpdate(id, { width: sizeRef.current.w, height: sizeRef.current.h });
        onDragEnd?.();
      },

      onPanResponderTerminate: () => {
        onDragEnd?.();
      },
    })
  ).current;

  // ── Draw canvas responder ─────────────────────────────────────────────────
  const lastDrawPoint = useRef(null);

  const handleDrawGrant = useCallback(
    (e) => {
      if (mode !== 'draw') return;
      const touch = e.nativeEvent;
      const px = touch.locationX;
      const py = touch.locationY;
      lastDrawPoint.current = { x: px, y: py };
      setCurrentStroke({
        points: [{ x: px, y: py }],
        color: note.penColor || '#1a1a1a',
        thickness: note.penThickness || 2,
      });
    },
    [mode, note.penColor, note.penThickness]
  );

  const handleDrawMove = useCallback(
    (e) => {
      if (mode !== 'draw') return;
      const touch = e.nativeEvent;
      const px = touch.locationX;
      const py = touch.locationY;

      // Throttle: skip if too close to last point
      const last = lastDrawPoint.current;
      if (last) {
        const dist = Math.sqrt((px - last.x) ** 2 + (py - last.y) ** 2);
        if (dist < MIN_POINT_GAP) return;
      }
      lastDrawPoint.current = { x: px, y: py };

      setCurrentStroke((prev) =>
        prev ? { ...prev, points: [...prev.points, { x: px, y: py }] } : prev
      );
    },
    [mode]
  );

  const handleDrawEnd = useCallback(() => {
    if (mode !== 'draw' || !currentStroke) return;
    const committed = [...(strokes || []), currentStroke];
    onUpdate(id, { strokes: committed });
    setCurrentStroke(null);
    lastDrawPoint.current = null;
  }, [mode, currentStroke, strokes, id, onUpdate]);

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
          width: animW,
          height: animH,
          backgroundColor: color,
          borderColor: isActive ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.12)',
          borderWidth: isActive ? 1.5 : 1,
          zIndex: isActive ? 100 : 10,
          elevation: isActive ? 12 : 5,
          shadowOpacity: isActive ? 0.28 : 0.18,
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

        {/* Mode toggle: text ↔ draw */}
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => onUpdate(id, { mode: mode === 'text' ? 'draw' : 'text' })}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={mode === 'text' ? 'pencil-outline' : 'text-outline'}
            size={14}
            color="rgba(0,0,0,0.5)"
          />
        </TouchableOpacity>

        {/* Close */}
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => onRemove(id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
        {mode === 'text' ? (
          /* ── TEXT MODE ── */
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
        ) : (
          /* ── DRAW MODE ── */
          <View
            style={styles.drawCanvas}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={handleDrawGrant}
            onResponderMove={handleDrawMove}
            onResponderRelease={handleDrawEnd}
            onResponderTerminate={handleDrawEnd}
          >
            {/* Committed strokes */}
            {(strokes || []).map((stroke, si) =>
              stroke.points.map((pt, pi) => (
                <View
                  key={`s${si}-p${pi}`}
                  pointerEvents="none"
                  style={[
                    styles.dot,
                    {
                      left: pt.x - stroke.thickness / 2,
                      top: pt.y - stroke.thickness / 2,
                      width: stroke.thickness,
                      height: stroke.thickness,
                      borderRadius: stroke.thickness / 2,
                      backgroundColor: stroke.color,
                    },
                  ]}
                />
              ))
            )}

            {/* Live in-progress stroke */}
            {currentStroke &&
              currentStroke.points.map((pt, pi) => (
                <View
                  key={`live-${pi}`}
                  pointerEvents="none"
                  style={[
                    styles.dot,
                    {
                      left: pt.x - currentStroke.thickness / 2,
                      top: pt.y - currentStroke.thickness / 2,
                      width: currentStroke.thickness,
                      height: currentStroke.thickness,
                      borderRadius: currentStroke.thickness / 2,
                      backgroundColor: currentStroke.color,
                    },
                  ]}
                />
              ))}

            {(strokes || []).length === 0 && !currentStroke && (
              <Text style={styles.drawPlaceholder} pointerEvents="none">
                Draw here…
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>

      {/* ── RESIZE HANDLE (bottom-right) ── */}
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
    fontSize: 14,
    lineHeight: 20,
  },
  drawCanvas: {
    flex: 1,
    overflow: 'hidden',
  },
  dot: {
    position: 'absolute',
  },
  drawPlaceholder: {
    position: 'absolute',
    top: 10,
    left: 10,
    color: 'rgba(0,0,0,0.28)',
    fontSize: 13,
    fontStyle: 'italic',
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
