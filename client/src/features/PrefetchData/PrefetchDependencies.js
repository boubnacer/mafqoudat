import React, { useEffect, useState } from "react";
import { store } from "../../app/store";
import { dependencieaApiSlice } from "../dependencies/dependenciesApiSlice";
import { apiSlice } from "../../app/api/apiSlice";
import { useLanguage } from "../../utils/languageContext";

const PrefetchDependencies = ({ children }) => {
  const { currentLanguage } = useLanguage();
  const [isRefetching, setIsRefetching] = useState(false);

  useEffect(() => {
    setIsRefetching(true);
    
    // Invalidate existing cache when language changes
    store.dispatch(
      dependencieaApiSlice.util.invalidateTags([
        { type: "Category", id: "LIST" },
        { type: "Country", id: "LIST" },
        { type: "Dependencies", id: "LIST" }
      ])
    );

    // Also invalidate dashboard and posts cache
    store.dispatch(
      apiSlice.util.invalidateTags([
        { type: "Dashboard", id: "LIST" },
        { type: "Post", id: "LIST" }
      ])
    );

    // Prefetch with new language - using the correct format
    const prefetchPromises = [
      store.dispatch(
        dependencieaApiSlice.util.prefetch("getflOptions", {
          language: currentLanguage || 'en',
          active: true
        }, { force: true })
      ),
      store.dispatch(
        dependencieaApiSlice.util.prefetch("getCategories", {
          language: currentLanguage || 'en',
          active: true
        }, { force: true })
      ),
      store.dispatch(
        dependencieaApiSlice.util.prefetch("getCountries", {
          language: currentLanguage || 'en',
          active: true
        }, { force: true })
      )
    ];

    // Wait for all prefetch operations to complete
    Promise.all(prefetchPromises).then(() => {
      setTimeout(() => setIsRefetching(false), 500); // Small delay to ensure UI updates
    });
  }, [currentLanguage]);

  return children;
};

export default PrefetchDependencies;
