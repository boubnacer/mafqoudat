import {
  Box,
  Button,
  FormLabel,
  Modal,
  Typography,
  useTheme,
} from "@mui/material";
import React from "react";
import { useDispatch } from "react-redux";
import { setOpenModal } from "../app/state";
import CountryAutoselect from "./CountryAutoselect";

const CountryModal = ({
  openModal,
  setCountryId,
  // countryId={countryId}
  countries,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  return (
    <Modal
      sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
      open={openModal}
      onClose={() => dispatch(setOpenModal())}
    >
      <Box p="2rem" backgroundColor={theme.palette.background}>
        <FormLabel>Choose country</FormLabel>
        <CountryAutoselect
          setCountryId={setCountryId}
          // countryId={countryId}
          countries={countries}
          sx={{}}
        />
        {/* <Button onClick={() => dispatch(setOpenModal())}>Close</Button> */}
      </Box>
    </Modal>
  );
};

export default CountryModal;
