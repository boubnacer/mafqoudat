import { useState, useEffect } from "react";
import { useAddNewUserMutation } from "../../userSettings/usersApiSlice";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave } from "@fortawesome/free-solid-svg-icons";
import useTitle from "../../../hooks/useTitle";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCredentials } from "../authSlice";

import { Formik, Form } from "formik";
import * as Yup from "yup";
import { Box, FormLabel, IconButton, Typography, useTheme } from "@mui/material";
import TextField from "../../../components/Textfield";
import SubmitButton from "../../../components/SubmitButton";
import SelectOption from "../../../components/SelectOption";
import CheckBox from "../../../components/CheckBox";
import SelectCountry from "../../../components/SelectCountry";
import Lottie from "lottie-react";
import LoginAnimation from '../../../animations/LoginAnimation.json'
import LanguageToggle from "../../../lang/LanguageToggle";
import { setMode } from "../../../app/state";
import { DarkModeOutlined, LightModeOutlined } from "@mui/icons-material";

const USER_REGEX = /^[A-z]{3,20}$/;
const PWD_REGEX = /^[A-z0-9!@#$%]{4,12}$/;



const NewUserForm = ({ countries }) => {
  useTitle("Mafkoudat | New User");

  const [addNewUser, { isLoading, isSuccess, isError, error }] =
    useAddNewUserMutation();

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const theme = useTheme()

  const [countryId, setCountryId] = useState(countries[0].id);
  const [username, setUsername] = useState("");
  const [validUsername, setValidUsername] = useState(false);
  const [password, setPassword] = useState("");
  const [validPassword, setValidPassword] = useState(false);

  useEffect(() => {
    setValidUsername(USER_REGEX.test(username));
  }, [username]);

  useEffect(() => {
    setValidPassword(PWD_REGEX.test(password));
  }, [password]);

  const onUsernameChanged = (e) => setUsername(e.target.value);
  const onPasswordChanged = (e) => setPassword(e.target.value);
  const onCountryIdChanged = (e) => setCountryId(e.target.value);

  const initialFormState = {
    username: "",
    password: "",
    country: countries[0].id,
    // termsOfService: false,
  };

  const formValidation = Yup.object().shape({
    username: Yup.string().required("Required"),
    password: Yup.string().required("Required"),
    country: Yup.string().required("Required"),
    // termsOfService: Yup.boolean()
    //   .oneOf([true], "Terms must be accepted")
    //   .required("Required"),
  });

  // const canSave =
  //   [validUsername, validPassword, countryId].every(Boolean) && !isLoading;

  const handleSubmit = async (e) => {
    console.log(e);
    // e.preventDefault();
    // if (canSave) {
    const { accessToken } = await addNewUser(e);
    dispatch(setCredentials({ accessToken }));
    console.log(accessToken);
    // setUsername("");
    // setPassword("");
    // setCountryId("");
    navigate("/dash");
    // }
  };

  const countryOptions = countries.map((country) => {
    return (
      <option key={country.id} value={country.id}>
        {country.code}
      </option>
    );
  });

  const errClass = isError ? "errmsg" : "offscreen";
  const validUserClass = !validUsername ? "form__input--incomplete" : "";
  const validPwdClass = !validPassword ? "form__input--incomplete" : "";

  const SignupForm = (
    <Formik
      initialValues={{ ...initialFormState }}
      validationSchema={formValidation}
      onSubmit={handleSubmit}
    > 
      <Form>
        <Box
          margin="0 auto"
          width="60%"
          display="grid"
          gridTemplateColumns="repeat(1,1fr)"
          gap="0.5rem"
        >
          {/* <Grid item sx={12}>
            <Typography>mafkoudat login</Typography>
          </Grid> */}

<Typography
          variant="brandName"
          // marginBottom="3rem"
          sx={{color:theme.palette.textColor.main}}
          // fontSize="26"
        >
          mafqoudat
        </Typography>

          {/* <FormLabel>Username or Phone</FormLabel> */}
          <TextField name="username" label="User Name" variant="standard"/>

          <TextField name="password" label="Password" variant="standard"/>

          {/* <SelectOption name="country" label="Country" options={countries} /> */}
          <Box sx={{mt:'1rem'}}>
          <FormLabel>choose Country</FormLabel>
          <SelectCountry name="country" label="Country" variant="standard" options={countries}/>
          </Box>

          {/* <CheckBox
            name="termsOfService"
            legend="Terms Of Service"
            label="I agree"
          /> */}

          <SubmitButton>signup</SubmitButton>

          <Box display="flex" alignItems="center" gap="2rem">
        <Typography mt="1rem" mb="1rem">
          Already member ?
        </Typography>
        <Box backgroundColor="#fe9229" px="10px" borderRadius="5px">
        <Link className="btn" to="/">
          Sign in
        </Link>
        </Box>
        </Box>
        </Box>
      </Form>
    </Formik>
  );

  const content = (
    <Box display="grid"
    gridTemplateColumns="repeat(2,1fr)"
    alignItems="center"
    sx={{ backgroundColor: theme.palette.background }}>

      

     <Box>
     <Box>
      <p className={errClass}>{error?.data?.message}</p>
      {SignupForm}
      </Box>

      
     </Box>

      <Box>
        <Box>
          <Lottie animationData={LoginAnimation}/>
        </Box>

        <Box sx={{ position: "absolute", top: "2rem", right: "3rem", display:'flex', alignItems:'center' }}>
          {/* switch mode and language */}
          <LanguageToggle />
          <IconButton onClick={() => dispatch(setMode())}>
            {theme.palette.mode === "dark" ? (
              <LightModeOutlined sx={{ fontSize: "25px" }} />
            ) : (
              <DarkModeOutlined sx={{ fontSize: "25px" }} />
            )}
          </IconButton>
        </Box>

        
      </Box>

    </Box>
  );

  return content;
};
export default NewUserForm;
