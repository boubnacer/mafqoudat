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

  const { data } = useGetPostQuery(id);

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

  if (!data || !user || !countries || !categories || !flOptions)
    return <LoadingState message={t('loadingEditForm')} />;

  const content = (
    <EditPostForm
      categories={categories}
      flOptions={flOptions}
      post={data}
      user={user}
      countries={countries}
    />
  );

  return content;
};
export default EditPost;
