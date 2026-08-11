import { useEffect, useMemo } from "react";
import NewPostForm from "./NewPostForm";
import { useGetUserByIdQuery } from "../../userSettings/usersApiSlice";
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
import scrollToTop from "../../../utils/scrollToTop";

const NewPost = () => {
  useTitle("Mafqoudat| New Post");

  // Resets scroll as soon as this route mounts, before dependencies
  // (user/countries/categories/flOptions) finish loading. Without this, the
  // page opens wherever the previous route left the scroll offset, and the
  // loading skeleton below is short enough that a deep offset clamps to the
  // very bottom of the page - the footer - until the fetches resolve.
  useEffect(() => {
    scrollToTop();
  }, []);

  const { usernameId } = useAuth();

  const { t, currentLanguage } = useTranslation();

  // Ask for this one account, not the whole list. GET /users is admin-only by
  // design - it returns every user's email and role - so pulling the poster's own
  // record out of it worked for an admin and failed with a flat 403 for everyone
  // else, which surfaced here as "error loading the post form" on a form a normal
  // user is perfectly entitled to open. GET /users/:id allows self (or admin),
  // which is what mobile's PostForm already calls.
  const {
    data: userData,
    isError: isUserError,
    error: userError,
    refetch: refetchUser,
  } = useGetUserByIdQuery(usernameId, { skip: !usernameId });

  // Keep the shape NewPostForm expects. The two endpoints differ in one way that
  // matters: /users leaves `country` as the raw id, /users/:id populates it into a
  // document. The form treats user.country as an id (seeds Formik with it, looks it
  // up in `countries`, passes it to fetchCitiesByCountry), so flatten it back.
  const user = useMemo(() => {
    if (!userData) return undefined;

    return {
      ...userData,
      id: userData._id,
      country: userData.country?._id || userData.country,
    };
  }, [userData]);

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
