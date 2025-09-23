import { useSelector } from "react-redux";
import { selectCurrentToken, selectCurrentUser } from "../features/auth/authSlice";
import { isTokenExpired, isTokenExpiringSoon } from "../utils/tokenUtils";
import jwtDecode from "jwt-decode";

const useAuth = () => {
  const token = useSelector(selectCurrentToken);
  const user = useSelector(selectCurrentUser);

  // Check if token exists and is valid
  if (token && !isTokenExpired(token)) {
    try {
      const decoded = jwtDecode(token);
      const { username, country, usernameId, foundLost, role } = decoded.UserInfo;
      
      return { 
        username, 
        country, 
        usernameId, 
        foundLost, 
        role, 
        isAuthenticated: true,
        token,
        isTokenExpiringSoon: isTokenExpiringSoon(token)
      };
    } catch (error) {
      // Token is invalid, return empty values
      console.error('Token decode error:', error);
      return { username: "", country: "", usernameId: "", foundLost: "", role: "", isAuthenticated: false };
    }
  }

  return { username: "", country: "", usernameId: "", foundLost: "", role: "", isAuthenticated: false };
};
export default useAuth;
