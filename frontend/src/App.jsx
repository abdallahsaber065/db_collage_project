// @ts-nocheck
import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import PreviewBanner from './components/PreviewBanner';
import Students from './pages/Students';
import Courses from './pages/Courses';
import Faculty from './pages/Faculty';
import Departments from './pages/Departments';
import Registrations from './pages/Registrations';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -12 },
};

const pageTransition = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.25,
};

function AnimatedPage({ children }) {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      {children}
    </motion.div>
  );
}

function App() {
  const location = useLocation();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: '#f1f5f9',
      }}
    >
      <Navbar />
      <Container
        component="main"
        maxWidth="xl"
        sx={{
          mt: { xs: 2.5, md: 4 },
          mb: 4,
          flex: 1,
          px: { xs: 2, sm: 3, md: 4 },
        }}
      >
        <PreviewBanner />
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<AnimatedPage><Students /></AnimatedPage>} />
            <Route path="/students" element={<AnimatedPage><Students /></AnimatedPage>} />
            <Route path="/courses" element={<AnimatedPage><Courses /></AnimatedPage>} />
            <Route path="/faculty" element={<AnimatedPage><Faculty /></AnimatedPage>} />
            <Route path="/departments" element={<AnimatedPage><Departments /></AnimatedPage>} />
            <Route path="/registrations" element={<AnimatedPage><Registrations /></AnimatedPage>} />
          </Routes>
        </AnimatePresence>
      </Container>
      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 4,
          textAlign: 'center',
          borderTop: '1px solid #e2e8f0',
          bgcolor: '#fff',
          color: '#94a3b8',
          fontSize: '0.8125rem',
        }}
      >
        College Database Project &middot; University Management System
      </Box>
    </Box>
  );
}

export default App;
