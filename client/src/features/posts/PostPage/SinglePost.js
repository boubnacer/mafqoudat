import React, { useState } from "react";
import { useParams } from "react-router-dom";
import useAuth from "../../../hooks/useAuth";
import { useGetPostQuery, useGetPostsQuery } from "../postsApiSlice";
import SinglePostPage from "./SinglePostPage";
import { LoadingState, ErrorState } from "../../../components/LoadingStates";
import { useTranslation as useAppTranslation } from "../../../utils/translations";
import { useTranslation } from "react-i18next";

const SinglePost = () => {
  const { country } = useAuth();
  const { id } = useParams();
  const { currentLanguage } = useAppTranslation();
  const { t } = useTranslation();

  const { data: post, isLoading, isError, error } = useGetPostQuery({
    postId: id,
    language: currentLanguage
  });

  if (isLoading) {
    return <LoadingState message={t('loadingPostDetails')} />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load post"
        message={error?.data?.message || "The post may have been deleted or doesn't exist"}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!post) {
    return (
      <ErrorState
        title="Post not found"
        message="The post you're looking for doesn't exist or has been removed"
        onRetry={() => window.location.reload()}
      />
    );
  }

  return <SinglePostPage {...post} />;
};

export default SinglePost;
