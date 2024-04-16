import { useRef, useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCredentials } from "../authSlice";
import { useLoginMutation } from "../authApiSlice";
import useTitle from "../../../hooks/useTitle";
import PulseLoader from "react-spinners/PulseLoader";
import FlexBetween from "../../../components/FlexBetween";
import LoginPic from "../../../img/LoginPic.svg";

import { Formik, Form } from "formik";
import * as Yup from "yup";

import usePersist from "../../../hooks/usePersist";

import "./login.css";
import { Box, Grid, IconButton, Typography, useTheme } from "@mui/material";
import TextField from "../../../components/Textfield";
import SubmitButton from "../../../components/SubmitButton";
import CheckBox from "../../../components/CheckBox";

import Searching from "../../../animations/Searching.json";
import LoginAnimation from "../../../animations/LoginAnimation.json";
import Lottie from "lottie-react";
import { setMode } from "../../../app/state";
import { DarkModeOutlined, LightModeOutlined } from "@mui/icons-material";
import LanguageToggle from "../../../lang/LanguageToggle";

const Login = () => {
  useTitle("Employee Login");

  const userRef = useRef();
  const errRef = useRef();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [persist, setPersist] = usePersist();

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();

  const [login, { isLoading, isSuccess }] = useLoginMutation();

  // useEffect(() => {
  //   userRef.current.focus();
  // }, []);

  useEffect(() => {
    setErrMsg("");
  }, [username, password]);

  // const handleUserInput = (e) => setUsername(e.target.value);
  // const handlePwdInput = (e) => setPassword(e.target.value);
  // const handleToggle = (e) => setPersist((prev) => !prev);

  const initialFormState = {
    username: "",
    password: "",
    // termsOfServices: false,
  };

  const formValidation = Yup.object().shape({
    username: Yup.string().required("username error message"),
    password: Yup.string().required("password error message"),
    // termsOfServices: Yup.boolean()
    //   .oneOf([true], "Terms must be accepted")
    //   .required("Required"),
  });

  const handleSubmit = async (e) => {
    // e.preventDefault();
    try {
      // i guess we can do this in the login fonction !!
      const { accessToken } = await login(e).unwrap();
      dispatch(setCredentials({ accessToken }));
      // dispatch(setPersist(true));
      navigate("/dash");
    } catch (err) {
      if (!err.status) {
        setErrMsg("No Server Response");
      } else if (err.status === 400) {
        setErrMsg("Missing Username or Password");
      } else if (err.status === 401) {
        setErrMsg("Unauthorized");
      } else {
        setErrMsg(err.data?.message);
      }
      errRef.current.focus();
    }
  };

  const LoginForm = (
    <Formik
      initialValues={{ ...initialFormState }}
      validationSchema={formValidation}
      onSubmit={handleSubmit}
    >
      <Form>
        <Box display="grid" gridTemplateColumns="repeat(1,1fr)" gap="0.5rem">
          {/* <Grid item sx={12}>
            <Typography>mafkoudat login</Typography>
          </Grid> */}

          <TextField variant="standard" name="username" label="User Name" />

          <TextField variant="standard" name="password" label="Password" />
          {/* 
          <CheckBox
            name="termsOfServices"
            legend="Terms Of Service"
            label="I agree"
          /> */}
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
          }}
        >
          <SubmitButton>Submit</SubmitButton>
        </Box>
      </Form>
    </Formik>
  );

  const errClass = errMsg ? "errmsg" : "offscreen";

  if (isLoading) return <PulseLoader color={"#FFF"} />;

  const content = (
    <Box
      // marginTop="5rem"
      height="100%"
      display="grid"
      gridTemplateColumns="repeat(2,1fr)"
      alignItems="center"
      gap="2rem"
      sx={{ backgroundColor: theme.palette.background }}
    >
      <Box>
        {/* <img src={LoginPic} /> */}
        {/* <Lottie animationData={Searching} /> */}
        <Lottie animationData={LoginAnimation} />
      </Box>

      <Box
        width="60%"
        sx={{
          backgroundColor: theme.palette.primary.main,
          padding: "4rem",
          boxShadow: 1,
          borderRadius: "5px",
        }}
      >
        <Box sx={{ position: "absolute", top: "2rem", right: "3rem" }}>
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

        <Typography
          variant="h1"
          marginBottom="3rem"
          textAlign="center"
          color="#666666"
        >
          mafkoudat
        </Typography>
        <Box>
          <p ref={errRef} className={errClass} aria-live="assertive">
            {errMsg}
          </p>

          {LoginForm}

          {/* <form className="form" onSubmit={handleSubmit}>
            <label htmlFor="username">Username:</label>
            <input
              className="form__input"
              type="text"
              id="username"
              ref={userRef}
              value={username}
              onChange={handleUserInput}
              autoComplete="off"
              required
            />

            <label htmlFor="password">Password:</label>
            <input
              className="form__input"
              type="password"
              id="password"
              onChange={handlePwdInput}
              value={password}
              required
            />
            <button className="form__submit-button">Sign In</button>

            <label htmlFor="persist" className="form__persist">
              <input
                type="checkbox"
                className="form__checkbox"
                id="persist"
                onChange={handleToggle}
                checked={persist}
              />
              Trust This Device
            </label>
          </form> */}
        </Box>
        <Typography mt="1rem" mb="1rem">
          if you are new make sure to add an account first
        </Typography>
        <Link className="btn" to="/signup">
          Employee Signup
        </Link>
      </Box>
    </Box>
  );

  return content;
};
export default Login;
