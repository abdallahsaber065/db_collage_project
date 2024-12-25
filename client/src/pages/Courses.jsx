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
  Chip,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import axios from 'axios';

function Courses() {
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    Name: '',
    CreditHours: '',
    DepartmentID: '',
    Prerequisites: [],
  });

  useEffect(() => {
    fetchCourses();
    fetchDepartments();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await axios.get('/api/courses');
      const coursesWithDetails = await Promise.all(
        response.data.map(async (course) => {
          const detailsResponse = await axios.get(`/api/courses/${course.CourseID}`);
          return detailsResponse.data;
        })
      );
      setCourses(coursesWithDetails);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get('/api/departments');
      setDepartments(response.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleOpen = (course = null) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        Name: course.Name,
        CreditHours: course.CreditHours,
        DepartmentID: course.DepartmentID,
        Prerequisites: course.prerequisites?.map(p => p.id) || [],
      });
    } else {
      setEditingCourse(null);
      setFormData({
        Name: '',
        CreditHours: '',
        DepartmentID: '',
        Prerequisites: [],
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingCourse(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePrerequisitesChange = (event) => {
    const {
      target: { value },
    } = event;
    setFormData({
      ...formData,
      Prerequisites: typeof value === 'string' ? value.split(',') : value,
    });
  };

  const handleSubmit = async () => {
    try {
      if (editingCourse) {
        await axios.put(`/api/courses/${editingCourse.CourseID}`, formData);
      } else {
        await axios.post('/api/courses', formData);
      }
      fetchCourses();
      handleClose();
    } catch (error) {
      console.error('Error saving course:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        const response = await axios.delete(`/api/courses/${id}`);
        if (response.data.message) {
          fetchCourses();
        }
      } catch (error) {
        console.error('Error deleting course:', error);
        alert(error.response?.data?.message || 'Error deleting course');
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <h1>Courses</h1>
        <Button variant="contained" onClick={() => handleOpen()}>
          Add Course
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Credit Hours</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Prerequisites</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {courses.map((course) => (
              <TableRow key={course.CourseID}>
                <TableCell>{course.Name}</TableCell>
                <TableCell>{course.CreditHours}</TableCell>
                <TableCell>
                  {departments.find(d => d.DepartmentID === course.DepartmentID)?.Name}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {course.prerequisites?.map((prereq) => (
                      <Chip
                        key={prereq.id}
                        label={prereq.name}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpen(course)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(course.CourseID)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCourse ? 'Edit Course' : 'Add Course'}</DialogTitle>
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
              name="CreditHours"
              label="Credit Hours"
              type="number"
              value={formData.CreditHours}
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
            >
              {departments.map((dept) => (
                <MenuItem key={dept.DepartmentID} value={dept.DepartmentID}>
                  {dept.Name}
                </MenuItem>
              ))}
            </TextField>
            <FormControl fullWidth>
              <InputLabel>Prerequisites</InputLabel>
              <Select
                multiple
                name="Prerequisites"
                value={formData.Prerequisites}
                onChange={handlePrerequisitesChange}
                input={<OutlinedInput label="Prerequisites" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip
                        key={value}
                        label={courses.find(c => c.CourseID === value)?.Name}
                        size="small"
                      />
                    ))}
                  </Box>
                )}
              >
                {courses
                  .filter(course => !editingCourse || course.CourseID !== editingCourse.CourseID)
                  .map((course) => (
                    <MenuItem key={course.CourseID} value={course.CourseID}>
                      {course.Name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingCourse ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Courses; 