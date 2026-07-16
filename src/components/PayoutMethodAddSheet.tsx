import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { PayoutMethodDto } from '../api/types';
import { AppIcon, type AppIconName } from './AppIcon';
import { ListIcon } from './FormUI';
import { DismissibleModal, PillButton } from './UI';
import { Text } from './typography';
import { colors, fonts, radius } from '../theme';

type PayoutMethodType = PayoutMethodDto['type'];

type AddOption = {
  type: PayoutMethodType;
  icon: AppIconName;
  titleKey: string;
  subKey: string;
};

const OPTIONS: AddOption[] = [
  { type: 'bank', icon: 'bank', titleKey: 'screens.payoutSettings.addBank', subKey: 'screens.payoutSettings.bankSub' },
  { type: 'paypal', icon: 'paypal', titleKey: 'screens.payoutSettings.addPaypal', subKey: 'screens.payoutSettings.paypalSub' },
  { type: 'alipay', icon: 'alipay', titleKey: 'screens.payoutSettings.addAlipay', subKey: 'screens.payoutSettings.alipaySub' },
  { type: 'wechat', icon: 'wechat', titleKey: 'screens.payoutSettings.addWechat', subKey: 'screens.payoutSettings.wechatSub' },
];

function providerFieldKey(type: 'alipay' | 'wechat') {
  if (type === 'alipay') return 'alipay';
  return 'wechat';
}

export function PayoutMethodAddSheet({
  visible,
  onClose,
  onSubmitBank,
  onSubmitPayPal,
  onSubmitProvider,
  onRequireBinding,
  providerBindings,
  busyType,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmitBank: () => void;
  onSubmitPayPal: () => void;
  onSubmitProvider: (type: 'alipay' | 'wechat', accountRef: string) => void;
  onRequireBinding?: (type: 'alipay' | 'wechat') => void;
  providerBindings?: { alipay: boolean; wechat: boolean };
  busyType?: PayoutMethodType | null;
}) {
  const { t } = useTranslation();
  const [selectedType, setSelectedType] = React.useState<'alipay' | 'wechat' | null>(null);
  const [accountRef, setAccountRef] = React.useState('');

  React.useEffect(() => {
    if (!visible) {
      setSelectedType(null);
      setAccountRef('');
    }
  }, [visible]);

  const selectOption = (type: PayoutMethodType) => {
    if (type === 'bank') {
      onSubmitBank();
      return;
    }
    if (type === 'paypal') {
      onSubmitPayPal();
      return;
    }
    if ((type === 'alipay' || type === 'wechat') && providerBindings && !providerBindings[type]) {
      onRequireBinding?.(type);
      return;
    }
    setSelectedType(type);
    setAccountRef('');
  };

  const submitProvider = () => {
    if (!selectedType) return;
    onSubmitProvider(selectedType, accountRef.trim());
  };

  const fieldKey = selectedType ? providerFieldKey(selectedType) : null;
  const title = selectedType
    ? t(`screens.payoutSettings.${fieldKey}FieldTitle`)
    : t('screens.payoutSettings.addChooseTitle');
  const subtitle = selectedType
    ? t(`screens.payoutSettings.${fieldKey}FieldSub`)
    : t('screens.payoutSettings.addSheetSub');

  return (
    <DismissibleModal visible={visible} onClose={onClose} animationType="slide" placement="bottom">
      <View style={styles.sheet}>
        <View style={styles.head}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.sub}>{subtitle}</Text>
          </View>
          <Pressable style={styles.close} onPress={onClose} accessibilityRole="button">
            <Text style={styles.closeText}>x</Text>
          </Pressable>
        </View>

        {!selectedType ? (
          <View style={styles.list}>
            {OPTIONS.map((option) => {
              const busy = busyType === option.type;
              const bindingRequired = (option.type === 'alipay' || option.type === 'wechat')
                && providerBindings
                && !providerBindings[option.type];
              return (
                <Pressable
                  key={option.type}
                  style={[styles.option, busy && styles.optionBusy, bindingRequired && styles.optionNeedsBinding]}
                  onPress={() => selectOption(option.type)}
                  disabled={Boolean(busyType)}
                  accessibilityRole="button"
                >
                  <ListIcon name={option.icon} />
                  <View style={styles.optionBody}>
                    <Text style={styles.optionTitle} numberOfLines={1}>
                      {t(option.titleKey)}
                    </Text>
                    <Text style={styles.optionSub} numberOfLines={2}>
                      {bindingRequired
                        ? t(`screens.payoutSettings.${option.type}BindFirstSub`)
                        : t(option.subKey)}
                    </Text>
                  </View>
                  {bindingRequired ? (
                    <Text style={styles.bindStatus}>{t('common.notBound')}</Text>
                  ) : (
                    <AppIcon name="chevronForward" size={18} color={colors.sub} />
                  )}
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View>
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>{t(`screens.payoutSettings.${fieldKey}FieldLabel`)}</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={accountRef}
                  onChangeText={setAccountRef}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder={t(`screens.payoutSettings.${fieldKey}Placeholder`)}
                  placeholderTextColor={colors.sub}
                  keyboardType="default"
                  selectionColor={colors.brand2}
                />
              </View>
            </View>

            <View style={styles.formActions}>
              <PillButton
                label={t('screens.payoutSettings.saveProvider')}
                variant="brand"
                full
                onPress={submitProvider}
                disabled={Boolean(busyType) || !accountRef.trim()}
              />
              <PillButton
                label={t('common.cancel')}
                variant="light"
                full
                onPress={() => {
                  setSelectedType(null);
                  setAccountRef('');
                }}
                disabled={Boolean(busyType)}
              />
            </View>
          </View>
        )}
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
    opacity: 0.7,
  },
  optionNeedsBinding: {
    borderColor: '#f0d49b',
    backgroundColor: '#fffaf0',
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
  bindStatus: {
    fontSize: 12,
    fontWeight: fonts.weights.medium,
    color: colors.brand2,
  },
  fieldBlock: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: fonts.weights.medium,
    color: colors.text,
    marginBottom: 8,
  },
  inputWrap: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    backgroundColor: colors.paper,
  },
  input: {
    minHeight: 48,
    fontSize: 15,
    color: colors.text,
  },
  formActions: {
    gap: 10,
    marginBottom: 6,
  },
});
