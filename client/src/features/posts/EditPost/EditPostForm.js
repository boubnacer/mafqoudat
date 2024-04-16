import { useState, useEffect } from "react";
import { useUpdatePostMutation, useDeletePostMutation } from "../postsApiSlice";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave, faTrashCan } from "@fortawesome/free-solid-svg-icons";

import * as Yup from "yup";
import { Formik, Form } from "formik";
import { Box, Button, FormLabel } from "@mui/material";
import CheckBox from "../../../components/CheckBox";
import SubmitButton from "../../../components/SubmitButton";
import SelectOption from "../../../components/SelectOption";
import Textfield from "../../../components/Textfield";
import FlexBetween from "../../../components/FlexBetween";
import SelectCountry from "../../../components/SelectCountry";

const EditPostForm = ({ post, user, countries, flOptions, categories }) => {
  const [updatePost, { isLoading, isSuccess, isError, error }] =
    useUpdatePostMutation();

  const [
    deletePost,
    { isSuccess: isDelSuccess, isError: isDelError, error: delerror },
  ] = useDeletePostMutation();

  const navigate = useNavigate();

  const [countryId, setCountryId] = useState(post.country);
  const [region, setRegion] = useState(post.region);
  const [category, setCategory] = useState(post.category);
  const [contact, setContact] = useState(user.username);
  const [returned, setReturned] = useState(post.returned);

  useEffect(() => {
    if (isSuccess || isDelSuccess) {
      setRegion("");
      setCategory("");
      setCountryId("");
      setContact("");
      navigate("/dash");
    }
  }, [isSuccess, isDelSuccess, navigate]);

  const onRegionChanged = (e) => setRegion(e.target.value);
  const onContactChanged = (e) => setContact(e.target.value);
  const onCategoryChanged = (e) => setCategory(e.target.value);
  const onReturnedChanged = (e) => setReturned((prev) => !prev);
  const onCountryIdChanged = (e) => setCountryId(e.target.value);

  const canSave =
    [region, category, countryId, contact].every(Boolean) && !isLoading;

  const onSavePostClicked = async (e) => {
    if (canSave) {
      await updatePost({
        id: post._id,
        user: user._id,
        country: countryId,
        region,
        category,
        returned,
        contact,
      });
    }
  };

  const onDeletePostClicked = async () => {
    await deletePost({ id: post._id });
  };

  const created = new Date(post.createdAt).toLocaleString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  });
  const updated = new Date(post.updatedAt).toLocaleString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  });

  const countryOptions = countries.map((country) => {
    return (
      <option key={country.id} value={country.id}>
        {country.code}
      </option>
    );
  });

  const errClass = isError || isDelError ? "errmsg" : "offscreen";
  const validRegionClass = !region ? "form__input--incomplete" : "";
  const validCategoryClass = !category ? "form__input--incomplete" : "";

  const errContent = (error?.data?.message || delerror?.data?.message) ?? "";

  let deleteButton = (
    <button
      className="icon-button"
      region="Delete"
      onClick={onDeletePostClicked}
    >
      <FontAwesomeIcon icon={faTrashCan} />
    </button>
  );

  const initialFormState = {
    country: user.country,
    contact: user.username,
    category: categories[0].id,
    foundLost: flOptions[0].id,
    region: post.region,
    returned: false,
  };

  const formValidation = Yup.object().shape({
    country: Yup.string().required("country Required"),
    contact: Yup.string().required("contact Required"),
    category: Yup.string().required("category Required"),
    foundLost: Yup.string().required("foundLost Required"),
    region: Yup.string().required("region Required"),
    returned: Yup.boolean().required("Required"),
  });

  const handleSubmit = async (e) => {
    // console.log({ ...e, user: user.id, id: post._id });
    await updatePost({ ...e, user: user.id, id: post._id });
  };

  const updatePostForm = (
    <Formik
      initialValues={{ ...initialFormState }}
      validationSchema={formValidation}
      onSubmit={handleSubmit}
    >
      <Form>
        <Box
          margin="0 auto"
          width="40%"
          display="grid"
          gridTemplateColumns="repeat(1,1fr)"
          gap="0.5rem"
        >
          {/* <Grid item sx={12}>
            <Typography>mafkoudat login</Typography>
          </Grid> */}

          <FormLabel>Country</FormLabel>
          {/* <SelectOption
            name="country"
            // label="Country"
            options={countries}
          /> */}
          <SelectCountry
            name="country"
            // countryname={post?.countryname}
            // label="Country"
            options={countries}
          />

          <FormLabel>Found or Lost</FormLabel>
          <SelectOption
            name="foundLost"
            // label="Foundorlost"
            options={flOptions}
          />

          <FormLabel>Category</FormLabel>
          <SelectOption
            name="category"
            // label="Category"
            options={categories}
          />

          <FormLabel>Region</FormLabel>
          <Textfield name="region" />

          <FormLabel>Contact</FormLabel>
          <Textfield name="contact" />

          {/* <FormLabel>Password</FormLabel>
          <Textfield name="password" label="Password" /> */}

          <CheckBox name="returned" legend="Item returned ?" label="Returned" />

          <FlexBetween>
            <SubmitButton>Submit</SubmitButton>
            <Button onClick={onDeletePostClicked}>Delete</Button>
          </FlexBetween>
        </Box>
      </Form>
    </Formik>
  );

  const content = (
    <Box mt="4rem">
      <p className={errClass}>{errContent}</p>

      {updatePostForm}

      {/* <form className="form" onSubmit={(e) => e.preventDefault()}>
        <div className="form__region-row">
          <h2>Edit Post #{post.ticket}</h2>
          <div className="form__action-buttons">
            <button
              className="icon-button"
              region="Save"
              onClick={onSavePostClicked}
              disabled={!canSave}
            >
              <FontAwesomeIcon icon={faSave} />
            </button>
            {deleteButton}
          </div>
        </div>
        <label className="form__label" htmlFor="post-region">
          Region:
        </label>
        <input
          className={`form__input ${validRegionClass}`}
          id="post-region"
          name="region"
          type="category"
          autoComplete="off"
          value={region}
          onChange={onRegionChanged}
        />

        <label className="form__label" htmlFor="post-region">
          Contact:
        </label>
        <input
          className={`form__input ${validRegionClass}`}
          id="post-contact"
          name="contact"
          type="category"
          autoComplete="off"
          value={contact}
          onChange={onContactChanged}
        />

        <label className="form__label" htmlFor="post-category">
          Category:
        </label>
        <categoryarea
          className={`form__input form__input--category ${validCategoryClass}`}
          id="post-category"
          name="category"
          value={category}
          onChange={onCategoryChanged}
        />
        <div className="form__row">
          <div className="form__divider">
            <label
              className="form__label form__checkbox-container"
              htmlFor="post-returned"
            >
              AMANA WSLAT ?
              <input
                className="form__checkbox"
                id="post-returned"
                name="returned"
                type="checkbox"
                checked={returned}
                onChange={onReturnedChanged}
              />
            </label>

            <label className="form__label" htmlFor="country">
              COUNTRY:
            </label>
            <select
              id="country"
              name="country"
              className="form__select"
              value={countryId}
              onChange={onCountryIdChanged}
            >
              {countryOptions}
            </select>
          </div>
          <div className="form__divider">
            <p className="form__created">
              Created:
              <br />
              {created}
            </p>
            <p className="form__updated">
              Updated:
              <br />
              {updated}
            </p>
          </div>
        </div>
      </form> */}
    </Box>
  );

  return content;
};

export default EditPostForm;
