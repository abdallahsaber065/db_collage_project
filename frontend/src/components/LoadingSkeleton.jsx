// @ts-nocheck
import React from 'react';
import { Box, Skeleton, Paper } from '@mui/material';

function TableSkeleton({ rows = 5, columns = 6 }) {
    return (
        <Paper
            sx={{
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    gap: 2,
                    p: 2,
                    bgcolor: '#f8fafc',
                    borderBottom: '2px solid #e2e8f0',
                }}
            >
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton
                        key={`header-${i}`}
                        variant="text"
                        width={`${100 / columns}%`}
                        height={20}
                        sx={{ borderRadius: '6px' }}
                    />
                ))}
            </Box>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIdx) => (
                <Box
                    key={`row-${rowIdx}`}
                    sx={{
                        display: 'flex',
                        gap: 2,
                        p: 2,
                        borderBottom: rowIdx < rows - 1 ? '1px solid #f1f5f9' : 'none',
                    }}
                >
                    {Array.from({ length: columns }).map((_, colIdx) => (
                        <Skeleton
                            key={`cell-${rowIdx}-${colIdx}`}
                            variant="text"
                            width={`${100 / columns}%`}
                            height={18}
                            sx={{ borderRadius: '6px' }}
                            animation="wave"
                        />
                    ))}
                </Box>
            ))}
        </Paper>
    );
}

function CardSkeleton({ count = 3 }) {
    return (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
            {Array.from({ length: count }).map((_, i) => (
                <Paper key={i} sx={{ p: 3, borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Skeleton variant="circular" width={44} height={44} animation="wave" />
                        <Box sx={{ flex: 1 }}>
                            <Skeleton variant="text" width="70%" height={22} animation="wave" />
                            <Skeleton variant="text" width="40%" height={16} animation="wave" />
                        </Box>
                    </Box>
                    <Skeleton variant="rounded" width="100%" height={40} animation="wave" sx={{ borderRadius: '8px' }} />
                </Paper>
            ))}
        </Box>
    );
}

function StatsSkeleton({ count = 4 }) {
    return (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: `repeat(${count}, 1fr)` }, gap: 2, mb: 4 }}>
            {Array.from({ length: count }).map((_, i) => (
                <Paper key={i} sx={{ p: 2.5, borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                    <Skeleton variant="text" width="50%" height={16} animation="wave" />
                    <Skeleton variant="text" width="30%" height={32} animation="wave" />
                </Paper>
            ))}
        </Box>
    );
}

export { TableSkeleton, CardSkeleton, StatsSkeleton };
