import React, { useState } from "react";
import { useParams } from "react-router-dom";
import useAuth from "../../../hooks/useAuth";
import { useGetPostQuery, useGetPostsQuery } from "../postsApiSlice";
import SinglePostPage from "./SinglePostPage";
import { LoadingState, ErrorState } from "../../../components/LoadingStates";
import { useTranslation } from "../../../utils/translations";

const SinglePost = () => {
  const { country } = useAuth();
  const { id } = useParams();
  const { t, currentLanguage } = useTranslation();

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

  // Ensure contactPreferences is properly formatted before passing to SinglePostPage
  const sanitizedPost = {
    ...post,
    contactPreferences: post.contactPreferences && typeof post.contactPreferences === 'object' 
      ? {
          phone: Boolean(post.contactPreferences.phone),
          email: Boolean(post.contactPreferences.email),
          whatsapp: Boolean(post.contactPreferences.whatsapp)
        }
      : {
          phone: true,
          email: false,
          whatsapp: false
        },
    // Ensure foundLostLabel is passed if available from API transformation
    foundLostLabel: post.foundLostLabel || null,
    // Ensure floptionName is passed if available from API transformation
    floptionName: post.floptionName || null
  };

  return <SinglePostPage {...sanitizedPost} />;
};

export default SinglePost;
