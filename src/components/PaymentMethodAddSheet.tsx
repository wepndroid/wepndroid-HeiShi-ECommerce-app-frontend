import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { PaymentMethodDto } from '../api/types';
import { AppIcon, type AppIconName } from './AppIcon';
import { ListIcon } from './FormUI';
import { DismissibleModal, PillButton } from './UI';
import { Text } from './typography';
import { colors, fonts, radius } from '../theme';

type PaymentMethodType = PaymentMethodDto['type'];

type AddOption = {
  type: PaymentMethodType;
  icon: AppIconName;
  titleKey: string;
  subKey: string;
};

const OPTIONS: AddOption[] = [
  { type: 'card', icon: 'card', titleKey: 'screens.paymentSettings.addCard', subKey: 'screens.paymentSettings.addCardHint' },
];

export function PaymentMethodAddSheet({
  visible,
  onClose,
  onSelect,
  busyType,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: PaymentMethodType) => void;
  busyType?: PaymentMethodType | null;
}) {
  const { t } = useTranslation();

  return (
    <DismissibleModal visible={visible} onClose={onClose} animationType="slide" placement="bottom">
      <View style={styles.sheet}>
        <View style={styles.head}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{t('screens.paymentSettings.addChooseTitle')}</Text>
            <Text style={styles.sub}>{t('screens.paymentSettings.addSheetSub')}</Text>
          </View>
          <Pressable style={styles.close} onPress={onClose} accessibilityRole="button">
            <Text style={styles.closeText}>x</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {OPTIONS.map((option) => {
            const busy = busyType === option.type;
            return (
              <Pressable
                key={option.type}
                style={[styles.option, busy && styles.optionBusy]}
                onPress={() => onSelect(option.type)}
                disabled={Boolean(busyType)}
                accessibilityRole="button"
              >
                <ListIcon name={option.icon} />
                <View style={styles.optionBody}>
                  <Text style={styles.optionTitle} numberOfLines={1}>
                    {t(option.titleKey)}
                  </Text>
                  <Text style={styles.optionSub} numberOfLines={2}>
                    {t(option.subKey)}
                  </Text>
                </View>
                {busy ? (
                  <AppIcon name="check" size={18} color={colors.brand2} />
                ) : (
                  <AppIcon name="chevronForward" size={18} color={colors.sub} />
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.note}>
          <Text style={styles.noteText}>
            {t('screens.paymentSettings.checkoutMethodsSub', {
              defaultValue:
                'PayPal, Alipay, WeChat Pay, Apple Pay, and Google Pay are selected during checkout instead of being saved in Settings.',
            })}
          </Text>
        </View>

        <PillButton label={t('common.cancel')} variant="light" full onPress={onClose} />
      </View>
    </DismissibleModal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    paddingHorizontal: 14,
    paddingTop: 18,
    maxHeight: '100%',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: fonts.weights.bold,
    color: colors.text,
    marginBottom: 4,
  },
  sub: {
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
  list: {
    maxHeight: 380,
    marginBottom: 14,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 13,
    marginBottom: 8,
    backgroundColor: colors.paper,
  },
  optionBusy: {
    borderColor: colors.brand,
    backgroundColor: colors.brand3,
  },
  optionBody: {
    flex: 1,
    minWidth: 0,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  optionSub: {
    fontSize: 12,
    color: colors.sub,
    marginTop: 3,
  },
  note: {
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  noteText: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.sub,
  },
});
