import NewPostForm from "./NewPostForm";
import { useGetUsersQuery } from "../../userSettings/usersApiSlice";
import { LoadingState, ErrorState } from "../../../components/LoadingStates";
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
    return <LoadingState message={t('loadingPostForm')} />;

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
