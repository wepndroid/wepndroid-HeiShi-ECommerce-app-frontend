import React, { useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { Text } from '../../components/typography';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams } from 'expo-router';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { nav, requireAuthNav } from '../../store/navigation';
import { AppIcon, AppIconName } from '../../components/AppIcon';
import { BackButton, IconButton, Notice, ScreenScroll, SectionHead, TitleBar } from '../../components/UI';
import { colors } from '../../theme';
import {
  PUBLISH_CLEARANCE_BUNDLE_ART,
  PUBLISH_SINGLE_ITEM_ART,
} from '../../assets/publishHubArt';
import { styles } from './shared';
import { UploadProductScreen } from './product';
import { PublishBundleScreen } from './bundle';

type SecondhandTab = 'product' | 'bundle';

function SecondhandTabBar({
  tab,
  onTabChange,
}: {
  tab: SecondhandTab;
  onTabChange: (tab: SecondhandTab) => void;
}) {
  const { t } = useTranslation();
  const tabs: { id: SecondhandTab; labelKey: string }[] = [
    { id: 'product', labelKey: 'screens.uploadProduct.listingKindProduct' },
    { id: 'bundle', labelKey: 'screens.publish.bundleTitle' },
  ];

  return (
    <View style={styles.secondhandTabBar}>
      {tabs.map(({ id, labelKey }) => {
        const selected = tab === id;
        return (
          <Pressable
            key={id}
            style={[styles.secondhandTab, selected && styles.secondhandTabActive]}
            onPress={() => onTabChange(id)}
          >
            <Text style={[styles.secondhandTabText, selected && styles.secondhandTabTextActive]}>
              {t(labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type PublishHubCardConfig = {
  key: string;
  titleKey: string;
  descKey: string;
  btnKey: string;
  icon: AppIconName;
  screen: 'publishService' | 'publishJob' | 'publishRental';
};

const SERVICE_HUB_CARD: PublishHubCardConfig = {
  key: 'service',
  titleKey: 'screens.publish.serviceTitle',
  descKey: 'screens.publish.serviceDesc',
  btnKey: 'screens.publishService.submit',
  icon: 'service',
  screen: 'publishService',
};

const GIG_RENTAL_HUB_CARDS: PublishHubCardConfig[] = [
  {
    key: 'job',
    titleKey: 'screens.publish.jobTitle',
    descKey: 'screens.publish.jobDesc',
    btnKey: 'screens.publishJob.submit',
    icon: 'toolbox',
    screen: 'publishJob',
  },
  {
    key: 'rental',
    titleKey: 'screens.publish.rentalTitle',
    descKey: 'screens.publish.rentalDesc',
    btnKey: 'screens.publishRental.submit',
    icon: 'home',
    screen: 'publishRental',
  },
];

function PublishHubCard({
  card,
  onPress,
  t,
}: {
  card: PublishHubCardConfig;
  onPress: () => void;
  t: (key: string) => string;
}) {
  return (
    <Pressable style={styles.publishHubCard} onPress={onPress}>
      <View style={styles.uploadHero}>
        <View style={styles.uploadCenter}>
          <Text style={styles.publishHubTitle}>{t(card.titleKey)}</Text>
          <Text style={styles.publishHubSub}>{t(card.descKey)}</Text>
          <View style={styles.publishHubBtn}>
            <AppIcon name={card.icon} size={14} color={colors.text} />
            <Text style={styles.publishHubBtnText}>{t(card.btnKey)}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export function PublishScreen() {
  const { t } = useTranslation();
  const [secondhandTab, setSecondhandTab] = useState<SecondhandTab>('product');
  useAuthGuard();

  return (
    <ScreenScroll screenId="publish">
      <TitleBar
        left={<BackButton onPress={() => nav('home')} />}
        center={t('screens.publish.title')}
        right={<IconButton icon="more" onPress={() => requireAuthNav('settings')} />}
        compact
      />
      <SectionHead compact title={t('screens.publish.sectionSecondhand')} />
      <SecondhandTabBar tab={secondhandTab} onTabChange={setSecondhandTab} />
      {secondhandTab === 'product' ? (
        <Pressable
          style={styles.publishHubCard}
          onPress={() => requireAuthNav('uploadProduct')}
        >
          <View style={styles.uploadHero}>
            <Image
              source={PUBLISH_SINGLE_ITEM_ART}
              style={styles.publishHubArt}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
            <View style={styles.uploadCenter}>
              <Text style={styles.publishHubTitle}>{t('screens.publish.heroTitle')}</Text>
              <Text style={styles.publishHubSub}>{t('screens.publish.heroSubtitle')}</Text>
              <View style={styles.publishHubBtn}>
                <AppIcon name="camera" size={14} color={colors.text} />
                <Text style={styles.publishHubBtnText}>{t('screens.publish.uploadBtn')}</Text>
              </View>
            </View>
          </View>
        </Pressable>
      ) : (
        <Pressable
          style={styles.publishHubCard}
          onPress={() => requireAuthNav('publishBundle')}
        >
          <View style={styles.uploadHero}>
            <Image
              source={PUBLISH_CLEARANCE_BUNDLE_ART}
              style={styles.publishHubArt}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
            <View style={styles.uploadCenter}>
              <Text style={styles.publishHubTitle}>{t('screens.publish.bundleHeroTitle')}</Text>
              <Text style={styles.publishHubSub}>{t('screens.publish.bundleHeroSubtitle')}</Text>
              <View style={styles.publishHubBtn}>
                <AppIcon name="box" size={14} color={colors.text} />
                <Text style={styles.publishHubBtnText}>{t('screens.publish.bundleHeroBtn')}</Text>
              </View>
            </View>
          </View>
        </Pressable>
      )}

      <SectionHead compact title={t('screens.publish.sectionService')} />
      <PublishHubCard
        card={SERVICE_HUB_CARD}
        onPress={() => requireAuthNav(SERVICE_HUB_CARD.screen)}
        t={t}
      />

      <SectionHead compact title={t('screens.publish.sectionGigsRentals')} />
      {GIG_RENTAL_HUB_CARDS.map((card) => (
        <PublishHubCard
          key={card.key}
          card={card}
          onPress={() => requireAuthNav(card.screen)}
          t={t}
        />
      ))}

      <View style={styles.steps}>
        {[
          { icon: 'camera' as AppIconName, titleKey: 'screens.publish.step1Title', subKey: 'screens.publish.step1Sub' },
          { icon: 'edit' as AppIconName, titleKey: 'screens.publish.step2Title', subKey: 'screens.publish.step2Sub' },
          { icon: 'send' as AppIconName, titleKey: 'screens.publish.step3Title', subKey: 'screens.publish.step3Sub' },
        ].map((step, index) => (
          <React.Fragment key={step.titleKey}>
            {index > 0 ? <Text style={styles.arrow}>→</Text> : null}
            <View style={styles.step}>
              <View style={styles.stepIco}>
                <AppIcon name={step.icon} size={18} color="#e8a500" />
              </View>
              <Text style={styles.stepStrong}>{t(step.titleKey)}</Text>
              <Text style={styles.stepSmall}>{t(step.subKey)}</Text>
            </View>
          </React.Fragment>
        ))}
      </View>
      <Notice text={t('screens.publish.notice')} />
    </ScreenScroll>
  );
}

export function PublishSecondhandScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ tab?: string; kind?: string; mode?: string; listingId?: string }>();
  const isEditMode = params.mode === 'edit' && Boolean(params.listingId);
  const isJob = params.kind === 'job';
  const isRental = params.kind === 'rental';
  useAuthGuard();

  if (isJob || isRental || isEditMode) {
    return <UploadProductScreen listingType={isJob ? 'job' : isRental ? 'rental' : 'product'} />;
  }

  const tab: SecondhandTab = params.tab === 'bundle' ? 'bundle' : 'product';

  return (
    <View style={styles.publishShell}>
      <View style={styles.secondhandStickyHeader}>
        <TitleBar
          center={t('screens.publish.sectionSecondhand')}
          left={<BackButton onPress={() => nav('publish')} />}
        />
      </View>
      <View style={styles.secondhandTabBody}>
        {tab === 'product' ? (
          <UploadProductScreen embedded />
        ) : (
          <PublishBundleScreen embedded />
        )}
      </View>
    </View>
  );
}
