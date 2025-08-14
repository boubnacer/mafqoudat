import React, { useEffect, useState } from "react";
import { store } from "../../app/store";
import { dependencieaApiSlice } from "../dependencies/dependenciesApiSlice";
import { apiSlice } from "../../app/api/apiSlice";
import { useLanguage } from "../../utils/languageContext";

const PrefetchDependencies = ({ children }) => {
  console.log('PrefetchDependencies: Component function called');
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get language context with fallback
  let currentLanguage = 'en';
  try {
    const languageContext = useLanguage();
    currentLanguage = languageContext?.currentLanguage || 'en';
  } catch (err) {
    console.error('PrefetchDependencies: Error getting language context:', err);
    // Don't set error, just use default language
  }

  console.log('PrefetchDependencies: Language context loaded:', currentLanguage);

  useEffect(() => {
    console.log('PrefetchDependencies: useEffect triggered');
    
    const loadDependencies = async () => {
      try {
        console.log('PrefetchDependencies: Starting to load dependencies...');
        
        // Simple approach: just dispatch the prefetch actions
        const promises = [
          store.dispatch(
            dependencieaApiSlice.util.prefetch("getflOptions", {
              language: currentLanguage,
              active: true
            })
          ),
          store.dispatch(
            dependencieaApiSlice.util.prefetch("getCategories", {
              language: currentLanguage,
              active: true
            })
          ),
          store.dispatch(
            dependencieaApiSlice.util.prefetch("getCountries", {
              language: currentLanguage,
              active: true
            })
          )
        ];

        console.log('PrefetchDependencies: Waiting for dependencies to load...');
        await Promise.all(promises);
        
        console.log('PrefetchDependencies: Dependencies loaded successfully');
        setIsLoading(false);
      } catch (err) {
        console.error('PrefetchDependencies: Error loading dependencies:', err);
        setError(err);
        setIsLoading(false);
      }
    };

    // Add a small delay to ensure everything is initialized
    setTimeout(loadDependencies, 100);
  }, [currentLanguage]);

  console.log('PrefetchDependencies: Render state:', { isLoading, error: error?.message });

  if (isLoading) {
    console.log('PrefetchDependencies: Showing loading state');
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '200px',
        padding: '2rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <div>Loading dependencies...</div>
          {error && (
            <div style={{ color: 'red', marginTop: '1rem', fontSize: '0.9rem' }}>
              Error: {error.message}
            </div>
          )}
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  console.log('PrefetchDependencies: Rendering children');
  return children;
};

export default PrefetchDependencies;
