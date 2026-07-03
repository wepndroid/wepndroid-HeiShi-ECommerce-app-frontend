import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Text } from '../../components/typography';
import { useTranslation } from 'react-i18next';
import { Logo } from '../../components/UI';
import { Chevron, DetailCard, ListCard, ListRow, ListRowMain, TableNote } from '../../components/FormUI';
import { EmptyHint, PillButton, SearchBar } from '../../components/UI';
import { SimplePage, openSupportEmail, styles } from './shared';

export function AgreementScreen() {
  const { t } = useTranslation();

  return (
    <SimplePage screenId="agreement" title={t('screens.agreement.title')}>
      <TableNote>{`${t('screens.agreement.s1Title')}\n${t('screens.agreement.s1Body')}`}</TableNote>
      <TableNote>{`${t('screens.agreement.s2Title')}\n${t('screens.agreement.s2Body')}`}</TableNote>
      <TableNote>{`${t('screens.agreement.s3Title')}\n${t('screens.agreement.s3Body')}`}</TableNote>
    </SimplePage>
  );
}

export function PrivacyPolicyScreen() {
  const { t } = useTranslation();

  return (
    <SimplePage screenId="privacyPolicy" title={t('screens.privacyPolicy.title')}>
      <TableNote>{`${t('screens.privacyPolicy.cTitle')}\n${t('screens.privacyPolicy.cBody')}`}</TableNote>
      <TableNote>{`${t('screens.privacyPolicy.uTitle')}\n${t('screens.privacyPolicy.uBody')}`}</TableNote>
      <TableNote>{`${t('screens.privacyPolicy.sTitle')}\n${t('screens.privacyPolicy.sBody')}`}</TableNote>
    </SimplePage>
  );
}

export function HelpScreen() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const faqs = [
    { titleKey: 'screens.help.q1Title', answerKey: 'screens.help.q1Answer' },
    { titleKey: 'screens.help.q2Title', answerKey: 'screens.help.q2Answer' },
    { titleKey: 'screens.help.q3Title', answerKey: 'screens.help.q3Answer' },
    { titleKey: 'screens.help.q4Title', answerKey: 'screens.help.q4Answer' },
  ] as const;

  const normalizedQuery = query.trim().toLowerCase();

  const filteredFaqs = useMemo(() => {
    if (!normalizedQuery) return faqs;
    return faqs.filter((faq) => {
      const title = t(faq.titleKey).toLowerCase();
      const answer = t(faq.answerKey).toLowerCase();
      return title.includes(normalizedQuery) || answer.includes(normalizedQuery);
    });
  }, [faqs, normalizedQuery, t]);

  return (
    <SimplePage screenId="help" title={t('screens.help.title')}>
      <SearchBar
        placeholder={t('common.placeholders.searchProblems')}
        value={query}
        onChangeText={setQuery}
      />
      {!filteredFaqs.length && normalizedQuery ? (
        <EmptyHint text={t('screens.help.noSearchResults')} />
      ) : null}
      <ListCard>
        {filteredFaqs.map((faq, index) => {
          const expanded = expandedKey === faq.titleKey;
          return (
            <ListRow
              key={faq.titleKey}
              onPress={() => setExpandedKey(expanded ? null : faq.titleKey)}
              left={
                <ListRowMain>
                  <Text style={styles.rowTitle}>{t(faq.titleKey)}</Text>
                  {expanded ? (
                    <Text style={styles.helpAnswer}>{t(faq.answerKey)}</Text>
                  ) : null}
                </ListRowMain>
              }
              right={
                <View style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }}>
                  <Chevron />
                </View>
              }
              border={index < filteredFaqs.length - 1}
            />
          );
        })}
      </ListCard>
      <PillButton label={t('common.onlineSupport')} variant="brand" full onPress={openSupportEmail} />
    </SimplePage>
  );
}

export function TradeRulesScreen() {
  const { t } = useTranslation();

  return (
    <SimplePage screenId="safetyCenter" title={t('screens.tradeRules.title')}>
      <TableNote>{`${t('screens.tradeRules.s1Title')}\n${t('screens.tradeRules.s1Body')}`}</TableNote>
      <TableNote>{`${t('screens.tradeRules.s2Title')}\n${t('screens.tradeRules.s2Body')}`}</TableNote>
      <TableNote>{`${t('screens.tradeRules.s3Title')}\n${t('screens.tradeRules.s3Body')}`}</TableNote>
      <TableNote>{`${t('screens.tradeRules.s4Title')}\n${t('screens.tradeRules.s4Body')}`}</TableNote>
    </SimplePage>
  );
}

export function AboutScreen() {
  const { t } = useTranslation();

  return (
    <SimplePage screenId="about" title={t('screens.about.title')}>
      <DetailCard>
        <View style={{ alignItems: 'center' }}>
          <Logo size={28} />
          <Text style={[styles.profileSub, { textAlign: 'center', marginTop: 8 }]}>{t('screens.about.tagline')}</Text>
          <Text style={styles.profileSub}>{t('screens.settings.versionDemo')}</Text>
        </View>
      </DetailCard>
      <ListCard>
        <ListRow left={<Text style={styles.rowTitle}>{t('screens.about.website')}</Text>} right={<Text style={styles.statusText}>heishi.app</Text>} />
        <ListRow left={<Text style={styles.rowTitle}>{t('screens.about.email')}</Text>} right={<Text style={styles.statusText}>support@heishi.app</Text>} />
        <ListRow left={<Text style={styles.rowTitle}>{t('screens.about.copyright')}</Text>} right={<Text style={styles.statusText}>© HeiShi</Text>} border={false} />
      </ListCard>
    </SimplePage>
  );
}
