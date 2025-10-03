import {
  Add,
  ArrowRightAlt,
  KeyboardArrowRightOutlined,
} from "@mui/icons-material";
import { Box, Button, IconButton, useTheme, Typography } from "@mui/material";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setActiveLink, setFoundOrLost } from "../../app/state";
import PulseLoader from "react-spinners/PulseLoader";
import RenderIcon from "../RenderIcon";
import { useTranslation } from "../../utils/translations";
import { useGetflOptionsQuery } from "../../features/dependencies/dependenciesApiSlice";

const SeeAll = ({ foundOrlostId, totalItems, variant = "desktop", postType = "found" }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const { t, currentLanguage } = useTranslation();

  // Get found/lost options for navigation (same as navbar)
  const { data: flOptionsData } = useGetflOptionsQuery({
    language: currentLanguage
  }, {
    selectFromResult: ({ data }) => ({
      data: data?.ids?.map((id) => data?.entities[id]) || [],
    }),
  });

  const hanldeAddNewPost = () => navigate("/dash/posts/new");

  const hanldeSeeAllPosts = ({ foundOrlostId }) => {
    // Navigate with the correct found/lost ID filter (same as navbar)
    navigate(`/dash/posts?fl=${foundOrlostId}`);
    dispatch(
      setFoundOrLost({
        foundOrlost: foundOrlostId,
      })
    );
    dispatch(setActiveLink({ active: foundOrlostId }));
  };

  // Mobile variant styling - show "see all" if > 2 posts, otherwise show "add" with message
  if (variant === "mobile") {
    // If there are 2 or more posts, show "See All" button
    if (totalItems >= 2) {
      return (
        <Button
          variant="contained"
          size="small"
          startIcon={currentLanguage === 'ar' ? <RenderIcon name="seeall" /> : null}
          endIcon={currentLanguage === 'ar' ? null : <RenderIcon name="seeall" />}
          onClick={() => hanldeSeeAllPosts({ foundOrlostId })}
          sx={{
            background: 'linear-gradient(45deg, #4A8BFF 30%, #1A6EEE 90%)',
            color: '#fff',
            border: 'none',
            textTransform: 'none',
            fontSize: '0.8rem',
            fontWeight: 700,
            padding: '8px 16px',
            borderRadius: '4px',
            minWidth: 'auto',
            width: '100%',
            maxWidth: '200px',
            boxShadow: '0 3px 5px 2px rgba(26, 110, 238, .3)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              background: 'linear-gradient(45deg, #5A9BFF 30%, #2A7EFF 90%)',
              boxShadow: '0 4px 8px 2px rgba(26, 110, 238, .4)',
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
    
    // If there's only 1 post, show message with "Add" button
    return (
      <Box sx={{ textAlign: 'center', width: '100%' }}>
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
            fontSize: '0.75rem',
            lineHeight: 1.4,
            mb: 2,
            px: 1
          }}
        >
          {postType === 'found' ? t('onlyOneFoundPost') : t('onlyOneLostPost')}
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={currentLanguage === 'ar' ? <Add /> : null}
          endIcon={currentLanguage === 'ar' ? null : <Add />}
          onClick={hanldeAddNewPost}
          sx={{
            background: 'linear-gradient(45deg, #4A8BFF 30%, #1A6EEE 90%)',
            color: '#fff',
            border: 'none',
            textTransform: 'none',
            fontSize: '0.8rem',
            fontWeight: 700,
            padding: '8px 16px',
            borderRadius: '4px',
            minWidth: 'auto',
            width: '100%',
            maxWidth: '200px',
            boxShadow: '0 3px 5px 2px rgba(26, 110, 238, .3)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              background: 'linear-gradient(45deg, #5A9BFF 30%, #2A7EFF 90%)',
              boxShadow: '0 4px 8px 2px rgba(26, 110, 238, .4)',
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
          {t('add')}
        </Button>
      </Box>
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
        background: 'linear-gradient(45deg, #4A8BFF 30%, #1A6EEE 90%)',
        color: '#fff',
        border: 'none',
        textTransform: 'none',
        fontSize: '0.9rem',
        fontWeight: 700,
        padding: '10px 20px',
        borderRadius: '4px',
        minWidth: 'auto',
        boxShadow: '0 3px 5px 2px rgba(26, 110, 238, .3)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          background: 'linear-gradient(45deg, #5A9BFF 30%, #2A7EFF 90%)',
          boxShadow: '0 4px 8px 2px rgba(26, 110, 238, .4)',
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
