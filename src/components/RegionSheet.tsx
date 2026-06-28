import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from './typography';
import { useTranslation } from 'react-i18next';
import {
  ALL_AREAS,
  cityHasSecondaryAreas,
  formatAreaLabel,
  formatCityLabel,
  formatStateHeading,
  formatStateName,
  getPrimaryAreas,
  getSecondaryAreas,
  isSecondaryArea,
  OTHER_AREAS,
  regionData,
  regionSummary,
} from '../data/region';
import { useApp } from '../context/AppContext';
import { PillButton } from './UI';
import { colors, fonts, radius, amazingStyle } from '../theme';

const SHEET_SLIDE_OFFSET = 420;

export function RegionSheet() {
  const { t } = useTranslation();
  const {
    region,
    setRegion,
    regionSheetVisible,
    closeRegionSheet,
  } = useApp();
  const slideAnim = useRef(new Animated.Value(SHEET_SLIDE_OFFSET)).current;
  const [expandedOtherCity, setExpandedOtherCity] = useState<string | null>(null);

  useEffect(() => {
    if (!regionSheetVisible) {
      setExpandedOtherCity(null);
      return;
    }
    const city = regionData
      .find((g) => g.state === region.state)
      ?.cities.find((c) => c.name === region.city);
    if (!city) {
      setExpandedOtherCity(null);
      return;
    }
    if (region.area === OTHER_AREAS || isSecondaryArea(city, region.area)) {
      setExpandedOtherCity(city.name);
    } else {
      setExpandedOtherCity(null);
    }
  }, [regionSheetVisible, region.state, region.city, region.area]);

  useEffect(() => {
    if (!regionSheetVisible) {
      slideAnim.setValue(SHEET_SLIDE_OFFSET);
      return;
    }
    slideAnim.setValue(SHEET_SLIDE_OFFSET);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [regionSheetVisible, slideAnim]);

  const selectedLabel = regionSummary(region);

  return (
    <Modal
      visible={regionSheetVisible}
      transparent
      animationType="none"
      onRequestClose={closeRegionSheet}
    >
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={closeRegionSheet} />
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
        >
          <View style={styles.head}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headTitle}>{t('region.title')}</Text>
              <Text style={styles.headSub}>{t('region.subtitle')}</Text>
            </View>
            <Pressable style={styles.close} onPress={closeRegionSheet}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>
          <Text style={styles.current}>{t('region.current', { value: selectedLabel })}</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {regionData.map((group) => {
              const activeGroup = group.state === region.state;
              return (
                <View
                  key={group.state}
                  style={[styles.card, activeGroup && styles.cardActive]}
                >
                  <View style={styles.cardTitle}>
                    <Text style={styles.cardTitleStrong}>
                      {formatStateHeading(group.state, group.stateName)}
                    </Text>
                    <Text style={styles.cardTitleSmall} numberOfLines={1}>
                      {group.cities.map((c) => formatCityLabel(c)).join(' / ')}
                    </Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.chipRow}>
                      {group.cities.map((city) => (
                        <Pressable
                          key={city.name}
                          style={[
                            styles.cityChip,
                            city.name === region.city && activeGroup && styles.chipActive,
                          ]}
                          onPress={() =>
                            setRegion({ state: group.state, city: city.name, area: ALL_AREAS })
                          }
                        >
                          <Text
                            style={[
                              styles.chipText,
                              city.name === region.city && activeGroup && styles.chipTextActive,
                            ]}
                          >
                            {formatCityLabel(city)}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                  {activeGroup &&
                    group.cities
                      .filter((c) => c.name === region.city)
                      .map((city) => {
                        const primaryAreas = getPrimaryAreas(city);
                        const secondaryAreas = getSecondaryAreas(city);
                        const showSecondary =
                          expandedOtherCity === city.name && secondaryAreas.length > 0;
                        const otherAreasActive =
                          region.area === OTHER_AREAS ||
                          secondaryAreas.some((area) => region.area === area);

                        return (
                        <View key={city.name} style={styles.areaWrap}>
                          <Pressable
                            style={[
                              styles.areaChip,
                              region.area === ALL_AREAS && styles.chipActive,
                            ]}
                            onPress={() => {
                              setExpandedOtherCity(null);
                              setRegion({ state: group.state, city: city.name, area: ALL_AREAS });
                            }}
                          >
                            <Text
                              style={[
                                styles.areaChipText,
                                region.area === ALL_AREAS && styles.chipTextActive,
                              ]}
                            >
                              {t('region.allAreas')}
                            </Text>
                          </Pressable>
                          {primaryAreas.map((area) => (
                            <Pressable
                              key={area}
                              style={[
                                styles.areaChip,
                                region.area === area && styles.chipActive,
                              ]}
                              onPress={() => {
                                setExpandedOtherCity(null);
                                setRegion({ state: group.state, city: city.name, area });
                              }}
                            >
                              <Text
                                style={[
                                  styles.areaChipText,
                                  region.area === area && styles.chipTextActive,
                                ]}
                              >
                                {formatAreaLabel(area)}
                              </Text>
                            </Pressable>
                          ))}
                          {cityHasSecondaryAreas(city) && (
                            <Pressable
                              style={[
                                styles.areaChip,
                                styles.otherAreasChip,
                                (showSecondary || otherAreasActive) && styles.chipActive,
                              ]}
                              onPress={() =>
                                setExpandedOtherCity((prev) =>
                                  prev === city.name ? null : city.name,
                                )
                              }
                            >
                              <Text
                                style={[
                                  styles.areaChipText,
                                  (showSecondary || otherAreasActive) && styles.chipTextActive,
                                ]}
                              >
                                {t('region.otherAreas')}
                              </Text>
                            </Pressable>
                          )}
                          {showSecondary && (
                            <View style={styles.secondaryWrap}>
                              <Text style={styles.secondaryLabel}>
                                {t('region.moreAreasInCity', { city: formatCityLabel(city) })}
                              </Text>
                              <View style={styles.secondaryRow}>
                                {secondaryAreas.map((area) => (
                                  <Pressable
                                    key={area}
                                    style={[
                                      styles.areaChip,
                                      styles.secondaryChip,
                                      region.area === area && styles.chipActive,
                                    ]}
                                    onPress={() =>
                                      setRegion({ state: group.state, city: city.name, area })
                                    }
                                  >
                                    <Text
                                      style={[
                                        styles.areaChipText,
                                        region.area === area && styles.chipTextActive,
                                      ]}
                                    >
                                      {formatAreaLabel(area)}
                                    </Text>
                                  </Pressable>
                                ))}
                                <Pressable
                                  style={[
                                    styles.areaChip,
                                    styles.secondaryChip,
                                    region.area === OTHER_AREAS && styles.chipActive,
                                  ]}
                                  onPress={() =>
                                    setRegion({
                                      state: group.state,
                                      city: city.name,
                                      area: OTHER_AREAS,
                                    })
                                  }
                                >
                                  <Text
                                    style={[
                                      styles.areaChipText,
                                      region.area === OTHER_AREAS && styles.chipTextActive,
                                    ]}
                                  >
                                    {t('region.otherAreasCatchAll')}
                                  </Text>
                                </Pressable>
                              </View>
                            </View>
                          )}
                        </View>
                        );
                      })}
                </View>
              );
            })}
          </ScrollView>
          <PillButton label={t('common.done')} variant="brand" full onPress={closeRegionSheet} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 28,
    maxHeight: '82%',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
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
  current: {
    fontSize: 12,
    color: colors.sub,
    marginBottom: 10,
    lineHeight: 17,
  },
  card: {
    ...amazingStyle,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 10,
  },
  cardActive: {
    borderColor: colors.brand,
    backgroundColor: colors.brand3,
  },
  cardTitle: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  cardTitleStrong: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  cardTitleSmall: {
    flexShrink: 0,
    maxWidth: '46%',
    fontSize: 10,
    color: colors.sub,
    textAlign: 'right',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 7,
    paddingBottom: 2,
  },
  cityChip: {
    borderRadius: radius.pill,
    backgroundColor: '#f6f6f3',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  areaWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 8,
  },
  areaChip: {
    borderRadius: radius.pill,
    backgroundColor: colors.brand3,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  areaChipText: {
    fontSize: 12,
    fontWeight: fonts.weights.bold,
    color: '#7c5600',
  },
  otherAreasChip: {
    borderWidth: 1,
    borderColor: '#e8d48a',
  },
  secondaryWrap: {
    width: '100%',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0ead0',
  },
  secondaryLabel: {
    width: '100%',
    fontSize: 11,
    color: colors.sub,
    marginBottom: 6,
  },
  secondaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  secondaryChip: {
    backgroundColor: colors.brand3,
  },
  chipActive: {
    backgroundColor: colors.brand3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.brand,
  },
  chipText: {
    fontSize: 12,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  chipTextActive: {
    color: colors.text,
  },
});
