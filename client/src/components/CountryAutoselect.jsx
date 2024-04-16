import * as React from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import { useState } from "react";
import useAuth from "../hooks/useAuth";
import { useDispatch } from "react-redux";
import { setOpenModal } from "../app/state";

const CountryAutoselect = ({ countries, setCountryId }) => {
  const dispatch = useDispatch();
  const defaultProps = {
    // options: countries,
    getOptionLabel: (option) => option.label,
  };

  const handleChange = (_, value, reason) => {
    console.log({ id: value._id });
    setCountryId(value._id);
    dispatch(setOpenModal());
  };

  return (
    <Autocomplete
      sx={{ width: 300, marginTop: "1rem" }}
      options={countries}
      autoHighlight
      disableClearable
      onChange={handleChange}
      // getOptionLabel={(option) => option.label}
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
          {...params}
          label="Choose a country"
          inputProps={{
            ...params.inputProps,
            autoComplete: "new-password", // disable autocomplete and autofill
          }}
        />
      )}
    />
  );
};

export default CountryAutoselect;
