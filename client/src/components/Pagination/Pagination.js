import { useTranslation } from "../../utils/translations";

const Pagination = () => {
  const { t, currentLanguage } = useTranslation();
  
  return (
    <div style={{ direction: currentLanguage === 'ar' ? 'rtl' : 'ltr' }}>
      <button>{t('next')}</button>
      <button>{t('back')}</button>
    </div>
  );
};

export default Pagination;
