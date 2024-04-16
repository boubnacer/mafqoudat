import { Button, useTheme } from "@mui/material";
import { useFormikContext } from "formik";

const SubmitButton = ({ children, ...otherProps }) => {
  const { submitForm } = useFormikContext();
  const theme = useTheme();

  const handleSubmit = () => {
    submitForm();
  };

  const buttonConfig = {
    variant: "outlined",
    fullWidth: true,
    onClick: handleSubmit,
  };
  return (
    <Button
      // type="submit"
      sx={{
        backgroundColor: theme.palette.primary.main,
        color: "#fff",
        width: "40%",
        marginTop: "1.5rem",
        marginBottom: "1.5rem",
      }}
      {...buttonConfig}
    >
      {children}
    </Button>
  );
};

export default SubmitButton;
