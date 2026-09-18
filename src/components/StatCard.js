import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../theme/colors';

const StatCard = ({ value, label }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  value: {
    color: Colors.yellow,
    fontSize: 26,
    fontWeight: '700',
  },
  label: {
    color: Colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default StatCard;
