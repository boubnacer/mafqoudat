import NewUserForm from "./NewUserForm";
import { useGetCountriesQuery } from "../../countries/countriesApiSlice";

const NewUser = () => {
  const { countries } = useGetCountriesQuery("countriesList", {
    selectFromResult: ({ data }) => ({
      countries: data?.ids.map((id) => data?.entities[id]),
    }),
  });

  if (!countries) return <p>no countries found</p>;

  const content = <NewUserForm countries={countries} />;

  return content;
};

export default NewUser;
