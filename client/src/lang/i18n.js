import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n.use(initReactI18next).init({
  lng: "en",
  resources: {
    en: {
      translation: {
        mafkoudat: "mafkoudat",
        Found: "Found",
        Lost: "Lost",
        All: "All",
        Returned: "Returned",
        "Found Things": "Found Things",
        "Lost Things": "Lost Things",
        "Total Posts": "Total Posts",
        "Returned to Owners": "Returned to Owners",
        "new today": "new today",
        "This month": "This month",
        "Successfully returned": "Successfully returned"
      },
    },
    ar: {
      translation: {
        mafkoudat: "مفقودات",
        Found: "وجد",
        Lost: "فقد",
        All: "الكل",
        Returned: "رجع",
        "Found Things": "الأشياء الموجودة",
        "Lost Things": "الأشياء المفقودة",
        "Total Posts": "إجمالي المنشورات",
        "Returned to Owners": "تم إرجاعه لأصحابه",
        "new today": "جديد اليوم",
        "This month": "هذا الشهر",
        "Successfully returned": "تم الإرجاع بنجاح"
      },
    },
  },
});

export default i18n;
