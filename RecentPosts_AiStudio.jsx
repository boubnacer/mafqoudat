import React, { useState, useMemo, Fragment } from "react";

// ============================================================================
// 1. ICONS (Self-contained SVG Icons - Zero external dependencies)
// ============================================================================

const Icons = {
  Location: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" {...props}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Found: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" {...props}>
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  Lost: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" {...props}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  ),
  CheckCircle: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" {...props}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  Phone: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="24" height="24" {...props}>
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  ),
  Laptop: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="24" height="24" {...props}>
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="1" y1="20" x2="23" y2="20" />
    </svg>
  ),
  Wallet: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="24" height="24" {...props}>
      <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
      <path d="M16 3H4a2 2 0 0 0-2 2v2h18V5a2 2 0 0 0-2-2z" />
      <circle cx="18" cy="14" r="1" />
    </svg>
  ),
  Key: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="24" height="24" {...props}>
      <circle cx="7.5" cy="15.5" r="4.5" />
      <path d="M21 2l-9.6 9.6" />
      <path d="M15.5 7.5l3 3" />
      <path d="M18.5 4.5l3 3" />
    </svg>
  ),
  Document: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="24" height="24" {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  Jewelry: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="24" height="24" {...props}>
      <path d="M6 3h12l4 6-10 13L2 9z" />
      <path d="M10 3L6 9l6 13 6-13-4-6" />
      <line x1="2" y1="9" x2="22" y2="9" />
    </svg>
  ),
  Cash: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="24" height="24" {...props}>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  ),
  Pet: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="24" height="24" {...props}>
      <circle cx="11" cy="4" r="2" />
      <circle cx="18" cy="8" r="2" />
      <circle cx="4" cy="8" r="2" />
      <path d="M12 10c-3 0-5 2-5 5 0 2.5 2 4.5 5 4.5s5-2 5-4.5c0-3-2-5-5-5z" />
    </svg>
  ),
  ArrowRight: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" {...props}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  ArrowLeft: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" {...props}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
};

// ============================================================================
// 2. CATEGORY CONFIGURATION (Color palette & Category metadata)
// ============================================================================

const CATEGORIES = {
  PHONES: {
    code: "PHONES",
    color: "#00BCD4",
    bg: "#E0F7FA",
    Icon: Icons.Phone,
    labels: { en: "Phones & Tablets", ar: "هواتف وأجهزة لوحية" },
  },
  LAPTOPS: {
    code: "LAPTOPS",
    color: "#2979FF",
    bg: "#E8F0FE",
    Icon: Icons.Laptop,
    labels: { en: "Laptops & Computers", ar: "حواسيب محمولة" },
  },
  WALLET: {
    code: "WALLET",
    color: "#FF9800",
    bg: "#FFF3E0",
    Icon: Icons.Wallet,
    labels: { en: "Wallets & Purses", ar: "محافظ وحقائب يد" },
  },
  KEY: {
    code: "KEY",
    color: "#607D8B",
    bg: "#ECEFF1",
    Icon: Icons.Key,
    labels: { en: "Keys & Keychains", ar: "مفاتيح وميداليات" },
  },
  DOCUMENTS: {
    code: "DOCUMENTS",
    color: "#795548",
    bg: "#EFEBE9",
    Icon: Icons.Document,
    labels: { en: "Official Documents", ar: "وثائق وأوراق رسمية" },
  },
  JEWELRY: {
    code: "JEWELRY",
    color: "#9C27B0",
    bg: "#F3E5F6",
    Icon: Icons.Jewelry,
    labels: { en: "Jewelry & Watches", ar: "مجوهرات وساعات" },
  },
  CASH: {
    code: "CASH",
    color: "#4CAF50",
    bg: "#E8F5E9",
    Icon: Icons.Cash,
    labels: { en: "Cash & Money", ar: "نقود وأموال" },
  },
  PETS: {
    code: "PETS",
    color: "#E91E63",
    bg: "#FCE4EC",
    Icon: Icons.Pet,
    labels: { en: "Pets & Animals", ar: "حيوانات أليفة" },
  },
};

// ============================================================================
// 3. TRANSLATIONS (English & Arabic Only)
// ============================================================================

const TRANSLATIONS = {
  en: {
    recentFounds: "Recent Founds",
    recentLosts: "Recent Losts",
    seeAll: "See All",
    found: "Found",
    lost: "Lost",
    returned: "Returned",
    unknownLocation: "Unknown Location",
    ago: "ago",
    justNow: "Just now",
  },
  ar: {
    recentFounds: "أحدث الموجودات",
    recentLosts: "أحدث المفقودات",
    seeAll: "عرض الكل",
    found: "معثور عليه",
    lost: "مفقود",
    returned: "تم الاسترجاع",
    unknownLocation: "موقع غير محدد",
    ago: "",
    justNow: "الآن",
  },
};

// ============================================================================
// 4. MOCK DATA (No Post Images - Category Icons Only)
// ============================================================================

const MOCK_FOUND_POSTS = [
  {
    _id: "post-f1",
    type: "FOUND",
    categories: [CATEGORIES.PHONES],
    cityLabels: { en: "Algiers", ar: "الجزائر العاصمة" },
    timeAgo: { en: "15 minutes ago", ar: "منذ 15 دقيقة" },
    returned: false,
  },
  {
    _id: "post-f2",
    type: "FOUND",
    // Multi-category post (Wallet + Cash + Documents)
    categories: [CATEGORIES.WALLET, CATEGORIES.CASH, CATEGORIES.DOCUMENTS],
    cityLabels: { en: "Oran", ar: "وهران" },
    timeAgo: { en: "1 hour ago", ar: "منذ ساعة واحدة" },
    returned: true, // Marked as Returned
  },
];

const MOCK_LOST_POSTS = [
  {
    _id: "post-l1",
    type: "LOST",
    categories: [CATEGORIES.KEY],
    cityLabels: { en: "Constantine", ar: "قسنطينة" },
    timeAgo: { en: "35 minutes ago", ar: "منذ 35 دقيقة" },
    returned: false,
  },
  {
    _id: "post-l2",
    type: "LOST",
    // Multi-category post (Laptop + Documents)
    categories: [CATEGORIES.LAPTOPS, CATEGORIES.DOCUMENTS],
    cityLabels: { en: "Annaba", ar: "عنابة" },
    timeAgo: { en: "2 hours ago", ar: "منذ ساعتين" },
    returned: false,
  },
];

// ============================================================================
// 5. SUBCOMPONENT: CategoryBentoPod (Frosted Pod with Category Icons)
// ============================================================================

const CategoryBentoPod = ({ categories, lang, isDark }) => {
  const count = categories?.length || 0;
  if (count === 0) return null;

  const dividerColor = isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)";
  const textColor = isDark ? "#EDEFF5" : "#0B1220";

  return (
    <div
      style={{
        backgroundColor: isDark ? "rgba(30, 41, 59, 0.25)" : "rgba(255, 255, 255, 0.35)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.14)" : "rgba(255, 255, 255, 0.6)"}`,
        boxShadow: isDark
          ? "0 8px 32px rgba(0, 0, 0, 0.25), 0 2px 6px rgba(0, 0, 0, 0.15)"
          : "0 10px 28px rgba(0, 0, 0, 0.04), 0 2px 6px rgba(0, 0, 0, 0.02)",
        borderRadius: "20px",
        width: count === 1 ? "fit-content" : "100%",
        maxWidth: count === 1 ? "86%" : "92%",
        boxSizing: "border-box",
        overflow: "hidden",
        padding: count === 1 ? "18px 26px" : "12px 16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1,
      }}
    >
      {/* 1 Category: Large Centered Icon + Label */}
      {count === 1 && (() => {
        const item = categories[0];
        const Icon = item.Icon;
        return (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", width: "100%" }}>
            <div
              style={{
                color: item.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: "scale(1.8)",
                marginBottom: "4px",
              }}
            >
              <Icon />
            </div>
            <span
              style={{
                fontWeight: 700,
                fontSize: "13px",
                color: item.color,
                textAlign: "center",
                maxWidth: "150px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {item.labels[lang]}
            </span>
          </div>
        );
      })()}

      {/* 2 or more Categories: Vertical list with hairline dividers */}
      {count >= 2 && (
        <div style={{ display: "flex", flexDirection: "column", width: "100%", boxSizing: "border-box" }}>
          {categories.slice(0, 4).map((item, idx) => {
            const Icon = item.Icon;
            return (
              <Fragment key={item.code || idx}>
                {idx > 0 && (
                  <div
                    style={{
                      width: "100%",
                      height: "1px",
                      backgroundColor: dividerColor,
                      margin: "6px 0",
                    }}
                  />
                )}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    width: "100%",
                    padding: "2px 0",
                  }}
                >
                  <div
                    style={{
                      color: item.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon width="18" height="18" />
                  </div>
                  <span
                    style={{
                      flex: 1,
                      fontWeight: 650,
                      fontSize: "12px",
                      color: textColor,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.labels[lang]}
                  </span>
                </div>
              </Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 6. MAIN COMPONENT: RecentPosts (Card Component)
// ============================================================================

const RecentPosts = ({
  post,
  lang = "en",
  isDark = false,
  onClick,
}) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const isFound = post.type === "FOUND";

  // Semantic Status Color: Found = Emerald/Teal, Lost = Rose/Red
  const statusColor = isFound
    ? (isDark ? "#3DDCA6" : "#1A8563")
    : (isDark ? "#FF6B5E" : "#C64335");

  const cityName = post.cityLabels?.[lang] || t.unknownLocation;
  const timeText = post.timeAgo?.[lang] || "";

  // Dynamic Aura Mesh background based on category colors
  const auraBackground = useMemo(() => {
    const baseBg = isDark ? "#0E1116" : "#F8FAFC";
    const cats = post.categories || [];
    if (cats.length === 0) return baseBg;

    const c1 = cats[0]?.color || (isFound ? "#1A8563" : "#C64335");
    const c2 = cats[1]?.color || c1;

    if (cats.length === 1) {
      return `radial-gradient(circle at 50% 45%, ${c1}33 0%, ${c1}0D 65%, transparent 100%), ${baseBg}`;
    }

    const pos1 = lang === "ar" ? "80% 25%" : "20% 25%";
    const pos2 = lang === "ar" ? "15% 75%" : "85% 75%";

    return `radial-gradient(circle at ${pos1}, ${c1}30 0%, transparent 65%), radial-gradient(circle at ${pos2}, ${c2}28 0%, transparent 65%), ${baseBg}`;
  }, [post.categories, isDark, isFound, lang]);

  const textColor = isDark ? "#EDEFF5" : "#0B1220";
  const dateColor = isDark ? "rgba(237, 239, 245, 0.65)" : "rgba(11, 18, 32, 0.65)";

  return (
    <div
      onClick={onClick}
      style={{
        textDecoration: "none",
        color: "inherit",
        display: "block",
        position: "relative",
        width: "100%",
        aspectRatio: "3 / 4.1",
        borderRadius: "18px",
        overflow: "hidden",
        cursor: "pointer",
        outline: "none",
        background: auraBackground,
        border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"}`,
        boxShadow: isDark
          ? "0 4px 20px rgba(0, 0, 0, 0.3)"
          : "0 4px 16px rgba(0, 0, 0, 0.03)",
        transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = isDark
          ? `0 12px 28px rgba(0,0,0,0.5), 0 0 0 1px ${statusColor}40`
          : `0 12px 24px rgba(0,0,0,0.08), 0 0 0 1px ${statusColor}40`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = isDark
          ? "0 4px 20px rgba(0, 0, 0, 0.3)"
          : "0 4px 16px rgba(0, 0, 0, 0.03)";
      }}
    >
      {/* Center Ambient Category Pod */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          boxSizing: "border-box",
        }}
      >
        <CategoryBentoPod categories={post.categories} lang={lang} isDark={isDark} />
      </div>

      {/* Top Header: Status Badges (FOUND / LOST & RETURNED) */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 2,
          padding: "12px 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          pointerEvents: "none",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {/* Status Tag */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "8px",
              backgroundColor: statusColor,
              color: "#FFFFFF",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
            }}
          >
            {isFound ? <Icons.Found width="13" height="13" /> : <Icons.Lost width="13" height="13" />}
            <span
              style={{
                fontWeight: 750,
                fontSize: "11px",
                letterSpacing: "0.4px",
                textTransform: "uppercase",
                lineHeight: 1,
              }}
            >
              {isFound ? t.found : t.lost}
            </span>
          </div>

          {/* Returned Badge (if solved) */}
          {post.returned && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "3px 8px",
                borderRadius: "6px",
                backgroundColor: isDark ? "#3DDCA6" : "#1A8563",
                color: "#FFFFFF",
                fontSize: "10px",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              <Icons.CheckCircle width="12" height="12" />
              <span>{t.returned}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Footer: Location & Time in a Frosted Glass Bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 2,
          padding: "10px 14px",
          backgroundColor: isDark ? "rgba(23, 27, 34, 0.7)" : "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderTop: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.06)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
          <div style={{ color: statusColor, flexShrink: 0, display: "flex" }}>
            <Icons.Location width="15" height="15" />
          </div>
          <span
            style={{
              color: textColor,
              fontWeight: 650,
              fontSize: "12.5px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {cityName}
          </span>
        </div>

        <span
          style={{
            color: dateColor,
            fontSize: "11px",
            fontWeight: 500,
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          {timeText}
        </span>
      </div>
    </div>
  );
};

// ============================================================================
// 7. CONTAINER COMPONENT: RecentGrid (2-Column Grid Layout)
// ============================================================================

const RecentGrid = ({ posts = [], lang = "en", isDark = false, onPostClick }) => {
  return (
    <div
      style={{
        width: "100%",
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "14px",
      }}
    >
      {posts.map((post) => (
        <RecentPosts
          key={post._id}
          post={post}
          lang={lang}
          isDark={isDark}
          onClick={() => onPostClick?.(post)}
        />
      ))}
    </div>
  );
};

// ============================================================================
// 8. SECTION CONTAINER: RecentSection (Homepage Card Container with Cyber Dots)
// ============================================================================

const RecentSection = ({
  type = "found", // "found" | "lost"
  posts = [],
  lang = "en",
  isDark = false,
  onSeeAll,
  onPostClick,
}) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const isFound = type === "found";
  const title = isFound ? t.recentFounds : t.recentLosts;
  const toneColor = isFound
    ? (isDark ? "#3DDCA6" : "#1A8563")
    : (isDark ? "#FF6B5E" : "#C64335");

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        backgroundColor: isDark ? "#171B22" : "#FFFFFF",
        borderRadius: "20px",
        padding: "24px",
        border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"}`,
        boxShadow: isDark
          ? "0 10px 30px rgba(0, 0, 0, 0.3)"
          : "0 10px 30px rgba(0, 0, 0, 0.04)",
      }}
    >
      {/* Decorative Subtle Dot Grid Mesh */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: lang === "ar" ? "auto" : 0,
          left: lang === "ar" ? 0 : "auto",
          width: "180px",
          height: "180px",
          opacity: isDark ? 0.25 : 0.45,
          backgroundImage: `radial-gradient(${toneColor} 1.5px, transparent 1.5px)`,
          backgroundSize: "14px 14px",
          pointerEvents: "none",
          maskImage: "radial-gradient(circle at 100% 0%, black, transparent 70%)",
          WebkitMaskImage: "radial-gradient(circle at 100% 0%, black, transparent 70%)",
        }}
      />

      {/* Section Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Title + Icon */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              color: toneColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "6px",
              borderRadius: "10px",
              backgroundColor: `${toneColor}15`,
            }}
          >
            {isFound ? <Icons.Found width="20" height="20" /> : <Icons.Lost width="20" height="20" />}
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: 700,
              color: isDark ? "#EDEFF5" : "#0B1220",
            }}
          >
            {title}
          </h3>
        </div>

        {/* See All Action Button */}
        <button
          onClick={onSeeAll}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            color: toneColor,
            fontWeight: 650,
            fontSize: "13px",
            padding: "4px 8px",
            borderRadius: "6px",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <span>{t.seeAll}</span>
          {lang === "ar" ? <Icons.ArrowLeft width="14" height="14" /> : <Icons.ArrowRight width="14" height="14" />}
        </button>
      </div>

      {/* Section Content: 2-Column Grid */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <RecentGrid
          posts={posts}
          lang={lang}
          isDark={isDark}
          onPostClick={onPostClick}
        />
      </div>
    </div>
  );
};

// ============================================================================
// 9. COMPLETE SHOWCASE / SANDBOX (Self-Contained for AI Studio)
// ============================================================================

export default function RecentPostsShowcase() {
  const [lang, setLang] = useState("en"); // "en" | "ar"
  const [isDark, setIsDark] = useState(false);

  const isRtl = lang === "ar";

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      style={{
        minHeight: "100vh",
        backgroundColor: isDark ? "#0E1116" : "#F7F8FB",
        color: isDark ? "#EDEFF5" : "#0B1220",
        fontFamily: isRtl
          ? '"Cairo", "IBM Plex Sans Arabic", -apple-system, BlinkMacSystemFont, sans-serif'
          : '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
        padding: "32px 20px",
        boxSizing: "border-box",
        transition: "background-color 0.2s, color 0.2s",
      }}
    >
      {/* Interactive Controls Bar for AI Studio testing */}
      <div
        style={{
          maxWidth: "1040px",
          margin: "0 auto 28px auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          padding: "12px 18px",
          borderRadius: "14px",
          backgroundColor: isDark ? "#171B22" : "#FFFFFF",
          border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"}`,
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>
            {lang === "ar" ? "معاينة قسم المنشورات الحديثة (بدون صور)" : "Recent Posts Preview (No-Image / Icons Only)"}
          </h2>
          <span style={{ fontSize: "12px", color: isDark ? "#94A3B8" : "#64748B" }}>
            {lang === "ar" ? "نموذج جاهز لإعادة التصميم في AI Studio" : "Ready for AI Studio Redesign"}
          </span>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          {/* Language Switcher */}
          <button
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              cursor: "pointer",
              border: `1px solid ${isDark ? "#334155" : "#E2E8F0"}`,
              backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
              color: isDark ? "#F8FAFC" : "#0F172A",
              fontWeight: 650,
              fontSize: "12.5px",
            }}
          >
            {lang === "en" ? "العربية (AR)" : "English (EN)"}
          </button>

          {/* Theme Switcher */}
          <button
            onClick={() => setIsDark(!isDark)}
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              cursor: "pointer",
              border: `1px solid ${isDark ? "#334155" : "#E2E8F0"}`,
              backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
              color: isDark ? "#F8FAFC" : "#0F172A",
              fontWeight: 650,
              fontSize: "12.5px",
            }}
          >
            {isDark ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>
      </div>

      {/* Main Containers Layout: 2 Paired Sections (Found & Lost) */}
      <div
        style={{
          maxWidth: "1040px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "24px",
        }}
      >
        {/* Container 1: Recent Founds */}
        <RecentSection
          type="found"
          posts={MOCK_FOUND_POSTS}
          lang={lang}
          isDark={isDark}
          onSeeAll={() => alert(lang === "ar" ? "عرض كل المعثورات" : "View all found items")}
          onPostClick={(post) => alert(`Clicked post: ${post._id}`)}
        />

        {/* Container 2: Recent Losts */}
        <RecentSection
          type="lost"
          posts={MOCK_LOST_POSTS}
          lang={lang}
          isDark={isDark}
          onSeeAll={() => alert(lang === "ar" ? "عرض كل المفقودات" : "View all lost items")}
          onPostClick={(post) => alert(`Clicked post: ${post._id}`)}
        />
      </div>
    </div>
  );
}
