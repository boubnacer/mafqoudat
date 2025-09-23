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
import { useTranslation } from "../../../utils/translations";

const NewPost = () => {
  console.log('🔍 NewPost: Component starting to render');
  
  useTitle("Mafkoudat| New Post");
  console.log('🔍 NewPost: useTitle hook completed');

  const { usernameId } = useAuth();
  console.log('🔍 NewPost: useAuth hook completed, usernameId:', usernameId);

  const { t, currentLanguage } = useTranslation();
  console.log('🔍 NewPost: useTranslation hook completed, currentLanguage:', currentLanguage);

  const { user } = useGetUsersQuery("usersList", {
    selectFromResult: ({ data }) => ({
      user: data?.entities[usernameId],
    }),
  });
  console.log('🔍 NewPost: useGetUsersQuery completed, user:', user);

  const { countries } = useGetCountriesQuery({
    language: currentLanguage || 'en'
  }, {
    selectFromResult: ({ data }) => ({
      countries: data?.ids.map((id) => data?.entities[id]),
    }),
  });
  console.log('🔍 NewPost: useGetCountriesQuery completed, countries:', countries?.length);

  const { categories } = useGetCategoriesQuery({
    language: currentLanguage || 'en'
  }, {
    selectFromResult: ({ data }) => ({
      categories: data?.ids.map((id) => data?.entities[id]),
    }),
  });
  console.log('🔍 NewPost: useGetCategoriesQuery completed, categories:', categories?.length);

  const { flOptions } = useGetflOptionsQuery({
    language: currentLanguage || 'en'
  }, {
    selectFromResult: ({ data }) => ({
      flOptions: data?.ids.map((id) => data?.entities[id]),
    }),
  });
  console.log('🔍 NewPost: useGetflOptionsQuery completed, flOptions:', flOptions?.length);

  if (!user || !countries || !flOptions || !categories) {
    console.log('🔍 NewPost: Missing data, showing loading state');
    return <LoadingState message={t('loadingPostForm')} />;
  }

  console.log('🔍 NewPost: All data loaded, rendering NewPostForm');
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
