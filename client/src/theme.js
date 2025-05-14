// mui theme settings
export const themeSettings = (mode) => {
  return {
    palette: {
      mode: mode,
      ...(mode === "dark"
        ? {
            // palette values for dark mode

            primary: {
              main:"#3C3C3C"  //#242526 ,
            },
            secondary: {
              main: "#3498DB",
              alt: "#14191F",
            },
            action: {
              back: "#202122", // A slightly lighter shade of dark gray 242526
              main: "#FF7828",
            },
            textColor: {
              main: "#E0E0E0", 
              secondary:"#B0B0B0",
              title: "#CCCCCC",
              links: "#FFFFFF", //#AAAAAA
            },
            background: "#121212",
            category: "#4E4F50",
            // found or lost options ------------------
            floptions: {
              found: {
                back: "#D3FBD8",
                // text: "#007C4F",
                text: "#00FF00", // for recent icon color #ADD8E6 
              },
              lost: {
                back: "#FF8B9B",
                text: "#FFA500",  // 
              },
            },
            // caetgories -----
            categories: {
              keyscate: {
                back: "#BDC3C7",
                icon: "#FFFFFF",
              },
              personcate: {
                back: "#9B59B6",
                icon: "#F8E9E9",
              },
              bagcate: {
                back: "#D5F2E3",
                icon: "#1ABC9C",
              },
              moneycate: {
                back: "#00796b",
                icon: "#D6F5E3",
              },
              devicecate: {
                back: "#00707c",
                icon: "hsla(195, 64%, 90%, 0.8)",
              },
              walletcate: {
                back: "#D4A069",
                icon: "#9C640C",
              },
              vehiclecate: {
                back: "#9b4d9b",
                icon: "hsla(300, 60%, 90%, 0.8)",
              },
              documentcate: {
                back: "#C0D3E3",
                icon: "#4682B4",
              },
              text: {},
              icon: {
                cateIconMain: "#00bcd4",
                cateIconBack: "#006064",
              },
              back: "#006064",
              text: "#00bcd4",
            },
            // Text color :
            text: {
              white: "#FFFFFF",
              black: "#000000",
              primary: "#CCCCCC", // Default text color
              secondary: "#AAAAAA", // Secondary text color
              title: "#7FB3D5",
              description: "#CCCCCC", //#707070
              navlinks: "#AAAAAA",
              recentIcon: "",
            },
          }
        : {
            // palette values for light mode

            primary: {
              main: "#FFFFFF",
            },
            secondary: {
              main: "#3498DB",
              alt: "#E2E4E7",
            },
            action: {
              main: "#2C2D2E", 
            },
            textColor: {
              main: "#000000",
              secondary:"#B0B0B0"
            },
            background: "#F0F2F5",
            category: "#E4E6E9",
            floptions: {
              found: {
                back: "#D3FBD8",
                text: "#007C4F",
              },
              lost: {
                back: "#FF8B9B",
                text: "#AD0000",
              },
            },
            // categories
            categories: {
              keyscate: {
                back: "#D1F5FF",
              },
              personcate: {
                back: "#006064",
              },
              bagcate: {
                back: "#F8D6D4",
              },
              moneycate: {
                back: "#F8D981",
              },
              devicecate: {
                back: "#F8D6D4",
              },
              walletcate: {
                back: "#F8D6D4",
              },
              back: "#FFECCC",
              text: "#E79C25",
            },
          }),
    },

    typography: {
      fontFamily: ["Montserrat", "sans-serif"].join(","),

      category: {
        fontFamily: ["Signika Negative", "sans-serif"].join(","),
      },

      floption: {
        fontFamily: ["ABeeZee", "sans-serif"].join(","),
      },

      welcome: {
        fontFamily: ["Source Code Pro", "monospace"].join(","),
      },

      brandName :{
        fontFamily: ["Agbalumo", "normal"].join(","),
        fontSize: 24,
        // fontWeight: 300
      }

      // button: {
      //   fontFamily: ["Pacifico", "cursive"].join(","),
      // },
    },

    direction: "rtl",
  };
};
