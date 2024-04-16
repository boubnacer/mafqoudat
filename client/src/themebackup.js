// color design tokens export
export const tokensDark = {
  grey: {
    0: "#ffffff", // manually adjusted
    10: "#f6f6f6", // manually adjusted
    50: "#f0f0f0", // manually adjusted
    100: "#e0e0e0",
    200: "#c2c2c2",
    300: "#a3a3a3",
    400: "#858585",
    500: "#666666",
    600: "#525252",
    700: "#3d3d3d",
    800: "#292929",
    900: "#141414",
    1000: "#000000", // manually adjusted
  },
  primary: {
    // blue
    100: "#d3d4de",
    200: "#a6a9be",
    300: "#7a7f9d",
    400: "#4d547d",
    500: "#21295c",
    600: "#191F45", // manually adjusted
    700: "#141937",
    800: "#0d1025",
    900: "#070812",
  },
  secondary: {
    // yellow
    50: "#f0f0f0", // manually adjusted
    100: "#fff6e0",
    200: "#ffedc2",
    300: "#ffe3a3",
    400: "#ffda85",
    500: "#ffd166",
    600: "#cca752",
    700: "#997d3d",
    800: "#665429",
    900: "#332a14",
  },
  categoryTxt: {
    // person, bag..
    100: "#dbf9e7",
    200: "#b7f3cf",
    300: "#94ecb7",
    400: "#70e69f",
    500: "#4ce087",
    600: "#3db36c",
    700: "#2e8651",
    800: "#1e5a36",
    900: "#0f2d1b",
  },
  categoryBack: {
    100: "#f5fff6",
    200: "#ebffed",
    300: "#e1ffe4",
    400: "#d7ffdb",
    500: "#cdffd2",
    600: "#a4cca8",
    700: "#7b997e",
    800: "#526654",
    900: "#29332a",
  },
  white: {
    100: "#ffffff",
    200: "#ffffff",
    300: "#ffffff",
    400: "#ffffff",
    500: "#ffffff",
    600: "#cccccc",
    700: "#999999",
    800: "#666666",
    900: "#333333",
  },

  //-------------
  black: {
    100: "#cccce6",
    200: "#9999cc",
    300: "#6666b3",
    400: "#333399",
    500: "#000080", // primary light mode
    600: "#000066",
    700: "#00004d",
    800: "#000033",
    900: "#00001a",
  },
  white: {
    100: "#ffffff",
    200: "#ffffff",
    300: "#ffffff",
    400: "#ffffff",
    500: "#ffffff",
    600: "#cccccc", // secondary light mode
    700: "#999999",
    800: "#666666",
    900: "#333333",
  },
  //---------------
};

// function that reverses the color palette
function reverseTokens(tokensDark) {
  const reversedTokens = {};
  Object.entries(tokensDark).forEach(([key, val]) => {
    const keys = Object.keys(val);
    const values = Object.values(val);
    const length = keys.length;
    const reversedObj = {};
    for (let i = 0; i < length; i++) {
      reversedObj[keys[i]] = values[length - i - 1];
    }
    reversedTokens[key] = reversedObj;
  });
  return reversedTokens;
}
export const tokensLight = reverseTokens(tokensDark);

// mui theme settings
export const themeSettings = (mode) => {
  return {
    palette: {
      mode: mode,
      ...(mode === "dark"
        ? {
            // palette values for dark mode
            primary: {
              ...tokensDark.primary,
              main: tokensDark.primary[400],
              light: tokensDark.primary[400],
            },
            secondary: {
              ...tokensDark.secondary,
              main: tokensDark.secondary[600],
            },
            neutral: {
              ...tokensDark.grey,
              main: tokensDark.grey[100],
            },
            background: {
              default: tokensDark.primary[600],
              alt: tokensDark.primary[500],
            },
            categoryTxt: {
              default: tokensDark.categoryTxt[500],
            },
            categoryBack: {
              default: tokensDark.categoryBack[500],
            },
            whiteColor: {
              ...tokensDark.white,
              main: tokensDark.white[100],
            },
          }
        : {
            // palette values for light mode
            primary: {
              ...tokensLight.primary,
              main: tokensDark.grey[50],
              light: tokensDark.grey[100],
            },
            secondary: {
              ...tokensLight.secondary,
              main: tokensDark.secondary[600],
              light: tokensDark.secondary[700],
            },
            neutral: {
              ...tokensLight.grey,
              main: tokensDark.grey[500],
            },
            background: {
              default: tokensDark.grey[0],
              alt: tokensDark.grey[50],
            },
            categoryTxt: {
              default: tokensDark.categoryTxt[500],
            },
            categoryBack: {
              default: tokensDark.categoryBack[50],
            },
            whiteColor: {
              ...tokensDark.white,
              main: tokensDark.white[900],
            },
          }),
    },

    typography: {
      fontFamily: ["Inter", "sans-serif"].join(","),
      fontSize: 12,
      h1: {
        fontFamily: ["Inter", "sans-serif"].join(","),
        fontSize: 40,
      },
      h2: {
        fontFamily: ["Inter", "sans-serif"].join(","),
        fontSize: 32,
      },
      h3: {
        fontFamily: ["Inter", "sans-serif"].join(","),
        fontSize: 24,
      },
      h4: {
        fontFamily: ["Inter", "sans-serif"].join(","),
        fontSize: 20,
      },
      h5: {
        fontFamily: ["Inter", "sans-serif"].join(","),
        fontSize: 16,
      },
      h6: {
        fontFamily: ["Inter", "sans-serif"].join(","),
        fontSize: 14,
      },
    },
    // direction: "rtl",
  };
};
