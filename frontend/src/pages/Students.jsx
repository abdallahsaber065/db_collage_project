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
  Chip,
  Typography,
  InputAdornment,
  Avatar,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  Close as CloseIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import api from '../utils/api';
import { appConfig } from '../config/appConfig';
import PageHeader from '../components/PageHeader';
import StatsCard from '../components/StatsCard';
import { TableSkeleton, StatsSkeleton } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';

function Students() {
  const isPreviewMode = appConfig.previewMode;
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, name: '' });
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
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentsRes, deptsRes] = await Promise.all([
        api.get('/students'),
        api.get('/departments'),
      ]);
      setStudents(studentsRes.data);
      setDepartments(deptsRes.data);
    } catch (err) {
      enqueueSnackbar('Failed to load students', { variant: 'error' });
    } finally {
      setLoading(false);
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
    setError('');
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingStudent(null);
    setError('');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (isPreviewMode) return;
    try {
      const requiredFields = ['Name', 'Gender', 'Major'];
      const missingFields = requiredFields.filter((field) => !formData[field]);
      if (missingFields.length > 0) {
        setError(`Please fill in: ${missingFields.join(', ')}`);
        return;
      }

      const phoneRegex = /^\+?[\d\s-]{10,}$/;
      if (formData.PhoneNumber && !phoneRegex.test(formData.PhoneNumber)) {
        setError('Please enter a valid phone number');
        return;
      }

      if (formData.RecordedCreditHours && formData.CompletedCreditHours) {
        if (parseInt(formData.CompletedCreditHours) > parseInt(formData.RecordedCreditHours)) {
          setError('Completed credit hours cannot exceed recorded hours');
          return;
        }
      }

      if (formData.CGPA) {
        const cgpa = parseFloat(formData.CGPA);
        if (isNaN(cgpa) || cgpa < 0 || cgpa > 4) {
          setError('CGPA must be between 0 and 4');
          return;
        }
      }

      if (editingStudent) {
        await api.put(`/students/${editingStudent.StudentID}`, formData);
        enqueueSnackbar('Student updated successfully', { variant: 'success' });
      } else {
        await api.post('/students', formData);
        enqueueSnackbar('Student added successfully', { variant: 'success' });
      }
      fetchData();
      handleClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error saving student';
      setError(msg);
      enqueueSnackbar(msg, { variant: 'error' });
    }
  };

  const handleDeleteClick = (student) => {
    if (isPreviewMode) return;
    setDeleteConfirm({ open: true, id: student.StudentID, name: student.Name });
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await api.delete(`/students/${deleteConfirm.id}`);
      if (response.data.message) {
        fetchData();
        enqueueSnackbar(
          response.data.hadRegistrations
            ? 'Student and their registrations deleted'
            : 'Student deleted successfully',
          { variant: 'success' }
        );
      }
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Error deleting student', { variant: 'error' });
    } finally {
      setDeleteConfirm({ open: false, id: null, name: '' });
    }
  };

  const getDeptName = (id) => departments.find((d) => d.DepartmentID === id)?.Name || '—';

  const getGpaColor = (gpa) => {
    if (gpa >= 3.5) return '#059669';
    if (gpa >= 3.0) return '#2563eb';
    if (gpa >= 2.0) return '#d97706';
    return '#dc2626';
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filtered = students.filter((s) =>
    s.Name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getDeptName(s.Major)?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const avgGpa = students.length
    ? (students.reduce((sum, s) => sum + (parseFloat(s.CGPA) || 0), 0) / students.length).toFixed(2)
    : '0.00';

  const totalCredits = students.reduce((sum, s) => sum + (parseInt(s.CompletedCreditHours) || 0), 0);

  return (
    <Box>
      <PageHeader
        title="Students"
        subtitle="Manage student records and academic information"
        icon={PeopleIcon}
        actionLabel="Add Student"
        onAction={() => handleOpen()}
        actionDisabled={isPreviewMode}
        count={students.length}
      />

      {/* Stats */}
      {loading ? (
        <StatsSkeleton count={3} />
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, mb: 4 }}>
          <StatsCard label="Total Students" value={students.length} icon={PeopleIcon} color="#6366f1" delay={0} />
          <StatsCard label="Average GPA" value={avgGpa} icon={TrendingUpIcon} color="#059669" delay={0.1} />
          <StatsCard label="Total Credits" value={totalCredits.toLocaleString()} icon={SchoolIcon} color="#f59e0b" delay={0.2} />
        </Box>
      )}

      {/* Search */}
      {!loading && students.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <TextField
            placeholder="Search students by name or major..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            fullWidth
            sx={{ maxWidth: 420 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      )}

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={5} columns={7} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={PeopleIcon}
          title={searchQuery ? 'No students match your search' : 'No students yet'}
          subtitle={searchQuery ? 'Try a different keyword' : 'Add your first student to get started'}
          actionLabel={!searchQuery ? 'Add Student' : undefined}
          onAction={() => handleOpen()}
        />
      ) : (
        <TableContainer component={Paper} className="responsive-table">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Gender</TableCell>
                {!isMobile && <TableCell>Phone</TableCell>}
                <TableCell>Major</TableCell>
                {!isMobile && <TableCell align="center">Recorded Hrs</TableCell>}
                {!isMobile && <TableCell align="center">Completed Hrs</TableCell>}
                <TableCell align="center">GPA</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((student) => (
                <TableRow key={student.StudentID}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        }}
                      >
                        {getInitials(student.Name)}
                      </Avatar>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                        {student.Name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={student.Gender}
                      size="small"
                      sx={{
                        bgcolor: student.Gender === 'Male' ? '#eff6ff' : '#fdf2f8',
                        color: student.Gender === 'Male' ? '#2563eb' : '#db2777',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                      }}
                    />
                  </TableCell>
                  {!isMobile && (
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#64748b' }}>
                        {student.PhoneNumber || '—'}
                      </Typography>
                    </TableCell>
                  )}
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {getDeptName(student.Major)}
                    </Typography>
                  </TableCell>
                  {!isMobile && <TableCell align="center">{student.RecordedCreditHours || '—'}</TableCell>}
                  {!isMobile && <TableCell align="center">{student.CompletedCreditHours || '—'}</TableCell>}
                  <TableCell align="center">
                    {student.CGPA ? (
                      <Chip
                        label={parseFloat(student.CGPA).toFixed(2)}
                        size="small"
                        sx={{
                          bgcolor: `${getGpaColor(parseFloat(student.CGPA))}14`,
                          color: getGpaColor(parseFloat(student.CGPA)),
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          minWidth: 56,
                        }}
                      />
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpen(student)}
                        disabled={isPreviewMode}
                        sx={{
                          color: '#6366f1',
                          bgcolor: 'rgba(99,102,241,0.08)',
                          '&:hover': { bgcolor: 'rgba(99,102,241,0.16)' },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(student)}
                        disabled={isPreviewMode}
                        sx={{
                          color: '#ef4444',
                          bgcolor: 'rgba(239,68,68,0.08)',
                          '&:hover': { bgcolor: 'rgba(239,68,68,0.16)' },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Form Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PersonIcon sx={{ color: '#fff', fontSize: 22 }} />
            </Box>
            {editingStudent ? 'Edit Student' : 'New Student'}
          </Box>
          <IconButton onClick={handleClose} size="small" sx={{ color: '#94a3b8' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1.5 }}>
            {error && (
              <Alert severity="error" sx={{ borderRadius: '12px' }}>
                {error}
              </Alert>
            )}
            <TextField name="Name" label="Full Name" value={formData.Name} onChange={handleChange} fullWidth required />
            <TextField name="Gender" label="Gender" value={formData.Gender} onChange={handleChange} select fullWidth required>
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
            </TextField>
            <TextField name="PhoneNumber" label="Phone Number" value={formData.PhoneNumber} onChange={handleChange} fullWidth />
            <TextField name="Major" label="Major (Department)" value={formData.Major} onChange={handleChange} select fullWidth required>
              {departments.map((dept) => (
                <MenuItem key={dept.DepartmentID} value={dept.DepartmentID}>
                  {dept.Name}
                </MenuItem>
              ))}
            </TextField>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                name="RecordedCreditHours"
                label="Recorded Hours"
                type="number"
                value={formData.RecordedCreditHours}
                onChange={handleChange}
                fullWidth
              />
              <TextField
                name="CompletedCreditHours"
                label="Completed Hours"
                type="number"
                value={formData.CompletedCreditHours}
                onChange={handleChange}
                fullWidth
              />
            </Box>
            <TextField
              name="CGPA"
              label="CGPA"
              type="number"
              inputProps={{ step: '0.01', min: '0', max: '4' }}
              value={formData.CGPA}
              onChange={handleChange}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={handleClose} sx={{ color: '#64748b', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained" disabled={isPreviewMode}>
            {editingStudent ? 'Update Student' : 'Add Student'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirm.open}
        title="Delete Student"
        message={`Are you sure you want to delete "${deleteConfirm.name}"? If they have any registrations, those will be deleted as well.`}
        confirmLabel="Delete"
        severity="error"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm({ open: false, id: null, name: '' })}
      />
    </Box>
  );
}

export default Students;
