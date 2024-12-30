// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Alert,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import api from '../utils/api';
import { appConfig } from '../config/appConfig';

function Departments() {
  const isPreviewMode = appConfig.previewMode;
  const [departments, setDepartments] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    Name: '',
    OfficeLocation: '',
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      const departmentsWithCounts = await Promise.all(
        response.data.map(async (dept) => {
          const detailsResponse = await api.get(`/departments/${dept.DepartmentID}`);
          return { ...dept, ...detailsResponse.data };
        })
      );
      setDepartments(departmentsWithCounts);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleOpen = (department = null) => {
    if (department) {
      setEditingDepartment(department);
      setFormData({
        Name: department.Name,
        OfficeLocation: department.OfficeLocation,
      });
    } else {
      setEditingDepartment(null);
      setFormData({
        Name: '',
        OfficeLocation: '',
      });
    }
    setError('');
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingDepartment(null);
    setError('');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (isPreviewMode) {
      return;
    }
    try {
      // Validate required fields
      if (!formData.Name || !formData.OfficeLocation) {
        setError('Please fill in all required fields');
        return;
      }

      // Validate name length
      if (formData.Name.length < 2 || formData.Name.length > 50) {
        setError('Department name must be between 2 and 50 characters');
        return;
      }

      if (editingDepartment) {
        await api.put(`/departments/${editingDepartment.DepartmentID}`, formData);
      } else {
        await api.post('/departments', formData);
      }
      fetchDepartments();
      handleClose();
    } catch (error) {
      console.error('Error saving department:', error);
      setError(error.response?.data?.message || 'Error saving department');
    }
  };

  const handleDelete = async (id) => {
    if (isPreviewMode) {
      return;
    }
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        await api.delete(`/departments/${id}`);
        fetchDepartments();
      } catch (error) {
        console.error('Error deleting department:', error);
        if (error.response?.data?.message) {
          alert(error.response.data.message);
        }
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <h1>Departments</h1>
        <Button variant="contained" onClick={() => handleOpen()} disabled={isPreviewMode}>
          Add Department
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Office Location</TableCell>
              <TableCell>Students</TableCell>
              <TableCell>Faculty</TableCell>
              <TableCell>Courses</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {departments.map((department) => (
              <TableRow key={department.DepartmentID}>
                <TableCell>{department.Name}</TableCell>
                <TableCell>{department.OfficeLocation}</TableCell>
                <TableCell>
                  <Chip 
                    label={department.StudentCount || 0}
                    color={department.StudentCount > 0 ? "primary" : "default"}
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={department.FacultyCount || 0}
                    color={department.FacultyCount > 0 ? "primary" : "default"}
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={department.CourseCount || 0}
                    color={department.CourseCount > 0 ? "primary" : "default"}
                  />
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpen(department)} disabled={isPreviewMode}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(department.DepartmentID)} disabled={isPreviewMode}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editingDepartment ? 'Edit Department' : 'Add Department'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              name="Name"
              label="Name"
              value={formData.Name}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              name="OfficeLocation"
              label="Office Location"
              value={formData.OfficeLocation}
              onChange={handleChange}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={isPreviewMode}>
            {editingDepartment ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Departments; 
