import NewUserForm from "./NewUserForm";
import { useGetCountriesQuery } from "../../dependencies/dependenciesApiSlice";
import AuthPageSkeleton from "../AuthPageSkeleton";
import { useTranslation } from "../../../utils/translations";
import { useLanguage } from "../../../utils/languageContext";

const NewUser = () => {
  const { currentLanguage } = useTranslation();
  const { currentLanguage: langContext } = useLanguage();

  const { countries } = useGetCountriesQuery({
    language: currentLanguage || langContext || 'en'
  }, {
    selectFromResult: ({ data }) => ({
      countries: data?.ids.map((id) => data?.entities[id]),
    }),
  });

  if (!countries) return <AuthPageSkeleton fields={5} />;

  const content = <NewUserForm countries={countries} />;

  return content;
};

export default NewUser;
