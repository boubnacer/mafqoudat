import React from "react";
import { useParams } from "react-router-dom";
import { useGetPostQuery } from "../postsApiSlice";
import SinglePostPage from "./SinglePostPage";
import SeoMeta from "../../../components/SeoMeta";
import { ErrorState } from "../../../components/LoadingStates";
import SinglePostSkeleton from "../../../components/SinglePostSkeleton";
import { useTranslation } from "../../../utils/translations";
import { buildPostSeo, buildPostPath } from "../../../utils/postSeo";

const SinglePost = () => {
  const { id } = useParams();
  const { t, currentLanguage } = useTranslation();

  const { data: post, isLoading, isUninitialized, isError, error, refetch } = useGetPostQuery({
    postId: id,
    language: currentLanguage
  });

  // Deliberately no SeoMeta while loading: a crawler that snapshots the page
  // mid-fetch (the API is on a cold-start-prone host) would otherwise capture
  // whatever we emitted here. Falling through to the static shell's tags is
  // safe; emitting a "not found" title or a noindex at this point would not be.
  if (isLoading || isUninitialized) {
    return <SinglePostSkeleton />;
  }

  // A genuine 404 means the post is gone, so it should drop out of the index.
  // Every other failure (500, network, cold backend) is transient and must NOT
  // emit noindex - that would deindex a perfectly good post over a blip.
  const isMissing = (isError && error?.status === 404) || (!isError && !post);

  if (isMissing) {
    return (
      <>
        <SeoMeta
          title={t('seoPostNotFoundTitle')}
          description={t('seoPostNotFoundDescription')}
          path={buildPostPath(id)}
          noindex
        />
        <ErrorState
          title={t('postNotFoundTitle')}
          message={t('postNotFoundMessage')}
          onRetry={() => window.location.reload()}
        />
      </>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title={t('postLoadFailedTitle')}
        message={error?.data?.message || t('postLoadFailedMessage')}
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
    foundLostLabel: post.foundLostLabel || null
  };

  const seo = buildPostSeo({ post, language: currentLanguage, t });

  return (
    <>
      <SeoMeta
        title={seo.title}
        description={seo.description}
        keywords={seo.keywords}
        image={seo.image}
        path={seo.path}
        structuredData={seo.structuredData}
        noindex={seo.noindex}
      />
      <SinglePostPage {...sanitizedPost} refetchPost={refetch} />
    </>
  );
};

export default SinglePost;
