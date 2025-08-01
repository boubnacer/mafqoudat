import NewPostForm from "./NewPostForm";
import { useGetUsersQuery } from "../../userSettings/usersApiSlice";
import { LoadingState } from "../../../components/LoadingStates";
import useTitle from "../../../hooks/useTitle";
import {
  useGetCategoriesQuery,
  useGetCountriesQuery,
  useGetflOptionsQuery,
} from "../../dependencies/dependenciesApiSlice";
import useAuth from "../../../hooks/useAuth";
import { useTranslation } from "react-i18next";

const NewPost = () => {
  useTitle("Mafkoudat| New Post");

  const { usernameId } = useAuth();

  const { t } = useTranslation();

  const { user } = useGetUsersQuery("usersList", {
    selectFromResult: ({ data }) => ({
      user: data?.entities[usernameId],
    }),
  });

  const { countries } = useGetCountriesQuery({
    language: 'en'
  }, {
    selectFromResult: ({ data }) => ({
      countries: data?.ids.map((id) => data?.entities[id]),
    }),
  });

  const { categories } = useGetCategoriesQuery("categoriesList", {
    selectFromResult: ({ data }) => ({
      categories: data?.ids.map((id) => data?.entities[id]),
    }),
  });

  const { flOptions } = useGetflOptionsQuery("flOptions", {
    selectFromResult: ({ data }) => ({
      flOptions: data?.ids.map((id) => data?.entities[id]),
    }),
  });

  console.log(categories, flOptions, countries);
  

  if (!user || !countries || !flOptions || !categories)
    return <LoadingState message={t('loadingPostForm')} />;

  const content = (
    <NewPostForm
      user={user}
      countries={countries}
      categories={categories}
      flOptions={flOptions}
    />
  );

  return content;
};
export default NewPost;
