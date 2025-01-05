// @ts-nocheck
import React from 'react';
import { Box, Typography, Button, useTheme, useMediaQuery } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';

function PageHeader({ title, subtitle, icon: Icon, actionLabel, onAction, actionDisabled, count }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
        >
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    justifyContent: 'space-between',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    gap: 2,
                    mb: 4,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {Icon && (
                        <Box
                            sx={{
                                width: 52,
                                height: 52,
                                borderRadius: '14px',
                                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                            }}
                        >
                            <Icon sx={{ color: '#fff', fontSize: 28 }} />
                        </Box>
                    )}
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Typography
                                variant="h4"
                                sx={{
                                    fontWeight: 800,
                                    fontSize: isMobile ? '1.5rem' : '1.85rem',
                                    color: '#1e293b',
                                    letterSpacing: '-0.025em',
                                }}
                            >
                                {title}
                            </Typography>
                            {count !== undefined && (
                                <Box
                                    sx={{
                                        bgcolor: '#ede9fe',
                                        color: '#6366f1',
                                        px: 1.5,
                                        py: 0.25,
                                        borderRadius: '8px',
                                        fontWeight: 700,
                                        fontSize: '0.8125rem',
                                    }}
                                >
                                    {count}
                                </Box>
                            )}
                        </Box>
                        {subtitle && (
                            <Typography
                                variant="body2"
                                sx={{ color: '#64748b', mt: 0.25, fontSize: '0.875rem' }}
                            >
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                </Box>

                {actionLabel && (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={onAction}
                        disabled={actionDisabled}
                        sx={{
                            px: 3,
                            py: 1.2,
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                                boxShadow: '0 6px 20px rgba(99, 102, 241, 0.5)',
                                transform: 'translateY(-1px)',
                            },
                            transition: 'all 0.2s ease',
                            whiteSpace: 'nowrap',
                            width: isMobile ? '100%' : 'auto',
                        }}
                    >
                        {actionLabel}
                    </Button>
                )}
            </Box>
        </motion.div>
    );
}

export default PageHeader;
