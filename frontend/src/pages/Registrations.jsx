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
  Chip,
  Typography,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as RegIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  People as PeopleIcon,
  MenuBook as CoursesIcon,
  Grade as GradeIcon,
  Schedule as ScheduleIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import api from '../utils/api';
import { formatTime, formatSchedule, formatDate } from '../utils/timeUtils';
import { appConfig } from '../config/appConfig';
import PageHeader from '../components/PageHeader';
import StatsCard from '../components/StatsCard';
import { TableSkeleton, StatsSkeleton } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';

function Registrations() {
  const isPreviewMode = appConfig.previewMode;
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [registrations, setRegistrations] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingRegistration, setEditingRegistration] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, label: '' });
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    StudentID: '',
    CourseID: '',
    LectureID: '',
    LabID: '',
    Grade: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [regRes, studRes, courseRes] = await Promise.all([
        api.get('/registrations'),
        api.get('/students'),
        api.get('/courses'),
      ]);
      setRegistrations(regRes.data);
      setStudents(studRes.data);
      setCourses(courseRes.data);
    } catch (err) {
      enqueueSnackbar('Failed to load registrations', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchLecturesAndLabs = async (courseId) => {
    try {
      const [lecturesRes, labsRes] = await Promise.all([
        api.get(`/lectures?courseId=${courseId}`),
        api.get(`/labs?courseId=${courseId}`),
      ]);
      setLectures(
        lecturesRes.data.map((l) => ({ ...l, displayTime: formatSchedule(l.Day, l.StartTime, l.EndTime) }))
      );
      setLabs(labsRes.data.map((l) => ({ ...l, displayTime: formatSchedule(l.Day, l.StartTime, l.EndTime) })));
    } catch (err) {
      setError('Failed to fetch lectures/labs');
    }
  };

  const handleOpen = (reg = null) => {
    if (reg) {
      setEditingRegistration(reg);
      setFormData({
        StudentID: reg.StudentID,
        CourseID: reg.CourseID,
        LectureID: reg.LectureID,
        LabID: reg.LabID || '',
        Grade: reg.Grade || '',
      });
      fetchLecturesAndLabs(reg.CourseID);
    } else {
      setEditingRegistration(null);
      setFormData({ StudentID: '', CourseID: '', LectureID: '', LabID: '', Grade: '' });
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
      setFormData((prev) => ({ ...prev, CourseID: value, LectureID: '', LabID: '' }));
    }
  };

  const handleSubmit = async () => {
    if (isPreviewMode) return;
    try {
      const requiredFields = ['StudentID', 'CourseID', 'LectureID'];
      const missingFields = requiredFields.filter((f) => !formData[f]);
      if (missingFields.length > 0) {
        setError(`Please fill in: ${missingFields.join(', ')}`);
        return;
      }
      if (formData.Grade) {
        const gradeRegex = /^[A-F][+-]?$|^F$/;
        if (!gradeRegex.test(formData.Grade)) {
          setError('Invalid grade format (A+, A, A-, B+, ... F)');
          return;
        }
      }

      let response;
      if (editingRegistration) {
        const updateData = {
          LectureID: formData.LectureID,
          LabID: formData.LabID === '' ? null : formData.LabID,
          Grade: formData.Grade || null,
        };
        response = await api.put(`/registrations/${editingRegistration.RegistrationID}`, updateData);
        enqueueSnackbar('Registration updated successfully', { variant: 'success' });
      } else {
        response = await api.post('/registrations', {
          ...formData,
          LabID: formData.LabID === '' ? null : formData.LabID,
        });
        enqueueSnackbar('Registration added successfully', { variant: 'success' });
      }
      if (response.data) {
        fetchData();
        handleClose();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Error saving registration';
      setError(msg);
      enqueueSnackbar(msg, { variant: 'error' });
    }
  };

  const handleDeleteClick = (reg) => {
    if (isPreviewMode) return;
    setDeleteConfirm({
      open: true,
      id: reg.RegistrationID,
      label: `${reg.StudentName} — ${reg.CourseName}`,
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await api.delete(`/registrations/${deleteConfirm.id}`);
      if (response.data.message) {
        fetchData();
        enqueueSnackbar('Registration deleted', { variant: 'success' });
      }
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Error deleting registration', { variant: 'error' });
    } finally {
      setDeleteConfirm({ open: false, id: null, label: '' });
    }
  };

  const getGradeColor = (grade) => {
    if (!grade) return { bg: '#f1f5f9', color: '#94a3b8' };
    const g = grade.charAt(0);
    if (g === 'A') return { bg: '#ecfdf5', color: '#059669' };
    if (g === 'B') return { bg: '#eff6ff', color: '#2563eb' };
    if (g === 'C') return { bg: '#fefce8', color: '#d97706' };
    if (g === 'D') return { bg: '#fff7ed', color: '#ea580c' };
    return { bg: '#fee2e2', color: '#dc2626' };
  };

  const filtered = registrations.filter(
    (r) =>
      r.StudentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.CourseName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const graded = registrations.filter((r) => r.Grade).length;
  const uniqueStudents = [...new Set(registrations.map((r) => r.StudentID))].length;
  const uniqueCourses = [...new Set(registrations.map((r) => r.CourseID))].length;

  return (
    <Box>
      <PageHeader
        title="Registrations"
        subtitle="Manage student course registrations, lectures, and grades"
        icon={RegIcon}
        actionLabel="Add Registration"
        onAction={() => handleOpen()}
        actionDisabled={isPreviewMode}
        count={registrations.length}
      />

      {/* Stats */}
      {loading ? (
        <StatsSkeleton count={4} />
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 4 }}>
          <StatsCard label="Registrations" value={registrations.length} icon={RegIcon} color="#6366f1" delay={0} />
          <StatsCard label="Students" value={uniqueStudents} icon={PeopleIcon} color="#3b82f6" delay={0.1} />
          <StatsCard label="Courses" value={uniqueCourses} icon={CoursesIcon} color="#059669" delay={0.15} />
          <StatsCard label="Graded" value={graded} icon={GradeIcon} color="#f59e0b" delay={0.2} />
        </Box>
      )}

      {/* Search */}
      {!loading && registrations.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <TextField
            placeholder="Search by student or course name..."
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

      {/* Table / Cards */}
      {loading ? (
        <TableSkeleton rows={5} columns={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={RegIcon}
          title={searchQuery ? 'No registrations match your search' : 'No registrations yet'}
          subtitle={searchQuery ? 'Try a different keyword' : 'Create your first registration'}
          actionLabel={!searchQuery ? 'Add Registration' : undefined}
          onAction={() => handleOpen()}
        />
      ) : isMobile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filtered.map((reg) => {
            const gc = getGradeColor(reg.Grade);
            return (
              <Card key={reg.RegistrationID}>
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                        {reg.StudentName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        {reg.CourseName}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton size="small" onClick={() => handleOpen(reg)} disabled={isPreviewMode} sx={{ color: '#6366f1', bgcolor: 'rgba(99,102,241,0.08)' }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteClick(reg)} disabled={isPreviewMode} sx={{ color: '#ef4444', bgcolor: 'rgba(239,68,68,0.08)' }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<ScheduleIcon sx={{ fontSize: '14px !important' }} />}
                      label={formatSchedule(reg.LectureDay, reg.LectureStartTime, reg.LectureEndTime)}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem' }}
                    />
                    <Chip
                      label={reg.Grade || 'Not graded'}
                      size="small"
                      sx={{ bgcolor: gc.bg, color: gc.color, fontWeight: 700 }}
                    />
                    <Chip
                      icon={<CalendarIcon sx={{ fontSize: '14px !important' }} />}
                      label={formatDate(reg.RegistrationDate)}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Course</TableCell>
                <TableCell>Lecture Schedule</TableCell>
                <TableCell>Lab Schedule</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="center">Grade</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((reg) => {
                const gc = getGradeColor(reg.Grade);
                return (
                  <TableRow key={reg.RegistrationID}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                        {reg.StudentName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={reg.CourseName}
                        size="small"
                        sx={{ bgcolor: '#ede9fe', color: '#6366f1', fontWeight: 600, fontSize: '0.75rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <ScheduleIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                        <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.8125rem' }}>
                          {formatSchedule(reg.LectureDay, reg.LectureStartTime, reg.LectureEndTime)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {reg.LabDay ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <ScheduleIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                          <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.8125rem' }}>
                            {formatSchedule(reg.LabDay, reg.LabStartTime, reg.LabEndTime)}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>N/A</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.8125rem' }}>
                        {formatDate(reg.RegistrationDate)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={reg.Grade || 'Not graded'}
                        size="small"
                        sx={{ bgcolor: gc.bg, color: gc.color, fontWeight: 700, minWidth: 70 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                        <IconButton size="small" onClick={() => handleOpen(reg)} disabled={isPreviewMode} sx={{ color: '#6366f1', bgcolor: 'rgba(99,102,241,0.08)', '&:hover': { bgcolor: 'rgba(99,102,241,0.16)' } }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteClick(reg)} disabled={isPreviewMode} sx={{ color: '#ef4444', bgcolor: 'rgba(239,68,68,0.08)', '&:hover': { bgcolor: 'rgba(239,68,68,0.16)' } }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
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
                background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RegIcon sx={{ color: '#fff', fontSize: 22 }} />
            </Box>
            {editingRegistration ? 'Edit Registration' : 'New Registration'}
          </Box>
          <IconButton onClick={handleClose} size="small" sx={{ color: '#94a3b8' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1.5 }}>
            {error && <Alert severity="error" sx={{ borderRadius: '12px' }}>{error}</Alert>}
            <FormControl fullWidth required>
              <InputLabel>Student</InputLabel>
              <Select name="StudentID" value={formData.StudentID} onChange={handleChange} label="Student">
                {students.map((s) => (
                  <MenuItem key={s.StudentID} value={s.StudentID}>{s.Name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel>Course</InputLabel>
              <Select name="CourseID" value={formData.CourseID} onChange={handleChange} label="Course">
                {courses.map((c) => (
                  <MenuItem key={c.CourseID} value={c.CourseID}>{c.Name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {formData.CourseID && (
              <>
                <FormControl fullWidth required>
                  <InputLabel>Lecture</InputLabel>
                  <Select name="LectureID" value={formData.LectureID} onChange={handleChange} label="Lecture">
                    {lectures.map((l) => (
                      <MenuItem key={l.LectureID} value={l.LectureID}>
                        {formatSchedule(l.Day, l.StartTime, l.EndTime)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Lab (Optional)</InputLabel>
                  <Select name="LabID" value={formData.LabID} onChange={handleChange} label="Lab (Optional)">
                    <MenuItem value="">None</MenuItem>
                    {labs.map((l) => (
                      <MenuItem key={l.LabID} value={l.LabID}>
                        {formatSchedule(l.Day, l.StartTime, l.EndTime)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            )}
            {editingRegistration && (
              <TextField name="Grade" label="Grade (e.g. A+, B-, F)" value={formData.Grade} onChange={handleChange} fullWidth />
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={handleClose} sx={{ color: '#64748b', fontWeight: 600 }}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={isPreviewMode}>
            {editingRegistration ? 'Update Registration' : 'Add Registration'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirm.open}
        title="Delete Registration"
        message={`Are you sure you want to delete the registration for "${deleteConfirm.label}"?`}
        confirmLabel="Delete"
        severity="error"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm({ open: false, id: null, label: '' })}
      />
    </Box>
  );
}

export default Registrations;
