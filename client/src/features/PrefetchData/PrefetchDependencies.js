import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { store } from "../../app/store";
import { dependencieaApiSlice } from "../dependencies/dependenciesApiSlice";

const PrefetchDependencies = () => {
  useEffect(() => {
    store.dispatch(
      dependencieaApiSlice.util.prefetch("getflOptions", "flOptionsList", {
        force: true,
      })
    );
    store.dispatch(
      dependencieaApiSlice.util.prefetch("getCategories", "categoriesList", {
        force: true,
      })
    );

    store.dispatch(
      dependencieaApiSlice.util.prefetch("getCountries", "countriesList", {
        force: true,
      })
    );
  }, []);
  return <Outlet />;
};

export default PrefetchDependencies;
