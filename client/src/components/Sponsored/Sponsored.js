import React from "react";
import { Link, useNavigate } from "react-router-dom";
import defaultImage from "../../../img/ma.jpg";
import "./sponsored.css";

const Sponsored = ({ post }) => {
  const navigate = useNavigate();

  const handleEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/dash/posts/${post.id}`);
  };

  const handleReport = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/dash/posts/report/${post.id}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  return (
    <Link to={`/dash/posts/${post.id}`}>
      <div className="sponsored__card">
        <div className="sponsored__info">
          <h3>{post.category}</h3>
          <h4>{post.region}</h4>
          <small>{post.contact}</small>
          <div className="sponsored-handle__edit">
            <button className="btn btn-primary" onClick={handleEdit}>
              Read More
            </button>
            <button className="btn btn-secondary" onClick={handleReport}>
              Report
            </button>
          </div>
        </div>
        <div className="card__img">
          <img 
            src={post.image || defaultImage} 
            alt={`${post.category} - ${post.region}`}
            onError={(e) => {
              e.target.src = defaultImage;
            }}
          />
          <div className={`status-badge ${post.foundLost?.toLowerCase()}`}>
            {post.foundLost}
          </div>
          <p className="trending__date">{formatDate(post.createdAt)}</p>
        </div>
      </div>
    </Link>
  );
};

export default Sponsored;