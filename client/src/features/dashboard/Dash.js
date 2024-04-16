import React, { useEffect, useState } from "react";
import { useGetDashboardQuery, useGetPostsQuery } from "../posts/postsApiSlice";
import TotalBox from "../../components/TotalBox";

import "./dash.css";
import useAuth from "../../hooks/useAuth";
import {
  Box,
  Button,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import LeftSide from "../../components/dashboard/LeftSide";
import FlexCenter from "../../components/FlexCenter";
import TrendingItem from "../../components/dashboard/TrendingItem";
import Geography from "../geography";
import DashRecents from "../../components/dashboard/DashRecents";
import {
  selectCurrentCountry,
  setActiveLink,
  setFoundOrLost,
} from "../../app/state";
import { Add, Send, WhatshotOutlined } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Categories from "../../components/dashboard/Categories";

import Recent from "../../components/dashboard/Recent";
import SeeAll from "../../components/dashboard/SeeAll";
import FlexBetween from "../../components/FlexBetween";
import PulseLoader from "react-spinners/PulseLoader";

import Skeleton from "@mui/material/Skeleton";
import RoadMap from "../../components/dashboard/RoadMap";
import Process from "../../components/dashboard/Process";

const lostsId = "63cc3484bc901245d3a1cb5a";
const foundsId = "63cc34613e5e7407436e09a5";

const Dash = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const currentCountry = useSelector(selectCurrentCountry);

  // currentCountry && localStorage.setItem("country", currentCountry);
  // const storedCountry = localStorage.getItem("country");

  const isNonMediumScreens = useMediaQuery("(min-width:1200px)");

  const theme = useTheme();

  const { data, isError, error, isLoading } = useGetDashboardQuery({
    currentCountry,
  });

  const trend = data?.trendingPost;
  const createdtoday = data?.createdToday;

  const hanldeSeeAllPosts = ({ foundOrlostId }) => {
    navigate("/dash/posts");
    dispatch(
      setFoundOrLost({
        foundOrlost: foundOrlostId,
      })
    );
    dispatch(setActiveLink({ active: foundOrlostId }));
  };

  const hanldeAddNewPost = () => navigate("/dash/posts/new");

  if (isError) console.log(data?.error?.message);

  if (!data) return <PulseLoader color={"#FFF"} />;

  return (
    <Box pt="5.7rem" width="100%">
      {/* dash header */}
      <Box
        m="0 1rem"
        gap="20px"
        sx={{
          display: { xs: "grid", sm: "flex" },
          gridTemplateColumns: { xs: "repeat(1,1fr)", sm: "repeat(2,1fr)" },
        }}
      >
        <LeftSide
          totalFounds={data?.totalFounds}
          totalLosts={data?.totalLosts}
          totalPosts={data?.totalPosts}
          foundsToday={data?.createdToday.todaysFoundPosts}
          lostsToday={data?.createdToday.todaysLostPosts}
        />
        {isLoading ? (
          <Skeleton variant="rounded" width={210} height={60} />
        ) : (
          <TrendingItem trend={trend} isLoading={isLoading} />
        )}
      </Box>
      {/* dash body */}

      {/* Road map --------------------------------*/}
      <DashRecents cate="roadmap">
        <Box display="flex" alignItems="center" pt="1rem">
          <Typography
            fontWeight="600"
            sx={{
              fontSize: "26px",
              paddingLeft: "2rem",
            }}
          >
            WEBSITE MAP
          </Typography>
          <Typography
            variant="welcome"
            sx={{
              fontSize: "18px",
              paddingLeft: "2rem",
              fontStyle: "italic",
              color: theme.palette.text.description,
            }}
          >
            Weclome to mafoudat
          </Typography>
        </Box>
        <RoadMap />
      </DashRecents>
      {/* Latest founds ------------------------------ */}
      <DashRecents cate="recents" sx={{ backgroundColor: "#1B1C1D" }}>
        <Box display="flex" alignItems="center" padding="0 0 1rem">
          <Typography
            fontWeight="500"
            sx={{
              backgroundColor: theme.palette.primary.main,
              clipPath: "polygon(0 0, 100% 0%, 95% 100%, 0% 100%)",
              padding: "0.5rem",
              width: "26%",
              borderLeft: "1px solid",
              borderColor: "#00FF00",
              fontSize: "22px",
              paddingLeft: "2rem",
            }}
          >
            RECENT FOUNDS
          </Typography>
          <SeeAll foundOrlostId={foundsId} totalItems={data?.totalFounds} />
        </Box>
        <FlexCenter>
          <Recent recent={data?.recentFounds} />
        </FlexCenter>
      </DashRecents>

      {/* latest losts */}
      <DashRecents
        cate="recents"
        sx={{ borderColor: theme.palette.primary.main }}
      >
        <Box display="flex" alignItems="center" gap="1rem" padding="1rem 0">
          <Typography
            fontWeight="500"
            sx={{
              backgroundColor: theme.palette.primary.main,
              clipPath: "polygon(0 0, 100% 0%, 95% 100%, 0% 100%)",
              padding: "0.5rem",
              width: "26%",
              borderLeft: "1px solid",
              borderColor: "#FFA500",
              fontSize: "22px",
              paddingLeft: "2rem",
            }}
          >
            RECENT LOSTS
          </Typography>
          <SeeAll foundOrlostId={foundsId} totalItems={data?.totalLosts} />
        </Box>
        <FlexCenter>
          <Recent recent={data?.recentLosts} />
        </FlexCenter>
      </DashRecents>

      {/* Categories ---------------------  */}
      <DashRecents
        cate="cate"
        sx={{
          borderColor: theme.palette.primary.main,
          // backgroundColor: theme.palette.secondary.alt,
        }}
      >
        <Typography
          fontWeight="600"
          sx={{
            fontSize: "26px",
            // paddingLeft: "2rem",
            p: "2rem 0",
            // textAlign: "center",
          }}
        >
          CAETGORIES
        </Typography>

        <Categories />
      </DashRecents>

      <DashRecents>
        <Process />
      </DashRecents>

      {/* latest losts */}
      {/* <DashRecents sx={{ borderColor: theme.palette.primary.main }}>
        <Box display="flex" alignItems="center" gap="2rem">
          <Typography>Recent Founds</Typography>
          <SeeAll foundOrlostId={foundsId} totalItems={data?.totalFounds} />
        </Box>
        <FlexCenter>
          <Recent recent={data?.recentFounds} />
        </FlexCenter>
      </DashRecents> */}

      {/* <Box>
        <Geography data={data} />
      </Box> */}
    </Box>
  );
};

export default Dash;
