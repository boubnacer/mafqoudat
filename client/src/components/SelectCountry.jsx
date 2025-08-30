import * as React from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import { useField } from "formik";

const SelectCountry = ({ name, countries, language = 'en' }) => {
  const [field, meta, helpers] = useField(name);

  const handleChange = (_, value) => {
    helpers.setValue(value?._id || "");
  };

  // Get the appropriate label based on language
  const getCountryLabel = (option) => {
    // First try to get the full country name from the names field
    if (option.names && option.names[language]) {
      return option.names[language];
    }
    // Fallback to labels field
    if (option.labels && option.labels[language]) {
      return option.labels[language];
    }
    // Final fallback to label or code
    return option.label || option.code;
  };

  // Get flag source - prefer local flag, fallback to flagcdn
  const getFlagSource = (option) => {
    if (option.flag) {
      return option.flag; // Use emoji flag if available
    }
    return `https://flagcdn.com/w20/${option.code.toLowerCase()}.png`;
  };

  // Filter valid props for li elements to prevent React error #137
  const getValidLiProps = (props) => {
    const validLiProps = [
      'id', 'role', 'aria-selected', 'aria-disabled', 'data-option-index',
      'onClick', 'onMouseDown', 'onMouseMove', 'onMouseEnter', 'onMouseLeave',
      'style', 'className'
    ];
    
    return Object.keys(props).reduce((acc, key) => {
      if (validLiProps.includes(key) && props[key] !== undefined) {
        acc[key] = props[key];
      }
      return acc;
    }, {});
  };

  // Find the selected country object
  const selectedCountry = countries?.find(country => country._id === field.value);

  return (
    <Autocomplete
      defaultValue={selectedCountry}
      options={countries}
      autoHighlight
      disableClearable
      onChange={handleChange}
      getOptionLabel={(option) => getCountryLabel(option)}
      renderOption={(props, option) => (
        <Box
          component="li"
          sx={{ "& > img": { mr: 2, flexShrink: 0 } }}
          {...getValidLiProps(props)}
        >
          {option.flag ? (
            <span style={{ marginRight: 8, fontSize: '20px' }}>
              {option.flag}
            </span>
          ) : (
            <img
              loading="lazy"
              width="20"
              src={getFlagSource(option)}
              srcSet={`https://flagcdn.com/w40/${option.code.toLowerCase()}.png 2x`}
              alt=""
            />
          )}
          {getCountryLabel(option)} ({option.code})
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
