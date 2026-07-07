import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DismissibleModal, PillButton } from './UI';
import { Text } from './typography';
import { colors, fonts, radius } from '../theme';

/** Report reason categories — value is stored on the report; label is localized. */
export const REPORT_REASONS = ['prohibited', 'counterfeit', 'fraud', 'offensive', 'spam', 'other'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

/**
 * In-app report modal (replaces the OS Alert). Collects a reason category and a free-text
 * description so the admin web can review the full context of the report.
 */
export function ReportSheet({
  visible,
  onClose,
  onSubmit,
  submitting,
  title,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: ReportReason, details: string) => void;
  submitting?: boolean;
  title?: string;
}) {
  const { t } = useTranslation();
  const [reason, setReason] = useState<ReportReason>('prohibited');
  const [details, setDetails] = useState('');

  useEffect(() => {
    if (!visible) return;
    setReason('prohibited');
    setDetails('');
  }, [visible]);

  const canSubmit = details.trim().length > 0 && !submitting;

  return (
    <DismissibleModal visible={visible} onClose={onClose} animationType="slide" placement="bottom">
      <View style={styles.sheet}>
        <View style={styles.head}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headTitle}>{title ?? t('screens.report.title')}</Text>
            <Text style={styles.headSub}>{t('screens.report.subtitle')}</Text>
          </View>
          <Pressable style={styles.close} onPress={onClose} accessibilityRole="button">
            <Text style={styles.closeText}>×</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>{t('screens.report.reasonLabel')}</Text>
        <View style={styles.chips}>
          {REPORT_REASONS.map((value) => {
            const active = value === reason;
            return (
              <Pressable
                key={value}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setReason(value)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
                  {t(`screens.report.reasons.${value}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>{t('screens.report.detailsLabel')}</Text>
        <TextInput
          style={styles.input}
          value={details}
          onChangeText={setDetails}
          placeholder={t('screens.report.detailsPlaceholder')}
          placeholderTextColor={colors.sub}
          multiline
          numberOfLines={4}
          maxLength={500}
          textAlignVertical="top"
        />

        <PillButton
          label={t('common.report')}
          variant="brand"
          full
          disabled={!canSubmit}
          onPress={() => onSubmit(reason, details.trim())}
        />
        <PillButton label={t('common.cancel')} variant="light" full onPress={onClose} />
      </View>
    </DismissibleModal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 6,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 16,
  },
  headTitle: {
    fontSize: 18,
    fontWeight: fonts.weights.bold,
    color: colors.text,
    marginBottom: 4,
  },
  headSub: {
    fontSize: 12,
    color: colors.sub,
    lineHeight: 17,
  },
  close: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f6f6f3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 18,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: fonts.weights.bold,
    color: colors.text,
    marginBottom: 8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: colors.paper,
  },
  chipActive: {
    borderColor: colors.brand,
    backgroundColor: colors.brand3,
  },
  chipText: {
    fontSize: 13,
    fontWeight: fonts.weights.medium,
    color: colors.sub,
  },
  chipTextActive: {
    color: colors.text,
    fontWeight: fonts.weights.bold,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 96,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.paper,
    marginBottom: 16,
  },
});
