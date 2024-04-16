// LanguageToggle.js
import React, { useEffect } from "react";
import i18n from "./i18n";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";

function LanguageToggle() {
  const changeLanguage = (e) => {
    const newLang = e.target.value;
    i18n.changeLanguage(newLang);
    localStorage.setItem("language", newLang);
  };

  const language = localStorage.getItem("language");

  useEffect(() => {
    document.body.setAttribute("dir", language === "ar" ? "rtl" : "ltr");
    i18n.changeLanguage(language);
  }, [language]);

  return (
    <>
      <FormControl>
        {/* <InputLabel id="lang">Lang</InputLabel> */}
        <Select
          labelId="lang"
          value={language == null ? "" : language}
          label="lang"
          onChange={changeLanguage}
          sx={{
            width: 100,
            "& > .css-9425fu-MuiOutlinedInput-notchedOutline": {
              display: "none",
            },
            "& > .css-dpt9um-MuiSelect-select-MuiInputBase-input-MuiOutlinedInput-input.css-dpt9um-MuiSelect-select-MuiInputBase-input-MuiOutlinedInput-input.css-dpt9um-MuiSelect-select-MuiInputBase-input-MuiOutlinedInput-input":
              { fontSize: "14px" },
          }}
        >
          <MenuItem value="en">English</MenuItem>
          <MenuItem value="ar">العربية</MenuItem>
          {/* <MenuItem value={30}>Thirty</MenuItem> */}
        </Select>
      </FormControl>
    </>
  );
}

export default LanguageToggle;
