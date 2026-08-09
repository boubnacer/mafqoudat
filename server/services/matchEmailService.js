const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const Post = require('../models/Post');
const Category = require('../models/Category');
const City = require('../models/City');
const FoundLost = require('../models/FoundLost');

/**
 * Opt-in email copy of a lost/found match alert.
 *
 * Entirely secondary to the in-app notification: it is off by default per user
 * (User.notificationPreferences.emailAlerts), gated on a high confidence score,
 * and silently disabled when SMTP credentials are absent. It never throws - the
 * caller treats a failed send as "no email", not as a failed match.
 */

const SUPPORTED_LANGUAGES = ['en', 'fr', 'ar'];

const COPY = {
  en: {
    subject: 'Possible match for your listing on Mafqoudat',
    heading: 'We may have found a match',
    introLost: 'Someone posted a found item that looks like the one you reported lost.',
    introFound: 'Someone reported losing an item that looks like the one you found.',
    yourListing: 'Your listing',
    theirListing: 'Possible match',
    confidence: 'Confidence',
    viewMatch: 'View the match',
    reasonsTitle: 'Why we think these are related',
    footer: 'You are receiving this because email match alerts are enabled on your Mafqoudat account. You can turn them off in your notification settings.',
    reasons: {
      same_category: 'Same item category',
      same_city: 'Same city',
      nearby_location: 'Similar location description',
      close_dates: 'Dates are close together',
      similar_description: 'Similar descriptions',
      shared_reference: 'Both mention the same reference number',
    },
  },
  fr: {
    subject: 'Correspondance possible pour votre annonce sur Mafqoudat',
    heading: 'Nous avons peut-être trouvé une correspondance',
    introLost: "Quelqu'un a publié un objet trouvé qui ressemble à celui que vous avez perdu.",
    introFound: "Quelqu'un a signalé la perte d'un objet qui ressemble à celui que vous avez trouvé.",
    yourListing: 'Votre annonce',
    theirListing: 'Correspondance possible',
    confidence: 'Confiance',
    viewMatch: 'Voir la correspondance',
    reasonsTitle: 'Pourquoi ces annonces semblent liées',
    footer: "Vous recevez cet e-mail car les alertes par e-mail sont activées sur votre compte Mafqoudat. Vous pouvez les désactiver dans vos paramètres de notification.",
    reasons: {
      same_category: "Même catégorie d'objet",
      same_city: 'Même ville',
      nearby_location: 'Description de lieu similaire',
      close_dates: 'Dates proches',
      similar_description: 'Descriptions similaires',
      shared_reference: 'Les deux mentionnent le même numéro de référence',
    },
  },
  ar: {
    subject: 'تطابق محتمل مع إعلانك على مفقودات',
    heading: 'قد نكون وجدنا تطابقًا',
    introLost: 'نشر أحدهم غرضًا وجده يشبه الغرض الذي أعلنت عن فقدانه.',
    introFound: 'أعلن أحدهم عن فقدان غرض يشبه الغرض الذي عثرت عليه.',
    yourListing: 'إعلانك',
    theirListing: 'تطابق محتمل',
    confidence: 'نسبة التطابق',
    viewMatch: 'عرض التطابق',
    reasonsTitle: 'لماذا نعتقد أن الإعلانين مرتبطان',
    footer: 'تصلك هذه الرسالة لأن تنبيهات البريد الإلكتروني مفعّلة في حسابك على مفقودات. يمكنك إيقافها من إعدادات الإشعارات.',
    reasons: {
      same_category: 'نفس فئة الغرض',
      same_city: 'نفس المدينة',
      nearby_location: 'وصف مكان متشابه',
      close_dates: 'تاريخان متقاربان',
      similar_description: 'وصفان متشابهان',
      shared_reference: 'كلا الإعلانين يذكران نفس الرقم المرجعي',
    },
  },
};

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const siteUrl = () => (process.env.CLIENT_URL || 'https://mafqoudat.com').replace(/\/$/, '');

const isConfigured = () => Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

const createTransporter = () => nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/** Minimal, presentation-ready view of a post for the email body. */
const loadPostSummary = async (postId, language) => {
  const post = await Post.findById(postId)
    .select('categories category city foundLost exactLocation mainDate cloudinaryUrl image createdAt')
    .lean();
  if (!post) return null;

  const categoryIds = (Array.isArray(post.categories) && post.categories.length > 0)
    ? post.categories
    : [post.category].filter(Boolean);

  const [categories, city, foundLost] = await Promise.all([
    categoryIds.length ? Category.find({ _id: { $in: categoryIds } }).select('labels').lean() : [],
    // Post.city is a Mixed field and can hold a raw place name, which would
    // make findById throw a CastError - only look it up when it is really an id.
    (post.city && mongoose.Types.ObjectId.isValid(String(post.city)))
      ? City.findById(post.city).select('labels').lean()
      : null,
    post.foundLost ? FoundLost.findById(post.foundLost).select('code').lean() : null,
  ]);

  const label = (labels) => labels?.[language] || labels?.en || '';

  return {
    id: String(post._id),
    categoryLabel: categories.map((category) => label(category.labels)).filter(Boolean).join(', '),
    cityLabel: label(city?.labels),
    exactLocation: post.exactLocation || '',
    mainDate: post.mainDate || '',
    image: post.cloudinaryUrl || post.image || '',
    foundLostCode: String(foundLost?.code || '').toUpperCase(),
  };
};

const renderCard = (title, summary, copy) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#ffffff;border-radius:12px;margin-bottom:16px;">
    <tr>
      <td style="padding:16px;">
        <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#6b7280;margin-bottom:6px;">${escapeHtml(title)}</div>
        <div style="font-size:16px;font-weight:700;color:#0B1220;">${escapeHtml(summary.categoryLabel || '—')}</div>
        <div style="font-size:14px;color:#4b5563;margin-top:4px;">${escapeHtml([summary.cityLabel, summary.exactLocation].filter(Boolean).join(' · '))}</div>
        ${summary.mainDate ? `<div style="font-size:13px;color:#6b7280;margin-top:4px;">${escapeHtml(summary.mainDate)}</div>` : ''}
      </td>
      ${summary.image ? `<td width="96" style="padding:16px 16px 16px 0;"><img src="${escapeHtml(summary.image)}" width="80" height="80" alt="" style="width:80px;height:80px;object-fit:cover;border-radius:10px;display:block;" /></td>` : ''}
    </tr>
  </table>`;

/**
 * Sends one match alert. Resolves `{ success: false, reason }` rather than
 * throwing on any failure, including missing configuration.
 */
const sendMatchAlert = async ({ recipient, ownPostId, matchedPostId, score, reasons = [] }) => {
  try {
    if (!isConfigured()) return { success: false, reason: 'email_not_configured' };
    if (!recipient?.email) return { success: false, reason: 'no_recipient_email' };

    const language = SUPPORTED_LANGUAGES.includes(recipient.language) ? recipient.language : 'en';
    const copy = COPY[language];
    const isRTL = language === 'ar';

    const [ownSummary, matchedSummary] = await Promise.all([
      loadPostSummary(ownPostId, language),
      loadPostSummary(matchedPostId, language),
    ]);
    if (!ownSummary || !matchedSummary) return { success: false, reason: 'post_missing' };

    const intro = ownSummary.foundLostCode === 'LOST' ? copy.introLost : copy.introFound;
    const url = `${siteUrl()}/dash/posts/${matchedSummary.id}`;

    const reasonList = reasons
      .map((reason) => copy.reasons[reason])
      .filter(Boolean)
      .map((text) => `<li style="margin-bottom:4px;">${escapeHtml(text)}</li>`)
      .join('');

    const html = `<!doctype html>
<html dir="${isRTL ? 'rtl' : 'ltr'}" lang="${language}">
<body style="margin:0;padding:24px;background:#F7F8FB;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;border-collapse:collapse;">
    <tr><td>
      <h1 style="font-size:20px;color:#0B1220;margin:0 0 8px;">${escapeHtml(copy.heading)}</h1>
      <p style="font-size:15px;color:#4b5563;margin:0 0 4px;">${escapeHtml(intro)}</p>
      <p style="font-size:14px;color:#1B4DFF;font-weight:700;margin:0 0 20px;">${escapeHtml(copy.confidence)}: ${Number(score) || 0}%</p>
      ${renderCard(copy.yourListing, ownSummary, copy)}
      ${renderCard(copy.theirListing, matchedSummary, copy)}
      ${reasonList ? `<div style="margin:8px 0 20px;"><div style="font-size:13px;font-weight:700;color:#0B1220;margin-bottom:6px;">${escapeHtml(copy.reasonsTitle)}</div><ul style="margin:0;padding-${isRTL ? 'right' : 'left'}:18px;font-size:13px;color:#4b5563;">${reasonList}</ul></div>` : ''}
      <a href="${escapeHtml(url)}" style="display:inline-block;background:#1B4DFF;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:12px 22px;border-radius:12px;">${escapeHtml(copy.viewMatch)}</a>
      <p style="font-size:12px;color:#9ca3af;margin:24px 0 0;">${escapeHtml(copy.footer)}</p>
    </td></tr>
  </table>
</body>
</html>`;

    const text = [
      copy.heading,
      intro,
      `${copy.confidence}: ${Number(score) || 0}%`,
      '',
      `${copy.yourListing}: ${[ownSummary.categoryLabel, ownSummary.cityLabel].filter(Boolean).join(' - ')}`,
      `${copy.theirListing}: ${[matchedSummary.categoryLabel, matchedSummary.cityLabel].filter(Boolean).join(' - ')}`,
      '',
      url,
      '',
      copy.footer,
    ].join('\n');

    await createTransporter().sendMail({
      from: `"Mafqoudat" <${process.env.EMAIL_USER}>`,
      to: recipient.email,
      subject: copy.subject,
      text,
      html,
    });

    return { success: true };
  } catch (error) {
    console.error('Match alert email error:', error?.message || error);
    return { success: false, reason: 'send_failed' };
  }
};

module.exports = { sendMatchAlert, isConfigured };
