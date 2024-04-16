import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate } from "react-router-dom";
import { useGetPostsQuery } from "../postsApiSlice";
import { memo } from "react";
import "./postslist.css";
import ma from "../../../img/ma.jpg";
import useAuth from "../../../hooks/useAuth";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Typography,
  useTheme,
  Box,
} from "@mui/material";
import {
  LocationOnOutlined,
  KeyboardArrowRightOutlined,
  ReportProblemOutlined,
} from "@mui/icons-material";
import FlexBetween from "../../../components/FlexBetween";

const Post = ({ post }) => {
  const { usernameId, foundLost } = useAuth();
  console.log(`http://localhost:3500/${post.image}`);

  const theme = useTheme();

  const navigate = useNavigate();

  if (post) {
    const created = new Date(post.createdAt).toLocaleString("en-US", {
      day: "numeric",
      month: "long",
    });

    const updated = new Date(post.updatedAt).toLocaleString("en-US", {
      day: "numeric",
      month: "long",
    });

    const handleEdit = () => navigate(`/dash/posts/${post._id}`);
    const handleReport = () => navigate(`/dash/posts/report/${post._id}`);

    const cardClass = post.foundLost === "Found" ? "found__card" : "lost__card";

    return (
      <>
        <Card sx={{ backgroundColor: theme.palette.primary.main }}>
          {/* <h1 className={`h1 ${cardClass}`}>...</h1> */}
          <CardMedia
            sx={{ height: 150 }}
            image={post.image ? `http://localhost:3500/${post.image}` : ma}
            title={post.image}
          />
          <CardContent>
            <FlexBetween>
              <Typography variant="body2">{created}</Typography>
              <Typography
                backgroundColor={theme.palette.secondary.main}
                color="#fff"
                p="1px 9px"
                borderRadius="10px"
              >
                {post.categoryname}
              </Typography>
            </FlexBetween>
            <Box display="flex" mt="0.5rem">
              <LocationOnOutlined sx={{ marginTop: "1.5px" }} />
              <Typography
                // mt="2px"
                ml="2px"
                gutterBottom
                variant="h5"
                component="div"
              >
                {post.region}
              </Typography>
            </Box>
            {/* <Typography variant="body2" color={theme.palette.secondary.main}>
          {created}
        </Typography> */}
          </CardContent>
          <CardActions
            sx={{
              display: "flex",
              justifyContent: "space-around",
              alignItems: "center",
              marginTop: "1rem",
              borderTop: "2px solid",
              borderColor: theme.palette.background,
              borderWidth: "40%",
            }}
          >
            <Button
              sx={{ color: "#fff" }}
              startIcon={
                <ReportProblemOutlined
                  sx={{
                    color: "#fff",
                  }}
                />
              }
              onClick={handleReport}
              size="small"
            >
              Report
            </Button>
            <Button
              sx={{ color: "#fff" }}
              endIcon={
                <KeyboardArrowRightOutlined
                  sx={{
                    backgroundColor: "#fff",
                    color: "#000",
                    borderRadius: "50%",
                  }}
                />
              }
              onClick={handleEdit}
              size="small"
            >
              Read more
            </Button>
          </CardActions>
        </Card>
      </>
    );
  } else return null;
};

const memoizedPost = memo(Post);

export default memoizedPost;
