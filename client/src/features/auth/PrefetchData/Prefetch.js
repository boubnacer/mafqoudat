import { store } from "../../../app/store";
import { postsApiSlice } from "../../posts/postsApiSlice";
import { usersApiSlice } from "../../userSettings/usersApiSlice";
import { useEffect } from "react";
import { Outlet } from "react-router-dom";

const Prefetch = () => {
  useEffect(() => {
    store.dispatch(
      usersApiSlice.util.prefetch("getUsers", "usersList", { force: true })
    );

    // store.dispatch(
    //   postsApiSlice.util.prefetch("getPosts", "postsList", { force: true })
    // );
  }, []);

  return <Outlet />;
};
export default Prefetch;
