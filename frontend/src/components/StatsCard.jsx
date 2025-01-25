// @ts-nocheck
import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { motion } from 'framer-motion';

function StatsCard({ label, value, icon: Icon, color = '#6366f1', trend, delay = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay, ease: 'easeOut' }}
        >
            <Box
                className="stat-card"
                sx={{
                    bgcolor: '#fff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    p: 2.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                }}
            >
                <Box
                    sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '14px',
                        bgcolor: `${color}12`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    {Icon && <Icon sx={{ color, fontSize: 24 }} />}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                    <Typography
                        variant="caption"
                        sx={{
                            color: '#94a3b8',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                        }}
                    >
                        {label}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                        <Typography
                            variant="h5"
                            sx={{ fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}
                        >
                            {value}
                        </Typography>
                        {trend && (
                            <Typography
                                variant="caption"
                                sx={{
                                    color: trend > 0 ? '#059669' : '#dc2626',
                                    fontWeight: 600,
                                    fontSize: '0.75rem',
                                }}
                            >
                                {trend > 0 ? '+' : ''}{trend}%
                            </Typography>
                        )}
                    </Box>
                </Box>
            </Box>
        </motion.div>
    );
}

export default StatsCard;
