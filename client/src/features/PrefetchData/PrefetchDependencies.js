import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { store } from "../../app/store";
import { dependencieaApiSlice } from "../dependencies/dependenciesApiSlice";
import { getCurrentLanguage } from "../../utils/languageUtils";

const PrefetchDependencies = () => {
  useEffect(() => {
    const currentLanguage = getCurrentLanguage();
    
    store.dispatch(
      dependencieaApiSlice.util.prefetch("getflOptions", "flOptionsList", {
        force: true,
        language: currentLanguage,
        active: true
      })
    );
    store.dispatch(
      dependencieaApiSlice.util.prefetch("getCategories", "categoriesList", {
        force: true,
        language: currentLanguage,
        active: true
      })
    );

    store.dispatch(
      dependencieaApiSlice.util.prefetch("getCountries", "countriesList", {
        force: true,
        language: currentLanguage,
        active: true
      })
    );
  }, []);
  return <Outlet />;
};

export default PrefetchDependencies;
