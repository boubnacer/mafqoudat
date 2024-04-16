import { TextField } from "@mui/material";
import { useField } from "formik";

const Textfield = ({ name, variant, ...otherProps }) => {
  const [field, mata] = useField(name);

  const textFieldConfig = {
    ...field,
    ...otherProps,
    fullWidth: true,
    variant,
  };

  if (mata && mata.touched && mata.error) {
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
