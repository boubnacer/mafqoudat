import { MenuItem, TextField } from "@mui/material";
import { useField, useFormikContext } from "formik";
import React from "react";
import { useTranslation } from "../utils/translations";

const SelectOption = ({ name, options, error, helperText, onErrorClear, ...otherProps }) => {
  const { setFieldValue } = useFormikContext();
  const [field, meta] = useField(name);
  const { currentLanguage } = useTranslation();

  const handleChange = (event) => {
    const { value } = event.target;
    setFieldValue(name, value);
    
    // Clear error if field has value and onErrorClear callback is provided
    if (value && onErrorClear) {
      onErrorClear(name);
    }
  };

  // Get the appropriate label based on language
  const getOptionLabel = (option) => {
    if (option.labels && option.labels[currentLanguage]) {
      return option.labels[currentLanguage];
    }
    return option.label || option.code;
  };

  const selectConfig = {
    ...field,
    ...otherProps,
    select: true,
    variant: "outlined",
    fullWidth: true,
    onChange: handleChange,
  };

  // Use external error props if provided, otherwise use Formik validation
  if (error !== undefined && helperText !== undefined) {
    selectConfig.error = error;
    selectConfig.helperText = helperText;
  } else if (meta && meta.touched && meta.error) {
    selectConfig.error = true;
    selectConfig.helperText = meta.error;
  }

  return (
    <TextField {...selectConfig}>
      {options.map(({ _id, code, label, labels }) => {
        return (
          <MenuItem key={_id} value={_id}>
            {getOptionLabel({ code, label, labels })}
          </MenuItem>
        );
      })}
    </TextField>
  );
};

export default SelectOption;
