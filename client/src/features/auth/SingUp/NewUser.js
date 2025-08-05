import NewUserForm from "./NewUserForm";
import { useGetCountriesQuery } from "../../dependencies/dependenciesApiSlice";
import { LoadingState } from "../../../components/LoadingStates";
import { useTranslation } from "../../../utils/translations";
import { useLanguage } from "../../../utils/languageContext";

const NewUser = () => {
  const { t, currentLanguage } = useTranslation();
  const { currentLanguage: langContext } = useLanguage();
  
  const { countries } = useGetCountriesQuery({
    language: currentLanguage || langContext || 'en'
  }, {
    selectFromResult: ({ data }) => ({
      countries: data?.ids.map((id) => data?.entities[id]),
    }),
  });

  if (!countries) return <LoadingState message={t('loadingSignupForm')} />;

  const content = <NewUserForm countries={countries} />;

  return content;
};

export default NewUser;
