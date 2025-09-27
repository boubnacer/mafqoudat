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

  // Mobile variant styling - always show "see all"
  if (variant === "mobile") {
    return (
      <Button
        variant="contained"
        size="small"
        startIcon={currentLanguage === 'ar' ? <RenderIcon name="seeall" /> : null}
        endIcon={currentLanguage === 'ar' ? null : <RenderIcon name="seeall" />}
        onClick={() => hanldeSeeAllPosts({ foundOrlostId })}
        sx={{
          // Modern gradient style
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
          border: 'none',
          textTransform: 'none',
          fontSize: '0.8rem',
          fontWeight: 600,
          padding: '8px 16px',
          borderRadius: '8px',
          minWidth: 'auto',
          width: '100%',
          maxWidth: '200px',
          boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
            boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
            transform: 'translateY(-1px)',
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
        {t('seeAll')}
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
        // Modern gradient style matching mobile
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff',
        border: 'none',
        textTransform: 'none',
        fontSize: '0.9rem',
        fontWeight: 600,
        padding: '10px 20px',
        borderRadius: '8px',
        minWidth: 'auto',
        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
          boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
          transform: 'translateY(-1px)',
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
