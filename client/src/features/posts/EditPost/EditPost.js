import { useParams } from "react-router-dom";
import EditPostForm from "./EditPostForm";
import { useGetPostQuery, useGetPostsQuery } from "../postsApiSlice";
import { useGetUsersQuery } from "../../userSettings/usersApiSlice";
import PulseLoader from "react-spinners/PulseLoader";
import useTitle from "../../../hooks/useTitle";
import { useGetCountriesQuery } from "../../countries/countriesApiSlice";
import useAuth from "../../../hooks/useAuth";
import {
  useGetCategoriesQuery,
  useGetflOptionsQuery,
} from "../../dependencies/dependenciesApiSlice";

const EditPost = () => {
  useTitle("mafkoudat: Edit Post");

  const { usernameId } = useAuth();

  const { id } = useParams();

  const { countries } = useGetCountriesQuery("countriesList", {
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

  if (!data || !user || !countries || !categories || !flOptions)
    return <PulseLoader color={"#FFF"} />;

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
