import React from "react";
import { View, Text, StyleSheet } from "react-native";

const STATUS_STYLES = {
  open: { backgroundColor: "#1b5e20", textColor: "#ffffff" },
  closed: { backgroundColor: "#b71c1c", textColor: "#ffffff" },
  unknown: { backgroundColor: "#616161", textColor: "#ffffff" },
};

const StatusBadge = ({ label, status = "unknown", style }) => {
  const palette = STATUS_STYLES[status] || STATUS_STYLES.unknown;
  return (
    <View style={[styles.badge, { backgroundColor: palette.backgroundColor }, style]}>
      <Text style={[styles.text, { color: palette.textColor }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default StatusBadge;
