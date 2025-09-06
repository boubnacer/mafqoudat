import {
  NorthEast,
  SouthEast,
  HomeOutlined,
  TimelineOutlined,
  PersonOutlined,
  LuggageOutlined,
  PhoneAndroidOutlined,
  KeyOutlined,
  CreditCardOutlined,
  AttachMoneyOutlined,
  DeliveryDiningOutlined,
  ArticleOutlined,
  PetsOutlined,
  WatchOutlined,
  SchoolOutlined,
  SportsEsportsOutlined,
  HomeOutlined as HomeIcon,
  LocalHospitalOutlined,
  RestaurantOutlined,
  ShoppingBagOutlined,
  WorkOutlineOutlined,
  SportsSoccerOutlined,
  MusicNoteOutlined,
  ToysOutlined,
  FaceOutlined,
  CameraAltOutlined,
  BuildOutlined,
  LocalFloristOutlined,
  MoreHorizOutlined,
  Facebook,
  Instagram,
  WhatsApp,
  Twitter,
  Share,
  Campaign,
  Notifications
} from "@mui/icons-material";
import { useTheme } from "@mui/material";
import React from "react";
import { getCategoryIcon, getCategoryColor } from "../config/categories";

const RenderIcon = ({ name }) => {
  const theme = useTheme();
  
  // Check if this is a category icon first
  if (name && name.toLowerCase().includes('cate')) {
    const categoryCode = name.replace('cate', '').toUpperCase();
    const IconComponent = getCategoryIcon(categoryCode);
    const iconColor = getCategoryColor(categoryCode);
    
    if (IconComponent) {
      return (
        <IconComponent
          sx={{
            color: iconColor,
            fontSize: name === "personcate" ? "2rem" : 
                     name === "personrece" ? "2.5rem" : "26px",
            borderRadius: "5px",
            padding: name === "personrece" && "0.5rem",
          }}
        />
      );
    }
  }
  
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
    ) : name === "home" ? (
      <HomeOutlined
        sx={{
          fontSize: "20px",
          color: "#B0BEC5",
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
              : "26px",

          borderRadius: "5px",
          padding: name === "Documentrece" && "0.5rem",
        }}
      />
    ) : name === "Pets" ||
      name === "Petscate" ||
      name === "Petsrece" ? (
      <PetsOutlined
        sx={{
          color: theme.palette.categories.petscate?.icon || "#795548",
          fontSize:
            name === "Petscate"
              ? "2rem"
              : name === "Petsrece"
              ? "2.5rem"
              : "26px",

          borderRadius: "5px",
          padding: name === "Petsrece" && "0.5rem",
        }}
      />
    ) : name === "Watches" ||
      name === "Watchescate" ||
      name === "Watchesrece" ? (
      <WatchOutlined
        sx={{
          color: theme.palette.categories.watchescate?.icon || "#2196F3",
          fontSize:
            name === "Watchescate"
              ? "2rem"
              : name === "Watchesrece"
              ? "2.5rem"
              : "26px",

          borderRadius: "5px",
          padding: name === "Watchesrece" && "0.5rem",
        }}
      />
    ) : name === "Education" ||
      name === "Educationcate" ||
      name === "Educationrece" ? (
      <SchoolOutlined
        sx={{
          color: theme.palette.categories.educationcate?.icon || "#673AB7",
          fontSize:
            name === "Educationcate"
              ? "2rem"
              : name === "Educationrece"
              ? "2.5rem"
              : "26px",

          borderRadius: "5px",
          padding: name === "Educationrece" && "0.5rem",
        }}
      />
    ) : name === "Gaming" ||
      name === "Gamingcate" ||
      name === "Gamingrece" ? (
      <SportsEsportsOutlined
        sx={{
          color: theme.palette.categories.gamingcate?.icon || "#E91E63",
          fontSize:
            name === "Gamingcate"
              ? "2rem"
              : name === "Gamingrece"
              ? "2.5rem"
              : "26px",

          borderRadius: "5px",
          padding: name === "Gamingrece" && "0.5rem",
        }}
      />
    ) : name === "Home" ||
      name === "Homecate" ||
      name === "Homerece" ? (
      <HomeIcon
        sx={{
          color: theme.palette.categories.homecate?.icon || "#8BC34A",
          fontSize:
            name === "Homecate"
              ? "2rem"
              : name === "Homerece"
              ? "2.5rem"
              : "26px",

          borderRadius: "5px",
          padding: name === "Homerece" && "0.5rem",
        }}
      />
    ) : name === "Medical" ||
      name === "Medicalcate" ||
      name === "Medicalrece" ? (
      <LocalHospitalOutlined
        sx={{
          color: theme.palette.categories.medicalcate?.icon || "#F44336",
          fontSize:
            name === "Medicalcate"
              ? "2rem"
              : name === "Medicalrece"
              ? "2.5rem"
              : "26px",

          borderRadius: "5px",
          padding: name === "Medicalrece" && "0.5rem",
        }}
      />
    ) : name === "Food" ||
      name === "Foodcate" ||
      name === "Foodrece" ? (
      <RestaurantOutlined
        sx={{
          color: theme.palette.categories.foodcate?.icon || "#FF9800",
          fontSize:
            name === "Foodcate"
              ? "2rem"
              : name === "Foodrece"
              ? "2.5rem"
              : "26px",

          borderRadius: "5px",
          padding: name === "Foodrece" && "0.5rem",
        }}
      />
    ) : name === "Shopping" ||
      name === "Shoppingcate" ||
      name === "Shoppingrece" ? (
      <ShoppingBagOutlined
        sx={{
          color: theme.palette.categories.shoppingcate?.icon || "#9C27B0",
          fontSize:
            name === "Shoppingcate"
              ? "2rem"
              : name === "Shoppingrece"
              ? "2.5rem"
              : "26px",

          borderRadius: "5px",
          padding: name === "Shoppingrece" && "0.5rem",
        }}
      />
    ) : name === "Work" ||
      name === "Workcate" ||
      name === "Workrece" ? (
      <WorkOutlineOutlined
        sx={{
          color: theme.palette.categories.workcate?.icon || "#607D8B",
          fontSize:
            name === "Workcate"
              ? "2rem"
              : name === "Workrece"
              ? "2.5rem"
              : "26px",

          borderRadius: "5px",
          padding: name === "Workrece" && "0.5rem",
        }}
      />
    ) : name === "Sports" ||
      name === "Sportscate" ||
      name === "Sportsrece" ? (
      <SportsSoccerOutlined
        sx={{
          color: theme.palette.categories.sportscate?.icon || "#4CAF50",
          fontSize:
            name === "Sportscate"
              ? "2rem"
              : name === "Sportsrece"
              ? "2.5rem"
              : "26px",

          borderRadius: "5px",
          padding: name === "Sportsrece" && "0.5rem",
        }}
      />
    ) : name === "Music" ||
      name === "Musiccate" ||
      name === "Musicrece" ? (
      <MusicNoteOutlined
        sx={{
          color: theme.palette.categories.musiccate?.icon || "#9C27B0",
          fontSize:
            name === "Musiccate"
              ? "2rem"
              : name === "Musicrece"
              ? "2.5rem"
              : "26px",

          borderRadius: "5px",
          padding: name === "Musicrece" && "0.5rem",
        }}
      />
    ) : name === "Toys" ||
      name === "Toyscate" ||
      name === "Toysrece" ? (
      <ToysOutlined
        sx={{
          color: theme.palette.categories.toyscate?.icon || "#FF9800",
          fontSize:
            name === "Toyscate"
              ? "2rem"
              : name === "Toysrece"
              ? "2.5rem"
              : "26px",

          borderRadius: "5px",
          padding: name === "Toysrece" && "0.5rem",
        }}
      />
    ) : name === "Beauty" ||
      name === "Beautycate" ||
      name === "Beautyrece" ? (
      <FaceOutlined
        sx={{
          color: theme.palette.categories.beautycate?.icon || "#E91E63",
          fontSize:
            name === "Beautycate"
              ? "2rem"
              : name === "Beautyrece"
              ? "2.5rem"
              : "26px",

          borderRadius: "5px",
          padding: name === "Beautyrece" && "0.5rem",
        }}
      />
    ) : name === "Camera" ||
      name === "Cameracate" ||
      name === "Camerarece" ? (
      <CameraAltOutlined
        sx={{
          color: theme.palette.categories.cameracate?.icon || "#2196F3",
          fontSize:
            name === "Cameracate"
              ? "2rem"
              : name === "Camerarece"
              ? "2.5rem"
              : "26px",

          borderRadius: "5px",
          padding: name === "Camerarece" && "0.5rem",
        }}
      />
    ) : name === "Luggage" ||
      name === "Luggagecate" ||
      name === "Luggagerece" ? (
      <LuggageOutlined
        sx={{
          color: theme.palette.categories.luggagecate?.icon || "#795548",
          fontSize:
            name === "Luggagecate"
              ? "2rem"
              : name === "Luggagerece"
              ? "2.5rem"
              : "26px",

          borderRadius: "5px",
          padding: name === "Luggagerece" && "0.5rem",
        }}
      />
    ) : name === "Tools" ||
      name === "Toolscate" ||
      name === "Toolsrece" ? (
      <BuildOutlined
        sx={{
          color: theme.palette.categories.toolscate?.icon || "#607D8B",
          fontSize:
            name === "Toolscate"
              ? "2rem"
              : name === "Toolsrece"
              ? "2.5rem"
              : "26px",

          borderRadius: "5px",
          padding: name === "Toolsrece" && "0.5rem",
        }}
      />
    ) : name === "Garden" ||
      name === "Gardencate" ||
      name === "Gardenrece" ? (
      <LocalFloristOutlined
        sx={{
          color: theme.palette.categories.gardencate?.icon || "#4CAF50",
          fontSize:
            name === "Gardencate"
              ? "2rem"
              : name === "Gardenrece"
              ? "2.5rem"
              : "26px",

          borderRadius: "5px",
          padding: name === "Gardenrece" && "0.5rem",
        }}
      />
    ) : name === "Other" ||
      name === "Othercate" ||
      name === "Otherrece" ? (
      <MoreHorizOutlined
        sx={{
          color: theme.palette.categories.othercate?.icon || "#9E9E9E",
          fontSize:
            name === "Othercate"
              ? "2rem"
              : name === "Otherrece"
              ? "2.5rem"
              : "26px",

          borderRadius: "5px",
          padding: name === "Otherrece" && "0.5rem",
        }}
      />
    ) : // Process Step Icons
    name === "share" ? (
      <Share
        sx={{
          color: theme.palette.primary.main,
          fontSize: "24px",
        }}
      />
    ) : name === "ad" ? (
      <Campaign
        sx={{
          color: theme.palette.primary.main,
          fontSize: "24px",
        }}
      />
    ) : name === "notif" ? (
      <Notifications
        sx={{
          color: theme.palette.primary.main,
          fontSize: "24px",
        }}
      />
    ) : // Social Media Icons
    name === "face" ? (
      <Facebook
        sx={{
          color: "#1877F2",
          fontSize: "20px",
        }}
      />
    ) : name === "whats" ? (
      <WhatsApp
        sx={{
          color: "#25D366",
          fontSize: "20px",
        }}
      />
    ) : name === "x" ? (
      <Twitter
        sx={{
          color: "#1DA1F2",
          fontSize: "20px",
        }}
      />
    ) : name === "insta" ? (
      <Instagram
        sx={{
          color: "#E4405F",
          fontSize: "20px",
        }}
      />
    ) : null;

  return icon;
};

export default RenderIcon;
