import NewUserForm from "./NewUserForm";
import { useGetCountriesQuery } from "../../countries/countriesApiSlice";
import { LoadingState } from "../../../components/LoadingStates";
import { getCurrentLanguage, t } from "../../../utils/languageUtils";

const NewUser = () => {
  const currentLanguage = getCurrentLanguage();
  
  const { countries } = useGetCountriesQuery({
    language: currentLanguage
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
