import { TextField } from "@mui/material";
import { useField } from "formik";

const Textfield = ({ name, variant, error, helperText, onErrorClear, ...otherProps }) => {
  const [field, mata] = useField(name);

  const handleChange = (event) => {
    const { value } = event.target;
    field.onChange(event);
    
    // Clear error if field has value and onErrorClear callback is provided
    if (value && onErrorClear) {
      onErrorClear(name);
    }
  };

  const textFieldConfig = {
    ...field,
    ...otherProps,
    fullWidth: true,
    variant,
    onChange: handleChange,
  };

  // Use external error props if provided, otherwise use Formik validation
  if (error !== undefined && helperText !== undefined) {
    textFieldConfig.error = error;
    textFieldConfig.helperText = helperText;
  } else if (mata && mata.touched && mata.error) {
    textFieldConfig.error = true;
    textFieldConfig.helperText = mata.error;
  }

  return (
    <TextField
      {...textFieldConfig}
      sx={{
        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: "#3F3D56",
        },
      }}
    />
  );
};

export default Textfield;
