import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Grid, Chip, CircularProgress, Alert } from '@mui/material';
import ThemeService from '../services/themeService';
import { BusinessThemeSummaryDto } from '../types';

const ExploreThemes: React.FC = () => {
  const [data, setData] = useState<BusinessThemeSummaryDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await ThemeService.getThemesByBusinessSummary();
        setData(res);
      } catch (e) {
        setError('Failed to load themes');
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!loading && data.length === 0) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="info">No businesses found yet. Please check back later.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Explore Themes
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Browse all businesses and their available themes
      </Typography>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        {data.map((biz) => (
          <Grid item xs={12} md={6} lg={4} key={biz.businessId}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {biz.businessName}
                </Typography>
                {biz.themes.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No themes yet
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {biz.themes.map((t) => (
                      <Chip key={t.themeId} label={t.themeName} color="default" />)
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ExploreThemes;


