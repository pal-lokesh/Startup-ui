import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
} from '@mui/icons-material';
import { Theme } from '../types';
import ThemeService from '../services/themeService';
import ThemeManagementForm from './ThemeManagementForm';
import ThemeImages from './ThemeImages';
import ThemeCard from './ThemeCard';

interface ThemeManagementProps {
  themes: Theme[];
  businessId: string;
  onThemesChange: (themes: Theme[]) => void;
}

const ThemeManagement: React.FC<ThemeManagementProps> = ({
  themes,
  businessId,
  onThemesChange,
}) => {
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [themeToDelete, setThemeToDelete] = useState<Theme | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  const handleAddTheme = () => {
    setEditingTheme(null);
    setIsFormOpen(true);
  };

  const handleEditTheme = (theme: Theme) => {
    setEditingTheme(theme);
    setIsFormOpen(true);
  };

  const handleDeleteTheme = (theme: Theme) => {
    setThemeToDelete(theme);
    setDeleteDialogOpen(true);
  };

  const handleFormSuccess = (updatedTheme: Theme) => {
    if (editingTheme) {
      // Update existing theme
      const updatedThemes = themes.map(theme =>
        theme.themeId === updatedTheme.themeId ? updatedTheme : theme
      );
      onThemesChange(updatedThemes);
    } else {
      // Add new theme
      onThemesChange([...themes, updatedTheme]);
    }
    setIsFormOpen(false);
  };

  const confirmDelete = async () => {
    if (!themeToDelete) return;

    try {
      setLoading(true);
      setError(null);
      
      await ThemeService.deleteTheme(themeToDelete.themeId);
      
      // Remove theme from list
      const updatedThemes = themes.filter(theme => theme.themeId !== themeToDelete.themeId);
      onThemesChange(updatedThemes);
      
      setDeleteDialogOpen(false);
      setThemeToDelete(null);
      
      // If the deleted theme was selected, clear selection
      if (selectedTheme?.themeId === themeToDelete.themeId) {
        setSelectedTheme(null);
        setActiveTab(0);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete theme');
      console.error('Error deleting theme:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setThemeToDelete(null);
    setError(null);
  };

  const handleThemeSelect = (theme: Theme) => {
    setSelectedTheme(theme);
    setActiveTab(1); // Switch to images tab
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          My Themes ({themes.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddTheme}
          disabled={!businessId}
        >
          Add Theme
        </Button>
      </Box>

      {themes.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No themes created yet
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Start by creating your first theme to showcase your work.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddTheme}
              disabled={!businessId}
            >
              Create Your First Theme
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Box>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tab label="All Themes" />
              {selectedTheme && <Tab label={`Images - ${selectedTheme.themeName}`} />}
            </Tabs>
          </Box>

          {activeTab === 0 && (
            <Grid container spacing={2}>
              {themes.map((theme) => (
                <Grid item xs={12} sm={6} md={4} key={theme.themeId}>
                  <ThemeCard
                    theme={theme}
                    onEdit={handleEditTheme}
                    onDelete={handleDeleteTheme}
                    onViewImages={handleThemeSelect}
                    showActions={true}
                  />
                </Grid>
              ))}
            </Grid>
          )}

          {activeTab === 1 && selectedTheme && (
            <ThemeImages
              themeId={selectedTheme.themeId}
              themeName={selectedTheme.themeName}
            />
          )}
        </Box>
      )}

      {/* Theme Management Form */}
      <ThemeManagementForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        theme={editingTheme}
        businessId={businessId}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Theme</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Typography>
            Are you sure you want to delete the theme "{themeToDelete?.themeName}"? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ThemeManagement;
