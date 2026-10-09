import { Outlet } from "react-router-dom";

const Prefetch = () => {
  // Protected routes wrapper. Data is loaded on demand by specific pages
  // rather than firing unconditional background requests on every navigation.
  return <Outlet />;
};
export default Prefetch;
