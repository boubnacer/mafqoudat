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
  Instagram,
  KeyOutlined,
  KeyboardArrowRightOutlined,
  LocationOn,
  LocationOnOutlined,
  NorthEast,
  NotificationsActiveOutlined,
  Person,
  PersonOutlineOutlined,
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
} from "@mui/icons-material";
import { useTheme } from "@mui/material";
import React from "react";

const RenderIcon = ({ name }) => {
  const theme = useTheme();
  const icon =
    // for left side header ------
    name === "Found" ? (
      <NorthEast sx={{ fontSize: "20px", color: "#4CAF50" }} />
    ) : name === "Lost" ? (
      <SouthEast sx={{ fontSize: "20px", color: "#757575" }} />
    ) : name === "returned" ? (
      <UndoOutlined
        sx={{
          fontSize: "20px",
          color: "#FFC107",
        }}
      />
    ) : name === "total" ? (
      <SwapVertOutlined sx={{ fontSize: "26px", color: "#AAAAAA" }} />
    ) : name === "Foundfl" ||
      name === "Lostfl" ||
      name === "roadmapl" ||
      name === "roadmapf" ? (
      <FiberManualRecord
        sx={{
          fontSize:
            name === "roadmapf" || name === "roadmapl" ? "18px" : "12px",
          color:
            name === "Lostfl" || name === "roadmapl"
              ? theme.palette.floptions.lost.text
              : theme.palette.floptions.found.text,
        }}
      />
    ) : // Categories---------------------------------------------------------------
    name === "person" || name === "personcate" || name === "personrece" ? (
      <Person
        sx={{
          color: theme.palette.categories.personcate.icon,
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
    ) : name === "Bag" || name === "Bagcate" || name === "Bagrece" ? (
      <WorkOutlineOutlined
        sx={{
          color: theme.palette.categories.bagcate.icon,
          fontSize:
            name === "Bagcate"
              ? "2rem"
              : name === "Bagrece"
              ? "2.5rem"
              : name === "Bag"
              ? "20px"
              : "",

          borderRadius: "5px",
          padding: name === "Bagrece" && "0.5rem",
        }}
      />
    ) : name === "Devices" ||
      name === "Devicescate" ||
      name === "Devicesrece" ? (
      <DevicesOtherOutlined
        sx={{
          color: theme.palette.categories.devicecate.icon,
          fontSize:
            name === "Devicescate"
              ? "2rem"
              : name === "Devicesrece"
              ? "2.5rem"
              : "26px",

          borderRadius: "5px",
          padding: name === "Devicesrece" && "0.5rem",
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
      <AccountBalanceWalletOutlined
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
      <LocationOn
        sx={{
          color:
            name === "location" ? "#e74c3c" : name === "locat" ? "#A8ABAF" : "",
          fontSize: "20px",
        }}
      /> // #777777 #A8ABAF
    ) : name === "share" ? (
      <ShareOutlined />
    ) : name === "trending" ? (
      <TrendingUpOutlined />
    ) : name === "view" ? (
      <KeyboardArrowRightOutlined />
    ) : name == "time" || name === "timerace" ? (
      <AccessTimeFilled
        sx={{
          color:
            name === "time" ? "#ffd700" : name === "timerace" ? "#A8ABAF" : "",
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
      />
    ) : name === "create" ? (
      <Create
        sx={{
          fontSize: "18px",
        }}
      />
    ) : name === "arrowDown" ? (
      <ArrowDropDown />
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
