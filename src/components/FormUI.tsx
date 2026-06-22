import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInputProps, View } from 'react-native';
import { Text, TextInput } from './typography';
import { useTranslation } from 'react-i18next';
import { AmazingSurface } from './AmazingSurface';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing, cardShadow } from '../theme';
import { AppIcon, AppIconName } from './AppIcon';
import type { FormOptionDto } from '../api/types';
import { formOptionLabel } from '../utils/formOptionLabel';
import { filterNumericInput, numericKeyboardType, NumericInputKind } from '../utils/numericInput';

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
  numericKind,
  onInvalidInput,
}: {
  icon?: AppIconName;
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  suffix?: string;
  multiline?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  numericKind?: NumericInputKind;
  onInvalidInput?: () => void;
}) {
  const resolvedKeyboardType = numericKind ? numericKeyboardType(numericKind) : keyboardType;

  const handleChangeText = (text: string) => {
    if (!numericKind) {
      onChangeText(text);
      return;
    }
    const { value: filtered, rejected } = filterNumericInput(text, numericKind);
    if (rejected) {
      onInvalidInput?.();
    }
    onChangeText(filtered);
  };

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
        onChangeText={handleChangeText}
        placeholder={placeholder}
        placeholderTextColor="#999999"
        multiline={multiline}
        keyboardType={resolvedKeyboardType}
        selectionColor={colors.brand2}
      />
      {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
    </View>
  );
}

export function FieldSelectRow({
  icon,
  label,
  options,
  selectedKey,
  onSelect,
  placeholder,
  loading,
  stacked,
}: {
  icon?: AppIconName;
  label: string;
  options: FormOptionDto[];
  selectedKey: string;
  onSelect: (key: string) => void;
  placeholder?: string;
  loading?: boolean;
  stacked?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const selected = options.find((item) => item.key === selectedKey);
  const display = selected
    ? formOptionLabel(selected, i18n.language)
    : loading
      ? t('common.loading')
      : placeholder ?? t('common.placeholders.selectOption');

  const pickerModal = (
    <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
      <Pressable style={styles.sheetBackdrop} onPress={() => setOpen(false)}>
        <Pressable style={styles.sheetCard} onPress={(event) => event.stopPropagation()}>
          <Text style={styles.sheetTitle}>{label}</Text>
          <ScrollView style={styles.sheetList} showsVerticalScrollIndicator={false}>
            {options.map((option) => {
              const active = option.key === selectedKey;
              return (
                <Pressable
                  key={option.key}
                  style={[styles.sheetOption, active && styles.sheetOptionActive]}
                  onPress={() => {
                    onSelect(option.key);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.sheetOptionText, active && styles.sheetOptionTextActive]}>
                    {formOptionLabel(option, i18n.language)}
                  </Text>
                  {active ? <AppIcon name="check" size={16} color={colors.text} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );

  if (stacked) {
    return (
      <>
        <View style={styles.stackedField}>
          <Text style={styles.stackedLabel}>{label}</Text>
          <Pressable
            style={styles.stackedSelect}
            onPress={() => !loading && setOpen(true)}
            accessibilityRole="button"
          >
            <Text
              style={[styles.stackedSelectText, !selected && styles.selectPlaceholder]}
              numberOfLines={1}
            >
              {display}
            </Text>
            <AppIcon name="chevronForward" size={16} color="#bbbbbb" />
          </Pressable>
        </View>
        {pickerModal}
      </>
    );
  }

  return (
    <>
      <Pressable style={styles.field} onPress={() => !loading && setOpen(true)}>
        {icon ? (
          <View style={styles.ficonWrap}>
            <AppIcon name={icon} size={18} color="#f2a400" />
          </View>
        ) : null}
        <Text style={styles.label}>{label}</Text>
        <Text
          style={[styles.selectValue, !selected && styles.selectPlaceholder]}
          numberOfLines={1}
        >
          {display}
        </Text>
        <AppIcon name="chevronForward" size={16} color="#bbbbbb" />
      </Pressable>
      {pickerModal}
    </>
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

const STICKY_ACTIONS_BUTTON_HEIGHT = 48;

export function DetailBottomIconAction({
  icon,
  label,
  active,
  onPress,
  accessibilityLabel,
  layout = 'stacked',
}: {
  icon: AppIconName;
  label: string;
  active?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  layout?: 'stacked' | 'inline';
}) {
  const iconColor = active ? '#FFFFFF' : colors.text;
  const labelStyle = [styles.detailBottomIconLabel, active && styles.detailBottomIconLabelActive];

  return (
    <Pressable
      style={layout === 'inline' ? styles.detailBottomIconInline : styles.detailBottomIcon}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <View style={[styles.detailBottomIconGraphic, active && styles.detailBottomIconGraphicActive]}>
        <AppIcon name={icon} size={active ? 16 : 22} color={iconColor} />
      </View>
      <Text style={labelStyle}>{label}</Text>
    </Pressable>
  );
}

export function DetailBottomBar({
  leading,
  trailing,
}: {
  leading: React.ReactNode;
  trailing: React.ReactNode;
}) {
  return (
    <View style={styles.detailBottomBar}>
      <View style={styles.detailBottomLeading}>{leading}</View>
      <View style={styles.detailBottomTrailing}>{trailing}</View>
    </View>
  );
}

export function useStickyActionsBarInset(): number {
  const insets = useSafeAreaInsets();
  return 12 + STICKY_ACTIONS_BUTTON_HEIGHT + Math.max(insets.bottom, spacing.screenBottomNoNav);
}

export function StickyActions({
  children,
  fixed,
}: {
  children: React.ReactNode;
  fixed?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, spacing.screenBottomNoNav);

  if (!fixed) {
    return <View style={styles.stickyActions}>{children}</View>;
  }

  return (
    <View style={[styles.stickyActionsFixed, { paddingBottom: bottomPad }]}>
      <View style={styles.stickyActionsRow}>{children}</View>
    </View>
  );
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
    paddingHorizontal: 8,
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
  selectValue: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    color: colors.text,
  },
  selectPlaceholder: {
    color: colors.placeholder,
  },
  stackedField: {
    marginBottom: 14,
  },
  stackedLabel: {
    fontWeight: fonts.weights.bold,
    color: colors.text,
    fontSize: 13,
    marginBottom: 6,
  },
  stackedSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ececec',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fafafa',
    gap: 8,
  },
  stackedSelectText: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    color: colors.text,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '62%',
    paddingTop: 14,
    paddingBottom: 24,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: fonts.weights.bold,
    color: colors.text,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  sheetList: {
    paddingHorizontal: 8,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: radius.md,
  },
  sheetOptionActive: {
    backgroundColor: colors.brand3,
  },
  sheetOptionText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  sheetOptionTextActive: {
    fontWeight: fonts.weights.bold,
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
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCard: {
    borderRadius: radius.lg,
    padding: 15,
    marginBottom: 12,
    backgroundColor: colors.paper,
  },
  stickyActions: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 8,
  },
  stickyActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  detailBottomBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    minWidth: 0,
  },
  detailBottomLeading: {
    flexShrink: 0,
  },
  detailBottomTrailing: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  detailBottomIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    gap: 4,
  },
  detailBottomIconInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    gap: 4,
  },
  detailBottomIconGraphic: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailBottomIconGraphicActive: {
    backgroundColor: colors.red,
    borderRadius: 14,
  },
  detailBottomIconLabel: {
    fontSize: 10,
    lineHeight: 12,
    color: colors.text,
    fontWeight: fonts.weights.medium,
  },
  detailBottomIconLabelActive: {
    color: colors.red,
  },
  stickyActionsFixed: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    backgroundColor: colors.paper,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    paddingHorizontal: spacing.screenPadding,
    paddingTop: 12,
    ...cardShadow,
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
    backgroundColor: colors.brand3,
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
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: colors.bg,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: fonts.weights.medium,
    color: colors.sub,
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
    fontSize: 12,
    color: colors.muted,
    marginTop: 12,
    marginBottom: 6,
    marginHorizontal: 4,
    fontWeight: fonts.weights.medium,
  },
});
