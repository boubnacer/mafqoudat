/**
 * The document titles the New Post form offers when a listing is filed under
 * the DOCUMENTS category.
 *
 * Why this list exists at all: a photo of an identity document is the one
 * attachment a lost-and-found listing must never carry - it publishes a full
 * name, a document number, an address and a face to anyone who opens the
 * listing, which is exactly what someone who has just lost that document
 * cannot afford. So DOCUMENTS listings take no photo (see the New Post
 * wizard), and this list is what replaces it: the reader picks *which*
 * document it is, from a fixed vocabulary, and the listing carries that
 * instead of a picture.
 *
 * The seed list is written in Arabic first - these are Moroccan civil-status
 * documents and the Arabic name is the one on the paper - with the English and
 * French names beside it. `code` is the stable identifier; labels are curated
 * copy and are never rewritten by the sync script once a row exists.
 *
 * A title a reader cannot find here is added by them through the form's
 * "Other document" option (two fields: the Arabic name and the Latin one),
 * which creates a row with `isCustom: true` so the next person finds it in the
 * list. See controllers/documentTypesController.js.
 */

// Alphabetical order is wrong for this list: it is scanned by someone who has
// just lost a specific paper, and the papers people actually lose are not
// evenly likely. `priority` (higher first) puts the common ones at the top.
const DEFAULT_DOCUMENT_TYPES = [
  {
    code: 'NATIONAL_ID',
    labels: {
      ar: 'بطاقة الهوية الوطنية',
      en: 'National identity card',
      fr: "Carte nationale d'identité",
    },
    priority: 100,
    searchTerms: ['cin', 'cnie', 'id card', 'carte identite', 'بطاقة التعريف'],
  },
  {
    code: 'PASSPORT',
    labels: { ar: 'جواز السفر', en: 'Passport', fr: 'Passeport' },
    priority: 95,
    searchTerms: ['passport', 'passeport', 'جواز'],
  },
  {
    code: 'DRIVING_LICENCE',
    labels: { ar: 'رخصة السياقة', en: 'Driving licence', fr: 'Permis de conduire' },
    priority: 90,
    searchTerms: ['permis', 'licence', 'رخصة السياقة', 'driving'],
  },
  {
    code: 'VEHICLE_REGISTRATION',
    labels: {
      ar: 'ملكية المركبة',
      en: 'Vehicle registration card',
      fr: 'Carte grise',
    },
    priority: 85,
    searchTerms: ['carte grise', 'registration', 'ملكية', 'بطاقة رمادية'],
  },
  {
    code: 'BIRTH_CERTIFICATE',
    labels: {
      ar: 'شهادة الميلاد',
      en: 'Birth certificate',
      fr: 'Acte de naissance',
    },
    priority: 80,
    searchTerms: ['birth', 'naissance', 'ميلاد'],
  },
  {
    code: 'CIVIL_STATUS_EXTRACT',
    labels: {
      ar: 'خلاصة القيد',
      en: 'Civil status extract',
      fr: "Extrait d'acte de naissance",
    },
    priority: 75,
    searchTerms: ['extrait', 'خلاصة', 'civil status'],
  },
  {
    code: 'FAMILY_BOOK',
    labels: { ar: 'الدفتر العائلي', en: 'Family record book', fr: 'Livret de famille' },
    priority: 70,
    searchTerms: ['livret', 'family book', 'دفتر عائلي'],
  },
  {
    code: 'MARRIAGE_CERTIFICATE',
    labels: { ar: 'عقد الزواج', en: 'Marriage certificate', fr: 'Acte de mariage' },
    priority: 65,
    searchTerms: ['mariage', 'marriage', 'زواج'],
  },
  {
    code: 'RESIDENCE_CERTIFICATE',
    labels: {
      ar: 'شهادة الإقامة',
      en: 'Residence certificate',
      fr: 'Certificat de résidence',
    },
    priority: 60,
    searchTerms: ['residence', 'إقامة', 'سكنى'],
  },
  {
    code: 'CRIMINAL_RECORD',
    labels: {
      ar: 'السجل العدلي',
      en: 'Criminal record extract',
      fr: 'Casier judiciaire',
    },
    priority: 55,
    searchTerms: ['casier', 'criminal record', 'سجل عدلي'],
  },
  {
    code: 'RENTAL_CONTRACT',
    labels: { ar: 'عقد الإيجار', en: 'Rental contract', fr: 'Contrat de bail' },
    priority: 50,
    searchTerms: ['bail', 'lease', 'كراء', 'إيجار'],
  },
  {
    code: 'AMO_CERTIFICATE',
    labels: {
      ar: 'شهادة التأمين الإجباري عن المرض',
      en: 'Compulsory health insurance certificate (AMO)',
      fr: "Attestation d'assurance maladie obligatoire (AMO)",
    },
    priority: 45,
    searchTerms: ['amo', 'assurance maladie', 'تأمين', 'صحي'],
  },
  {
    code: 'HEALTH_CARD',
    labels: { ar: 'البطاقة الصحية', en: 'Health card', fr: 'Carte sanitaire' },
    priority: 40,
    searchTerms: ['health card', 'carte sanitaire', 'بطاقة صحية'],
  },
  {
    code: 'NATIONALITY_CERTIFICATE',
    labels: {
      ar: 'شهادة الجنسية',
      en: 'Certificate of nationality',
      fr: 'Certificat de nationalité',
    },
    priority: 35,
    searchTerms: ['nationality', 'nationalite', 'جنسية'],
  },
  // Beyond the civil-status set above, the titles most often reported lost
  // alongside it - added so the "Other document" path is the exception rather
  // than the first thing half the readers reach for.
  {
    code: 'STUDENT_CARD',
    labels: { ar: 'بطاقة الطالب', en: 'Student card', fr: "Carte d'étudiant" },
    priority: 30,
    searchTerms: ['student', 'etudiant', 'طالب', 'جامعة'],
  },
  {
    code: 'SOCIAL_SECURITY_CARD',
    labels: {
      ar: 'بطاقة الضمان الاجتماعي',
      en: 'Social security card (CNSS)',
      fr: 'Carte de sécurité sociale (CNSS)',
    },
    priority: 25,
    searchTerms: ['cnss', 'securite sociale', 'ضمان اجتماعي'],
  },
  {
    code: 'VEHICLE_INSURANCE',
    labels: {
      ar: 'شهادة التأمين على المركبة',
      en: 'Vehicle insurance certificate',
      fr: "Attestation d'assurance automobile",
    },
    priority: 20,
    searchTerms: ['assurance', 'insurance', 'تأمين', 'سيارة'],
  },
  {
    code: 'TECHNICAL_INSPECTION',
    labels: {
      ar: 'شهادة الفحص التقني',
      en: 'Technical inspection certificate',
      fr: 'Visite technique',
    },
    priority: 15,
    searchTerms: ['visite technique', 'inspection', 'فحص تقني'],
  },
  {
    code: 'DIPLOMA',
    labels: { ar: 'الشهادة الدراسية', en: 'Diploma or school certificate', fr: 'Diplôme ou attestation scolaire' },
    priority: 10,
    searchTerms: ['diplome', 'diploma', 'شهادة دراسية', 'باكالوريا'],
  },
  {
    code: 'WORK_BADGE',
    labels: { ar: 'البطاقة المهنية', en: 'Professional or work badge', fr: 'Carte professionnelle' },
    priority: 5,
    searchTerms: ['carte professionnelle', 'work badge', 'مهنية'],
  },
];

module.exports = { DEFAULT_DOCUMENT_TYPES };
