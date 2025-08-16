import React from "react";

const PrefetchDependencies = ({ children }) => {
  // For now, just render children directly to avoid the infinite loop
  // The dependencies will be loaded when needed by the components that use them
  return children;
};

export default PrefetchDependencies;
