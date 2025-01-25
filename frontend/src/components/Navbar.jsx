// @ts-nocheck
import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  useTheme,
  useMediaQuery,
  Divider,
  tooltipClasses,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  People as PeopleIcon,
  MenuBook as CoursesIcon,
  School as FacultyIcon,
  Business as DeptIcon,
  Assignment as RegIcon,
  Info as InfoIcon,
  School,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const DRAWER_WIDTH = 260;

const navItems = [
  { label: 'Students', path: '/students', icon: PeopleIcon },
  { label: 'Courses', path: '/courses', icon: CoursesIcon },
  { label: 'Faculty', path: '/faculty', icon: FacultyIcon },
  { label: 'Departments', path: '/departments', icon: DeptIcon },
  { label: 'Registrations', path: '/registrations', icon: RegIcon },
];

const InfoTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: '#1e293b',
    color: '#e2e8f0',
    maxWidth: 320,
    fontSize: '0.8125rem',
    borderRadius: 12,
    padding: '14px 18px',
    lineHeight: 1.6,
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
  },
  [`& .${tooltipClasses.arrow}`]: {
    color: '#1e293b',
  },
}));

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (path) => {
    if (path === '/students' && location.pathname === '/') return true;
    return location.pathname === path;
  };

  const handleNavigate = (path) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <School sx={{ color: '#fff', fontSize: 20 }} />
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>
            UniManager
          </Typography>
        </Box>
        <IconButton onClick={() => setDrawerOpen(false)} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <Divider />
      <List sx={{ flex: 1, px: 1.5, py: 2 }}>
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavigate(item.path)}
                sx={{
                  borderRadius: '12px',
                  py: 1.2,
                  px: 2,
                  bgcolor: active ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                  color: active ? '#6366f1' : '#475569',
                  '&:hover': {
                    bgcolor: active ? 'rgba(99, 102, 241, 0.12)' : '#f1f5f9',
                  },
                  transition: 'all 0.15s ease',
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: active ? '#6366f1' : '#94a3b8' }}>
                  <item.icon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: active ? 700 : 500,
                  }}
                />
                {active && (
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: '#6366f1',
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid #e2e8f0',
          color: '#1e293b',
        }}
      >
        <Toolbar
          sx={{
            justifyContent: 'space-between',
            px: { xs: 2, md: 4 },
            minHeight: { xs: 64, md: 68 },
          }}
        >
          {/* Left: Logo + Name */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {isMobile && (
              <IconButton
                onClick={() => setDrawerOpen(true)}
                sx={{ mr: 0.5, color: '#475569' }}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
                cursor: 'pointer',
              }}
              onClick={() => navigate('/')}
            >
              <FacultyIcon sx={{ color: '#fff', fontSize: 20 }} />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1rem', md: '1.1rem' },
                cursor: 'pointer',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em',
              }}
              onClick={() => navigate('/')}
            >
              UniManager
            </Typography>
            <InfoTooltip
              title={
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: '#fff', mb: 0.5 }}>
                    College Database Project
                  </Typography>
                  <Typography sx={{ fontSize: '0.8125rem', color: '#cbd5e1', lineHeight: 1.6 }}>
                    This is a university management system built as a college project focusing on database design and normalization. The interface provides a friendly way to interact with the underlying PostgreSQL database.
                  </Typography>
                </Box>
              }
              arrow
              placement="bottom-start"
            >
              <IconButton
                size="small"
                sx={{
                  ml: 0.5,
                  color: '#94a3b8',
                  '&:hover': { color: '#6366f1', bgcolor: 'rgba(99, 102, 241, 0.08)' },
                }}
              >
                <InfoIcon fontSize="small" />
              </IconButton>
            </InfoTooltip>
          </Box>

          {/* Center: Desktop nav */}
          {!isMobile && (
            <Box
              sx={{
                display: 'flex',
                gap: 0.5,
                bgcolor: '#f1f5f9',
                borderRadius: '14px',
                p: 0.5,
              }}
            >
              {navItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <Box
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.75,
                      px: 2,
                      py: 1,
                      borderRadius: '10px',
                      cursor: 'pointer',
                      bgcolor: active ? '#fff' : 'transparent',
                      color: active ? '#6366f1' : '#64748b',
                      boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      fontWeight: active ? 600 : 500,
                      fontSize: '0.8125rem',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        color: active ? '#6366f1' : '#1e293b',
                        bgcolor: active ? '#fff' : 'rgba(255,255,255,0.6)',
                      },
                      userSelect: 'none',
                    }}
                  >
                    <item.icon sx={{ fontSize: 18 }} />
                    {item.label}
                  </Box>
                );
              })}
            </Box>
          )}

          {/* Right: placeholder for future features */}
          <Box sx={{ width: isMobile ? 0 : 80 }} />
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: DRAWER_WIDTH,
            borderRadius: '0 20px 20px 0',
            border: 'none',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
}

export default Navbar;
