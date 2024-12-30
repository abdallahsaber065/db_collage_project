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
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import api from '../utils/api';
import { formatTime, formatSchedule, formatDate } from '../utils/timeUtils';
import { appConfig } from '../config/appConfig';

function Registrations() {
  const isPreviewMode = appConfig.previewMode;
  const [registrations, setRegistrations] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [labs, setLabs] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingRegistration, setEditingRegistration] = useState(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    StudentID: '',
    CourseID: '',
    LectureID: '',
    LabID: '',
    Grade: '',
  });

  useEffect(() => {
    fetchRegistrations();
    fetchStudents();
    fetchCourses();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const response = await api.get('/registrations');
      setRegistrations(response.data);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await api.get('/students');
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses');
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchLecturesAndLabs = async (courseId) => {
    try {
      const [lecturesResponse, labsResponse] = await Promise.all([
        api.get(`/lectures?courseId=${courseId}`),
        api.get(`/labs?courseId=${courseId}`)
      ]);
      
      setLectures(lecturesResponse.data.map(lecture => ({
        ...lecture,
        displayTime: formatSchedule(lecture.Day, lecture.StartTime, lecture.EndTime)
      })));
      
      setLabs(labsResponse.data.map(lab => ({
        ...lab,
        displayTime: formatSchedule(lab.Day, lab.StartTime, lab.EndTime)
      })));
    } catch (error) {
      console.error('Error fetching lectures and labs:', error);
      setError('Failed to fetch lectures and labs for this course');
    }
  };

  const handleOpen = (registration = null) => {
    if (registration) {
      setEditingRegistration(registration);
      setFormData({
        StudentID: registration.StudentID,
        CourseID: registration.CourseID,
        LectureID: registration.LectureID,
        LabID: registration.LabID || '',
        Grade: registration.Grade || '',
      });
      fetchLecturesAndLabs(registration.CourseID);
    } else {
      setEditingRegistration(null);
      setFormData({
        StudentID: '',
        CourseID: '',
        LectureID: '',
        LabID: '',
        Grade: '',
      });
      setLectures([]);
      setLabs([]);
    }
    setError('');
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingRegistration(null);
    setError('');
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'CourseID') {
      await fetchLecturesAndLabs(value);
      setFormData(prev => ({
        ...prev,
        LectureID: '',
        LabID: '',
      }));
    }
  };

  const handleSubmit = async () => {
    if (isPreviewMode) {
      return;
    }
    try {
      // Validate required fields
      const requiredFields = ['StudentID', 'CourseID', 'LectureID'];
      const missingFields = requiredFields.filter(field => !formData[field]);
      if (missingFields.length > 0) {
        setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
        return;
      }

      // Validate grade format if provided
      if (formData.Grade) {
        const gradeRegex = /^[A-F][+-]?$|^F$/;
        if (!gradeRegex.test(formData.Grade)) {
          setError('Invalid grade format. Must be A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, or F');
          return;
        }
      }

      let response;
      if (editingRegistration) {
        // For update, only send the fields that can be updated
        const updateData = {
          LectureID: formData.LectureID,
          LabID: formData.LabID === '' ? null : formData.LabID,
          Grade: formData.Grade || null
        };
        response = await api.put(`/registrations/${editingRegistration.RegistrationID}`, updateData);
      } else {
        response = await api.post('/registrations', {
          ...formData,
          LabID: formData.LabID === '' ? null : formData.LabID
        });
      }

      if (response.data) {
        fetchRegistrations();
        handleClose();
        alert(editingRegistration ? 'Registration updated successfully' : 'Registration added successfully');
      }
    } catch (error) {
      console.error('Error saving registration:', error);
      setError(error.response?.data?.message || 'Error saving registration');
    }
  };

  const handleDelete = async (id) => {
    if (isPreviewMode) {
      return;
    }
    if (window.confirm('Are you sure you want to delete this registration?')) {
      try {
        const response = await api.delete(`/registrations/${id}`);
        if (response.data.message) {
          fetchRegistrations();
        }
      } catch (error) {
        console.error('Error deleting registration:', error);
        alert(error.response?.data?.message || 'Error deleting registration');
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <h1>Registrations</h1>
        <Button variant="contained" onClick={() => handleOpen()} disabled={isPreviewMode}>
          Add Registration
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Student</TableCell>
              <TableCell>Course</TableCell>
              <TableCell>Lecture Schedule</TableCell>
              <TableCell>Lab Schedule</TableCell>
              <TableCell>Registration Date</TableCell>
              <TableCell>Grade</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {registrations.map((registration) => (
              <TableRow key={registration.RegistrationID}>
                <TableCell>{registration.StudentName}</TableCell>
                <TableCell>{registration.CourseName}</TableCell>
                <TableCell>
                  {formatSchedule(registration.LectureDay, registration.LectureStartTime, registration.LectureEndTime)}
                </TableCell>
                <TableCell>
                  {formatSchedule(registration.LabDay, registration.LabStartTime, registration.LabEndTime)}
                </TableCell>
                <TableCell>{formatDate(registration.RegistrationDate)}</TableCell>
                <TableCell>{registration.Grade || 'Not graded'}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpen(registration)} disabled={isPreviewMode}>
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    onClick={() => handleDelete(registration.RegistrationID)}
                    color="error"
                    disabled={isPreviewMode}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingRegistration ? 'Edit Registration' : 'Add Registration'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            {error && <Alert severity="error">{error}</Alert>}
            
            <FormControl fullWidth>
              <InputLabel>Student</InputLabel>
              <Select
                name="StudentID"
                value={formData.StudentID}
                onChange={handleChange}
                label="Student"
              >
                {students.map((student) => (
                  <MenuItem key={student.StudentID} value={student.StudentID}>
                    {student.Name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Course</InputLabel>
              <Select
                name="CourseID"
                value={formData.CourseID}
                onChange={handleChange}
                label="Course"
              >
                {courses.map((course) => (
                  <MenuItem key={course.CourseID} value={course.CourseID}>
                    {course.Name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {formData.CourseID && (
              <>
                <FormControl fullWidth>
                  <InputLabel>Lecture</InputLabel>
                  <Select
                    name="LectureID"
                    value={formData.LectureID}
                    onChange={handleChange}
                    label="Lecture"
                  >
                    {lectures.map((lecture) => (
                      <MenuItem key={lecture.LectureID} value={lecture.LectureID}>
                        {formatSchedule(lecture.Day, lecture.StartTime, lecture.EndTime)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Lab (Optional)</InputLabel>
                  <Select
                    name="LabID"
                    value={formData.LabID}
                    onChange={handleChange}
                    label="Lab (Optional)"
                  >
                    <MenuItem value="">None</MenuItem>
                    {labs.map((lab) => (
                      <MenuItem key={lab.LabID} value={lab.LabID}>
                        {formatSchedule(lab.Day, lab.StartTime, lab.EndTime)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            )}

            {editingRegistration && (
              <TextField
                name="Grade"
                label="Grade"
                value={formData.Grade}
                onChange={handleChange}
                fullWidth
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={isPreviewMode}>
            {editingRegistration ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Registrations; 
