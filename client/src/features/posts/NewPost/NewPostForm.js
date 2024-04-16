import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAddNewPostMutation } from "../postsApiSlice";
import { FOUNDLOST } from "../../../config/foundsOptions";

import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import Textfield from "../../../components/Textfield";
import SubmitButton from "../../../components/SubmitButton";
import SelectOption from "../../../components/SelectOption";
import { Box, FormLabel } from "@mui/material";
import SelectCountry from "../../../components/SelectCountry";

const NewPostForm = ({ user, countries, categories, flOptions }) => {
  const [addNewPost, { isLoading, isSuccess, isError, error }] =
    useAddNewPostMutation();

  const navigate = useNavigate();

  const [countryId, setCountryId] = useState(countries[0].id);
  const [category, setCategory] = useState("");
  const [contact, setContact] = useState(user.username);
  const [region, setRegion] = useState("");
  const [foundLost, setFoundLost] = useState("");

  useEffect(() => {
    if (isSuccess) {
      setCategory("");
      setContact("");
      setCountryId("");
      setRegion("");
      setFoundLost("");
      navigate("/dash");
    }
  }, [isSuccess, navigate]);

  const initialFormState = {
    country: user.country,
    contact: user.username,
    category: "",
    category: categories[0].id,
    foundLost: "",
    foundLost: flOptions[0].id,
    region: "",
    image: null,
  };

  const formValidation = Yup.object().shape({
    country: Yup.string().required("Required"),
    contact: Yup.string().required("Required"),
    category: Yup.string().required("Required"),
    region: Yup.string().required("Required"),
    foundLost: Yup.string().required("Required"),
    image: Yup.mixed().required("Please upload an image"),
    // .test("fileSize", "The file is too large", (value) => {
    //   return value && value[0].size <= 2000000; // 2MB
    // })
    // .test(
    //   "type",
    //   "Only the following formats are accepted: .jpeg, .jpg, .png, .gif",
    //   (value) => {
    //     return (
    //       value &&
    //       (value[0].type === "image/jpeg" ||
    //         value[0].type === "image/jpg" ||
    //         value[0].type === "image/png" ||
    //         value[0].type === "image/gif")
    //     );
    //   }
    // ),
  });

  // const handleSubmit = async (values) => {
  //   console.log(values);
  //   await addNewPost({ ...values, image: values.image, user: user.id });
  // };

  const handleSubmit = async (values) => {
    const { image, ...otherValues } = values;

    // Check if image file exceeds 2MB
    if (image && image.size > 2097152) {
      throw new Error("Error: Image size should not exceed 2MB");
    }

    const formData = new FormData();

    // Append all fields except for the image
    Object.entries(otherValues).forEach(([key, value]) => {
      formData.append(key, value);
    });

    // Append th user
    formData.append("user", user.id);

    // Append the image file
    formData.append("image", image);

    // Call the addNewPost function with the FormData object
    await addNewPost(formData);

    //   fetch("http://localhost:3500/posts", {
    //     method: "POST",
    //     body: formData,
    //     headers: {
    //       Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJVc2VySW5mbyI6eyJ1c2VybmFtZSI6Im5hY2VyIiwidXNlcm5hbWVJZCI6IjYzNzEyNjgxMWRhZDA2OTkyZGI0ZjgyYSIsImNvdW50cnkiOiI2MzcxMjY2ZjFkYWQwNjk5MmRiNGY4MjYifSwiaWF0IjoxNzAwMDQ0ODc2LCJleHAiOjE3MDAwNDU3NzZ9.uT_YmNDAZmi1XK9VAHR56pQZO46jGYbpwOAc7sabQtY`,
    //       // Add any other headers as needed
    //     },
    //   })
    //     .then((response) => response.json())
    //     .then((data) => console.log(data))
    //     .catch((error) => console.error(error));
    // } catch (error) {
    //   // Handle form submission error
    //   console.error(error);
    // }
  };

  const SignupForm = (
    <Formik
      initialValues={{ ...initialFormState }}
      validationSchema={formValidation}
      onSubmit={handleSubmit}
    >
      <Form encType="multipart/form-data">
        <Box
          margin="0 auto"
          width="40%"
          display="grid"
          gridTemplateColumns="repeat(1,1fr)"
          gap="0.5rem"
        >
          <FormLabel>Country</FormLabel>

          <SelectCountry
            name="country"
            // countryname={user.code}
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

          <FormLabel>Add Item image</FormLabel>
          <Field
            name="image"
            type="file"
            label="Select Image"
            component={({ field, form }) => (
              <input
                type="file"
                formEncType="multipart"
                onChange={(event) => {
                  const file = event.currentTarget.files[0];
                  console.log(file);
                  form.setFieldValue("image", file);
                }}
              />
            )}
          />

          <SubmitButton>Submit</SubmitButton>
        </Box>
      </Form>
    </Formik>
  );

  const errClass = isError ? "errmsg" : "offscreen";

  const content = (
    <Box mt="6rem">
      <p className={errClass}>{error?.data?.message}</p>

      {SignupForm}
    </Box>
  );

  return content;
};

export default NewPostForm;
