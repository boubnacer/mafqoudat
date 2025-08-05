import React from "react";
import { Link, useNavigate } from "react-router-dom";
import defaultImage from "../../../img/ma.jpg";
import "./sponsored.css";
import { useTranslation } from "../../utils/translations";

const Sponsored = ({ post }) => {
  const navigate = useNavigate();
  const { t, currentLanguage } = useTranslation();

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
    return new Intl.DateTimeFormat(currentLanguage === 'ar' ? 'ar-SA' : currentLanguage === 'fr' ? 'fr-FR' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  return (
    <Link to={`/dash/posts/${post.id}`} className="sponsored__link">
      <div className="sponsored__card">
        <div className="sponsored__info">
          <div className="sponsored__header">
            <h3>{post.category}</h3>
            <div className={`status-badge ${post.foundLost?.toLowerCase()}`}>
              {post.foundLost}
            </div>
          </div>
          <h4>{post.region}</h4>
          <small>{post.contact}</small>
          <div className="sponsored-handle__edit">
            <button className="btn btn-primary" onClick={handleEdit}>
              {t('readMore')}
            </button>
            <button className="btn btn-secondary" onClick={handleReport}>
              {t('report')}
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
          <p className="trending__date">{formatDate(post.createdAt)}</p>
        </div>
      </div>
    </Link>
  );
};

export default Sponsored;