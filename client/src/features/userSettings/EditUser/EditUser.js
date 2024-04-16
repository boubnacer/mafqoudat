import { useParams } from "react-router-dom";
import EditUserForm from "./EditUserForm";
import { useGetUsersQuery } from "../usersApiSlice";
import PulseLoader from "react-spinners/PulseLoader";
import useTitle from "../../../hooks/useTitle";
import { useGetCountriesQuery } from "../../countries/countriesApiSlice";

const EditUser = () => {
  useTitle("mafkoudat: Edit User");

  const { id } = useParams();

  const { user } = useGetUsersQuery("usersList", {
    selectFromResult: ({ data }) => ({
      user: data?.entities[id],
    }),
  });

  const { countries } = useGetCountriesQuery("countriesList", {
    selectFromResult: ({ data }) => ({
      countries: data?.ids.map((id) => data?.entities[id]),
    }),
  });

  if (!user || !countries) return <PulseLoader color={"#FFF"} />;

  const content = <EditUserForm user={user} countries={countries} />;

  return content;
};
export default EditUser;
