import React from 'react';
import { Alert, Box } from '@mui/material';
import { appConfig } from '../config/appConfig';

function PreviewBanner() {
  if (!appConfig.previewMode) {
    return null;
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Alert severity="info">
        Preview mode is active. You can browse data, but create/update/delete actions are disabled.
      </Alert>
    </Box>
  );
}

export default PreviewBanner;
