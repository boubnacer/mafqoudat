import { TextField, alpha } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useField } from "formik";

const Textfield = ({ name, variant, error, helperText, onErrorClear, ...otherProps }) => {
  const [field, mata] = useField(name);
  const theme = useTheme();

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
        "& .MuiOutlinedInput-root": {
          "& fieldset": {
            borderColor: alpha(theme.custom.color.ink, theme.palette.mode === "dark" ? 0.3 : 0.2),
          },
          "&:hover fieldset": {
            borderColor: alpha(theme.custom.color.ink, theme.palette.mode === "dark" ? 0.5 : 0.4),
          },
          "&.Mui-focused fieldset": {
            borderColor: theme.custom.color.brandPrimary,
          },
          "&.Mui-error fieldset": {
            borderColor: theme.palette.error.main,
          },
        },
      }}
    />
  );
};

export default Textfield;
