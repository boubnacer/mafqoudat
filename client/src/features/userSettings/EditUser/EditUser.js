import { useParams } from "react-router-dom";
import EditUserForm from "./EditUserForm";
import { useGetUsersQuery } from "../usersApiSlice";
import { LoadingState } from "../../../components/LoadingStates";
import useTitle from "../../../hooks/useTitle";
import { useGetCountriesQuery } from "../../dependencies/dependenciesApiSlice";

const EditUser = () => {
  useTitle("mafkoudat: Edit User");

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

  if (!user || !countries) return <LoadingState message="Loading user data..." />;

  const content = <EditUserForm user={user} countries={countries} />;

  return content;
};
export default EditUser;
