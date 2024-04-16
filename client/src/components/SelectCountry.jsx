import * as React from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import { useField, useFormikContext } from "formik";

const SelectCountry = ({ options, name, countryname }) => {
  // console.log(countryname);
  const { setFieldValue } = useFormikContext();
  const [field, meta] = useField(name);

  const handleChange = (_, value, reason) => {
    console.log({ id: value._id });
    setFieldValue(name, value._id);
  };

  return (
    <Autocomplete
      defaultValue={countryname}
      //   sx={{ width: 300 }}
      options={options}
      autoHighlight
      disableClearable
      onChange={handleChange}
      getOptionLabel={(option) => option.label}
      renderOption={(props, option) => (
        <Box
          component="li"
          sx={{ "& > img": { mr: 2, flexShrink: 0 } }}
          {...props}
        >
          <img
            loading="lazy"
            width="20"
            src={`https://flagcdn.com/w20/${option.code.toLowerCase()}.png`}
            srcSet={`https://flagcdn.com/w40/${option.code.toLowerCase()}.png 2x`}
            alt=""
          />
          {option.label} ({option.code})
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...field}
          {...params}
          label="Choose country"
          inputProps={{
            ...params.inputProps,
            autoComplete: "new-password", // disable autocomplete and autofill
          }}
        />
      )}
    />
  );
};

export default SelectCountry;
