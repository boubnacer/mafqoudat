// LanguageToggle.js
import React from "react";
import { Box } from "@mui/material";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { getCurrentLanguage } from "../utils/languageUtils";

function LanguageToggle() {
  const currentLanguage = getCurrentLanguage();

  const handleLanguageChange = (language) => {
    // Set RTL for Arabic
    document.body.setAttribute("dir", language === "ar" ? "rtl" : "ltr");
    
    // You can add any additional language change logic here
    console.log(`Language changed to: ${language}`);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <LanguageSwitcher 
        variant="icon" 
        onLanguageChange={handleLanguageChange}
      />
    </Box>
  );
}

export default LanguageToggle;
