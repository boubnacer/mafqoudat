import { useParams } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import EditUserForm from "./EditUserForm";
import { useGetUsersQuery } from "../usersApiSlice";
import useTitle from "../../../hooks/useTitle";
import { useGetCountriesQuery } from "../../dependencies/dependenciesApiSlice";

const EditUser = () => {
  useTitle("mafqoudat: Edit User");

  const { id } = useParams();

  const { user } = useGetUsersQuery("usersList", {
    selectFromResult: ({ data }) => ({
      user: data?.entities[id],
    }),
  });

  const { countries } = useGetCountriesQuery({
    language: 'en'
  }, {
    selectFromResult: ({ data }) => ({
      countries: data?.ids.map((id) => data?.entities[id]),
    }),
  });

  if (!user || !countries) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const content = <EditUserForm user={user} countries={countries} />;

  return content;
};
export default EditUser;
