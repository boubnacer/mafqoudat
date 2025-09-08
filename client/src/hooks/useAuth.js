import { useSelector } from "react-redux";
import { selectCurrentToken } from "../features/auth/authSlice";
import jwtDecode from "jwt-decode";

const useAuth = () => {
  const token = useSelector(selectCurrentToken);

  if (token) {
    const decoded = jwtDecode(token);
    const { username, country, usernameId, foundLost, role } = decoded.UserInfo;

    return { username, country, usernameId, foundLost, role };
  }

  return { username: "", country: "", usernameId: "", foundLost: "", role: "" };
};
export default useAuth;
