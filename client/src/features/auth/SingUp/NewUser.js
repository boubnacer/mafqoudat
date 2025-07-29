import NewUserForm from "./NewUserForm";
import { useGetCountriesQuery } from "../../countries/countriesApiSlice";
import { LoadingState } from "../../../components/LoadingStates";

const NewUser = () => {
  const { countries } = useGetCountriesQuery("countriesList", {
    selectFromResult: ({ data }) => ({
      countries: data?.ids.map((id) => data?.entities[id]),
    }),
  });

  if (!countries) return <LoadingState message="Loading signup form..." />;

  const content = <NewUserForm countries={countries} />;

  return content;
};

export default NewUser;
