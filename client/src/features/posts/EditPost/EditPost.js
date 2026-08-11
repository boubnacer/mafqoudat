import { useParams } from "react-router-dom";
import { useEffect, useMemo } from "react";
import EditPostForm from "./EditPostForm";
import { useGetPostQuery } from "../postsApiSlice";
import { useGetUserByIdQuery } from "../../userSettings/usersApiSlice";
import PostFormSkeleton from "../../../components/PostFormSkeleton";
import useTitle from "../../../hooks/useTitle";
import useAuth from "../../../hooks/useAuth";
import { useTranslation } from "../../../utils/translations";
import {
  useGetCategoriesQuery,
  useGetCountriesQuery,
  useGetflOptionsQuery,
} from "../../dependencies/dependenciesApiSlice";

const EditPost = () => {
  useTitle("mafqoudat: Edit Post");

  const { currentLanguage } = useTranslation();

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


  // Same admin-only-endpoint bug NewPost.js had, and worse here: `user` is one of
  // the values the render gate below waits on, and there is no error branch, so a
  // non-admin editing their own post sat on the loading skeleton forever rather
  // than seeing anything go wrong. See NewPost.js for why /users/:id is the right
  // call and why `country` gets flattened back to an id.
  const { data: userData } = useGetUserByIdQuery(usernameId, { skip: !usernameId });

  const user = useMemo(() => {
    if (!userData) return undefined;

    return {
      ...userData,
      id: userData._id,
      country: userData.country?._id || userData.country,
    };
  }, [userData]);

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
    return <PostFormSkeleton />;


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
