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
  MenuItem,
  Alert,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import api from '../utils/api';
import { appConfig } from '../config/appConfig';

function Faculty() {
  const isPreviewMode = appConfig.previewMode;
  const [facultyMembers, setFacultyMembers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingFacultyMember, setEditingFacultyMember] = useState(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    Name: '',
    Gender: '',
    PhoneNumber: '',
    DepartmentID: '',
    Position: '',
    Salary: '',
    HireDate: '',
  });

  useEffect(() => {
    fetchFaculty();
    fetchDepartments();
  }, []);

  const fetchFaculty = async () => {
    try {
      const response = await api.get('/faculty');
      setFacultyMembers(response.data);
    } catch (error) {
      console.error('Error fetching faculty members:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setDepartments(response.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleOpen = (facultyMember = null) => {
    if (facultyMember) {
      setEditingFacultyMember(facultyMember);
      setFormData({
        ...facultyMember,
        HireDate: facultyMember.HireDate ? new Date(facultyMember.HireDate).toISOString().split('T')[0] : '',
      });
    } else {
      setEditingFacultyMember(null);
      setFormData({
        Name: '',
        Gender: '',
        PhoneNumber: '',
        DepartmentID: '',
        Position: '',
        Salary: '',
        HireDate: '',
      });
    }
    setError('');
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingFacultyMember(null);
    setError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    if (isPreviewMode) {
      return;
    }
    try {
      // Validate required fields
      const requiredFields = ['Name', 'Gender', 'DepartmentID', 'Position'];
      const missingFields = requiredFields.filter(field => !formData[field]);
      if (missingFields.length > 0) {
        setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
        return;
      }

      // Validate salary
      if (formData.Salary && (isNaN(formData.Salary) || formData.Salary < 0)) {
        setError('Please enter a valid salary');
        return;
      }

      // Validate phone number format
      const phoneRegex = /^\+?[\d\s-]{10,}$/;
      if (formData.PhoneNumber && !phoneRegex.test(formData.PhoneNumber)) {
        setError('Please enter a valid phone number');
        return;
      }

      if (editingFacultyMember) {
        await api.put(`/faculty/${editingFacultyMember.EmployeeID}`, formData);
      } else {
        await api.post('/faculty', formData);
      }
      fetchFaculty();
      handleClose();
    } catch (error) {
      console.error('Error saving faculty member:', error);
      setError(error.response?.data?.message || 'Error saving faculty member');
    }
  };

  const handleDelete = async (id) => {
    if (isPreviewMode) {
      return;
    }
    try {
      // First try to delete without force
      try {
        const response = await api.delete(`/faculty/${id}`);
        if (response.data.message) {
          fetchFaculty();
          alert('Faculty member deleted successfully');
        }
      } catch (error) {
        // If error contains information about lectures/labs
        if (error.response?.data?.message?.includes('teaching')) {
          if (window.confirm(error.response.data.message + '\nClick OK to delete everything.')) {
            // Retry with force delete
            const forceResponse = await api.delete(`/faculty/${id}?force=true`);
            if (forceResponse.data.message) {
              fetchFaculty();
              alert('Faculty member and their teaching assignments have been deleted successfully.');
            }
          }
        } else {
          // For other errors
          alert(error.response?.data?.message || 'Error deleting faculty member');
        }
      }
    } catch (error) {
      console.error('Error in delete operation:', error);
      alert('An unexpected error occurred');
    }
  };

  const formatSalary = (salary) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(salary);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <h1>Faculty</h1>
        <Button variant="contained" onClick={() => handleOpen()} disabled={isPreviewMode}>
          Add Faculty Member
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Phone Number</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Position</TableCell>
              <TableCell>Salary</TableCell>
              <TableCell>Hire Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {facultyMembers.map((facultyMember) => (
              <TableRow key={facultyMember.EmployeeID}>
                <TableCell>{facultyMember.Name}</TableCell>
                <TableCell>{facultyMember.Gender}</TableCell>
                <TableCell>{facultyMember.PhoneNumber}</TableCell>
                <TableCell>
                  {departments.find(d => d.DepartmentID === facultyMember.DepartmentID)?.Name}
                </TableCell>
                <TableCell>{facultyMember.Position}</TableCell>
                <TableCell>{formatSalary(facultyMember.Salary)}</TableCell>
                <TableCell>{formatDate(facultyMember.HireDate)}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpen(facultyMember)} disabled={isPreviewMode}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(facultyMember.EmployeeID)} disabled={isPreviewMode}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingFacultyMember ? 'Edit Faculty Member' : 'Add Faculty Member'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              name="Name"
              label="Name"
              value={formData.Name}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              name="Gender"
              label="Gender"
              value={formData.Gender}
              onChange={handleChange}
              select
              fullWidth
              required
            >
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
            </TextField>
            <TextField
              name="PhoneNumber"
              label="Phone Number"
              value={formData.PhoneNumber}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              name="DepartmentID"
              label="Department"
              value={formData.DepartmentID}
              onChange={handleChange}
              select
              fullWidth
              required
            >
              {departments.map((dept) => (
                <MenuItem key={dept.DepartmentID} value={dept.DepartmentID}>
                  {dept.Name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              name="Position"
              label="Position"
              value={formData.Position}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              name="Salary"
              label="Salary"
              type="number"
              value={formData.Salary}
              onChange={handleChange}
              fullWidth
              required
              inputProps={{ step: "0.01", min: "0" }}
            />
            <TextField
              name="HireDate"
              label="Hire Date"
              type="date"
              value={formData.HireDate}
              onChange={handleChange}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={isPreviewMode}>
            {editingFacultyMember ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Faculty;
