import { useEffect } from "react";
import NewPostForm from "./NewPostForm";
import { useGetUsersQuery } from "../../userSettings/usersApiSlice";
import { ErrorState } from "../../../components/LoadingStates";
import PostFormSkeleton from "../../../components/PostFormSkeleton";
import useTitle from "../../../hooks/useTitle";
import {
  useGetCategoriesQuery,
  useGetCountriesQuery,
  useGetflOptionsQuery,
} from "../../dependencies/dependenciesApiSlice";
import useAuth from "../../../hooks/useAuth";
import { useTranslation } from "../../../utils/translations";

const NewPost = () => {
  useTitle("Mafqoudat| New Post");

  // Resets scroll as soon as this route mounts, before dependencies
  // (user/countries/categories/flOptions) finish loading. Without this, the
  // page opens wherever the previous route left the scroll offset, and the
  // loading skeleton below is short enough that a deep offset clamps to the
  // very bottom of the page - the footer - until the fetches resolve.
  // Setting scrollTop directly (rather than window.scrollTo) is the only way
  // to force an instant jump here: index.css sets html { scroll-behavior:
  // smooth }, and per spec scrollTo's 'auto' behavior defers to that CSS
  // property instead of overriding it, so it animates too - and that
  // animation gets interrupted (and can end up stuck) when the skeleton
  // swaps for the real form moments later. Both html and body are set for
  // cross-browser support (Safari historically scrolls body).
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  const { usernameId } = useAuth();

  const { t, currentLanguage } = useTranslation();

  const {
    user,
    isError: isUserError,
    error: userError,
    refetch: refetchUser,
  } = useGetUsersQuery("usersList", {
    selectFromResult: ({ data, isError, error }) => ({
      user: data?.entities[usernameId],
      isError,
      error,
    }),
  });

  const {
    countries,
    isError: isCountriesError,
    error: countriesError,
    refetch: refetchCountries,
  } = useGetCountriesQuery({
    language: currentLanguage || 'en'
  }, {
    selectFromResult: ({ data, isError, error }) => ({
      countries: data?.ids.map((id) => data?.entities[id]),
      isError,
      error,
    }),
  });

  const {
    categories,
    isError: isCategoriesError,
    error: categoriesError,
    refetch: refetchCategories,
  } = useGetCategoriesQuery({
    language: currentLanguage || 'en'
  }, {
    selectFromResult: ({ data, isError, error }) => ({
      categories: data?.ids.map((id) => data?.entities[id]),
      isError,
      error,
    }),
  });

  const {
    flOptions,
    isError: isFlOptionsError,
    error: flOptionsError,
    refetch: refetchFlOptions,
  } = useGetflOptionsQuery({
    language: currentLanguage || 'en'
  }, {
    selectFromResult: ({ data, isError, error }) => ({
      flOptions: data?.ids.map((id) => data?.entities[id]),
      isError,
      error,
    }),
  });

  const hasError = isUserError || isCountriesError || isCategoriesError || isFlOptionsError;

  if (hasError) {
    const handleRetry = () => {
      if (isUserError) refetchUser();
      if (isCountriesError) refetchCountries();
      if (isCategoriesError) refetchCategories();
      if (isFlOptionsError) refetchFlOptions();
    };

    const firstError = userError || countriesError || categoriesError || flOptionsError;

    return (
      <ErrorState
        title={t('errorLoadingPostForm')}
        message={firstError?.data?.message || t('errorLoadingPostFormMessage')}
        onRetry={handleRetry}
      />
    );
  }

  if (!user || !countries || !flOptions || !categories)
    return <PostFormSkeleton />;

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
