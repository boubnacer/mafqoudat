import NewUserForm from "./NewUserForm";
import { useGetCountriesQuery } from "../../countries/countriesApiSlice";
import PulseLoader from "react-spinners/PulseLoader";

const NewUser = () => {
  const { countries } = useGetCountriesQuery("countriesList", {
    selectFromResult: ({ data }) => ({
      countries: data?.ids.map((id) => data?.entities[id]),
    }),
  });

  if (!countries) return <p><PulseLoader/></p>;

  const content = <NewUserForm countries={countries} />;

  return content;
};

export default NewUser;
