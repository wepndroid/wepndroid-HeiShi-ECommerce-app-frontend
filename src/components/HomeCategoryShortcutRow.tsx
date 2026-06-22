import React from 'react';
import { Image, Pressable, ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Text } from './typography';
import { useTranslation } from 'react-i18next';
import { HOME_CATEGORY_ICONS, HomeCategoryKey } from '../assets/homeCategories';
import { ProductCatKey } from '../types';
import { fonts, filterIconLabelColor } from '../theme';

export const HOME_CATEGORY_SHORTCUTS: { catKey: HomeCategoryKey; labelKey: string }[] = [
  { catKey: 'digital', labelKey: 'homeCats.digital' },
  { catKey: 'home', labelKey: 'homeCats.home' },
  { catKey: 'fashion', labelKey: 'homeCats.fashion' },
  { catKey: 'beauty', labelKey: 'homeCats.beauty' },
  { catKey: 'misc', labelKey: 'homeCats.misc' },
];

export const LOCAL_CATEGORY_SHORTCUTS: { catKey: HomeCategoryKey; labelKey: string }[] = [
  { catKey: 'digital', labelKey: 'homeCats.digital' },
  { catKey: 'home', labelKey: 'homeCats.home' },
  { catKey: 'fashion', labelKey: 'homeCats.fashion' },
  { catKey: 'beauty', labelKey: 'homeCats.beauty' },
];

const IMAGE_SIZE = 44;
const SELECTED_SCALE = 1.25;
/** Reserve space for the selected scale so icons stay vertically aligned. */
const IMAGE_SLOT = Math.ceil(IMAGE_SIZE * SELECTED_SCALE);

type Props = {
  categories: { catKey: HomeCategoryKey; labelKey: string }[];
  selectedKey?: ProductCatKey | null;
  onSelect: (catKey: ProductCatKey) => void;
  contentStyle?: StyleProp<ViewStyle>;
  /** `spread` (default): equal columns across the row. `scroll`: horizontal scroll for overflow. */
  layout?: 'scroll' | 'spread';
};

function CategoryShortcutItem({
  cat,
  selected,
  onSelect,
  spread,
  label,
}: {
  cat: { catKey: HomeCategoryKey; labelKey: string };
  selected: boolean;
  onSelect: (catKey: ProductCatKey) => void;
  spread: boolean;
  label: string;
}) {
  return (
    <Pressable
      style={[styles.item, spread ? styles.itemSpread : styles.itemScroll, selected && styles.itemSelected]}
      onPress={() => onSelect(cat.catKey)}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <View style={styles.imageSlot}>
        <Image
          source={HOME_CATEGORY_ICONS[cat.catKey]}
          style={[styles.image, selected && styles.imageSelected]}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

export function HomeCategoryShortcutRow({
  categories,
  selectedKey = null,
  onSelect,
  contentStyle,
  layout = 'spread',
}: Props) {
  const { t } = useTranslation();
  const spread = layout === 'spread';

  const items = categories.map((cat) => {
    const selected = selectedKey === cat.catKey;
    return (
      <CategoryShortcutItem
        key={cat.catKey}
        cat={cat}
        selected={selected}
        onSelect={onSelect}
        spread={spread}
        label={t(cat.labelKey)}
      />
    );
  });

  if (spread) {
    return <View style={[styles.row, styles.rowSpread, contentStyle]}>{items}</View>;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.row}
      contentContainerStyle={contentStyle}
    >
      {items}
    </ScrollView>
  );
}

/** Map home tab + category filter to the active shortcut key. */
export function activeHomeCategoryKey(
  tab: string,
  category: ProductCatKey | null,
): ProductCatKey | null {
  if (category) return category;
  if (tab === 'digital') return 'digital';
  return null;
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  rowSpread: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
  },
  item: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  itemSpread: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 2,
  },
  itemScroll: {
    width: IMAGE_SLOT + 12,
    marginRight: 8,
  },
  itemSelected: {
    zIndex: 1,
  },
  imageSlot: {
    width: IMAGE_SLOT,
    height: IMAGE_SLOT,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  image: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
  },
  imageSelected: {
    transform: [{ scale: SELECTED_SCALE }],
  },
  label: {
    fontSize: 10,
    lineHeight: 11,
    minHeight: 22,
    color: filterIconLabelColor,
    fontWeight: fonts.weights.medium,
    textAlign: 'center',
    alignSelf: 'stretch',
    marginTop: 2,
  },
});
