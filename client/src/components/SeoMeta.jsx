import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../utils/languageContext';
import { translations } from '../utils/translations';
import { defaultSeo, pageSeoConfig, SUPPORTED_LANGUAGES, LOCALE_MAP, buildAbsoluteUrl } from '../utils/seoConfig';

// Per-page title/description in the language the page is actually rendering in.
//
// pageSeoConfig's own title/description are English-only, so an Arabic visitor
// - the default for anyone with no stored preference - got an English <title>
// on a page whose every visible word is Arabic. Worse for search: the build's
// prerendered Arabic title was overwritten with the English one the moment
// React mounted, so the crawler's render pass undid the prerender. The copy now
// lives in translations.js's `seoPages` block, which the build-time prerender
// reads too, and pageSeoConfig stays the fallback for anything not listed there
// (and for the structured data, which is language-independent).
const localizedPageSeo = (pageKey, language) => {
  if (!pageKey) return null;
  const table = translations[language] && translations[language].seoPages;
  return (table && table[pageKey]) || null;
};

const SeoMeta = ({
  pageKey,
  title,
  description,
  path,
  image,
  structuredData,
  noindex = false,
  children,
}) => {
  const { currentLanguage } = useLanguage();
  const location = useLocation();
  const config = pageKey && pageSeoConfig[pageKey] ? pageSeoConfig[pageKey] : {};
  const localized = localizedPageSeo(pageKey, currentLanguage);

  const metaTitle = title || (localized && localized.title) || config.title || defaultSeo.title;
  const metaDescription =
    description || (localized && localized.description) || config.description || defaultSeo.description;
  // Use explicit path from config, or fall back to current location pathname
  // This ensures canonical is always set correctly even if config path is wrong
  const metaPath = path || config.path || location.pathname || defaultSeo.path;
  const metaImage = image || config.image || defaultSeo.image;
  const metaStructuredData = structuredData || config.structuredData || defaultSeo.structuredData;

  const canonicalUrl = buildAbsoluteUrl(metaPath);

  const ogLocale = LOCALE_MAP[currentLanguage] || LOCALE_MAP.en;

  // Two tags this used to render and deliberately no longer does.
  //
  // <meta name="keywords">: Google has ignored it since 2009, and the list it
  // carried was 60-odd brand misspellings - the one shape every engine
  // recognises as stuffing.
  //
  // The hreflang cluster: it pointed at ?lang=ar / ?lang=fr / ?lang=en variants
  // of the same path, while the canonical on every one of those variants
  // pointed back at the bare URL. Google discards an hreflang cluster whose
  // members canonicalise elsewhere, so the tags never did anything except spend
  // crawl budget on three extra URLs per page. This site serves one URL per
  // page and switches language client-side; the honest markup for that is a
  // single self-referencing canonical. Real alternates need real localised URLs
  // (/ar/..., /fr/...) carrying their own canonicals - a routing change, not a
  // meta-tag change.
  return (
    <Helmet>
      <html lang={currentLanguage} />
      <title>{metaTitle}</title>
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={defaultSeo.siteName} />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:locale" content={ogLocale} />
      {SUPPORTED_LANGUAGES.filter((lang) => lang !== currentLanguage).map((lang) => (
        <meta key={lang} property="og:locale:alternate" content={LOCALE_MAP[lang]} />
      ))}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />

      {metaStructuredData && Array.isArray(metaStructuredData)
        ? metaStructuredData.map((schema, index) => (
            <script key={index} type="application/ld+json">
              {JSON.stringify(schema)}
            </script>
          ))
        : metaStructuredData && (
            <script type="application/ld+json">
              {JSON.stringify(metaStructuredData)}
            </script>
          )}

      {children}
    </Helmet>
  );
};

export default SeoMeta;
