import { Outlet, Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useRefreshMutation } from "../authApiSlice";
import usePersist from "../../../hooks/usePersist";
import { useSelector } from "react-redux";
import { selectCurrentToken } from "../authSlice";
import { LoadingState, ErrorState } from "../../../components/LoadingStates";
import { Button } from "@mui/material";
import { authStorage } from "../../../utils/authStorage";

// to stay logged in when refreshing page
const PersistLogin = () => {
  const [persist] = usePersist();
  const token = useSelector(selectCurrentToken);
  const effectRan = useRef(false);

  const [trueSuccess, setTrueSuccess] = useState(false);

  const [refresh, { isUninitialized, isLoading, isSuccess, isError, error }] =
    useRefreshMutation();

  const navigate = useNavigate();

  useEffect(() => {
    if (effectRan.current === true || process.env.NODE_ENV !== "development") {
      // React 18 Strict Mode

      const verifyRefreshToken = async () => {
        // console.log("verifying refresh token");
        try {
          //const response =
          await refresh();
          //const { accessToken } = response.data
          setTrueSuccess(true);
        } catch (err) {
          console.error(err);
        }
      };

      // Verify authentication state persistence after page refresh (e.g., from language change)
      const verifyAuthPersistence = () => {
        const authVerification = authStorage.verifyAuthPersistence();
        if (authVerification.success) {
          // Only log success in development mode to avoid console spam
          if (process.env.NODE_ENV === 'development') {
            console.log('Authentication state successfully preserved after page refresh');
          }
        } else {
          // Always log warnings for debugging
          console.warn('Authentication state verification failed:', authVerification.details);
        }
      };

      // Verify auth persistence on component mount
      verifyAuthPersistence();
      
      // line below changed
      if (!token) verifyRefreshToken();
    }

    return () => (effectRan.current = true);

    // eslint-disable-next-line
  }, []);

  let content;
  // persist option is removed
  if (isLoading) {
    //persist: yes, token: no
    // console.log("loading");
    content = <LoadingState message="Refreshing session..." />;
  } else if (isError) {
    //persist: yes, token: no
    content = (
      <ErrorState
        title="Session expired"
        message={error?.data?.message || "Please login again"}
        action={
          <Link to="/login">
            <Button variant="contained">Login Again</Button>
          </Link>
        }
      />
    );
  } else if (isSuccess && trueSuccess) {
    //persist: yes, token: yes
    // console.log("success");

    content = <Outlet />;
  } else if (token && isUninitialized) {
    //persist: yes, token: yes
    // console.log("token and uninit");
    // console.log(isUninitialized);
    content = <Outlet />;
  }

  return content;
};
export default PersistLogin;
