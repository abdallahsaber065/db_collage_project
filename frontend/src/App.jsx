import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import Navbar from './components/Navbar';
import PreviewBanner from './components/PreviewBanner';
import Students from './pages/Students';
import Courses from './pages/Courses';
import Faculty from './pages/Faculty';
import Departments from './pages/Departments';
import Registrations from './pages/Registrations';

function App() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Container component="main" sx={{ mt: 4, mb: 4, flex: 1 }}>
        <PreviewBanner />
        <Routes>
          <Route path="/" element={<Students />} />
          <Route path="/students" element={<Students />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/faculty" element={<Faculty />} />
          <Route path="/departments" element={<Departments />} />
          <Route path="/registrations" element={<Registrations />} />
        </Routes>
      </Container>
    </Box>
  );
}

export default App; 
