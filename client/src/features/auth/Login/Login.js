import { useRef, useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { selectCurrentToken, selectIsLogedin, setCredentials } from "../authSlice";
import { useLoginMutation } from "../authApiSlice";
import useTitle from "../../../hooks/useTitle";
import { LoadingState } from "../../../components/LoadingStates";
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

  const loggedIN = JSON.parse(localStorage.getItem('isLoggedIn'))


  useEffect(()=>{
    if(loggedIN){
      navigate("/dash");
    }
  },[loggedIN])

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
    username: Yup.string().required("username required"),
    password: Yup.string().required("password required"),
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
      localStorage.setItem('isLoggedIn',true)
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
        <Box margin="0 auto"
          width="60%"
          display="grid"
          gridTemplateColumns="repeat(1,1fr)"
          gap="0.5rem" >
          {/* <Grid item sx={12}>
            <Typography sx={{color: theme.palette.textColor.secondary}}>mafkoudat login</Typography>
          </Grid> */}

          <TextField variant="standard" name="username" label="User Name" />

          <TextField variant="standard" name="password" label="Password" />
          {/* 
          <CheckBox
            name="termsOfServices"
            legend="Terms Of Service"
            label="I agree"
          /> */}

<SubmitButton>Submit</SubmitButton>
        
        <Box display="flex" alignItems="center" gap="2rem">
      <Typography mt="1rem" mb="1rem">
        first time ?
      </Typography>
      <Box backgroundColor="#fe9229" px="10px" borderRadius="5px">
      <Link className="btn" to="/signup">
        Sign up
      </Link>
      </Box>
      </Box>
        </Box>
        
          
      </Form>
    </Formik>
  );

  const errClass = errMsg ? "errmsg" : "offscreen";

  if (isLoading) return <LoadingState message="Signing in..." />;

  const content = (
    <Box
      // height="100%"
      display="grid"
      gridTemplateColumns="repeat(2,1fr)"
      alignItems="center"
      
      sx={{ backgroundColor: theme.palette.background }}
    >

      <Box
      // ml="20%"
        // width="60%"
      //   height="80%"
      //   sx={{
      //     // backgroundColor: theme.palette.primary.main,
      //     padding: "2rem",
      //     boxShadow: 1,
      //     borderRadius: "5px",
        
      //   }}
      >
        

        <Box textAlign="center" mb="5rem">
        <Typography
          variant="brandName"
          marginBottom="3rem"
          sx={{color:theme.palette.textColor.main}}
          // fontSize="26"
        >
          mafqoudat
        </Typography>
        </Box>
        <Box>
          <p ref={errRef} className={errClass} aria-live="assertive">
            {errMsg}
          </p>

          {LoginForm}


        </Box>
        
      </Box>
      <Box position="relative">
        {/* <img src={LoginPic} /> */}
        {/* <Lottie animationData={Searching} /> */}
        <Box>
        <Lottie animationData={LoginAnimation} />
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
export default Login;
