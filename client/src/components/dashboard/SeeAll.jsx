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
          backgroundColor: 'rgba(255,255,255,0.2)',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.3)',
          textTransform: 'none',
          fontSize: '0.75rem',
          fontWeight: 600,
          padding: '6px 12px',
          borderRadius: '8px',
          minWidth: 'auto',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.3)',
            borderColor: 'rgba(255,255,255,0.5)',
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          },
          '& .MuiButton-endIcon': {
            marginLeft: currentLanguage === 'ar' ? 0 : '4px',
            marginRight: currentLanguage === 'ar' ? '4px' : 0
          },
          '& .MuiButton-startIcon': {
            marginRight: currentLanguage === 'ar' ? 0 : '4px',
            marginLeft: currentLanguage === 'ar' ? '4px' : 0
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
        backgroundColor: 'rgba(255,255,255,0.15)',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.3)',
        textTransform: 'none',
        fontSize: '0.875rem',
        fontWeight: 600,
        padding: '8px 16px',
        borderRadius: '10px',
        minWidth: 'auto',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease',
        '&:hover': {
          backgroundColor: 'rgba(255,255,255,0.25)',
          borderColor: 'rgba(255,255,255,0.5)',
          transform: 'translateY(-2px)',
          boxShadow: '0 6px 16px rgba(0,0,0,0.2)'
        },
        '& .MuiButton-endIcon': {
          marginLeft: currentLanguage === 'ar' ? 0 : '6px',
          marginRight: currentLanguage === 'ar' ? '6px' : 0
        },
        '& .MuiButton-startIcon': {
          marginRight: currentLanguage === 'ar' ? 0 : '6px',
          marginLeft: currentLanguage === 'ar' ? '6px' : 0
        }
      }}
    >
      {totalItems > 4 ? t('seeAll') : t('add')}
    </Button>
  );
};

export default SeeAll;
