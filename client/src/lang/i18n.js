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
      },
    },
    ar: {
      translation: {
        mafkoudat: "مفقودات",
        Found: "وجد",
        Lost: "فقد",
        All: "الكل",
        Returned: "رجع",
      },
    },
  },
});

export default i18n;
