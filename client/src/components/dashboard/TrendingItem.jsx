import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Typography,
  useTheme,
} from "@mui/material";
import FlexBetween from "../FlexBetween";
import RenderIcon from "../RenderIcon";
import PulseLoader from "react-spinners/PulseLoader";
import ma from "../../img/ma.jpg";

const TrendingItem = ({ trend, isLoading }) => {
  const { categoryName, floptionName, region, image, createdAt } = trend[0] || {};
  const theme = useTheme();

  if (isLoading) return <PulseLoader />;
  if (!trend[0]) return <PulseLoader />;

  return (
    <Box flex={1.3}>
      <Card
        sx={{
          background: 'linear-gradient(135deg, rgba(60,60,60,0.95) 0%, rgba(30,30,30,0.95) 100%)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.08)',
          overflow: 'hidden',
          transition: 'transform 0.3s ease',
          '&:hover': {
            transform: 'translateY(-5px)',
          }
        }}
      >
        <Box sx={{ display: 'flex', height: '100%' }}>
          <Box sx={{ flex: 1, position: 'relative' }}>
            <CardContent sx={{ height: '100%', position: 'relative' }}>
              <FlexBetween>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'rgba(77, 77, 77, 0.5)',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    gap: '8px',
                    backdropFilter: 'blur(5px)',
                  }}
                >
                  <RenderIcon name={categoryName} />
                  <Typography
                    variant="category"
                    sx={{
                      color: '#E0E0E0',
                      fontWeight: 500,
                      fontSize: '14px',
                    }}
                  >
                    {categoryName}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    background: floptionName === "Found" 
                      ? 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)'
                      : 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
                    padding: '8px 16px',
                    borderRadius: '24px',
                    gap: '8px',
                  }}
                >
                  <Typography
                    sx={{
                      color: '#FFFFFF',
                      fontSize: '14px',
                      fontWeight: 500,
                    }}
                  >
                    {floptionName}
                  </Typography>
                  <RenderIcon name={`${floptionName}fl`} />
                </Box>
              </FlexBetween>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  mt: '24px',
                }}
              >
                <RenderIcon name="time" />
                <Typography
                  sx={{
                    color: '#E0E0E0',
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                >
                  {new Date(createdAt).toLocaleDateString()}
                </Typography>
              </Box>

              <Box
                sx={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '16px',
                  right: '16px',
                }}
              >
                <Button
                  fullWidth
                  sx={{
                    color: theme.palette.textColor.main,
                    background: 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(5px)',
                    borderRadius: '12px',
                    padding: '12px',
                    textTransform: 'none',
                    fontSize: '14px',
                    fontWeight: 500,
                    '&:hover': {
                      background: 'rgba(255,255,255,0.1)',
                    }
                  }}
                  endIcon={<RenderIcon name="view" />}
                >
                  Learn More
                </Button>
              </Box>
            </CardContent>
          </Box>

          <Box sx={{ flex: 1.2, position: 'relative' }}>
            <CardMedia
              component="img"
              height="100%"
              image={image ? `http://localhost:3500/${image}` : ma}
              title={image}
              sx={{
                objectFit: 'cover',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%)',
              }}
            />
          </Box>
        </Box>
      </Card>
    </Box>
  );
};

export default TrendingItem;
