import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Animated,
  PanResponder,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const DraggableStickyNote = ({ id, initialText, onClose }) => {
  const pan = useRef(new Animated.ValueXY({ x: width / 2 - 75, y: height / 2 - 100 })).current;
  const [text, setText] = useState(initialText || '');
  const [isEditing, setIsEditing] = useState(true);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => !isEditing, // Only drag when not editing
      onPanResponderGrant: () => {
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value
        });
      },
      onPanResponderMove: Animated.event(
        [
          null,
          { dx: pan.x, dy: pan.y }
        ],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      }
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateX: pan.x }, { translateY: pan.y }] }
      ]}
      {...panResponder.panHandlers}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.dragHandle} onPress={() => setIsEditing(false)}>
          <Ionicons name="apps-outline" size={14} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onClose(id)}>
          <Ionicons name="close" size={16} color="#000" />
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type here..."
            placeholderTextColor="rgba(0,0,0,0.4)"
            multiline
            autoFocus
            onBlur={() => setIsEditing(false)}
          />
        ) : (
          <TouchableOpacity style={styles.textWrap} onPress={() => setIsEditing(true)}>
            <Text style={styles.text}>{text || 'Tap to edit...'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 150,
    minHeight: 150,
    backgroundColor: '#FDEE87', // Classic sticky note yellow
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 6,
    backgroundColor: '#F3E47A', // Slightly darker header
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  dragHandle: {
    padding: 2,
  },
  content: {
    flex: 1,
    padding: 10,
  },
  input: {
    flex: 1,
    color: '#000',
    fontSize: 14,
    fontFamily: 'Caveat_700Bold', // Assuming Caveat is loaded globally
    textAlignVertical: 'top',
  },
  textWrap: {
    flex: 1,
  },
  text: {
    color: '#000',
    fontSize: 14,
    fontFamily: 'Caveat_700Bold',
  }
});

export default DraggableStickyNote;
