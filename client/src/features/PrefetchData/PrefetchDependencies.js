import React, { useEffect, useState } from "react";
import { store } from "../../app/store";
import { dependencieaApiSlice } from "../dependencies/dependenciesApiSlice";
import { apiSlice } from "../../app/api/apiSlice";
import { useLanguage } from "../../utils/languageContext";

const PrefetchDependencies = ({ children }) => {
  const { currentLanguage } = useLanguage();
  const [isRefetching, setIsRefetching] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const prefetchDependencies = async () => {
      try {
        console.log('PrefetchDependencies: Starting dependency prefetch...');
        setIsRefetching(true);
        
        // Always invalidate cache on mount to ensure fresh data
        console.log('PrefetchDependencies: Invalidating cache...');
        store.dispatch(
          dependencieaApiSlice.util.invalidateTags([
            { type: "Category", id: "LIST" },
            { type: "Country", id: "LIST" },
            { type: "Dependencies", id: "LIST" }
          ])
        );

        // Also invalidate dashboard and posts cache
        store.dispatch(
          apiSlice.util.invalidateTags([
            { type: "Dashboard", id: "LIST" },
            { type: "Post", id: "LIST" }
          ])
        );

        // Prefetch with new language - using the correct format
        console.log('PrefetchDependencies: Prefetching dependencies with language:', currentLanguage || 'en');
        const prefetchPromises = [
          store.dispatch(
            dependencieaApiSlice.util.prefetch("getflOptions", {
              language: currentLanguage || 'en',
              active: true
            }, { force: true })
          ),
          store.dispatch(
            dependencieaApiSlice.util.prefetch("getCategories", {
              language: currentLanguage || 'en',
              active: true
            }, { force: true })
          ),
          store.dispatch(
            dependencieaApiSlice.util.prefetch("getCountries", {
              language: currentLanguage || 'en',
              active: true
            }, { force: true })
          )
        ];

        // Wait for all prefetch operations to complete
        console.log('PrefetchDependencies: Waiting for prefetch operations...');
        await Promise.all(prefetchPromises);
        
        console.log('PrefetchDependencies: Dependencies loaded successfully');
        setIsInitialized(true);
        // Small delay to ensure UI updates
        setTimeout(() => setIsRefetching(false), 300);
      } catch (error) {
        console.error('PrefetchDependencies: Error prefetching dependencies:', error);
        setIsInitialized(true);
        setIsRefetching(false);
      }
    };

    prefetchDependencies();
  }, []); // Remove currentLanguage dependency - run on every mount

  // Also run when language changes
  useEffect(() => {
    if (isInitialized) {
      const updateLanguage = async () => {
        try {
          setIsRefetching(true);
          
          // Invalidate and refetch with new language
          store.dispatch(
            dependencieaApiSlice.util.invalidateTags([
              { type: "Category", id: "LIST" },
              { type: "Country", id: "LIST" },
              { type: "Dependencies", id: "LIST" }
            ])
          );

          const prefetchPromises = [
            store.dispatch(
              dependencieaApiSlice.util.prefetch("getflOptions", {
                language: currentLanguage || 'en',
                active: true
              }, { force: true })
            ),
            store.dispatch(
              dependencieaApiSlice.util.prefetch("getCategories", {
                language: currentLanguage || 'en',
                active: true
              }, { force: true })
            ),
            store.dispatch(
              dependencieaApiSlice.util.prefetch("getCountries", {
                language: currentLanguage || 'en',
                active: true
              }, { force: true })
            )
          ];

          await Promise.all(prefetchPromises);
          setTimeout(() => setIsRefetching(false), 300);
        } catch (error) {
          console.error('Error updating language dependencies:', error);
          setIsRefetching(false);
        }
      };

      updateLanguage();
    }
  }, [currentLanguage, isInitialized]);

  // Show loading state while refetching
  if (isRefetching || !isInitialized) {
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

  return children;
};

export default PrefetchDependencies;
