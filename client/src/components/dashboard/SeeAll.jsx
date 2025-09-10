import {
  Add,
  ArrowRightAlt,
  KeyboardArrowRightOutlined,
} from "@mui/icons-material";
import { Box, Button, IconButton, useTheme } from "@mui/material";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setActiveLink, setFoundOrLost } from "../../app/state";
import PulseLoader from "react-spinners/PulseLoader";
import RenderIcon from "../RenderIcon";
import { useTranslation } from "../../utils/translations";

const SeeAll = ({ foundOrlostId, totalItems, variant = "desktop" }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const { t, currentLanguage } = useTranslation();

  const hanldeAddNewPost = () => navigate("/dash/posts/new");

  const hanldeSeeAllPosts = ({ foundOrlostId }) => {
    navigate("/dash/posts");
    dispatch(
      setFoundOrLost({
        foundOrlost: foundOrlostId,
      })
    );
    dispatch(setActiveLink({ active: foundOrlostId }));
  };

  // Mobile variant styling
  if (variant === "mobile") {
    return (
      <Button
        variant="contained"
        size="small"
        startIcon={currentLanguage === 'ar' ? (totalItems > 4 ? <RenderIcon name="seeall" /> : <Add />) : null}
        endIcon={currentLanguage === 'ar' ? null : (totalItems > 4 ? <RenderIcon name="seeall" /> : <Add />)}
        onClick={
          totalItems > 4
            ? () => hanldeSeeAllPosts({ foundOrlostId })
            : hanldeAddNewPost
        }
        sx={{
          background: totalItems > 4 
            ? 'linear-gradient(135deg, #1976D2 0%, #1E88E5 100%)'
            : 'linear-gradient(135deg, #1976D2 0%, #1E88E5 100%)',
          color: '#fff',
          border: 'none',
          textTransform: 'none',
          fontSize: '0.8rem',
          fontWeight: 700,
          padding: '8px 16px',
          borderRadius: '8px',
          minWidth: 'auto',
          width: '100%', // Full width for mobile
          maxWidth: '200px', // Limit maximum width
          boxShadow: totalItems > 4
            ? '0 4px 15px rgba(25, 118, 210, 0.3)'
            : '0 4px 15px rgba(25, 118, 210, 0.3)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 100%)',
            opacity: 0,
            transition: 'opacity 0.3s ease',
          },
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: totalItems > 4
              ? '0 8px 25px rgba(25, 118, 210, 0.4)'
              : '0 8px 25px rgba(25, 118, 210, 0.4)',
            '&::before': {
              opacity: 1,
            }
          },
          '&:active': {
            transform: 'translateY(0px)',
            boxShadow: totalItems > 4
              ? '0 2px 10px rgba(25, 118, 210, 0.3)'
              : '0 2px 10px rgba(25, 118, 210, 0.3)',
          },
          '& .MuiButton-endIcon': {
            marginLeft: currentLanguage === 'ar' ? 0 : '6px',
            marginRight: currentLanguage === 'ar' ? '6px' : 0,
            fontSize: '16px'
          },
          '& .MuiButton-startIcon': {
            marginRight: currentLanguage === 'ar' ? 0 : '6px',
            marginLeft: currentLanguage === 'ar' ? '6px' : 0,
            fontSize: '16px'
          }
        }}
      >
        {totalItems > 4 ? t('seeAll') : t('add')}
      </Button>
    );
  }

  // Desktop variant styling
  return (
    <Button
      variant="contained"
      size="medium"
      startIcon={currentLanguage === 'ar' ? (totalItems > 4 ? <RenderIcon name="seeall" /> : <Add />) : null}
      endIcon={currentLanguage === 'ar' ? null : (totalItems > 4 ? <RenderIcon name="seeall" /> : <Add />)}
      onClick={
        totalItems > 4
          ? () => hanldeSeeAllPosts({ foundOrlostId })
          : hanldeAddNewPost
      }
        sx={{
          background: totalItems > 4 
            ? 'linear-gradient(135deg, #1976D2 0%, #1E88E5 100%)'
            : 'linear-gradient(135deg, #1976D2 0%, #1E88E5 100%)',
          color: '#fff',
          border: 'none',
          textTransform: 'none',
          fontSize: '0.9rem',
          fontWeight: 700,
          padding: '10px 20px',
          borderRadius: '10px',
          minWidth: 'auto',
          boxShadow: totalItems > 4
            ? '0 6px 20px rgba(25, 118, 210, 0.3)'
            : '0 6px 20px rgba(25, 118, 210, 0.3)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, rgba(255,255,255,0.15) 0%, transparent 100%)',
            opacity: 0,
            transition: 'opacity 0.3s ease',
          },
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: totalItems > 4
              ? '0 12px 30px rgba(25, 118, 210, 0.4)'
              : '0 12px 30px rgba(25, 118, 210, 0.4)',
            '&::before': {
              opacity: 1,
            }
          },
          '&:active': {
            transform: 'translateY(-1px)',
            boxShadow: totalItems > 4
              ? '0 4px 15px rgba(25, 118, 210, 0.3)'
              : '0 4px 15px rgba(25, 118, 210, 0.3)',
          },
          '& .MuiButton-endIcon': {
            marginLeft: currentLanguage === 'ar' ? 0 : '8px',
            marginRight: currentLanguage === 'ar' ? '8px' : 0,
            fontSize: '18px'
          },
          '& .MuiButton-startIcon': {
            marginRight: currentLanguage === 'ar' ? 0 : '8px',
            marginLeft: currentLanguage === 'ar' ? '8px' : 0,
            fontSize: '18px'
          }
        }}
      >
        {totalItems > 4 ? t('seeAll') : t('add')}
      </Button>
  );
};

export default SeeAll;
