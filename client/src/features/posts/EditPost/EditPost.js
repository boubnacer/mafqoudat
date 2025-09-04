import { useParams } from "react-router-dom";
import EditPostForm from "./EditPostForm";
import { useGetPostQuery, useGetPostsQuery } from "../postsApiSlice";
import { useGetUsersQuery } from "../../userSettings/usersApiSlice";
import { LoadingState } from "../../../components/LoadingStates";
import useTitle from "../../../hooks/useTitle";
import { useGetCountriesQuery } from "../../dependencies/dependenciesApiSlice";
import useAuth from "../../../hooks/useAuth";
import { useTranslation } from "../../../utils/translations";
import { useLanguage } from "../../../utils/languageContext";
import {
  useGetCategoriesQuery,
  useGetflOptionsQuery,
  useGetCitiesQuery,
} from "../../dependencies/dependenciesApiSlice";

const EditPost = () => {
  useTitle("mafkoudat: Edit Post");

  const { t, currentLanguage } = useTranslation();
  const { currentLanguage: langContext } = useLanguage();

  const { usernameId } = useAuth();

  const { id } = useParams();

  const { countries } = useGetCountriesQuery({
    language: currentLanguage || langContext || 'en'
  }, {
    selectFromResult: ({ data }) => ({
      countries: data?.ids.map((id) => data?.entities[id]),
    }),
  });

  // const { post } = useGetPostsQuery("postsList", {
  //   selectFromResult: ({ data }) => ({
  //     post: data?.entities[id],
  //   }),
  // });

  const { data } = useGetPostQuery({
    postId: id,
    language: currentLanguage || langContext || 'en'
  });

  const { user } = useGetUsersQuery("usersList", {
    selectFromResult: ({ data }) => ({
      user: data?.entities[usernameId],
    }),
  });

  const { categories } = useGetCategoriesQuery({
    language: currentLanguage || langContext || 'en'
  }, {
    selectFromResult: ({ data }) => ({
      categories: data?.ids.map((id) => data?.entities[id]),
    }),
  });

  const { flOptions } = useGetflOptionsQuery({
    language: currentLanguage || langContext || 'en'
  }, {
    selectFromResult: ({ data }) => ({
      flOptions: data?.ids.map((id) => data?.entities[id]),
    }),
  });

  const { cities } = useGetCitiesQuery({
    language: currentLanguage || langContext || 'en',
    countryId: data?.country
  }, {
    selectFromResult: ({ data }) => ({
      cities: data?.ids.map((id) => data?.entities[id]),
    }),
    skip: !data?.country // Skip if no country is selected
  });

  // Debug: Log the data being passed to EditPostForm
  console.log('🔍 EditPost - Post data from API:', data);
  console.log('🔍 EditPost - User data:', user);
  console.log('🔍 EditPost - Countries:', countries);
  console.log('🔍 EditPost - Categories:', categories);
  console.log('🔍 EditPost - FlOptions:', flOptions);

  if (!data || !user || !countries || !categories || !flOptions)
    return <LoadingState message={t('loadingEditForm')} />;

  const content = (
    <EditPostForm
      categories={categories}
      flOptions={flOptions}
      cities={cities}
      post={data}
      user={user}
      countries={countries}
    />
  );

  return content;
};
export default EditPost;
