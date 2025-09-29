import React from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
} from "@mui/material";
import { Search, FilterList } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { SearchLoadingStates } from "../LoadingStates";
import { useTranslation } from "../../utils/translations";
import LazyCardMedia from "../LazyCardMedia";
import noImageSvg from "../../img/noimage.svg";

const SearchSection = ({
  searchQuery,
  handleSearchChange,
  isSearching,
  isSearchLoading,
  searchData,
  handleCreateNewPost
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <>
      {/* Search and Filter Section */}
      <Box m="0 1rem" mb="2rem">
        <Paper 
          elevation={3} 
          sx={{ 
            p: 2, 
            display: 'flex', 
            gap: 2, 
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center'
          }}
        >
          <TextField
            fullWidth
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={t('searchPostsPlaceholder')}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <Button 
            variant="contained" 
            startIcon={<FilterList />}
            sx={{ minWidth: '120px' }}
          >
            {t('filters')}
          </Button>
        </Paper>
      </Box>

      {/* Search Results Section */}
      {isSearching && (
        <Box m="0 1rem" mb="2rem">
          {isSearchLoading ? (
            <SearchLoadingStates.Searching />
          ) : searchData?.postsWithUser?.length > 0 ? (
            <Box>
              <Typography variant="h6" mb={2}>{t('searchResults')}</Typography>
              <Grid container spacing={2}>
                {searchData.postsWithUser.map((post) => (
                  <Grid item xs={12} sm={6} md={4} key={post._id}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { transform: 'scale(1.02)' },
                        transition: 'transform 0.2s'
                      }}
                      onClick={() => navigate(`/dash/posts/${post._id}`)}
                    >
                      <LazyCardMedia
                        sx={{ 
                          height: 150,
                        }}
                        image={post.image ? `${process.env.REACT_APP_API_URL || "http://localhost:3500"}/${post.image}` : noImageSvg}
                        alt={post.image}
                        fallback={noImageSvg}
                      />
                      <CardContent>
                        <Typography variant="h6">{post.categoryname}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {post.region}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {post.foundLost}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
                    ) : (
            <SearchLoadingStates.NoSearchResults 
              query={searchQuery} 
              onCreatePost={handleCreateNewPost}
            />
          )}
        </Box>
      )}
    </>
  );
};

export default SearchSection; 