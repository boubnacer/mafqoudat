import { useGetPostsQuery } from "../postsApiSlice";
import Post from "./Post";
import useTitle from "../../../hooks/useTitle";
import PulseLoader from "react-spinners/PulseLoader";
import { useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";

import "./postslist.css";
import Filter from "../../../components/Filter/Filter";
import { useEffect, useState } from "react";

import Pagination from "@mui/material/Pagination";
import { Box } from "@mui/material";
import useAuth from "../../../hooks/useAuth";
import { selectCurrentCountry, selectFoundOrLost } from "../../../app/state";
import FlexCenter from "../../../components/FlexCenter";

const POSTS_REGEX = /^\/dash\/posts(\/)?$/;
const HOME_REGEX = /^\/dash(\/)?$/;

const PostsList = () => {
  useTitle("mafkoudat: Posts List");

  const user = useAuth();

  const countryId = useSelector(selectCurrentCountry);

  const [currentCountry, setCurrentCountry] = useState(user.country);

  const foundOrlost = useSelector(selectFoundOrLost);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(4);
  // const [sort, setSort] = useState({});
  const [fl, setFl] = useState(foundOrlost);

  const navigate = useNavigate();
  const { pathname } = useLocation();

  const { data, isLoading, isSuccess, isError, error } = useGetPostsQuery({
    page,
    pageSize,
    fl,
    currentCountry,
  });

  useEffect(() => {
    setCurrentCountry(countryId);
    setFl(foundOrlost);
    setPage(1);
  }, [countryId, foundOrlost]);

  const handlePaginate = (e, p) => {
    setPage(p);
  };

  const handleMore = () => navigate("/dash/posts");

  let content;

  if (isLoading) content = <PulseLoader color={"#FFF"} />;

  if (isError) {
    content = (
      <>
        <p className="errmsg">Error:{error?.data?.message}</p>{" "}
        <section className="welcome">
          <h1>there is no posts for the chosen country! Please add one</h1>
          <p>
            <Link to="/dash/posts/new">Add New post</Link>
          </p>
        </section>
      </>
    );
  }

  if (isSuccess) {
    const { postsWithUser } = data;

    const postsWithUserCountry = postsWithUser.filter(
      (postId) => postId.country === countryId
    );

    content = postsWithUserCountry?.length ? (
      <Box>
        <FlexCenter position="relative">
          {/* sorting */}
          <Box
            width="90%"
            display="grid"
            // gridTemplateColumns="repeat(4, 1fr)"
            gap="1.5rem"
            sx={{
              gridTemplateColumns: {
                xs: "repeat(1, 1fr)",
                md: "repeat(2, 1fr)",
                lg: "repeat(4, 1fr)",
              },
              mt: {
                xs: "21rem",
                sm: "13rem",
              },
            }}
          >
            {postsWithUserCountry.map((post) => (
              <Post key={post._id} post={post} />
            ))}
          </Box>
        </FlexCenter>
        <Box
          mt="2rem"
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <Pagination
            page={page}
            count={data.totalPages}
            onChange={handlePaginate}
            // sx={{ width:  }}
          ></Pagination>
        </Box>
      </Box>
    ) : (
      <section className="welcome">
        {/* {filterContent} */}
        <h1>there is no posts for the chosen country! Please add one</h1>
        <p>
          <Link to="/dash/posts/new">Add New post</Link>
        </p>
      </section>
    );
  }
  return content;
};
export default PostsList;
