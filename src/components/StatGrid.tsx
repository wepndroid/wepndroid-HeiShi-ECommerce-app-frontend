import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Text } from './typography';
import { colors, fonts } from '../theme';

export function StatGrid({
  items,
  style,
}: {
  items: { value: string; label: string }[];
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.grid, style]}>
      {items.map((item, index) => (
        <View
          key={item.label}
          style={[styles.cell, index < items.length - 1 && styles.cellBorder]}
        >
          <Text style={styles.value} numberOfLines={1}>
            {item.value}
          </Text>
          <Text style={styles.label} numberOfLines={2}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  cell: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  cellBorder: {
    borderRightWidth: 1,
    borderRightColor: colors.line,
  },
  value: {
    fontSize: 15,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  label: {
    marginTop: 3,
    color: '#777777',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: fonts.weights.medium,
    textAlign: 'center',
  },
});
