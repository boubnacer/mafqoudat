import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
} from "@mui/material";
import { useField, useFormikContext } from "formik";
import React from "react";
import usePersist from "../hooks/usePersist";
import { useDispatch } from "react-redux";

const CheckBox = ({ name, legend, label, otherProps }) => {
  const { setFieldValue } = useFormikContext();
  const [field, meta] = useField(name);

  const [, setPersist] = usePersist();
  const dispatch = useDispatch();

  const handleChange = (event) => {
    const { checked } = event.target;
    dispatch(setPersist(checked));
    setFieldValue(name, checked);
  };

  const checkboxConfig = {
    ...field,
    onChange: handleChange,
  };

  const formControlConfig = {};

  if (meta && meta.touched && meta.error) {
    checkboxConfig.error = true;
  }

  return (
    <FormControl {...formControlConfig}>
      <FormLabel component="legend">{legend}</FormLabel>
      <FormGroup>
        <FormControlLabel
          control={<Checkbox {...checkboxConfig} />}
          label={label}
        />
      </FormGroup>
    </FormControl>
  );
};

export default CheckBox;
