import { useState, useEffect } from "react";
import { useUpdateUserMutation, useDeleteUserMutation } from "../usersApiSlice";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave, faTrashCan, faPlus } from "@fortawesome/free-solid-svg-icons";
import { ROLES } from "../../../config/roles";
import { useCreateCountryMutation } from "../../dependencies/dependenciesApiSlice";
import { Box, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Typography } from "@mui/material";

const USER_REGEX = /^[A-z]{3,20}$/;
const PWD_REGEX = /^[A-z0-9!@#$%]{4,12}$/;

const EditUserForm = ({ user, countries }) => {
  const [updateUser, { isLoading, isSuccess, isError, error }] =
    useUpdateUserMutation();

  const [
    deleteUser,
    { isSuccess: isDelSuccess, isError: isDelError, error: delerror },
  ] = useDeleteUserMutation();

  const [createCountry, { isLoading: isCreatingCountry }] = useCreateCountryMutation();

  const navigate = useNavigate();

  const [countryId, setCountryId] = useState(user.country);
  const [username, setUsername] = useState(user.username);
  const [validUsername, setValidUsername] = useState(false);
  const [password, setPassword] = useState("");
  const [validPassword, setValidPassword] = useState(false);
  
  // New country creation state
  const [showNewCountryDialog, setShowNewCountryDialog] = useState(false);
  const [newCountryCode, setNewCountryCode] = useState("");
  const [newCountryLabel, setNewCountryLabel] = useState("");

  useEffect(() => {
    setValidUsername(USER_REGEX.test(username));
  }, [username]);

  useEffect(() => {
    setValidPassword(PWD_REGEX.test(password));
  }, [password]);

  useEffect(() => {
    if (isSuccess || isDelSuccess) {
      setUsername("");
      setPassword("");
      setCountryId("");
      navigate("/dash/users");
    }
  }, [isSuccess, isDelSuccess, navigate]);

  const onUsernameChanged = (e) => setUsername(e.target.value);
  const onPasswordChanged = (e) => setPassword(e.target.value);
  const onCountryIdChanged = (e) => setCountryId(e.target.value);

  const onSaveUserClicked = async (e) => {
    if (password) {
      await updateUser({
        id: user.id,
        username,
        password,
        country: countryId,
      });
    } else {
      await updateUser({
        id: user.id,
        username,
        country: countryId,
      });
    }
  };

  const onDeleteUserClicked = async () => {
    await deleteUser({ id: user.id });
  };

  const handleCreateNewCountry = async () => {
    if (newCountryCode && newCountryLabel) {
      try {
        const result = await createCountry({
          code: newCountryCode,
          label: newCountryLabel,
        }).unwrap();
        
        // Close dialog and reset form
        setShowNewCountryDialog(false);
        setNewCountryCode("");
        setNewCountryLabel("");
        
        // Optionally set the new country as selected
        // Note: The countries list will be automatically updated due to cache invalidation
      } catch (error) {
        console.error("Failed to create country:", error);
      }
    }
  };

  const countryOptions = countries.map((country) => {
    return (
      <option key={country.id} value={country.id}>
        {country.code}
      </option>
    );
  });

  let canSave;
  if (password) {
    canSave =
      [validUsername, validPassword, countryId].every(Boolean) && !isLoading;
  } else {
    canSave = [validUsername, countryId].every(Boolean) && !isLoading;
  }

  const errClass = isError || isDelError ? "errmsg" : "offscreen";
  const validUserClass = !validUsername ? "form__input--incomplete" : "";
  const validPwdClass = !validPassword ? "form__input--incomplete" : "";

  const errContent = (error?.data?.message || delerror?.data?.message) ?? "";

  const content = (
    <>
      <p className={errClass}>{errContent}</p>

      <form className="form" onSubmit={(e) => e.preventDefault()}>
        <div className="form__title-row">
          <h2>Edit User</h2>
          <div className="form__action-buttons">
            <button
              className="icon-button"
              title="Save"
              onClick={onSaveUserClicked}
              disabled={!canSave}
            >
              <FontAwesomeIcon icon={faSave} />
            </button>
            <button
              className="icon-button"
              title="Delete"
              onClick={onDeleteUserClicked}
            >
              <FontAwesomeIcon icon={faTrashCan} />
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
          Password: <span className="nowrap">[empty = no change]</span>{" "}
          <span className="nowrap">[4-12 chars incl. !@#$%]</span>
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
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <select
            id="countries"
            name="countries"
            className="form__select"
            value={countryId}
            onChange={onCountryIdChanged}
            style={{ flex: 1 }}
          >
            {countryOptions}
          </select>
          <button
            type="button"
            className="icon-button"
            title="Add New Country"
            onClick={() => setShowNewCountryDialog(true)}
            style={{ padding: "8px", fontSize: "14px" }}
          >
            <FontAwesomeIcon icon={faPlus} />
          </button>
        </div>
      </form>

      {/* New Country Dialog */}
      <Dialog open={showNewCountryDialog} onClose={() => setShowNewCountryDialog(false)}>
        <DialogTitle>Add New Country</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Country Code (e.g., US, UK)"
              value={newCountryCode}
              onChange={(e) => setNewCountryCode(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Country Label (e.g., United States, United Kingdom)"
              value={newCountryLabel}
              onChange={(e) => setNewCountryLabel(e.target.value)}
              fullWidth
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNewCountryDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateNewCountry}
            disabled={!newCountryCode || !newCountryLabel || isCreatingCountry}
            variant="contained"
          >
            {isCreatingCountry ? "Creating..." : "Create Country"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );

  return content;
};

export default EditUserForm;
