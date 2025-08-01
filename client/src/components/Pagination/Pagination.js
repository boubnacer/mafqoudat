import { getCurrentLanguage, t } from "../../utils/languageUtils";

const Pagination = () => {
  const currentLanguage = getCurrentLanguage();
  
  return (
    <div style={{ direction: currentLanguage === 'ar' ? 'rtl' : 'ltr' }}>
      <button>{t('next')}</button>
      <button>{t('back')}</button>
    </div>
  );
};

export default Pagination;
