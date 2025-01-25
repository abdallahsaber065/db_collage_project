// @ts-nocheck
import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { SearchOff as SearchOffIcon, InboxOutlined as InboxIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';

function EmptyState({ icon: Icon = InboxIcon, title = 'No data found', subtitle, actionLabel, onAction }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
        >
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: 8,
                    px: 3,
                }}
            >
                <Box
                    sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '20px',
                        bgcolor: '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 3,
                    }}
                >
                    <Icon sx={{ fontSize: 40, color: '#94a3b8' }} />
                </Box>
                <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, color: '#334155', mb: 0.5, textAlign: 'center' }}
                >
                    {title}
                </Typography>
                {subtitle && (
                    <Typography
                        variant="body2"
                        sx={{ color: '#94a3b8', mb: 3, textAlign: 'center', maxWidth: 320 }}
                    >
                        {subtitle}
                    </Typography>
                )}
                {actionLabel && (
                    <Button
                        variant="contained"
                        onClick={onAction}
                        sx={{
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            px: 3,
                            py: 1,
                            borderRadius: '12px',
                            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                        }}
                    >
                        {actionLabel}
                    </Button>
                )}
            </Box>
        </motion.div>
    );
}

export default EmptyState;
