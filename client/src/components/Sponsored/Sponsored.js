import React from "react";
import ma from "../../../img/ma.jpg";
import trending from "../../../img/trending.svg";
import { Link, useNavigate } from "react-router-dom";

import "./sponsored.css";

const Sponsored = ({ post }) => {
  const navigate = useNavigate();

  const handleEdit = () => navigate(`/dash/posts/${post.id}`);
  const handleReport = () => navigate(`/dash/posts/report/${post.id}`);

  return (
    <>
      <Link to={`/dash/posts/${post.id}`}>
        <div className="sponsored__card">
          <div>
            <div className="sponsored__info">
              <h3>{post.category}</h3>
              <h4>{post.region}</h4>
              <small>{post.contact}</small>
            </div>
            <div className="sponsored-handle__edit">
              <button className="btn" onClick={handleEdit}>
                Read More
              </button>
              <button className="btn" onClick={handleReport}>
                Report
              </button>
            </div>
            {/* <div className="trending__img">
              <img src={trending} alt="trending" />
            </div> */}
          </div>
          <div className="card__img">
            <img src={ma} alt="ma" />
            <p className="trending__date">{post.createdAt}</p>
            <p className="found__lost">{post.foundLost}</p>
          </div>
        </div>
      </Link>
    </>
  );
};

export default Sponsored;
