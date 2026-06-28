import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInputContentSizeChangeEventData,
  TextInputProps,
  View,
} from 'react-native';
import { Text, TextInput } from './typography';
import { useTranslation } from 'react-i18next';
import { AmazingSurface } from './AmazingSurface';
import { DismissibleModal } from './UI';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, formControls, iconTokens, messagesScreenTokens, multilineInitialHeight, publishScreenTokens, radius, spacing, shadows } from '../theme';
import { AppIcon, AppIconName } from './AppIcon';
import type { FormOptionDto } from '../api/types';
import { formOptionLabel } from '../utils/formOptionLabel';
import { filterNumericInput, numericKeyboardType, NumericInputKind } from '../utils/numericInput';
import {
  buildPickupDateOptions,
  formatPickupDateLabel,
  startOfToday,
} from '../utils/pickupDate';

const FormFieldStyleContext = createContext(false);

export function useFormFieldPill() {
  return useContext(FormFieldStyleContext);
}

function GrowingMultilineField({
  value,
  onChangeText,
  placeholder,
  usePill,
  flex,
  keyboardType,
  secureTextEntry,
  autoCapitalize,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  usePill?: boolean;
  /** Fill remaining horizontal space in label rows (default true). */
  flex?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  secureTextEntry?: boolean;
  autoCapitalize?: TextInputProps['autoCapitalize'];
}) {
  const minHeight = multilineInitialHeight;
  const maxHeight = formControls.multilineMaxHeight;
  const [inputHeight, setInputHeight] = useState(minHeight);

  useEffect(() => {
    if (!value) {
      setInputHeight(minHeight);
    }
  }, [value, minHeight]);

  const clampHeight = (height: number) =>
    Math.min(maxHeight, Math.max(minHeight, Math.ceil(height)));

  const handleContentSizeChange = (event: { nativeEvent: TextInputContentSizeChangeEventData }) => {
    setInputHeight(clampHeight(event.nativeEvent.contentSize.height));
  };

  const isExpanded = inputHeight > minHeight;
  const scrollEnabled = inputHeight >= maxHeight;

  return (
    <View
      style={[
        formControlStyles.box,
        flex !== false && formControlStyles.boxFlex,
        usePill && formControlStyles.boxPill,
        formControlStyles.boxMultilineGrow,
        { height: inputHeight, minHeight },
      ]}
    >
      <TextInput
        style={[
          formControlStyles.inputMultilineBase,
          isExpanded ? formControlStyles.inputMultilineGrow : formControlStyles.inputMultilineInitial,
          scrollEnabled && formControlStyles.inputMultilineScroll,
          { height: inputHeight, maxHeight },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={formControls.placeholderColor}
        multiline
        numberOfLines={formControls.multilineInitialRows}
        {...(Platform.OS === 'web' ? ({ rows: formControls.multilineInitialRows } as object) : null)}
        scrollEnabled={scrollEnabled}
        onContentSizeChange={handleContentSizeChange}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        selectionColor={colors.brand2}
      />
    </View>
  );
}

export function FormCard({
  children,
  roundedFields,
}: {
  children: React.ReactNode;
  /** Pill-shaped single-line inputs/selects (publish forms). */
  roundedFields?: boolean;
}) {
  return (
    <FormFieldStyleContext.Provider value={!!roundedFields}>
      <AmazingSurface style={styles.formCard}>{children}</AmazingSurface>
    </FormFieldStyleContext.Provider>
  );
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
          <AppIcon name={icon} size={18} color={formControls.iconColor} />
        </View>
      ) : null}
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <View style={[formControlStyles.box, formControlStyles.boxFlex]}>
        <Text style={styles.controlValue}>{value}</Text>
      </View>
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
  rounded,
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
  /** Override pill rounding from FormCard context. */
  rounded?: boolean;
}) {
  const resolvedKeyboardType = numericKind ? numericKeyboardType(numericKind) : keyboardType;
  const pillFromContext = useFormFieldPill();
  const usePill = rounded ?? pillFromContext;

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

  if (multiline) {
    return (
      <View style={[styles.field, styles.fieldMultiline]}>
        {icon ? (
          <View style={[styles.ficonWrap, styles.ficonWrapTop]}>
            <AppIcon name={icon} size={18} color={formControls.iconColor} />
          </View>
        ) : null}
        <Text style={[styles.label, styles.labelMultiline]} numberOfLines={1}>
          {label}
        </Text>
        <GrowingMultilineField
          value={value}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          usePill={usePill}
          keyboardType={resolvedKeyboardType}
        />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.field}>
      {icon ? (
        <View style={styles.ficonWrap}>
          <AppIcon name={icon} size={18} color={formControls.iconColor} />
        </View>
      ) : null}
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <View
        style={[
          formControlStyles.box,
          formControlStyles.boxFlex,
          usePill && formControlStyles.boxPill,
        ]}
      >
        <TextInput
          style={formControlStyles.input}
          value={value}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={formControls.placeholderColor}
          keyboardType={resolvedKeyboardType}
          selectionColor={colors.brand2}
        />
      </View>
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
  rounded,
}: {
  icon?: AppIconName;
  label: string;
  options: FormOptionDto[];
  selectedKey: string;
  onSelect: (key: string) => void;
  placeholder?: string;
  loading?: boolean;
  stacked?: boolean;
  rounded?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const pillFromContext = useFormFieldPill();
  const usePill = rounded ?? pillFromContext;
  const selected = options.find((item) => item.key === selectedKey);
  const display = selected
    ? formOptionLabel(selected, i18n.language)
    : loading
      ? t('common.loading')
      : placeholder ?? t('common.placeholders.selectOption');

  const pickerModal = (
    <DismissibleModal visible={open} onClose={() => setOpen(false)} animationType="slide" placement="bottom">
      <View style={styles.sheetCard}>
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
      </View>
    </DismissibleModal>
  );

  if (stacked) {
    return (
      <>
        <View style={styles.stackedField}>
          <Text style={styles.stackedLabel}>{label}</Text>
          <Pressable
            style={[formControlStyles.box, formControlStyles.boxRow, usePill && formControlStyles.boxPill]}
            onPress={() => !loading && setOpen(true)}
            accessibilityRole="button"
          >
            <Text
              style={[formControlStyles.selectText, !selected && styles.selectPlaceholder]}
              numberOfLines={1}
            >
              {display}
            </Text>
            <AppIcon name="chevronForward" size={16} color={formControls.chevronColor} />
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
            <AppIcon name={icon} size={18} color={formControls.iconColor} />
          </View>
        ) : null}
        <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
        <View
          style={[
            formControlStyles.box,
            formControlStyles.boxFlex,
            formControlStyles.boxRow,
            usePill && formControlStyles.boxPill,
          ]}
        >
          <Text
            style={[formControlStyles.selectText, !selected && styles.selectPlaceholder]}
            numberOfLines={1}
          >
            {display}
          </Text>
          <AppIcon name="chevronForward" size={16} color={formControls.chevronColor} />
        </View>
      </Pressable>
      {pickerModal}
    </>
  );
}

export function FieldDateRow({
  icon,
  label,
  value,
  onChange,
  placeholder,
  minimumDate,
  rounded,
}: {
  icon?: AppIconName;
  label: string;
  value: string;
  onChange: (isoDate: string) => void;
  placeholder?: string;
  minimumDate?: Date;
  rounded?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const pillFromContext = useFormFieldPill();
  const usePill = rounded ?? pillFromContext;
  const minDate = minimumDate ?? startOfToday();
  const dateOptions = useMemo(
    () => buildPickupDateOptions(minDate, 365),
    [minDate.getTime()],
  );
  const hasValue = Boolean(value.trim());
  const display = hasValue
    ? formatPickupDateLabel(value, i18n.language)
    : placeholder ?? t('common.placeholders.selectDate');

  const pickerModal = (
    <DismissibleModal visible={open} onClose={() => setOpen(false)} animationType="slide" placement="bottom">
      <View style={styles.sheetCard}>
        <Text style={styles.sheetTitle}>{label}</Text>
        <ScrollView style={styles.sheetList} showsVerticalScrollIndicator={false}>
          {dateOptions.map((iso) => {
            const active = iso === value;
            return (
              <Pressable
                key={iso}
                style={[styles.sheetOption, active && styles.sheetOptionActive]}
                onPress={() => {
                  onChange(iso);
                  setOpen(false);
                }}
              >
                <Text style={[styles.sheetOptionText, active && styles.sheetOptionTextActive]}>
                  {formatPickupDateLabel(iso, i18n.language)}
                </Text>
                {active ? <AppIcon name="check" size={16} color={colors.text} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </DismissibleModal>
  );

  return (
    <>
      <Pressable
        style={styles.field}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        {icon ? (
          <View style={styles.ficonWrap}>
            <AppIcon name={icon} size={18} color={formControls.iconColor} />
          </View>
        ) : null}
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        <View
          style={[
            formControlStyles.box,
            formControlStyles.boxFlex,
            formControlStyles.boxRow,
            usePill && formControlStyles.boxPill,
          ]}
        >
          <Text
            style={[formControlStyles.selectText, !hasValue && styles.selectPlaceholder]}
            numberOfLines={1}
          >
            {display}
          </Text>
          <AppIcon name="chevronForward" size={16} color={formControls.chevronColor} />
        </View>
      </Pressable>
      {pickerModal}
    </>
  );
}

export function ListCard({
  children,
  compact,
}: {
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <AmazingSurface style={[styles.listCard, compact && styles.listCardCompact]}>
      {children}
    </AmazingSurface>
  );
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
      {right != null ? <View style={styles.listRight}>{right}</View> : null}
    </View>
  );
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
        style={({ pressed }) => (pressed ? styles.listRowPressed : undefined)}
      >
        {content}
      </Pressable>
    );
  }
  return content;
}

/** Text column beside {@link ListIcon} — shrinks so trailing status/chevron does not overlap. */
export function ListRowMain({ children }: { children: React.ReactNode }) {
  return <View style={styles.listRowMain}>{children}</View>;
}

export function ListIcon({ name }: { name: AppIconName }) {
  return (
    <View style={styles.ico}>
      <AppIcon name={name} size={iconTokens.sizes.sm} color={iconTokens.accent} />
    </View>
  );
}

export function Chevron() {
  return <AppIcon name="chevronForward" size={18} color={formControls.chevronColor} />;
}

export function FieldInputStacked({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  numericKind,
  onInvalidInput,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
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
    <View style={styles.stackedField}>
      <Text style={styles.stackedLabel}>{label}</Text>
      {multiline ? (
        <GrowingMultilineField
          value={value}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          keyboardType={resolvedKeyboardType}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          flex={false}
        />
      ) : (
        <View style={[formControlStyles.box]}>
          <TextInput
            style={formControlStyles.input}
            value={value}
            onChangeText={handleChangeText}
            placeholder={placeholder}
            placeholderTextColor={formControls.placeholderColor}
            secureTextEntry={secureTextEntry}
            keyboardType={resolvedKeyboardType}
            autoCapitalize={autoCapitalize}
            autoCorrect={false}
            selectionColor={colors.brand2}
          />
        </View>
      )}
    </View>
  );
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
  items: { icon: AppIconName; label: string; onPress: () => void; badge?: number }[];
  compact?: boolean;
}) {
  const iconSize = compact ? 18 : 20;

  return (
    <AmazingSurface style={[styles.shortcutUnifiedCard, compact && styles.shortcutUnifiedCardCompact]} highlight={false}>
      {items.map((item, index) => (
        <React.Fragment key={item.label}>
          {index > 0 ? <View style={styles.shortcutUnifiedDivider} /> : null}
          <Pressable
            style={({ pressed }) => [
              styles.shortcutUnifiedItem,
              compact && styles.shortcutUnifiedItemCompact,
              pressed && styles.shortcutUnifiedItemPressed,
            ]}
            onPress={item.onPress}
            accessibilityRole="button"
          >
            <View style={styles.shortcutIconWrap}>
              <AppIcon name={item.icon} size={iconSize} color={colors.text} />
              {item.badge != null && item.badge > 0 ? (
                <View style={styles.shortcutBadge}>
                  <Text style={styles.shortcutBadgeText}>
                    {item.badge > 99 ? '99+' : String(item.badge)}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text
              style={[styles.shortcutLabel, compact && styles.shortcutLabelCompact]}
              numberOfLines={2}
            >
              {item.label}
            </Text>
          </Pressable>
        </React.Fragment>
      ))}
    </AmazingSurface>
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

export function FormSection({
  title,
  subtitle,
  children,
  first,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  first?: boolean;
}) {
  return (
    <View style={[styles.formSection, !first && styles.formSectionSpaced]}>
      <Text style={styles.formSectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.formSectionSub}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

export function FormSwitchRow({
  title,
  hint,
  on,
  onToggle,
}: {
  title: string;
  hint?: string;
  on?: boolean;
  onToggle?: () => void;
}) {
  return (
    <View style={styles.formSwitchRow}>
      <View style={styles.formSwitchCopy}>
        <Text style={styles.formSwitchTitle}>{title}</Text>
        {hint ? <Text style={styles.formSwitchHint}>{hint}</Text> : null}
      </View>
      <Switch on={on} onToggle={onToggle} />
    </View>
  );
}

export function SettingSectionTitle({ title }: { title: string }) {
  return <Text style={styles.settingSectionTitle}>{title}</Text>;
}

/** Shared bordered control shell for inputs and selects (also used in bundle publish). */
export const formControlStyles = StyleSheet.create({
  box: {
    height: formControls.controlMinHeight,
    minHeight: formControls.controlMinHeight,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: formControls.borderColor,
    borderRadius: formControls.radius,
    backgroundColor: formControls.fill,
    paddingHorizontal: formControls.controlPaddingH,
    justifyContent: 'center',
  },
  boxFlex: {
    flex: 1,
    minWidth: 0,
  },
  boxMultiline: {
    minHeight: formControls.controlMinHeight,
  },
  boxMultilineGrow: {
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  boxPill: {
    borderRadius: publishScreenTokens.inputRadius,
  },
  boxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    fontSize: formControls.fontSize,
    lineHeight: formControls.controlLineHeight,
    color: colors.text,
    paddingVertical: formControls.controlPaddingV,
    paddingHorizontal: 0,
    ...(Platform.OS === 'web'
      ? {
          minHeight: formControls.controlLineHeight,
          maxHeight: formControls.controlLineHeight,
        }
      : null),
  },
  inputMultiline: {
    minHeight: formControls.controlMinHeight,
    textAlignVertical: 'top',
  },
  inputMultilineBase: {
    fontSize: formControls.fontSize,
    lineHeight: formControls.controlLineHeight,
    color: colors.text,
    paddingHorizontal: 0,
    margin: 0,
  },
  inputMultilineGrow: {
    textAlignVertical: 'top',
    paddingTop: formControls.multilinePaddingV,
    paddingBottom: formControls.multilinePaddingV,
  },
  inputMultilineInitial: {
    textAlignVertical: 'top',
    paddingTop: formControls.multilinePaddingV,
    paddingBottom: formControls.multilinePaddingV,
  },
  inputMultilineScroll: {
    overflow: 'scroll',
  },
  selectText: {
    flex: 1,
    minWidth: 0,
    fontSize: formControls.fontSize,
    lineHeight: formControls.controlLineHeight,
    color: colors.text,
  },
});

const styles = StyleSheet.create({
  formCard: {
    borderRadius: radius.lg,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  formSection: {
    marginBottom: 0,
  },
  formSectionSpaced: {
    marginTop: 18,
    paddingTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  formSectionTitle: {
    fontSize: 15,
    fontWeight: fonts.weights.bold,
    color: colors.text,
    marginBottom: 4,
  },
  formSectionSub: {
    fontSize: 12,
    color: colors.sub,
    lineHeight: 17,
    marginBottom: 10,
  },
  formSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: formControls.rowPaddingVertical,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  formSwitchCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  formSwitchTitle: {
    fontSize: formControls.labelFontSize,
    fontWeight: fonts.weights.medium,
    color: colors.text,
  },
  formSwitchHint: {
    fontSize: 11,
    color: colors.sub,
    lineHeight: 15,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: formControls.rowGap,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
    paddingVertical: formControls.rowPaddingVertical,
  },
  ficonWrap: {
    width: formControls.iconWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    width: formControls.labelWidth,
    flexShrink: 0,
    fontWeight: fonts.weights.bold,
    fontSize: formControls.labelFontSize,
    color: colors.text,
  },
  controlValue: {
    fontSize: formControls.fontSize,
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
  suffix: {
    color: colors.text,
    fontSize: formControls.fontSize,
  },
  selectPlaceholder: {
    color: formControls.placeholderColor,
  },
  stackedField: {
    marginBottom: 14,
  },
  stackedLabel: {
    fontWeight: fonts.weights.bold,
    color: colors.text,
    fontSize: formControls.labelFontSize,
    marginBottom: 6,
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
    fontSize: formControls.fontSize,
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
  listCardCompact: {
    paddingVertical: messagesScreenTokens.listCardPaddingVertical,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    gap: 12,
  },
  listRowPressed: {
    opacity: 0.72,
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
  listRowMain: {
    flex: 1,
    minWidth: 0,
  },
  listRight: {
    flexShrink: 0,
    maxWidth: '36%',
    marginLeft: 8,
    alignItems: 'flex-end',
    justifyContent: 'center',
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
    ...shadows.card,
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
    backgroundColor: colors.surfaceMuted,
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
  shortcutUnifiedCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  shortcutUnifiedCardCompact: {
    paddingVertical: 10,
  },
  shortcutUnifiedItem: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
    gap: 5,
  },
  shortcutUnifiedItemCompact: {
    gap: 4,
  },
  shortcutUnifiedItemPressed: {
    opacity: 0.72,
  },
  shortcutIconWrap: {
    position: 'relative',
  },
  shortcutBadge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.brand2,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutBadgeText: {
    fontSize: 9,
    fontWeight: fonts.weights.bold,
    color: colors.text,
    lineHeight: 12,
  },
  shortcutUnifiedDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.line,
    alignSelf: 'stretch',
    marginVertical: 6,
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
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 10,
    backgroundColor: colors.trustSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.trustBorder,
  },
  tableNoteText: {
    fontSize: 12,
    color: colors.trustText,
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
    backgroundColor: colors.green,
  },
  switchKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    ...shadows.knob,
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
