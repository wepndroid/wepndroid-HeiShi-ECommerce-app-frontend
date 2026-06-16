import React from 'react';
import { Pressable, StyleSheet, TextInputProps, View } from 'react-native';
import { Text, TextInput } from './typography';
import { AmazingSurface } from './AmazingSurface';
import { colors, fonts, radius } from '../theme';
import { AppIcon, AppIconName } from './AppIcon';

export function FormCard({ children }: { children: React.ReactNode }) {
  return <AmazingSurface style={styles.formCard}>{children}</AmazingSurface>;
}

export function FieldRow({
  icon,
  label,
  value,
  suffix,
}: {
  icon?: AppIconName;
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <View style={styles.field}>
      {icon ? (
        <View style={styles.ficonWrap}>
          <AppIcon name={icon} size={18} color="#f2a400" />
        </View>
      ) : null}
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
    </View>
  );
}

export function FieldInputRow({
  icon,
  label,
  value,
  onChangeText,
  placeholder,
  suffix,
  multiline,
  keyboardType,
}: {
  icon?: AppIconName;
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  suffix?: string;
  multiline?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
}) {
  return (
    <View style={[styles.field, multiline && styles.fieldMultiline]}>
      {icon ? (
        <View style={[styles.ficonWrap, multiline && styles.ficonWrapTop]}>
          <AppIcon name={icon} size={18} color="#f2a400" />
        </View>
      ) : null}
      <Text style={[styles.label, multiline && styles.labelMultiline]}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#999999"
        multiline={multiline}
        keyboardType={keyboardType}
        selectionColor={colors.brand2}
      />
      {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
    </View>
  );
}

export function ListCard({ children }: { children: React.ReactNode }) {
  return <AmazingSurface style={styles.listCard}>{children}</AmazingSurface>;
}

export function ListRow({
  left,
  right,
  onPress,
  border,
}: {
  left: React.ReactNode;
  right?: React.ReactNode;
  onPress?: () => void;
  border?: boolean;
}) {
  const content = (
    <View style={[styles.listRow, border !== false && styles.listRowBorder]}>
      <View style={styles.listLeft}>{left}</View>
      {right}
    </View>
  );
  if (onPress) return <Pressable onPress={onPress}>{content}</Pressable>;
  return content;
}

export function ListIcon({ name }: { name: AppIconName }) {
  return (
    <View style={styles.ico}>
      <AppIcon name={name} size={16} color="#b87000" />
    </View>
  );
}

export function Chevron() {
  return <AppIcon name="chevronForward" size={18} color="#bbbbbb" />;
}

export function DetailCard({ children }: { children: React.ReactNode }) {
  return <AmazingSurface style={styles.detailCard}>{children}</AmazingSurface>;
}

export function StickyActions({ children }: { children: React.ReactNode }) {
  return <View style={styles.stickyActions}>{children}</View>;
}

export function ServiceCard({
  icon,
  title,
  desc,
  meta,
  badge,
  onPress,
}: {
  icon: AppIconName;
  title: string;
  desc: string;
  meta: string;
  badge: string;
  onPress?: () => void;
}) {
  return (
    <AmazingSurface style={styles.serviceCard} onPress={onPress}>
      <View style={styles.serviceRow}>
        <View style={styles.serviceImg}>
          <AppIcon name={icon} size={28} color="#b87000" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.serviceTitle}>{title}</Text>
          <Text style={styles.serviceDesc}>{desc}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{meta}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          </View>
        </View>
      </View>
    </AmazingSurface>
  );
}

export function ShortcutGrid({
  items,
  compact,
}: {
  items: { icon: AppIconName; label: string; onPress: () => void }[];
  compact?: boolean;
}) {
  return (
    <View style={styles.grid4}>
      {items.map((item) => (
        <AmazingSurface
          key={item.label}
          style={[styles.shortcut, compact && styles.shortcutCompact]}
          onPress={item.onPress}
        >
          <AppIcon name={item.icon} size={compact ? 18 : 20} color={colors.text} />
          <Text
            style={[styles.shortcutLabel, compact && styles.shortcutLabelCompact]}
            numberOfLines={2}
          >
            {item.label}
          </Text>
        </AmazingSurface>
      ))}
    </View>
  );
}

export function TableNote({ children }: { children: React.ReactNode }) {
  return (
    <AmazingSurface style={styles.tableNote}>
      <Text style={styles.tableNoteText}>{children}</Text>
    </AmazingSurface>
  );
}

export function Switch({ on, onToggle }: { on?: boolean; onToggle?: () => void }) {
  const track = (
    <View style={[styles.switch, on && styles.switchOn]}>
      <View style={[styles.switchKnob, on && styles.switchKnobOn]} />
    </View>
  );

  if (onToggle) {
    return (
      <Pressable onPress={onToggle} hitSlop={8} accessibilityRole="switch" accessibilityState={{ checked: !!on }}>
        {track}
      </Pressable>
    );
  }

  return track;
}

export function SettingSectionTitle({ title }: { title: string }) {
  return <Text style={styles.settingSectionTitle}>{title}</Text>;
}

const styles = StyleSheet.create({
  formCard: {
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingVertical: 13,
  },
  ficonWrap: {
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    width: 72,
    fontWeight: fonts.weights.bold,
    fontSize: 13,
    color: colors.text,
  },
  value: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    color: colors.text,
  },
  fieldMultiline: {
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  ficonWrapTop: {
    marginTop: 2,
  },
  labelMultiline: {
    marginTop: 2,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    color: colors.text,
    paddingVertical: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  inputMultiline: {
    minHeight: 56,
    textAlignVertical: 'top',
    paddingTop: 2,
  },
  suffix: {
    color: colors.text,
    fontSize: 14,
  },
  listCard: {
    borderRadius: radius.lg,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginBottom: 12,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    gap: 12,
  },
  listRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  listLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  ico: {
    width: 30,
    height: 30,
    borderRadius: 12,
    backgroundColor: '#fff0c2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCard: {
    borderRadius: radius.lg,
    padding: 15,
    marginBottom: 12,
  },
  stickyActions: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 8,
  },
  serviceCard: {
    borderRadius: radius.lg,
    padding: 13,
    marginBottom: 12,
  },
  serviceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  serviceImg: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: '#fff1d6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  serviceDesc: {
    marginTop: 5,
    color: '#777777',
    fontSize: 12,
    lineHeight: 17,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 7,
  },
  metaText: {
    color: '#888888',
    fontSize: 11,
  },
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#fff1d6',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: fonts.weights.bold,
    color: '#b65d00',
  },
  grid4: {
    flexDirection: 'row',
    gap: 6,
  },
  shortcut: {
    flex: 1,
    minWidth: 0,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 3,
    alignItems: 'center',
    gap: 4,
  },
  shortcutCompact: {
    paddingVertical: 8,
    paddingHorizontal: 2,
    gap: 3,
  },
  shortcutIcon: {
    fontSize: 18,
    fontWeight: fonts.weights.bold,
    marginBottom: 5,
    color: '#8a5a00',
  },
  shortcutLabel: {
    fontSize: 11,
    fontWeight: fonts.weights.medium,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 14,
  },
  shortcutLabelCompact: {
    fontSize: 10,
    lineHeight: 13,
  },
  tableNote: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  tableNoteText: {
    fontSize: 12,
    color: '#888888',
    lineHeight: 19,
  },
  switch: {
    width: 42,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: '#dddddd',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchOn: {
    backgroundColor: colors.brand,
  },
  switchKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2.5,
    elevation: 2,
    alignSelf: 'flex-start',
  },
  switchKnobOn: {
    alignSelf: 'flex-end',
  },
  settingSectionTitle: {
    fontSize: 13,
    color: '#999999',
    marginTop: 14,
    marginBottom: 7,
    marginHorizontal: 6,
    fontWeight: fonts.weights.bold,
  },
});
