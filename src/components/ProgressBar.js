import React from 'react';
import { View, StyleSheet } from 'react-native';
import Colors from '../theme/colors';

const ProgressBar = ({ progress = 0, height = 3, style }) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  return (
    <View style={[styles.track, { height }, style]}>
      <View
        style={[
          styles.fill,
          { width: `${clampedProgress * 100}%`, height },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: Colors.progressBg,
    borderRadius: 99,
    overflow: 'hidden',
  },
  fill: {
    backgroundColor: Colors.yellow,
    borderRadius: 99,
  },
});

export default ProgressBar;
