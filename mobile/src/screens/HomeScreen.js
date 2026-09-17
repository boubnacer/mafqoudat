/**
 * Home tab - compact discovery feed.
 * Mirrors client/src/features/dashboard/Dash.js structurally (stats + world
 * activity map header, recent founds/losts, categories) but adapted for a
 * phone: everything is a lean "See all" handoff into PostsListScreen rather
 * than a full section. Data comes from the same GET /dashboard endpoint
 * (useDashboardData.js).
 */

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable, Image, Animated, RefreshControl, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../utils/translations';
import { useReferenceData, getLocalizedLabel } from '../context/ReferenceDataContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { getCategoryConfig, sortCategoriesForBrowse } from '../config/categories';
import { getImageUri } from '../utils/imageUri';
import { colorTokens, radiusTokens, fontFamilies } from '../theme/tokens';
import AppHeader from '../components/AppHeader';
import DataStateView from '../components/DataStateView';
import GlowBlob from '../components/GlowBlob';
import NeumorphicSurface from '../components/NeumorphicSurface';
import SkeletonBlock from '../components/SkeletonBlock';
import WorldActivityMap from '../components/dashboard/WorldActivityMap';
import { useStaggeredFadeIn } from '../hooks/useStaggeredFadeIn';
import { alignEnd, alignStart, logical, needsDirectionFlip, row } from '../utils/rtl';
import { formatRelativeTime } from '../utils/relativeTime';

const SECTION_COUNT = 7;

// Horizontal padding of the scroll content - kept as a constant so the
// header's map backdrop can cancel it out and bleed to the screen edges.
const SCREEN_PADDING = 16;

// Diameter of the social section's neumorphic circles. A constant because the
// surface needs the matching corner radius as a prop, not just in a style.
const SOCIAL_CIRCLE_SIZE = 56;

// "Browse by category" grid, ported 1:1 from web's Categories.jsx (Phase 15's
// neumorphic bento layout was replaced with this on request, for exact parity
// with the /dash mobile-responsive view): a uniform 2-up grid, no featured
// cell, collapsed to CATEGORY_COLLAPSED_SMALL_COUNT cards (web's own
// `CATEGORY_COLLAPSED_SMALL_COUNT` for its `xs`/`sm` breakpoint) with a
// "show all" toggle.
const CATEGORY_COLLAPSED_SMALL_COUNT = 4;

// Same accounts as client/src/components/Footer/DashFooter.js's socialLinks -
// kept in sync manually since the mobile app has no shared config module yet.
const SOCIAL_LINKS = [
  {
    key: 'facebook',
    labelKey: 'socialFacebook',
    icon: 'logo-facebook',
    brandColor: '#1877F2',
    url: 'https://www.facebook.com/profile.php?id=100075968495897',
  },
  {
    key: 'instagram',
    labelKey: 'socialInstagram',
    icon: 'logo-instagram',
    brandColor: '#E1306C',
    url: 'https://www.instagram.com/mafkoudat?igsh=d29saTdtajZ5dWpu',
  },
  {
    key: 'whatsapp',
    labelKey: 'socialWhatsapp',
    icon: 'logo-whatsapp',
    brandColor: '#25D366',
    url: 'https://wa.me/212711621132',
  },
];

// Same scrim as web's RecentPosts.jsx card:
// `linear-gradient(to top, rgba(0,0,0,.65) 0%, rgba(0,0,0,.05) 45%, rgba(0,0,0,.4) 100%)`.
// CSS `to top` reads bottom -> top while LinearGradient's default axis reads
// top -> bottom, so the stops are listed in reverse here.
const POSTER_SCRIM_COLORS = ['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.05)', 'rgba(0,0,0,0.65)'];
const POSTER_SCRIM_LOCATIONS = [0, 0.55, 1];

// Mirrors client/src/designTokens.js's elevationTokens (e1/e2 boxShadow
// strings, resolved per light/dark mode) as RN shadow/elevation props -
// same shadow color/opacity the web panels use, not an arbitrary RN default.
const getElevation = (isDark, level = 1) =>
  level === 2
    ? {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.45 : 0.1,
        shadowRadius: 16,
        elevation: 4,
      }
    : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDark ? 0.4 : 0.06,
        shadowRadius: 2,
        elevation: 2,
      };

// Dashboard aggregation projects Categories (array, new format) with a
// Category/categoryname fallback for legacy posts - same shape trending and
// recent items share (see server/controllers/dependenciesController.js).
const getCategoryInfo = (item) => {
  if (Array.isArray(item?.Categories) && item.Categories.length > 0) return item.Categories[0];
  if (item?.Category?.code) return item.Category;
  if (item?.categoryname) return { code: item.categoryname, labels: null };
  return null;
};

const getCategoryLabel = (item, currentLanguage) => {
  const cat = getCategoryInfo(item);
  if (!cat) return null;
  return cat.labels ? cat.labels[currentLanguage] || cat.labels.en || cat.code : cat.code;
};

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

const getCityLabel = (item, currentLanguage) => {
  if (item?.cityLabels && typeof item.cityLabels === 'object') {
    const label = item.cityLabels[currentLanguage] || item.cityLabels.en;
    if (label && label.trim()) return label.trim();
  }
  if (item?.cityName && item.cityName.trim()) return item.cityName.trim();
  if (typeof item?.city === 'string' && item.city.trim() && !OBJECT_ID_RE.test(item.city.trim())) {
    return item.city.trim();
  }
  return null;
};

// Mirrors MUI's theme.palette.getContrastText() used by web's RecentPosts.jsx
// to pick legible text/icon color against a solid category-color card fill.
const getContrastText = (hexColor) => {
  if (!hexColor) return '#FFFFFF';
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#0B1220' : '#FFFFFF';
};

// Mirrors client/src/components/dashboard/RecentSection.jsx's header: a
// tone-colored status icon paired with the section title on the start edge,
// "See all" + chevron on the end edge.
const SectionHeader = ({ title, icon, iconColor, onSeeAll, seeAllColor, t, styles, isRTL }) => (
  <View style={[styles.sectionHeaderRow, { flexDirection: row(isRTL) }]}>
    <View style={[styles.sectionTitleGroup, { flexDirection: row(isRTL) }]}>
      {icon ? <Ionicons name={icon} size={24} color={iconColor} /> : null}
      <Text style={styles.panelTitleInline} numberOfLines={1}>
        {title}
      </Text>
    </View>
    {onSeeAll ? (
      <TouchableOpacity onPress={onSeeAll} hitSlop={8} style={styles.seeAllRow}>
        <Text style={[styles.seeAllText, seeAllColor && { color: seeAllColor }]}>{t('seeAll')}</Text>
        <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={14} color={seeAllColor || styles.seeAllText.color} />
      </TouchableOpacity>
    ) : null}
  </View>
);

// Mirrors the blurred surfaceRaised panel shell shared by LeftSide.jsx /
// TrendingItem.jsx's SectionPanel on web - every dashboard section now sits
// in the same bordered/elevated card instead of floating on the page background.
const Panel = ({ title, accentColor, style, styles, isRTL, children }) => (
  <View
    style={[
      styles.panelContainer,
      accentColor && logical(isRTL, { borderStartWidth: 4, borderStartColor: accentColor }),
      style,
    ]}
  >
    {title ? <Text style={styles.panelTitleCentered}>{title}</Text> : null}
    {children}
  </View>
);

// Mirrors client/src/components/dashboard/FoundLostStrip.jsx's mobile (xs)
// layout: Found and Lost aren't independent metrics, so they render as one
// connected strip - each a full-width stacked segment (icon, big number,
// "+N today") - rather than two identical small tiles.
const StatSegment = ({ icon, label, value, todayValue, tone, onPress, isLast, styles, t }) => {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      {...(onPress ? { onPress, activeOpacity: 0.75 } : {})}
      style={[styles.statSegment, !isLast && styles.statSegmentDivider]}
    >
      <View style={styles.statSegmentHeader}>
        <View style={[styles.statSegmentIcon, { backgroundColor: tone.bg }]}>
          <Ionicons name={icon} size={20} color={tone.main} />
        </View>
        <Text style={styles.statSegmentLabel}>{label}</Text>
      </View>
      <Text style={[styles.statSegmentValue, { color: tone.main }]}>{value}</Text>
      <Text style={styles.statSegmentToday}>
        + {todayValue} {t('today')}
      </Text>
    </Wrapper>
  );
};

const FoundLostStrip = ({ data, t, styles, tokens, onFoundPress, onLostPress }) => {
  const totalFounds = data?.totalFounds || 0;
  const totalLosts = data?.totalLosts || 0;

  return (
    <View style={styles.foundLostStrip}>
      <StatSegment
        icon="checkmark-circle-outline"
        label={t('foundItems')}
        value={totalFounds}
        todayValue={data?.createdToday?.todaysFoundPosts || 0}
        tone={tokens.status.found}
        onPress={onFoundPress}
        styles={styles}
        t={t}
      />
      <StatSegment
        icon="search-outline"
        label={t('lostItems')}
        value={totalLosts}
        todayValue={data?.createdToday?.todaysLostPosts || 0}
        tone={tokens.status.lost}
        onPress={onLostPress}
        isLast
        styles={styles}
        t={t}
      />
    </View>
  );
};

// Mirrors TotalBox.jsx's mobile treatment (tall card, icon top-corner, big
// value, caption pinned to the bottom) for the two supporting stats below
// the Found/Lost hero strip.
const BigStatCard = ({ icon, title, value, description, tone, cardStyle, styles }) => (
  <View style={[styles.bigStatCard, cardStyle]}>
    <View style={styles.bigStatCardTop}>
      <Text style={styles.bigStatCardTitle}>{title}</Text>
      <View style={[styles.bigStatCardIcon, { backgroundColor: `${tone}26` }]}>
        <Ionicons name={icon} size={20} color={tone} />
      </View>
    </View>
    <Text style={[styles.bigStatCardValue, { color: tone }]}>{value}</Text>
    <Text style={styles.bigStatCardDescription}>{description}</Text>
  </View>
);

// Same glass-blob family as web's LeftSide.jsx/QuickActions.jsx/
// RecentSection.jsx/HelpSupportSection.jsx/Dash.js: a single very faint
// brandPrimary glow tucked into the panel's top-start corner, at the same
// fraction of strength LeftSide.jsx uses (this panel is bare/transparent
// per Phase 10, not a filled card, so a bolder blob would read as a stray
// smudge rather than a tint).
const StatsSection = ({ data, isLoading, t, styles, tokens, isDark, isRTL, onFoundPress, onLostPress }) => {
  const statsBlob = (
    <GlowBlob
      color={tokens.brandPrimary}
      opacity={isDark ? 0.14 : 0.1}
      size={190}
      style={logical(isRTL, { top: -30, start: -40 })}
    />
  );

  if (isLoading && !data) {
    return (
      <Panel title={t('statistics')} style={styles.statsPanelGlass} styles={styles}>
        {statsBlob}
        <SkeletonBlock tokens={tokens} style={styles.foundLostSkeleton} />
        <View style={styles.bigStatsRow}>
          <SkeletonBlock tokens={tokens} style={styles.bigStatSkeleton} />
          <SkeletonBlock tokens={tokens} style={styles.bigStatSkeleton} />
        </View>
      </Panel>
    );
  }

  return (
    <Panel title={t('statistics')} style={styles.statsPanelGlass} styles={styles}>
      {statsBlob}
      <FoundLostStrip data={data} t={t} styles={styles} tokens={tokens} onFoundPress={onFoundPress} onLostPress={onLostPress} />
      <View style={styles.bigStatsRow}>
        <BigStatCard
          icon="albums-outline"
          title={t('totalItems')}
          value={data?.totalPosts || 0}
          description={t('sinceLastMonth')}
          tone={tokens.brandPrimary}
          cardStyle={styles.bigStatCardBrand}
          styles={styles}
        />
        <BigStatCard
          icon="ribbon-outline"
          title={t('returnedItems')}
          value={data?.totalReturned || 0}
          description={t('sinceLastMonth')}
          tone={tokens.status.found.main}
          styles={styles}
        />
      </View>
    </Panel>
  );
};

// Poster-style preview card - mirrors web's
// client/src/components/dashboard/RecentPosts.jsx: full-bleed image (or solid
// category-color fill) with a dark scrim, category label + status tag
// overlaid top, location + relative date overlaid bottom (stacked, matching
// the web card's own xs/mobile layout since these are always narrow 2-up
// cards here). Laid out 2-up by RecentSection, same as web's Recent.jsx grid.
const RecentPreviewCard = ({ item, type, currentLanguage, t, styles, tokens, isRTL, onPress }) => {
  const found = type === 'found';
  const tone = found ? tokens.status.found : tokens.status.lost;
  const imageUri = getImageUri(item.image);
  const categoryConfig = getCategoryConfig(getCategoryInfo(item)?.code);
  const categoryLabel = getCategoryLabel(item, currentLanguage) || t('categories');
  const cityLabel = getCityLabel(item, currentLanguage) || t('unknownCity');
  const textColor = imageUri ? '#FFFFFF' : getContrastText(categoryConfig.color);
  // Direction-dependent styles go through the helpers in utils/rtl.js
  // (row()/logical()), which compensate only when the language's direction
  // differs from the one native is already mirroring - see that file. Do NOT
  // write `isRTL ? 'row-reverse' : 'row'` here: that flips unconditionally and
  // cancels out native mirroring once forceRTL has taken effect on relaunch.
  const rowDirection = row(isRTL);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.posterCard, { backgroundColor: imageUri ? tokens.surfaceBase : categoryConfig.color }]}
    >
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.posterImage} resizeMode="cover" />
      ) : (
        <View style={styles.posterFallback}>
          <Ionicons name={categoryConfig.icon} size={40} color={textColor} style={{ opacity: 0.9 }} />
        </View>
      )}

      {imageUri ? (
        <LinearGradient
          colors={POSTER_SCRIM_COLORS}
          locations={POSTER_SCRIM_LOCATIONS}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      ) : null}

      <View style={[styles.posterTopRow, { flexDirection: rowDirection }]}>
        <Text style={[styles.posterCategoryLabel, { color: textColor }]} numberOfLines={2}>
          {categoryLabel}
        </Text>
        <View style={styles.posterBadgeColumn}>
          <View style={[styles.posterStatusPill, { backgroundColor: tone.main }]}>
            <Ionicons name={found ? 'checkmark-circle' : 'search'} size={14} color={getContrastText(tone.main)} />
            <Text style={[styles.posterStatusPillText, { color: getContrastText(tone.main) }]}>
              {found ? t('found') : t('lost')}
            </Text>
          </View>
          {item.returned ? (
            <View style={[styles.posterReturnedPill, { backgroundColor: tokens.status.found.main }]}>
              <Ionicons name="checkmark-circle" size={12} color={getContrastText(tokens.status.found.main)} />
              <Text style={[styles.posterReturnedPillText, { color: getContrastText(tokens.status.found.main) }]}>
                {t('returned')}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.posterBottomRow}>
        <View style={[styles.posterLocationRow, { flexDirection: rowDirection }]}>
          <Ionicons name="location-outline" size={14} color={textColor} style={{ opacity: 0.9 }} />
          <Text style={[styles.posterLocationText, { color: textColor }]} numberOfLines={1}>
            {cityLabel}
          </Text>
        </View>
        <Text style={[styles.posterDateText, { color: textColor }]} numberOfLines={1}>
          {formatRelativeTime(item.createdAt, t, currentLanguage)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const RecentSection = ({ type, items, isLoading, currentLanguage, t, styles, tokens, isRTL, isDark, onSeeAll, onPressItem }) => {
  const title = type === 'found' ? t('recentFounds') : t('recentLosts');
  const tone = tokens.status[type].main;

  return (
    <Panel styles={styles}>
      {/* Same glass-blob family as StatsSection above - one corner only,
          reusing this panel's own found/lost tone rather than the generic
          brand color, matching web's RecentSection.jsx. */}
      <GlowBlob
        color={tone}
        opacity={isDark ? 0.22 : 0.16}
        size={180}
        style={logical(isRTL, { top: -50, end: -35 })}
      />
      <SectionHeader
        title={title}
        icon={type === 'found' ? 'checkmark-circle-outline' : 'search-outline'}
        iconColor={tokens.status[type].main}
        onSeeAll={items.length > 0 ? onSeeAll : undefined}
        seeAllColor={tokens.status[type].main}
        t={t}
        styles={styles}
        isRTL={isRTL}
      />
      {isLoading && items.length === 0 ? (
        <View style={styles.recentGrid}>
          <SkeletonBlock tokens={tokens} style={styles.recentCardSkeleton} />
          <SkeletonBlock tokens={tokens} style={styles.recentCardSkeleton} />
        </View>
      ) : items.length > 0 ? (
        <View style={styles.recentGrid}>
          {items.map((item) => (
            <RecentPreviewCard
              key={item._id}
              item={item}
              type={type}
              currentLanguage={currentLanguage}
              t={t}
              styles={styles}
              tokens={tokens}
              isRTL={isRTL}
              onPress={() => onPressItem(item._id)}
            />
          ))}
        </View>
      ) : (
        <View style={styles.recentEmpty}>
          <Text style={styles.recentEmptyText}>{t('noPostsFound')}</Text>
        </View>
      )}
    </Panel>
  );
};

// One category cell - a plain tint of the category's own accent color (same
// `${hex}NN`-suffix alpha convention used elsewhere in this file, e.g.
// recentEmptyText/emptyCalloutText below), a frosted circular icon badge and
// a centered label. Exact port of web's Categories.jsx card: same tint alpha
// (0x1F light / 0x33 dark, i.e. MUI's alpha(color, 0.12/0.2)), same badge
// treatment, same centered layout - no "featured" variant, every cell is the
// same size, matching the uniform 2-up grid web renders at its own
// mobile/tablet breakpoint.
const CategoryGridCard = ({ category, currentLanguage, styles, isDark, onPress }) => {
  const config = getCategoryConfig(category.code);
  const tint = `${config.color}${isDark ? '33' : '1F'}`;
  const badgeBg = isDark ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.55)';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.categoryCard, { backgroundColor: tint }]}
    >
      <View style={[styles.categoryIconBadge, { backgroundColor: badgeBg }]}>
        <Ionicons name={config.icon} size={20} color={config.color} />
      </View>
      <Text style={styles.categoryLabel} numberOfLines={2}>
        {getLocalizedLabel(category, currentLanguage)}
      </Text>
    </TouchableOpacity>
  );
};

const chunkPairs = (items) => {
  const rows = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));
  return rows;
};

// 2-up grid of every category, collapsed to CATEGORY_COLLAPSED_SMALL_COUNT
// cells with a "show all" toggle - exact port of web's Categories.jsx
// (sortCategoriesForBrowse + categories.slice(0, collapsedCount) +
// showAllCategories state).
const CategoryGrid = ({ categories, currentLanguage, t, styles, tokens, isDark, isRTL, onPressCategory }) => {
  const [expanded, setExpanded] = useState(false);

  if (!categories || categories.length === 0) return null;

  const ordered = sortCategoriesForBrowse(categories);
  const hasMore = ordered.length > CATEGORY_COLLAPSED_SMALL_COUNT;
  const visible = expanded ? ordered : ordered.slice(0, CATEGORY_COLLAPSED_SMALL_COUNT);
  const rows = chunkPairs(visible);

  return (
    <View>
      <View style={styles.categoryGrid}>
        {rows.map((pair) => (
          <View key={pair[0]._id} style={[styles.categoryRow, { flexDirection: row(isRTL) }]}>
            {pair.map((cat) => (
              <CategoryGridCard
                key={cat._id}
                category={cat}
                currentLanguage={currentLanguage}
                styles={styles}
                isDark={isDark}
                onPress={() => onPressCategory(cat)}
              />
            ))}
            {pair.length === 1 ? <View style={styles.categorySpacer} /> : null}
          </View>
        ))}
      </View>
      {hasMore ? (
        <TouchableOpacity
          onPress={() => setExpanded((prev) => !prev)}
          style={[styles.showMoreButton, { flexDirection: row(isRTL) }]}
          hitSlop={8}
        >
          <Text style={styles.showMoreText}>{expanded ? t('showLess') : t('showAllCategories')}</Text>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={tokens.ink} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const EmptyStateCallout = ({ t, styles, onCreatePost }) => (
  <View style={styles.emptyCallout}>
    <Ionicons name="file-tray-outline" size={26} color={styles.emptyCalloutIconColor.color} />
    <Text style={styles.emptyCalloutText}>{t('noPostsInArea')}</Text>
    <TouchableOpacity style={styles.emptyCalloutButton} onPress={onCreatePost} activeOpacity={0.85}>
      <Text style={styles.emptyCalloutButtonText}>{t('createPost')}</Text>
    </TouchableOpacity>
  </View>
);

// Mirrors DashFooter.js's social row (same brand icons/links) but reframed
// as its own panel rather than a footer strip, since the mobile Home tab has
// no persistent site footer for it to live in. Neumorphic like the category
// chips above: the panel is a raised face in the page's base tone instead of a
// surfaceRaised card, and each brand button is a smaller face sitting on it
// that sinks when pressed. The brand tint behind the icons is gone with the
// fill - a tinted circle would break the one rule the effect rests on (element
// and background share a tone), so the brand color is carried by the icon.
// Mirrors client/src/components/dashboard/QuickActions.jsx's mobile (xs)
// column layout: a glass-styled panel (own hairline border + blurred-color
// blobs - the same documented Phase 8 exception web's version carries,
// since a hairline edge is what reads as "glass" here, not a container the
// border-removal pass was ever meant to touch) holding a "browse before you
// post" nudge + Search Items pill, then Report Lost / Report Found as two
// independent status-toned rows (never a merged panel - they need to read
// as pressable buttons). Search Items routes to the plain posts list
// (mirrors web's goToSearch -> `/dash/posts`, no filter); the two report
// actions hand off to NewPostScreen with an initialType, which resolves it
// to the matching floption id exactly the way web's `?type=lost|found`
// query param does.
const QuickActionsSection = ({ t, styles, tokens, isDark, isRTL, onSearch, onReportLost, onReportFound }) => {
  const primaryActions = [
    {
      key: 'lost',
      title: t('reportLostItem'),
      description: t('reportLostItemDesc'),
      icon: 'search-outline',
      tone: tokens.status.lost,
      onPress: onReportLost,
    },
    {
      key: 'found',
      title: t('reportFoundItem'),
      description: t('reportFoundItemDesc'),
      icon: 'checkmark-circle-outline',
      tone: tokens.status.found,
      onPress: onReportFound,
    },
  ];

  return (
    <View style={styles.quickActionsPanel}>
      <GlowBlob
        color={tokens.brandPrimary}
        opacity={isDark ? 0.3 : 0.22}
        size={220}
        style={logical(isRTL, { top: -80, start: -70 })}
      />
      <GlowBlob
        color={tokens.brandLogo}
        opacity={isDark ? 0.3 : 0.22}
        size={220}
        style={logical(isRTL, { bottom: -90, end: -70 })}
      />

      <View style={styles.quickActionsHeader}>
        <Text style={styles.quickActionsTitle}>{t('quickActions')}</Text>
        <Text style={styles.quickActionsSubtitle}>{t('quickActionsDesc')}</Text>
      </View>

      <View style={styles.quickActionsNudge}>
        <View style={[styles.quickActionsNudgeTextRow, { flexDirection: row(isRTL) }]}>
          <Ionicons name="information-circle-outline" size={20} color={tokens.brandPrimary} />
          <Text style={styles.quickActionsNudgeText}>{t('browseBeforePostTip')}</Text>
        </View>
        <TouchableOpacity
          style={[styles.quickActionsSearchButton, { flexDirection: row(isRTL) }]}
          onPress={onSearch}
          activeOpacity={0.85}
        >
          <Ionicons name="search" size={18} color="#FFFFFF" />
          <Text style={styles.quickActionsSearchButtonText}>{t('searchItems')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.quickActionsButtons}>
        {primaryActions.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[
              styles.quickActionCard,
              { flexDirection: row(isRTL), backgroundColor: item.tone.bg, borderColor: `${item.tone.main}59` },
            ]}
            onPress={item.onPress}
            activeOpacity={0.85}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: `${item.tone.main}33`, borderColor: `${item.tone.main}59` }]}>
              <Ionicons name={item.icon} size={26} color={item.tone.main} />
            </View>
            <View style={styles.quickActionTextWrap}>
              <Text style={styles.quickActionTitle}>{item.title}</Text>
              <Text style={styles.quickActionDescription}>{item.description}</Text>
            </View>
            <Ionicons
              name={isRTL ? 'chevron-back' : 'chevron-forward'}
              size={16}
              color={item.tone.main}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const SocialSection = ({ t, styles, isDark }) => (
  <NeumorphicSurface isDark={isDark} radius={radiusTokens.lg} contentStyle={styles.socialPanel}>
    <Text style={styles.socialTitle}>{t('followUsTitle')}</Text>
    <Text style={styles.socialSubtitle}>{t('followUsSubtitle')}</Text>
    <View style={styles.socialRow}>
      {SOCIAL_LINKS.map((social) => (
        <Pressable key={social.key} style={styles.socialButton} onPress={() => Linking.openURL(social.url)}>
          {({ pressed }) => (
            <>
              <NeumorphicSurface
                isDark={isDark}
                radius={SOCIAL_CIRCLE_SIZE / 2}
                pressed={pressed}
                contentStyle={styles.socialIconCircle}
              >
                <Ionicons name={social.icon} size={26} color={social.brandColor} />
              </NeumorphicSurface>
              <Text style={styles.socialLabel}>{t(social.labelKey)}</Text>
            </>
          )}
        </Pressable>
      ))}
    </View>
  </NeumorphicSurface>
);

const SafetyFooter = ({ t, styles }) => (
  <View style={styles.safetyFooter}>
    <Ionicons name="shield-checkmark-outline" size={18} color={styles.safetyFooterIconColor.color} />
    <View style={styles.safetyFooterTextWrap}>
      <Text style={styles.safetyFooterTitle}>{t('securePlatform')}</Text>
      <Text style={styles.safetyFooterBody}>{t('securePlatformDesc')}</Text>
    </View>
  </View>
);

const HomeScreen = ({ navigation }) => {
  const { isDark } = useTheme();
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const { floptions, categories, countries } = useReferenceData();
  const { data, isLoading, isError, refetch, countryId, handleSelectCountry } = useDashboardData();
  const isRTL = currentLanguage === 'ar';
  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const styles = useMemo(() => createStyles(tokens, isRTL, isDark), [tokens, isRTL, isDark]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const isReady = !isLoading || !!data;
  const animatedSectionStyle = useStaggeredFadeIn(SECTION_COUNT, isReady);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const foundOption = floptions.find((fl) => fl.code === 'FOUND');
  const lostOption = floptions.find((fl) => fl.code === 'LOST');

  const goToPosts = (params) => navigation.navigate('PostsListScreen', params);
  const goToPost = (id) => navigation.navigate('PostDetailScreen', { id });
  const goToNewPost = () => navigation.navigate('NewPost');
  const goToNewPostType = (initialType) => navigation.navigate('NewPost', { initialType });

  const currentCountryCode = useMemo(() => {
    const match = (countries || []).find((c) => (c._id || c.id) === countryId);
    return match?.code || null;
  }, [countries, countryId]);

  const recentFounds = Array.isArray(data?.recentFounds) ? data.recentFounds.slice(0, 2) : [];
  const recentLosts = Array.isArray(data?.recentLosts) ? data.recentLosts.slice(0, 2) : [];

  const hasNoData =
    !isLoading &&
    !data?.totalFounds &&
    !data?.totalLosts &&
    !data?.totalPosts &&
    recentFounds.length === 0 &&
    recentLosts.length === 0;

  if (isError && !data) {
    return (
      <View style={styles.container}>
        <AppHeader title={t('home')} countryId={countryId} onSelectCountry={handleSelectCountry} />
        <DataStateView variant="error" message={t('failedToLoadPosts')} actionLabel={t('retry')} onAction={refetch} isRTL={isRTL} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title={t('home')} countryId={countryId} onSelectCountry={handleSelectCountry} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[tokens.brandPrimary]} tintColor={tokens.brandPrimary} />
        }
      >
        {/* Header: statistics over a full-bleed world activity map, matching
            web's Dash.js mobile layout - the map is a chrome-less backdrop
            (no panel card, no title), not a card of its own, and it bleeds
            past the scroll view's horizontal padding to the screen edges.
            Web crops/pans an oversized map with CSS percentages so the
            country lands below LeftSide; react-native-svg's percentage
            sizing doesn't resolve the same way (verified live via expo web),
            so the same result is built from layout instead: the map keeps
            its natural square, is bottom-anchored in this section, and a
            spacer below the stats reserves the room it occupies.
            TrendingSection has been retired - this header now covers the
            space it and StatsSection used to share. */}
        <Animated.View style={[animatedSectionStyle(0), styles.headerStack]}>
          {/* Same glass-blob family as the panels below - mirrors Dash.js's
              mobile-branch mapBlob (brandLogo, the map's own accent color per
              CLAUDE.md's world-activity-map notes) tucked into the header's
              top-end corner. */}
          <GlowBlob
            color={tokens.brandLogo}
            opacity={isDark ? 0.16 : 0.1}
            size={200}
            style={logical(isRTL, { top: -20, end: -40 })}
          />
          {!hasNoData && (
            <View style={styles.mapBackdrop} pointerEvents="none">
              <WorldActivityMap
                worldActivity={data?.worldActivity}
                cityActivity={data?.cityActivity}
                currentCountryCode={currentCountryCode}
                isLoading={isLoading}
                tokens={tokens}
                isDark={isDark}
              />
            </View>
          )}
          <StatsSection
            data={data}
            isLoading={isLoading}
            t={t}
            styles={styles}
            tokens={tokens}
            isDark={isDark}
            isRTL={isRTL}
            onFoundPress={() => goToPosts({ initialFl: foundOption?._id || '' })}
            onLostPress={() => goToPosts({ initialFl: lostOption?._id || '' })}
          />
          {/* Reserves the vertical room the bottom-anchored map layer above
              occupies, exactly like the spacer row web's mobile header
              keeps below LeftSide. */}
          {!hasNoData && <View style={styles.mapSpacer} />}
        </Animated.View>

        <Animated.View style={[styles.section, animatedSectionStyle(1)]}>
          <RecentSection
            type="found"
            items={recentFounds}
            isLoading={isLoading}
            currentLanguage={currentLanguage}
            t={t}
            styles={styles}
            tokens={tokens}
            isRTL={isRTL}
            isDark={isDark}
            onSeeAll={() => goToPosts({ initialFl: foundOption?._id || '' })}
            onPressItem={goToPost}
          />
        </Animated.View>

        <Animated.View style={[styles.section, animatedSectionStyle(2)]}>
          <RecentSection
            type="lost"
            items={recentLosts}
            isLoading={isLoading}
            currentLanguage={currentLanguage}
            t={t}
            styles={styles}
            tokens={tokens}
            isRTL={isRTL}
            isDark={isDark}
            onSeeAll={() => goToPosts({ initialFl: lostOption?._id || '' })}
            onPressItem={goToPost}
          />
        </Animated.View>

        {hasNoData ? (
          <View style={styles.section}>
            <EmptyStateCallout t={t} styles={styles} onCreatePost={goToNewPost} />
          </View>
        ) : null}

        <Animated.View style={[styles.section, animatedSectionStyle(3)]}>
          <QuickActionsSection
            t={t}
            styles={styles}
            tokens={tokens}
            isDark={isDark}
            isRTL={isRTL}
            onSearch={() => goToPosts()}
            onReportLost={() => goToNewPostType('lost')}
            onReportFound={() => goToNewPostType('found')}
          />
        </Animated.View>

        <Animated.View style={[styles.section, animatedSectionStyle(4)]}>
          <Panel title={t('browseByCategory')} styles={styles}>
            {/* Same two-blob corner treatment as web's Dash.js `categoryBlob`
                wrapping its Categories.jsx in DashRecents - brandLogo at the
                top-end corner, brandPrimary at the bottom-start. */}
            <GlowBlob
              color={tokens.brandLogo}
              opacity={isDark ? 0.28 : 0.2}
              size={260}
              style={logical(isRTL, { top: -90, end: -70 })}
            />
            <GlowBlob
              color={tokens.brandPrimary}
              opacity={isDark ? 0.28 : 0.2}
              size={260}
              style={logical(isRTL, { bottom: -110, start: -70 })}
            />
            <CategoryGrid
              categories={categories}
              currentLanguage={currentLanguage}
              t={t}
              styles={styles}
              tokens={tokens}
              isDark={isDark}
              isRTL={isRTL}
              onPressCategory={(cat) => goToPosts({ initialCategoryId: cat._id })}
            />
          </Panel>
        </Animated.View>

        <Animated.View style={[styles.section, animatedSectionStyle(5)]}>
          <SocialSection t={t} styles={styles} isDark={isDark} />
        </Animated.View>

        <Animated.View style={[styles.section, styles.lastSection, animatedSectionStyle(6)]}>
          <SafetyFooter t={t} styles={styles} />
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const createStyles = (tokens, isRTL, isDark) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.surfaceBase,
    },
    scrollContent: {
      paddingHorizontal: SCREEN_PADDING,
      paddingTop: 16,
      paddingBottom: 32,
    },
    section: {
      marginTop: 20,
    },
    lastSection: {
      marginBottom: 8,
    },
    // Dashboard header: the statistics panel layered over a chrome-less
    // world activity map (see the comment above their render).
    headerStack: {
      gap: 20,
    },
    // The map layer itself: bottom-anchored behind the header, and pulled
    // out past scrollContent's horizontal padding so it bleeds to the
    // screen edges the way web's full-bleed header map does. Height comes
    // from its square aspect ratio, so it stands 2 x SCREEN_PADDING taller
    // than mapSpacer below - mapSpacer's marginTop pays that back so the map
    // clears the stat cards instead of creeping up behind them.
    mapBackdrop: {
      position: 'absolute',
      bottom: 0,
      left: -SCREEN_PADDING,
      right: -SCREEN_PADDING,
      // Explicit square rather than relying on the child's aspect ratio to
      // measure this absolutely-positioned box.
      aspectRatio: 1,
    },
    // Square of the content width, while the map layer above is a square of
    // the full screen width - i.e. 2 x SCREEN_PADDING taller. Absorbing that
    // difference as marginTop keeps headerStack's own 20px gap as the actual
    // breathing room between the stat cards and the top of the map, matching
    // the space web leaves below LeftSide.
    mapSpacer: {
      width: '100%',
      aspectRatio: 1,
      minHeight: 300,
      marginTop: SCREEN_PADDING * 2,
    },

    // Panel shell - mirrors LeftSide.jsx / TrendingItem.jsx's SectionPanel:
    // blurred-gradient surfaceRaised card, elevation e1.
    panelContainer: {
      backgroundColor: tokens.surfaceRaised,
      borderRadius: radiusTokens.lg,
      padding: 20,
      // Clips the corner glow (GlowBlob) to the panel's own rounded shape,
      // matching web's `overflow: 'hidden'` card treatment for this same
      // glass-blob family.
      overflow: 'hidden',
    },
    panelTitleCentered: {
      fontFamily: fontFamilies.display,
      fontSize: 22,
      color: tokens.ink,
      textAlign: 'center',
      marginBottom: 16,
    },
    panelTitleInline: {
      fontFamily: fontFamilies.display,
      fontSize: 20,
      color: tokens.ink,
      // No explicit textAlign - it gets swapped under native RTL and would
      // detach the title from the status icon it sits next to. Default
      // ('auto') resolves against the layout/text direction instead.
      flexShrink: 1,
    },
    sectionHeaderRow: {
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginBottom: 14,
    },
    sectionTitleGroup: {
      alignItems: 'center',
      gap: 8,
      flexShrink: 1,
    },
    seeAllRow: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      gap: 2,
      flexShrink: 0,
    },
    seeAllText: {
      fontFamily: fontFamilies.bodyMedium,
      fontSize: 14,
      color: tokens.brandPrimary,
    },

    // The statistics panel itself is a bare wrapper, not a card: web's
    // LeftSide.jsx paints it with a 14%-opacity surfaceRaised wash, so on the
    // page background the only shapes that read are the Found/Lost strip and
    // the two supporting stat cards inside it. Keeping the opaque
    // panelContainer fill here made those inner cards (also surfaceRaised)
    // disappear into their own parent.
    statsPanelGlass: {
      backgroundColor: 'transparent',
      padding: 0,
    },

    // Found/Lost hero strip
    foundLostStrip: {
      backgroundColor: tokens.surfaceRaised,
      borderRadius: radiusTokens.lg,
      overflow: 'hidden',
    },
    foundLostSkeleton: {
      height: 220,
      borderRadius: radiusTokens.lg,
    },
    statSegment: {
      paddingVertical: 20,
      paddingHorizontal: 20,
    },
    statSegmentDivider: {
      borderBottomWidth: 1,
      borderBottomColor: `${tokens.ink}12`,
    },
    statSegmentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 10,
    },
    // Flat tinted square, same as web's FoundLostStrip.jsx segment icon - the
    // Phase 9 sub-element shadow is dropped in this section now that the
    // parent cards carry their own fill again and read as separate shapes.
    statSegmentIcon: {
      width: 36,
      height: 36,
      borderRadius: radiusTokens.sm,
      justifyContent: 'center',
      alignItems: 'center',
    },
    statSegmentLabel: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 15,
      color: tokens.ink,
    },
    statSegmentValue: {
      fontFamily: fontFamilies.display,
      fontSize: 36,
      lineHeight: 40,
    },
    statSegmentToday: {
      fontFamily: fontFamilies.body,
      fontSize: 13,
      color: `${tokens.ink}99`,
      marginTop: 4,
    },
    // Total/Returned supporting stats
    bigStatsRow: {
      flexDirection: 'row',
      gap: 16,
      marginTop: 16,
    },
    bigStatSkeleton: {
      flex: 1,
      height: 158,
      borderRadius: radiusTokens.lg,
    },
    bigStatCard: {
      flex: 1,
      minHeight: 158,
      justifyContent: 'space-between',
      backgroundColor: tokens.surfaceRaised,
      borderRadius: radiusTokens.lg,
      padding: 18,
    },
    // Total items reads as the brand-tinted tile, the same split web's
    // LeftSide.jsx makes between its two TotalBox cards (brandPrimary wash at
    // 8% light / 14% dark vs. plain surfaceRaised for Returned).
    bigStatCardBrand: {
      backgroundColor: `${tokens.brandPrimary}${isDark ? '24' : '14'}`,
    },
    bigStatCardTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 8,
    },
    bigStatCardTitle: {
      flex: 1,
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 14,
      color: tokens.ink,
    },
    bigStatCardIcon: {
      width: 36,
      height: 36,
      borderRadius: radiusTokens.sm,
      justifyContent: 'center',
      alignItems: 'center',
    },
    bigStatCardValue: {
      fontFamily: fontFamilies.display,
      fontSize: 30,
      marginTop: 20,
    },
    bigStatCardDescription: {
      fontFamily: fontFamilies.body,
      fontSize: 12,
      color: `${tokens.ink}99`,
      marginTop: 6,
    },

    // Recent founds/losts - poster-style card mirrors web's
    // client/src/components/dashboard/RecentPosts.jsx: full-bleed image (or
    // solid category-color fill), gradient-ish scrim, category label +
    // status tag overlaid top, location + relative date overlaid bottom
    // (stacked, matching the web card's own mobile/xs layout). Always 2-up,
    // same as web's Recent.jsx grid.
    recentGrid: {
      flexDirection: 'row',
      gap: 14,
    },
    recentCardSkeleton: {
      flex: 1,
      aspectRatio: 3 / 4,
      borderRadius: radiusTokens.lg,
    },
    posterCard: {
      flex: 1,
      aspectRatio: 3 / 4,
      borderRadius: radiusTokens.lg,
      overflow: 'hidden',
    },
    posterImage: {
      ...StyleSheet.absoluteFillObject,
    },
    posterFallback: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
    },
    posterTopRow: {
      position: 'absolute',
      top: 0,
      ...logical(isRTL, { start: 0, end: 0 }),
      padding: 10,
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 6,
    },
    posterCategoryLabel: {
      // `flexShrink`, not `flex: 1`: a flex-grown box spans the row and then
      // needs textAlign to pull the text back to the start edge - and an
      // explicit `textAlign: 'right'` is swapped to the left by RN once native
      // RTL mirroring is on (I18nManager.doLeftAndRightSwapInRTL), which is
      // what left the label floating mid-card instead of flush to the start
      // padding. A shrink-only box hugs its text, so `space-between` alone
      // parks it on the correct edge in both directions.
      flexShrink: 1,
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 13,
      lineHeight: 16,
    },
    posterBadgeColumn: {
      alignItems: alignEnd(isRTL),
      flexShrink: 0,
      gap: 4,
      // Explicit margin, not just the row's `gap` - `gap` can fail to apply
      // when flexDirection is 'row-reverse' (RTL live-switch case, see
      // rowDirection above) on some Yoga versions, which left this column
      // flush against the category label with no visible space.
      ...logical(isRTL, { marginStart: 8 }),
    },
    posterStatusPill: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radiusTokens.sm,
      ...getElevation(isDark, 1),
    },
    posterStatusPillText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    posterReturnedPill: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radiusTokens.sm,
      ...getElevation(isDark, 1),
    },
    posterReturnedPillText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 10,
      textTransform: 'uppercase',
    },
    posterBottomRow: {
      position: 'absolute',
      bottom: 0,
      ...logical(isRTL, { start: 0, end: 0 }),
      padding: 10,
      gap: 3,
    },
    posterLocationRow: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      alignSelf: alignStart(isRTL),
      gap: 5,
    },
    posterLocationText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 12,
      flexShrink: 1,
    },
    posterDateText: {
      fontFamily: fontFamilies.body,
      fontSize: 12,
      opacity: 0.85,
      // Date sits under the location on the same (start) edge, as on web's
      // RecentPosts.jsx card. Cross-axis alignment is resolved against the
      // layout direction by Yoga, so it flips correctly - unlike an explicit
      // `textAlign: 'right'`, which RN swaps back to the left under native
      // RTL and pushed the date to the opposite corner from the location.
      alignSelf: alignStart(isRTL),
    },
    recentEmpty: {
      alignItems: 'center',
      borderRadius: radiusTokens.md,
      backgroundColor: `${tokens.ink}08`,
      padding: 24,
    },
    recentEmptyText: {
      fontFamily: fontFamilies.body,
      fontSize: 14,
      color: `${tokens.ink}99`,
      textAlign: isRTL ? 'right' : 'left',
    },

    // Quick Actions - 1:1 port of web's QuickActions.jsx mobile (xs) column
    // layout. This panel and its two action cards deliberately keep a
    // hairline border, same as web's version - the one documented exception
    // to the platform-wide no-border rule, since a border is what makes this
    // read as glass/a pressable card rather than a plain container.
    quickActionsPanel: {
      backgroundColor: tokens.surfaceRaised,
      borderRadius: radiusTokens.lg,
      borderWidth: 1,
      borderColor: `${tokens.brandPrimary}2E`,
      padding: 20,
      overflow: 'hidden',
      ...getElevation(isDark, 1),
    },
    quickActionsHeader: {
      alignItems: 'center',
      marginBottom: 20,
    },
    quickActionsTitle: {
      fontFamily: fontFamilies.display,
      fontSize: 22,
      color: tokens.ink,
      textAlign: 'center',
      marginBottom: 8,
    },
    quickActionsSubtitle: {
      fontFamily: fontFamilies.body,
      fontSize: 14,
      color: `${tokens.ink}A6`,
      textAlign: 'center',
    },
    quickActionsNudge: {
      backgroundColor: `${tokens.surfaceBase}${isDark ? '88' : 'B3'}`,
      borderWidth: 1,
      borderColor: `${tokens.brandPrimary}2E`,
      borderRadius: radiusTokens.md,
      padding: 14,
      gap: 12,
      marginBottom: 20,
    },
    quickActionsNudgeTextRow: {
      alignItems: 'flex-start',
      gap: 8,
    },
    quickActionsNudgeText: {
      flex: 1,
      fontFamily: fontFamilies.body,
      fontSize: 13,
      lineHeight: 18,
      color: `${tokens.ink}CC`,
    },
    quickActionsSearchButton: {
      alignSelf: alignStart(isRTL),
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: tokens.brandPrimary,
      ...getElevation(isDark, 1),
    },
    quickActionsSearchButtonText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 14,
      color: '#FFFFFF',
    },
    quickActionsButtons: {
      gap: 12,
    },
    quickActionCard: {
      alignItems: 'center',
      gap: 14,
      padding: 16,
      borderRadius: radiusTokens.lg,
      borderWidth: 1,
    },
    quickActionIcon: {
      width: 52,
      height: 52,
      borderRadius: 26,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quickActionTextWrap: {
      flex: 1,
      minWidth: 0,
    },
    quickActionTitle: {
      fontFamily: fontFamilies.display,
      fontSize: 16,
      color: tokens.ink,
      marginBottom: 2,
    },
    quickActionDescription: {
      fontFamily: fontFamilies.body,
      fontSize: 13,
      color: `${tokens.ink}A6`,
      lineHeight: 17,
    },

    // Categories - uniform 2-up grid (see CategoryGridCard/CategoryGrid
    // above), 1:1 port of web's Categories.jsx card at its own mobile/tablet
    // breakpoint: radius.lg cells, centered content, no border/shadow per the
    // platform-wide no-border rule - separation comes from each cell's own
    // color tint against the page background, not elevation.
    categoryGrid: {
      gap: 16,
    },
    categoryRow: {
      gap: 16,
    },
    categoryCard: {
      flex: 1,
      minHeight: 120,
      borderRadius: radiusTokens.lg,
      padding: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Matches an odd-numbered trailing row so the last cell keeps its
    // half-width instead of stretching to fill the row alone.
    categorySpacer: {
      flex: 1,
    },
    categoryIconBadge: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    // Plain `isRTL ? 'right' : 'left'` would be wrong here - see sectionTitle
    // above for why: RN swaps explicit left/right back once native RTL
    // mirroring is on, so needsDirectionFlip is what actually lands this on
    // the right edge in Arabic both mid-session and after a relaunch. Web's
    // card centers its label regardless of direction, so this does too.
    categoryLabel: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 13,
      color: tokens.ink,
      textAlign: 'center',
    },
    showMoreButton: {
      alignSelf: 'center',
      alignItems: 'center',
      gap: 6,
      marginTop: 16,
      paddingVertical: 8,
      paddingHorizontal: 24,
      borderRadius: radiusTokens.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: `${tokens.ink}3D`,
    },
    showMoreText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 14,
      color: tokens.ink,
    },

    // Empty state callout
    emptyCallout: {
      alignItems: 'center',
      gap: 8,
      backgroundColor: tokens.surfaceRaised,
      borderRadius: radiusTokens.lg,
      padding: 20,
    },
    emptyCalloutIconColor: {
      color: `${tokens.ink}66`,
    },
    emptyCalloutText: {
      fontFamily: fontFamilies.body,
      fontSize: 13,
      color: `${tokens.ink}CC`,
      textAlign: 'center',
    },
    emptyCalloutButton: {
      marginTop: 4,
      backgroundColor: tokens.brandPrimary,
      borderRadius: radiusTokens.md,
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    emptyCalloutButtonText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 13,
      color: '#FFFFFF',
    },

    // Social section - a neumorphic panel (its fill, radius and shadows come
    // from NeumorphicSurface, so this is only the face's padding/alignment)
    // with a centered title/subtitle pair above a row of circular brand
    // icon buttons.
    socialPanel: {
      paddingVertical: 22,
      paddingHorizontal: 20,
      alignItems: 'center',
    },
    socialTitle: {
      fontFamily: fontFamilies.display,
      fontSize: 20,
      color: tokens.ink,
      textAlign: 'center',
    },
    socialSubtitle: {
      fontFamily: fontFamilies.body,
      fontSize: 13,
      color: `${tokens.ink}99`,
      textAlign: 'center',
      marginTop: 6,
      marginBottom: 18,
      maxWidth: 260,
    },
    socialRow: {
      flexDirection: 'row',
      gap: 28,
    },
    socialButton: {
      alignItems: 'center',
      gap: 8,
    },
    // Face of the neumorphic brand button - opaque and untinted by design:
    // the effect needs the circle to share the panel's tone, so the brand
    // color is carried by the icon alone. That also retires the separate
    // opaque shadow wrapper this used to need, since there is no longer a
    // translucent fill for an Android elevation shadow to bleed through.
    socialIconCircle: {
      width: SOCIAL_CIRCLE_SIZE,
      height: SOCIAL_CIRCLE_SIZE,
      borderRadius: SOCIAL_CIRCLE_SIZE / 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    socialLabel: {
      fontFamily: fontFamilies.bodyMedium,
      fontSize: 12,
      color: `${tokens.ink}CC`,
    },

    // Safety footer
    safetyFooter: {
      flexDirection: row(isRTL),
      alignItems: 'flex-start',
      gap: 10,
      paddingHorizontal: 4,
    },
    safetyFooterIconColor: {
      color: `${tokens.ink}80`,
    },
    safetyFooterTextWrap: {
      flex: 1,
    },
    safetyFooterTitle: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 12,
      color: tokens.ink,
      textAlign: needsDirectionFlip(isRTL) ? 'right' : 'left',
      marginBottom: 2,
    },
    safetyFooterBody: {
      fontFamily: fontFamilies.body,
      fontSize: 11,
      color: `${tokens.ink}80`,
      textAlign: needsDirectionFlip(isRTL) ? 'right' : 'left',
      lineHeight: 16,
    },
  });

export default HomeScreen;
