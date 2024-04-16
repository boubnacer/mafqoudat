import React, { useState } from "react";
import { useParams } from "react-router-dom";
import useAuth from "../../../hooks/useAuth";
import { useGetPostQuery, useGetPostsQuery } from "../postsApiSlice";
import SinglePostPage from "./SinglePostPage";

const SinglePost = () => {
  const { country } = useAuth();
  const { id } = useParams();

  // const { post } = useGetPostsQuery("postsList", {
  //   selectFromResult: ({ data }) => ({
  //     post: data?.postsWithUser,
  //   }),
  // });

  // const [query, useQuery] = useState(`?postId=${id}`);

  // const { postsWithUser } = useGetPostsQuery(query, {
  //   selectFromResult: ({ data }) => ({
  //     postsWithUser: data?.postsWithUser.find((p) => p._id === id),
  //   }),
  // });

  const { data: post } = useGetPostQuery(id);
  console.log(post);

  if (!post) return <p>Post has disapeared!</p>;

  return <SinglePostPage {...post} />;
};

export default SinglePost;
