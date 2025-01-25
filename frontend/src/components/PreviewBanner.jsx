// @ts-nocheck
import React from 'react';
import { Alert, Box, Typography } from '@mui/material';
import { VisibilityOutlined as PreviewIcon } from '@mui/icons-material';
import { appConfig } from '../config/appConfig';

function PreviewBanner() {
  if (!appConfig.previewMode) {
    return null;
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Alert
        severity="info"
        icon={<PreviewIcon />}
        sx={{
          borderRadius: '14px',
          border: '1px solid #bfdbfe',
          bgcolor: '#eff6ff',
          '& .MuiAlert-icon': {
            color: '#3b82f6',
          },
          py: 1.5,
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e40af' }}>
          Preview Mode
        </Typography>
        <Typography variant="caption" sx={{ color: '#3b82f6' }}>
          You can browse data, but create/update/delete actions are disabled.
        </Typography>
      </Alert>
    </Box>
  );
}

export default PreviewBanner;
