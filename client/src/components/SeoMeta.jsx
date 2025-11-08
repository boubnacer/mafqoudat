import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../utils/languageContext';
import { defaultSeo, pageSeoConfig, SUPPORTED_LANGUAGES, LOCALE_MAP, buildAbsoluteUrl } from '../utils/seoConfig';

const SeoMeta = ({
  pageKey,
  title,
  description,
  keywords,
  path,
  image,
  alternates,
  structuredData,
  noindex = false,
  children,
}) => {
  const { currentLanguage } = useLanguage();
  const config = pageKey && pageSeoConfig[pageKey] ? pageSeoConfig[pageKey] : {};

  const metaTitle = title || config.title || defaultSeo.title;
  const metaDescription = description || config.description || defaultSeo.description;
  const metaKeywords = keywords || config.keywords || defaultSeo.keywords;
  const metaPath = path || config.path || defaultSeo.path;
  const metaImage = image || config.image || defaultSeo.image;
  const metaAlternates = alternates || config.alternates;
  const metaStructuredData = structuredData || config.structuredData || defaultSeo.structuredData;

  const canonicalUrl = buildAbsoluteUrl(metaPath);
  const keywordsContent = Array.isArray(metaKeywords) ? metaKeywords.join(', ') : metaKeywords;

  const alternateLinks = (() => {
    if (metaAlternates) {
      return Object.entries(metaAlternates).reduce((acc, [lang, url]) => {
        if (!SUPPORTED_LANGUAGES.includes(lang)) return acc;
        acc[lang] = buildAbsoluteUrl(url);
        return acc;
      }, {});
    }

    return SUPPORTED_LANGUAGES.reduce((acc, lang) => {
      const url = new URL(canonicalUrl);
      url.searchParams.set('lang', lang);
      acc[lang] = url.toString();
      return acc;
    }, {});
  })();

  const ogLocale = LOCALE_MAP[currentLanguage] || LOCALE_MAP.en;

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
      {keywordsContent && <meta name="keywords" content={keywordsContent} />}

      <link rel="canonical" href={canonicalUrl} />
      {Object.entries(alternateLinks).map(([lang, url]) => (
        <link key={lang} rel="alternate" hrefLang={lang} href={url} />
      ))}
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />

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
