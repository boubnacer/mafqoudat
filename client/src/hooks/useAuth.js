import { useSelector } from "react-redux";
import { useMemo } from "react";
import { 
  selectAuthState, 
  selectIsAuthenticated, 
  selectCurrentUser,
  selectIsTokenExpiringSoon 
} from "../features/auth/authSelectors";

/**
 * Optimized useAuth hook with memoization
 * Uses memoized selectors to prevent unnecessary re-renders
 */
const useAuth = () => {
  // Use memoized selectors for better performance
  const authState = useSelector(selectAuthState);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  const isTokenExpiringSoon = useSelector(selectIsTokenExpiringSoon);

  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(() => {
    if (!isAuthenticated || !user) {
      return { 
        username: "", 
        country: "", 
        usernameId: "", 
        foundLost: "", 
        role: "", 
        isAuthenticated: false,
        token: null,
        isTokenExpiringSoon: false
      };
    }

    return {
      username: user.username || "",
      country: user.country || "",
      usernameId: user.usernameId || "",
      foundLost: user.foundLost || "",
      role: user.role || "",
      isAuthenticated: true,
      token: authState.token,
      isTokenExpiringSoon,
      // Additional performance data
      userSource: user.isFromToken ? 'token' : 'storage',
      ...authState
    };
  }, [isAuthenticated, user, authState.token, isTokenExpiringSoon, authState]);
};

export default useAuth;
