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
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import api from '../utils/api';
import { appConfig } from '../config/appConfig';

function Students() {
  const isPreviewMode = appConfig.previewMode;
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    Name: '',
    Gender: '',
    PhoneNumber: '',
    Major: '',
    RecordedCreditHours: '',
    CompletedCreditHours: '',
    CGPA: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStudents();
    fetchDepartments();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await api.get('/students');
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
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

  const handleOpen = (student = null) => {
    if (student) {
      setEditingStudent(student);
      setFormData(student);
    } else {
      setEditingStudent(null);
      setFormData({
        Name: '',
        Gender: '',
        PhoneNumber: '',
        Major: '',
        RecordedCreditHours: '',
        CompletedCreditHours: '',
        CGPA: '',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingStudent(null);
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
      const requiredFields = ['Name', 'Gender', 'Major'];
      const missingFields = requiredFields.filter(field => !formData[field]);
      if (missingFields.length > 0) {
        setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
        return;
      }

      // Validate phone number format if provided
      const phoneRegex = /^\+?[\d\s-]{10,}$/;
      if (formData.PhoneNumber && !phoneRegex.test(formData.PhoneNumber)) {
        setError('Please enter a valid phone number');
        return;
      }

      // Validate credit hours
      if (formData.RecordedCreditHours && formData.CompletedCreditHours) {
        if (parseInt(formData.CompletedCreditHours) > parseInt(formData.RecordedCreditHours)) {
          setError('Completed credit hours cannot exceed recorded credit hours');
          return;
        }
      }

      // Validate CGPA
      if (formData.CGPA) {
        const cgpa = parseFloat(formData.CGPA);
        if (isNaN(cgpa) || cgpa < 0 || cgpa > 4) {
          setError('CGPA must be between 0 and 4');
          return;
        }
      }

      if (editingStudent) {
        await api.put(`/students/${editingStudent.StudentID}`, formData);
      } else {
        await api.post('/students', formData);
      }
      fetchStudents();
      handleClose();
    } catch (error) {
      console.error('Error saving student:', error);
      setError(error.response?.data?.message || 'Error saving student');
    }
  };

  const handleDelete = async (id) => {
    if (isPreviewMode) {
      return;
    }
    if (window.confirm('Are you sure you want to delete this student? If they have any registrations, those will be deleted as well.')) {
      try {
        const response = await api.delete(`/students/${id}`);
        if (response.data.message) {
          fetchStudents();
          if (response.data.hadRegistrations) {
            alert('Student and their registrations have been deleted successfully.');
          } else {
            alert('Student has been deleted successfully.');
          }
        }
      } catch (error) {
        console.error('Error deleting student:', error);
        alert(error.response?.data?.message || 'Error deleting student');
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <h1>Students</h1>
        <Button variant="contained" onClick={() => handleOpen()} disabled={isPreviewMode}>
          Add Student
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Phone Number</TableCell>
              <TableCell>Major</TableCell>
              <TableCell>Recorded Hours</TableCell>
              <TableCell>Completed Hours</TableCell>
              <TableCell>CGPA</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.StudentID}>
                <TableCell>{student.Name}</TableCell>
                <TableCell>{student.Gender}</TableCell>
                <TableCell>{student.PhoneNumber}</TableCell>
                <TableCell>
                  {departments.find(d => d.DepartmentID === student.Major)?.Name}
                </TableCell>
                <TableCell>{student.RecordedCreditHours}</TableCell>
                <TableCell>{student.CompletedCreditHours}</TableCell>
                <TableCell>{student.CGPA}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpen(student)} disabled={isPreviewMode}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(student.StudentID)} disabled={isPreviewMode}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editingStudent ? 'Edit Student' : 'Add Student'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              name="Name"
              label="Name"
              value={formData.Name}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              name="Gender"
              label="Gender"
              value={formData.Gender}
              onChange={handleChange}
              select
              fullWidth
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
              name="Major"
              label="Major"
              value={formData.Major}
              onChange={handleChange}
              select
              fullWidth
            >
              {departments.map((dept) => (
                <MenuItem key={dept.DepartmentID} value={dept.DepartmentID}>
                  {dept.Name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              name="RecordedCreditHours"
              label="Recorded Credit Hours"
              type="number"
              value={formData.RecordedCreditHours}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              name="CompletedCreditHours"
              label="Completed Credit Hours"
              type="number"
              value={formData.CompletedCreditHours}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              name="CGPA"
              label="CGPA"
              type="number"
              inputProps={{ step: "0.01", min: "0", max: "4" }}
              value={formData.CGPA}
              onChange={handleChange}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={isPreviewMode}>
            {editingStudent ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Students; 
