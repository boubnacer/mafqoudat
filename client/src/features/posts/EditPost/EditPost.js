import { useParams } from "react-router-dom";
import { useEffect } from "react";
import EditPostForm from "./EditPostForm";
import { useGetPostQuery } from "../postsApiSlice";
import { useGetUsersQuery } from "../../userSettings/usersApiSlice";
import { LoadingState } from "../../../components/LoadingStates";
import useTitle from "../../../hooks/useTitle";
import useAuth from "../../../hooks/useAuth";
import { useTranslation } from "../../../utils/translations";
import {
  useGetCategoriesQuery,
  useGetCountriesQuery,
  useGetflOptionsQuery,
} from "../../dependencies/dependenciesApiSlice";

const EditPost = () => {
  useTitle("mafkoudat: Edit Post");

  const { t, currentLanguage } = useTranslation();

  const { usernameId } = useAuth();

  const { id } = useParams();

  const { countries } = useGetCountriesQuery({
    language: currentLanguage || 'en'
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
    language: currentLanguage || 'en'
  });

  // Debug: Log post data when it's loaded
  useEffect(() => {
    if (data) {
      console.log('📋 POST DATA LOADED - Full post data:', data);
      console.log('📋 POST DATA LOADED - Post city:', data.city);
      console.log('📋 POST DATA LOADED - Post city type:', typeof data.city);
    }
  }, [data]);

  const { user } = useGetUsersQuery("usersList", {
    selectFromResult: ({ data }) => ({
      user: data?.entities[usernameId],
    }),
  });

  const { categories } = useGetCategoriesQuery({
    language: currentLanguage || 'en'
  }, {
    selectFromResult: ({ data }) => ({
      categories: data?.ids.map((id) => data?.entities[id]),
    }),
  });

  const { flOptions } = useGetflOptionsQuery({
    language: currentLanguage || 'en'
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
