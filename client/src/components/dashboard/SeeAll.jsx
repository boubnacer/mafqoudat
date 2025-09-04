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
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          color: '#fff',
          border: 'none',
          textTransform: 'none',
          fontSize: '0.8rem',
          fontWeight: 700,
          padding: '8px 16px',
          borderRadius: '12px',
          minWidth: 'auto',
          width: '100%', // Full width for mobile
          maxWidth: '200px', // Limit maximum width
          boxShadow: totalItems > 4
            ? '0 4px 15px rgba(102, 126, 234, 0.4)'
            : '0 4px 15px rgba(245, 87, 108, 0.4)',
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
              ? '0 8px 25px rgba(102, 126, 234, 0.6)'
              : '0 8px 25px rgba(245, 87, 108, 0.6)',
            '&::before': {
              opacity: 1,
            }
          },
          '&:active': {
            transform: 'translateY(0px)',
            boxShadow: totalItems > 4
              ? '0 2px 10px rgba(102, 126, 234, 0.4)'
              : '0 2px 10px rgba(245, 87, 108, 0.4)',
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
  // If totalItems is 0 or undefined, don't render anything
  if (!totalItems || totalItems === 0) {
    return null;
  }
  
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
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          color: '#fff',
          border: 'none',
          textTransform: 'none',
          fontSize: '0.9rem',
          fontWeight: 700,
          padding: '10px 20px',
          borderRadius: '14px',
          minWidth: 'auto',
          boxShadow: totalItems > 4
            ? '0 6px 20px rgba(102, 126, 234, 0.4)'
            : '0 6px 20px rgba(245, 87, 108, 0.4)',
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
              ? '0 12px 30px rgba(102, 126, 234, 0.6)'
              : '0 12px 30px rgba(245, 87, 108, 0.6)',
            '&::before': {
              opacity: 1,
            }
          },
          '&:active': {
            transform: 'translateY(-1px)',
            boxShadow: totalItems > 4
              ? '0 4px 15px rgba(102, 126, 234, 0.4)'
              : '0 4px 15px rgba(245, 87, 108, 0.4)',
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
