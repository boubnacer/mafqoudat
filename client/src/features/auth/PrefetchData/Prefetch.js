import { store } from "../../../app/store";
import { postsApiSlice } from "../../posts/postsApiSlice";
import { usersApiSlice } from "../../userSettings/usersApiSlice";
import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import useAuth from "../../../hooks/useAuth";

const Prefetch = () => {
  // This wraps every requireAuth protected route (new post, edit post,
  // profile...), not only the admin ones - but GET /users sits behind
  // verifyJWT + verifyAdmin server-side (server/routes/userRoutes.js), so
  // prefetching it unconditionally meant every non-admin's first protected
  // navigation fired a guaranteed 403 for a user list they were never going
  // to see.
  const { role } = useAuth();

  useEffect(() => {
    if (role !== 'admin') return;

    store.dispatch(
      usersApiSlice.util.prefetch("getUsers", "usersList", { force: true })
    );

    // store.dispatch(
    //   postsApiSlice.util.prefetch("getPosts", "postsList", { force: true })
    // );
  }, [role]);

  return <Outlet />;
};
export default Prefetch;
