// LanguageToggle.js
import React from "react";
import { Box } from "@mui/material";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useLanguage } from "../utils/languageContext";

function LanguageToggle() {
  const { currentLanguage, setLanguage } = useLanguage();

  const handleLanguageChange = (language) => {
    // Language change is now handled by the context
    // This callback is for any additional logic if needed
  };

  const testLanguagePersistence = () => {
    // Test switching to Arabic
    setLanguage('ar');
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <LanguageSwitcher 
        variant="icon" 
        onLanguageChange={handleLanguageChange}
      />
      {/* Debug button - remove in production */}
      <button 
        onClick={testLanguagePersistence}
        style={{ 
          fontSize: '10px', 
          padding: '2px 4px', 
          background: '#f0f0f0', 
          border: '1px solid #ccc',
          cursor: 'pointer'
        }}
      >
        Test
      </button>
    </Box>
  );
}

export default LanguageToggle;
