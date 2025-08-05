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
    console.log(`Language changed to: ${language}`);
  };

  const testLanguagePersistence = () => {
    console.log('=== Testing Language Persistence ===');
    console.log('Current language:', currentLanguage);
    console.log('localStorage app_language:', localStorage.getItem('app_language'));
    console.log('document.documentElement.lang:', document.documentElement.getAttribute('lang'));
    console.log('document.body.dir:', document.body.getAttribute('dir'));
    
    // Test switching to Arabic
    console.log('Switching to Arabic...');
    setLanguage('ar');
    
    setTimeout(() => {
      console.log('After switching to Arabic:');
      console.log('Current language:', currentLanguage);
      console.log('localStorage app_language:', localStorage.getItem('app_language'));
      console.log('document.documentElement.lang:', document.documentElement.getAttribute('lang'));
      console.log('document.body.dir:', document.body.getAttribute('dir'));
    }, 100);
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
