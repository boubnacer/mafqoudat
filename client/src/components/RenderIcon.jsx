import {
  AccessTimeFilled,
  AccessTimeOutlined,
  AccountBalanceWalletOutlined,
  ArrowDropDown,
  ArrowDropDownOutlined,
  ArrowDropUpOutlined,
  ArrowRightAlt,
  ArticleOutlined,
  AttachMoneyOutlined,
  Create,
  DeliveryDiningOutlined,
  DevicesOtherOutlined,
  East,
  FacebookOutlined,
  FiberManualRecord,
  HomeOutlined,
  Instagram,
  KeyOutlined,
  KeyboardArrowRightOutlined,
  LocationOn,
  LocationOnOutlined,
  NorthEast,
  NotificationsActiveOutlined,
  Person,
  PersonOutlineOutlined,
  PersonOutlined,
  PlaceOutlined,
  ShareOutlined,
  SouthEast,
  SwapVertOutlined,
  TimelineOutlined,
  TrendingFlat,
  TrendingUpOutlined,
  Twitter,
  UndoOutlined,
  WhatsApp,
  Whatshot,
  WorkOutlineOutlined,
  LuggageOutlined,
  PhoneAndroidOutlined,
  CreditCardOutlined,
} from "@mui/icons-material";
import { useTheme } from "@mui/material";
import React from "react";

const RenderIcon = ({ name }) => {
  const theme = useTheme();
  const icon =
    // for left side header ------
    name === "Found" ? (
      <NorthEast sx={{ fontSize: "20px", color: "#4CAF50" }} data-directional="true" />
    ) : name === "Lost" ? (
      <SouthEast sx={{ fontSize: "20px", color: "#757575" }} data-directional="true" />
    ) : name === "returned" ? (
      <HomeOutlined
        sx={{
          fontSize: "20px",
          color: "#ECEFF1",
        }}
      />
    ) : name === "total" ? (
      <TimelineOutlined sx={{ fontSize: "26px", color: "#B0BEC5" }} />
    ) : name === "foundfl" ||
      name === "lostfl" ||
      name === "roadmapl" ||
      name === "roadmapf" ? (
      <NorthEast
        sx={{
          fontSize:
            name === "roadmapf" || name === "roadmapl" ? "18px" : "14px",
          color:
            name === "lostfl" || name === "roadmapl"
              ? theme.palette.floptions.lost.text
              : theme.palette.floptions.found.text,
        }}
        data-directional="true"
      />
    ) : // Categories---------------------------------------------------------------
    name === "person" || name === "personcate" || name === "personrece" ? (
      <PersonOutlined
        sx={{
          color: "#B0BEC5",
          fontSize:
            name === "personcate"
              ? "2rem"
              : name === "personrece"
              ? "2.5rem"
              : "26px",

          borderRadius: "5px",
          padding: name === "personrece" && "0.5rem",
        }}
      />
    ) : name === "bag" || name === "bagcate" || name === "bagrece" ? (
      <LuggageOutlined
        sx={{
          color: name === "bagrece" ? theme.palette.categories.bagcate.icon : "#A8ABAF",
          fontSize:
            name === "bagcate"
              ? "2rem"
              : name === "bagrece"
              ? "2.5rem"
              : name === "bag"
              ? "20px"
              : "",

          borderRadius: "5px",
          padding: name === "Bagrece" && "0.5rem",
        }}
      />
    ) : name === "Devices" ||
      name === "Devicescate" ||
      name === "Devicesrece" ||
      name === "device" ||
      name === "devicecate" ||
      name === "devicerece" ? (
      <PhoneAndroidOutlined
        sx={{
          color: theme.palette.categories.devicecate.icon,
          fontSize:
            name === "devicecate" || name === "Devicescate"
              ? "2rem"
              : name === "devicerece" || name === "Devicesrece"
              ? "2.5rem"
              : "26px",

          borderRadius: "5px",
          padding: (name === "devicerece" || name === "Devicesrece") && "0.5rem",
        }}
      />
    ) : name === "keyscate" || name === "keys" || name === "keysrece" ? (
      <KeyOutlined
        sx={{
          color: theme.palette.categories.keyscate.icon,
          fontSize:
            name === "keyscate"
              ? "2rem"
              : name === "keysrece"
              ? "2.5rem"
              : "22px",
          borderRadius: "5px",
          padding: name === "keysrece" && "0.5rem",
        }}
      />
    ) : name === "Wallet" || name === "Walletcate" || name === "Walletrece" ? (
      <CreditCardOutlined
        sx={{
          color: theme.palette.categories.walletcate.icon,
          fontSize:
            name === "Walletcate"
              ? "2rem"
              : name === "Walletrece"
              ? "2.5rem"
              : "26px",

          borderRadius: "5px",
          padding: name === "Walletrece" && "0.5rem",
        }}
      />
    ) : name === "Money" || name === "Moneycate" || name === "Moneyrece" ? (
      <AttachMoneyOutlined
        sx={{
          color: theme.palette.categories.moneycate.icon,
          fontSize:
            name === "Moneycate"
              ? "2rem"
              : name === "Moneyrece"
              ? "2.5rem"
              : "26px",

          borderRadius: "5px",
          padding: name === "Moneyrece" && "0.5rem",
        }}
      />
    ) : name === "Vehicle" ||
      name === "Vehiclecate" ||
      name === "Vehiclerece" ? (
      <DeliveryDiningOutlined
        sx={{
          color: theme.palette.categories.vehiclecate.icon,
          fontSize:
            name === "Vehiclecate"
              ? "2rem"
              : name === "Vehiclerece"
              ? "2.5rem"
              : "22px",

          borderRadius: "5px",
          padding: name === "Vehiclerece" && "0.5rem",
        }}
      />
    ) : name === "Document" ||
      name === "Documentcate" ||
      name === "Documentrece" ? (
      <ArticleOutlined
        sx={{
          color: theme.palette.categories.documentcate.icon,
          fontSize:
            name === "Documentcate"
              ? "2rem"
              : name === "Documentrece"
              ? "2.5rem"
              : "22px",

          borderRadius: "5px",
          padding: name === "Documentrece" && "0.5rem",
        }}
      />
    ) : // other
    name === "location" || name === "locat" ? (
      <PlaceOutlined
        sx={{
          color:
            name === "location" ? "#A8ABAF" : name === "locat" ? "#A8ABAF" : "",
          fontSize: "20px",
        }}
      /> // #777777 #A8ABAF
    ) : name === "share" ? (
      <ShareOutlined data-directional="true" />
    ) : name === "trending" ? (
      <TrendingUpOutlined data-directional="true" />
    ) : name === "view" ? (
      <KeyboardArrowRightOutlined data-directional="true" />
    ) : name == "time" || name === "timerace" ? (
      <AccessTimeOutlined
        sx={{
          color:
            name === "time" ? "#AFB2B7" : name === "timerace" ? "#AFB2B7" : "",
          fontSize: "20px",
        }}
      />
    ) : name === "fire" ? (
      <Whatshot
        sx={{
          fontSize: "26px",
          color: "#FF0000",
        }}
      />
    ) : name === "seeall" ? (
      <East
        sx={{
          fontSize: "25px",
        }}
        data-directional="true"
      />
    ) : name === "create" ? (
      <Create
        sx={{
          fontSize: "18px",
        }}
        data-directional="true"
      />
    ) : name === "arrowDown" ? (
      <ArrowDropDown data-directional="true" />
    ) : name === "notif" ? (
      <NotificationsActiveOutlined />
    ) : name === "ad" ? (
      <TimelineOutlined />
    ) : name === "face" ? (
      <FacebookOutlined sx={{ color: "#1877f2", fontSize: "30px" }} />
    ) : name === "insta" ? (
      <Instagram sx={{ color: "#c32aa3", fontSize: "30px" }} />
    ) : name === "x" ? (
      <Twitter sx={{ color: "#55acee", fontSize: "30px" }} />
    ) : name === "whats" ? (
      <WhatsApp sx={{ color: "#25d366", fontSize: "30px" }} />
    ) : (
      ""
    );

  return icon;
};

export default RenderIcon;
