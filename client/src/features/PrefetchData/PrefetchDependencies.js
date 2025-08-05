import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { store } from "../../app/store";
import { dependencieaApiSlice } from "../dependencies/dependenciesApiSlice";
import { useLanguage } from "../../utils/languageContext";

const PrefetchDependencies = () => {
  const { currentLanguage } = useLanguage();

  useEffect(() => {
    // Invalidate existing cache when language changes
    store.dispatch(
      dependencieaApiSlice.util.invalidateTags([
        { type: "Category", id: "LIST" },
        { type: "Country", id: "LIST" },
        { type: "Dependencies", id: "LIST" }
      ])
    );

    // Prefetch with new language - using the correct format
    store.dispatch(
      dependencieaApiSlice.util.prefetch("getflOptions", {
        language: currentLanguage || 'en',
        active: true
      }, { force: true })
    );
    store.dispatch(
      dependencieaApiSlice.util.prefetch("getCategories", {
        language: currentLanguage || 'en',
        active: true
      }, { force: true })
    );

    store.dispatch(
      dependencieaApiSlice.util.prefetch("getCountries", {
        language: currentLanguage || 'en',
        active: true
      }, { force: true })
    );
  }, [currentLanguage]);
  return <Outlet />;
};

export default PrefetchDependencies;
