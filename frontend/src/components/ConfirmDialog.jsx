// @ts-nocheck
import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    IconButton,
} from '@mui/material';
import { Close as CloseIcon, WarningAmber as WarningIcon } from '@mui/icons-material';

function ConfirmDialog({
    open,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onConfirm,
    onCancel,
    severity = 'warning', // 'warning' | 'error' | 'info'
}) {
    const colors = {
        warning: { bg: '#fef3c7', icon: '#d97706', btn: '#d97706' },
        error: { bg: '#fee2e2', icon: '#dc2626', btn: '#dc2626' },
        info: { bg: '#dbeafe', icon: '#2563eb', btn: '#2563eb' },
    };

    const c = colors[severity] || colors.warning;

    return (
        <Dialog
            open={open}
            onClose={onCancel}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: { borderRadius: '20px', p: 1 },
            }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {title}
                </Typography>
                <IconButton onClick={onCancel} size="small" sx={{ color: '#94a3b8' }}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mt: 1 }}>
                    <Box
                        sx={{
                            width: 44,
                            height: 44,
                            borderRadius: '12px',
                            bgcolor: c.bg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        <WarningIcon sx={{ color: c.icon }} />
                    </Box>
                    <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.6, pt: 0.5 }}>
                        {message}
                    </Typography>
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
                <Button
                    onClick={onCancel}
                    sx={{
                        color: '#64748b',
                        fontWeight: 600,
                        borderRadius: '10px',
                        px: 2.5,
                        '&:hover': { bgcolor: '#f1f5f9' },
                    }}
                >
                    {cancelLabel}
                </Button>
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    sx={{
                        bgcolor: c.btn,
                        borderRadius: '10px',
                        px: 2.5,
                        fontWeight: 600,
                        boxShadow: 'none',
                        '&:hover': { bgcolor: c.btn, filter: 'brightness(0.9)', boxShadow: 'none' },
                    }}
                >
                    {confirmLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ConfirmDialog;
