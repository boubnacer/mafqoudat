import { Box, Button, CardMedia, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import useAuth from "../../../hooks/useAuth";
import sear from "../../../img/sear.svg";

import "./editpost.css";

const SinglePostPage = ({
  _id,
  categoryname,
  region,
  contact,
  user,
  image,
}) => {
  // console.log(post);
  const navigate = useNavigate();

  const { usernameId } = useAuth();

  const canEdit = user === usernameId ? true : false;

  const editClass = canEdit ? "" : "edit__btn";

  const handleEdit = () => navigate(`/dash/posts/edit/${_id}`);

  return (
    <Box padding="0.5rem 2rem" display="flex" mt="5rem">
      <Box flex={1}>
        <Typography variant="h2">{categoryname}</Typography>
        <Typography variant="h5">{region}</Typography>
        <Typography variant="h2">{contact}</Typography>
        <Button onClick={handleEdit} disabled={!canEdit}>
          Edit
        </Button>
      </Box>
      <Box flex={1}>
        <CardMedia
          sx={{ height: 500 }}
          image={image ? `http://localhost:3500/${image}` : sear}
          title={image}
        />
      </Box>
      {/* <article>
        <small>{categoryname}</small>
        <small>{region}</small>
        <small>{contact}</small>
        <button
          className={`btn primary-btn ${editClass}`}
          disabled={!canEdit}
          onClick={handleEdit}
        >
          Edit
        </button>
      </article> */}
    </Box>
  );
};

export default SinglePostPage;
