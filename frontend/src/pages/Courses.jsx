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
  Chip,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Alert,
  Typography,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Checkbox,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  MenuBook as CoursesIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  AccessTime as CreditIcon,
  Link as PrereqIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import api from '../utils/api';
import { appConfig } from '../config/appConfig';
import PageHeader from '../components/PageHeader';
import StatsCard from '../components/StatsCard';
import { TableSkeleton, StatsSkeleton } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';

function Courses() {
  const isPreviewMode = appConfig.previewMode;
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, name: '' });
  const [formData, setFormData] = useState({
    Name: '',
    CreditHours: '',
    DepartmentID: '',
    Prerequisites: [],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [coursesRes, deptsRes] = await Promise.all([
        api.get('/courses'),
        api.get('/departments'),
      ]);
      setDepartments(deptsRes.data);

      const coursesWithDetails = await Promise.all(
        coursesRes.data.map(async (course) => {
          const detailsRes = await api.get(`/courses/${course.CourseID}`);
          return detailsRes.data;
        })
      );
      setCourses(coursesWithDetails);
    } catch (err) {
      enqueueSnackbar('Failed to load courses', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (course = null) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        Name: course.Name,
        CreditHours: course.CreditHours,
        DepartmentID: course.DepartmentID,
        Prerequisites: course.prerequisites?.map((p) => p.id) || [],
      });
    } else {
      setEditingCourse(null);
      setFormData({ Name: '', CreditHours: '', DepartmentID: '', Prerequisites: [] });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingCourse(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePrerequisitesChange = (event) => {
    const { value } = event.target;
    setFormData({ ...formData, Prerequisites: typeof value === 'string' ? value.split(',') : value });
  };

  const handleSubmit = async () => {
    if (isPreviewMode) return;
    try {
      if (editingCourse) {
        await api.put(`/courses/${editingCourse.CourseID}`, formData);
        enqueueSnackbar('Course updated successfully', { variant: 'success' });
      } else {
        await api.post('/courses', formData);
        enqueueSnackbar('Course added successfully', { variant: 'success' });
      }
      fetchData();
      handleClose();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Error saving course', { variant: 'error' });
    }
  };

  const handleDeleteClick = (course) => {
    if (isPreviewMode) return;
    setDeleteConfirm({ open: true, id: course.CourseID, name: course.Name });
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await api.delete(`/courses/${deleteConfirm.id}`);
      if (response.data.message) {
        fetchData();
        enqueueSnackbar('Course deleted successfully', { variant: 'success' });
      }
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Error deleting course', { variant: 'error' });
    } finally {
      setDeleteConfirm({ open: false, id: null, name: '' });
    }
  };

  const getDeptName = (id) => departments.find((d) => d.DepartmentID === id)?.Name || '—';

  const filtered = courses.filter(
    (c) =>
      c.Name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getDeptName(c.DepartmentID)?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCredits = courses.reduce((sum, c) => sum + (parseInt(c.CreditHours) || 0), 0);
  const withPrereqs = courses.filter((c) => c.prerequisites?.length > 0).length;

  return (
    <Box>
      <PageHeader
        title="Courses"
        subtitle="Manage courses, credit hours, and prerequisites"
        icon={CoursesIcon}
        actionLabel="Add Course"
        onAction={() => handleOpen()}
        actionDisabled={isPreviewMode}
        count={courses.length}
      />

      {/* Stats */}
      {loading ? (
        <StatsSkeleton count={3} />
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, mb: 4 }}>
          <StatsCard label="Total Courses" value={courses.length} icon={CoursesIcon} color="#6366f1" delay={0} />
          <StatsCard label="Total Credits" value={totalCredits} icon={CreditIcon} color="#059669" delay={0.1} />
          <StatsCard label="With Prerequisites" value={withPrereqs} icon={PrereqIcon} color="#f59e0b" delay={0.2} />
        </Box>
      )}

      {/* Search */}
      {!loading && courses.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <TextField
            placeholder="Search courses by name or department..."
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
        <TableSkeleton rows={5} columns={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CoursesIcon}
          title={searchQuery ? 'No courses match your search' : 'No courses yet'}
          subtitle={searchQuery ? 'Try a different keyword' : 'Create your first course'}
          actionLabel={!searchQuery ? 'Add Course' : undefined}
          onAction={() => handleOpen()}
        />
      ) : isMobile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filtered.map((course) => (
            <Card key={course.CourseID}>
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>
                      {course.Name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      {getDeptName(course.DepartmentID)} &middot; {course.CreditHours} Credits
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton size="small" onClick={() => handleOpen(course)} disabled={isPreviewMode} sx={{ color: '#6366f1', bgcolor: 'rgba(99,102,241,0.08)' }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteClick(course)} disabled={isPreviewMode} sx={{ color: '#ef4444', bgcolor: 'rgba(239,68,68,0.08)' }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                {course.prerequisites?.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {course.prerequisites.map((p) => (
                      <Chip key={p.id} label={p.name} size="small" variant="outlined" sx={{ fontSize: '0.7rem', borderColor: '#6366f1', color: '#6366f1' }} />
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Course</TableCell>
                <TableCell align="center">Credit Hours</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Prerequisites</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((course) => (
                <TableRow key={course.CourseID}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '10px',
                          bgcolor: '#ecfdf5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <CoursesIcon sx={{ fontSize: 18, color: '#059669' }} />
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {course.Name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${course.CreditHours} hrs`}
                      size="small"
                      sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      {getDeptName(course.DepartmentID)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {course.prerequisites?.length > 0 ? (
                        course.prerequisites.map((prereq) => (
                          <Chip
                            key={prereq.id}
                            label={prereq.name}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.75rem', borderColor: '#6366f1', color: '#6366f1' }}
                          />
                        ))
                      ) : (
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                          None
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                      <IconButton size="small" onClick={() => handleOpen(course)} disabled={isPreviewMode} sx={{ color: '#6366f1', bgcolor: 'rgba(99,102,241,0.08)', '&:hover': { bgcolor: 'rgba(99,102,241,0.16)' } }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteClick(course)} disabled={isPreviewMode} sx={{ color: '#ef4444', bgcolor: 'rgba(239,68,68,0.08)', '&:hover': { bgcolor: 'rgba(239,68,68,0.16)' } }}>
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
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CoursesIcon sx={{ color: '#fff', fontSize: 22 }} />
            </Box>
            {editingCourse ? 'Edit Course' : 'New Course'}
          </Box>
          <IconButton onClick={handleClose} size="small" sx={{ color: '#94a3b8' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1.5 }}>
            <TextField name="Name" label="Course Name" value={formData.Name} onChange={handleChange} fullWidth required />
            <TextField
              name="CreditHours"
              label="Credit Hours"
              type="number"
              value={formData.CreditHours}
              onChange={handleChange}
              fullWidth
              required
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
            <FormControl fullWidth>
              <InputLabel>Prerequisites</InputLabel>
              <Select
                multiple
                name="Prerequisites"
                value={formData.Prerequisites}
                onChange={handlePrerequisitesChange}
                input={<OutlinedInput label="Prerequisites" />}
                renderValue={(selected) =>
                  selected.length === 0 ? (
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>None selected</Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip
                          key={value}
                          label={courses.find((c) => c.CourseID === value)?.Name}
                          size="small"
                          sx={{ bgcolor: '#ede9fe', color: '#6366f1', fontWeight: 600 }}
                        />
                      ))}
                    </Box>
                  )
                }
                MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}
              >
                {formData.Prerequisites.length > 0 && [
                  <MenuItem key="__selected_header" disabled sx={{ opacity: 1, py: 0.5 }}>
                    <Typography variant="caption" sx={{ color: '#6366f1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Selected ({formData.Prerequisites.length})
                    </Typography>
                  </MenuItem>,
                  ...courses
                    .filter((c) => formData.Prerequisites.includes(c.CourseID) && (!editingCourse || c.CourseID !== editingCourse.CourseID))
                    .map((course) => (
                      <MenuItem key={`sel-${course.CourseID}`} value={course.CourseID} sx={{ bgcolor: 'rgba(99,102,241,0.04)' }}>
                        <Checkbox checked size="small" sx={{ color: '#6366f1', '&.Mui-checked': { color: '#6366f1' }, p: 0.5 }} />
                        <ListItemText primary={course.Name} primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }} />
                      </MenuItem>
                    )),
                  <Divider key="__divider" sx={{ my: 0.5 }} />,
                ]}
                {courses
                  .filter((c) => !formData.Prerequisites.includes(c.CourseID) && (!editingCourse || c.CourseID !== editingCourse.CourseID))
                  .map((course) => (
                    <MenuItem key={course.CourseID} value={course.CourseID}>
                      <Checkbox checked={false} size="small" sx={{ p: 0.5 }} />
                      <ListItemText primary={course.Name} primaryTypographyProps={{ variant: 'body2' }} />
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={handleClose} sx={{ color: '#64748b', fontWeight: 600 }}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={isPreviewMode}>
            {editingCourse ? 'Update Course' : 'Add Course'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirm.open}
        title="Delete Course"
        message={`Are you sure you want to delete "${deleteConfirm.name}"?`}
        confirmLabel="Delete"
        severity="error"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm({ open: false, id: null, name: '' })}
      />
    </Box>
  );
}

export default Courses;
