import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import noImagePng from "../../img/noimage.png";
import "./sponsored.css";
import { useTranslation } from "../../utils/translations";
import { getOptimizedImageUrl } from "../../utils/cloudinaryUtils";
import LazyImage from "../LazyImage";
import ReportDialog from "../ReportDialog";
import { useSubmitReportMutation } from "../../features/posts/reportsApiSlice";
import useAuth from "../../hooks/useAuth";

const Sponsored = ({ post }) => {
  const navigate = useNavigate();
  const { t, currentLanguage } = useTranslation();
  const { usernameId } = useAuth();
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [submitReport] = useSubmitReportMutation();

  const handleEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/dash/posts/${post.id}`);
  };

  const handleReport = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setReportDialogOpen(true);
  };

  const handleSubmitReport = async (reportData) => {
    try {
      await submitReport(reportData).unwrap();
    } catch (error) {
      throw new Error(error.data?.message || 'Failed to submit report');
    }
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
          <LazyImage 
            src={post.image ? (post.image.startsWith('http') ? getOptimizedImageUrl(post.image, 'card') : post.image) : noImagePng} 
            alt={`${post.category} - ${post.region}`}
            fallback={noImagePng}
            onError={(e) => {
              console.log('Image failed to load:', e.target.src);
            }}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: post.image ? 'cover' : 'contain',
              // Make PNG smaller when no image
              ...(post.image ? {} : {
                maxWidth: '70%',
                maxHeight: '70%',
                margin: 'auto',
              }),
            }}
          />
          <p className="trending__date">{formatDate(post.createdAt)}</p>
        </div>
      </div>
    </Link>
    
    {/* Report Dialog */}
    <ReportDialog
      open={reportDialogOpen}
      onClose={() => setReportDialogOpen(false)}
      post={post}
      onSubmit={handleSubmitReport}
    />
  );
};

export default Sponsored;