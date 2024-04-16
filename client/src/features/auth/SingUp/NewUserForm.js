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
import { Box, FormLabel, Typography } from "@mui/material";
import TextField from "../../../components/Textfield";
import SubmitButton from "../../../components/SubmitButton";
import SelectOption from "../../../components/SelectOption";
import CheckBox from "../../../components/CheckBox";
import SelectCountry from "../../../components/SelectCountry";

const USER_REGEX = /^[A-z]{3,20}$/;
const PWD_REGEX = /^[A-z0-9!@#$%]{4,12}$/;

const NewUserForm = ({ countries }) => {
  useTitle("Mafkoudat | New User");

  const [addNewUser, { isLoading, isSuccess, isError, error }] =
    useAddNewUserMutation();

  const navigate = useNavigate();
  const dispatch = useDispatch();

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
          width="80%"
          display="grid"
          gridTemplateColumns="repeat(1,1fr)"
          gap="0.5rem"
        >
          {/* <Grid item sx={12}>
            <Typography>mafkoudat login</Typography>
          </Grid> */}

          <FormLabel>Username or Phone</FormLabel>
          <TextField name="username" label="User Name" />

          <FormLabel>Password</FormLabel>
          <TextField name="password" label="Password" />

          <FormLabel>Country</FormLabel>
          {/* <SelectOption name="country" label="Country" options={countries} /> */}
          <SelectCountry name="country" label="Country" options={countries} />

          {/* <CheckBox
            name="termsOfService"
            legend="Terms Of Service"
            label="I agree"
          /> */}

          <SubmitButton>Submit</SubmitButton>
        </Box>
      </Form>
    </Formik>
  );

  const content = (
    <Box>
      <p className={errClass}>{error?.data?.message}</p>
      {SignupForm}
      {/* <form className="form" onSubmit={onSaveUserClicked}>
        <div className="form__title-row">
          <h2>New User</h2>
          <div className="form__action-buttons">
            <button className="icon-button" title="Save" disabled={!canSave}>
              <FontAwesomeIcon icon={faSave} />
            </button>
          </div>
        </div>
        <label className="form__label" htmlFor="username">
          Username: <span className="nowrap">[3-20 letters]</span>
        </label>
        <input
          className={`form__input ${validUserClass}`}
          id="username"
          name="username"
          type="text"
          autoComplete="off"
          value={username}
          onChange={onUsernameChanged}
        />

        <label className="form__label" htmlFor="password">
          Password: <span className="nowrap">[4-12 chars incl. !@#$%]</span>
        </label>
        <input
          className={`form__input ${validPwdClass}`}
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={onPasswordChanged}
        />

        <label className="form__label" htmlFor="country">
          Country:
        </label>
        <select
          id="countries"
          name="countries"
          className="form__select"
          value={countryId}
          onChange={onCountryIdChanged}
        >
          {countryOptions}
        </select>

        <Link to="/login">Employee Login</Link>
      </form> */}
    </Box>
  );

  return content;
};
export default NewUserForm;
