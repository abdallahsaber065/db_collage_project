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
  Typography,
  InputAdornment,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as DeptIcon,
  People as PeopleIcon,
  School as FacultyIcon,
  MenuBook as CoursesIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import api from '../utils/api';
import { appConfig } from '../config/appConfig';
import PageHeader from '../components/PageHeader';
import StatsCard from '../components/StatsCard';
import { TableSkeleton, StatsSkeleton } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';

function Departments() {
  const isPreviewMode = appConfig.previewMode;
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, name: '' });
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    Name: '',
    OfficeLocation: '',
  });
  const [drilldown, setDrilldown] = useState({ open: false, type: null, deptName: '', rows: [], loading: false });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/departments');
      const departmentsWithCounts = await Promise.all(
        response.data.map(async (dept) => {
          const detailsResponse = await api.get(`/departments/${dept.DepartmentID}`);
          return { ...dept, ...detailsResponse.data };
        })
      );
      setDepartments(departmentsWithCounts);
    } catch (err) {
      enqueueSnackbar('Failed to load departments', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (department = null) => {
    if (department) {
      setEditingDepartment(department);
      setFormData({ Name: department.Name, OfficeLocation: department.OfficeLocation });
    } else {
      setEditingDepartment(null);
      setFormData({ Name: '', OfficeLocation: '' });
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
    if (isPreviewMode) return;
    try {
      if (!formData.Name || !formData.OfficeLocation) {
        setError('Please fill in all required fields');
        return;
      }
      if (formData.Name.length < 2 || formData.Name.length > 50) {
        setError('Department name must be between 2 and 50 characters');
        return;
      }

      if (editingDepartment) {
        await api.put(`/departments/${editingDepartment.DepartmentID}`, formData);
        enqueueSnackbar('Department updated successfully', { variant: 'success' });
      } else {
        await api.post('/departments', formData);
        enqueueSnackbar('Department added successfully', { variant: 'success' });
      }
      fetchDepartments();
      handleClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error saving department';
      setError(msg);
      enqueueSnackbar(msg, { variant: 'error' });
    }
  };

  const handleDeleteClick = (dept) => {
    if (isPreviewMode) return;
    setDeleteConfirm({ open: true, id: dept.DepartmentID, name: dept.Name });
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/departments/${deleteConfirm.id}`);
      fetchDepartments();
      enqueueSnackbar('Department deleted successfully', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Error deleting department', { variant: 'error' });
    } finally {
      setDeleteConfirm({ open: false, id: null, name: '' });
    }
  };

  const handleDrilldown = async (type, dept) => {
    setDrilldown({ open: true, type, deptName: dept.Name, rows: [], loading: true });
    try {
      let rows = [];
      if (type === 'Students') {
        const res = await api.get('/students');
        rows = res.data.filter((s) => s.Major === dept.DepartmentID || s.Major === String(dept.DepartmentID));
      } else if (type === 'Faculty') {
        const res = await api.get('/faculty');
        rows = res.data.filter((e) => e.DepartmentID === dept.DepartmentID || e.DepartmentID === String(dept.DepartmentID));
      } else if (type === 'Courses') {
        const res = await api.get('/courses');
        rows = res.data.filter((c) => c.DepartmentID === dept.DepartmentID || c.DepartmentID === String(dept.DepartmentID));
      }
      setDrilldown((d) => ({ ...d, rows, loading: false }));
    } catch (err) {
      enqueueSnackbar('Failed to load details', { variant: 'error' });
      setDrilldown((d) => ({ ...d, loading: false }));
    }
  };

  const filtered = departments.filter(
    (d) =>
      d.Name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.OfficeLocation?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalStudents = departments.reduce((sum, d) => sum + (parseInt(d.StudentCount) || 0), 0);
  const totalFaculty = departments.reduce((sum, d) => sum + (parseInt(d.FacultyCount) || 0), 0);
  const totalCourses = departments.reduce((sum, d) => sum + (parseInt(d.CourseCount) || 0), 0);

  return (
    <Box>
      <PageHeader
        title="Departments"
        subtitle="Manage academic departments and their resources"
        icon={DeptIcon}
        actionLabel="Add Department"
        onAction={() => handleOpen()}
        actionDisabled={isPreviewMode}
        count={departments.length}
      />

      {/* Stats */}
      {loading ? (
        <StatsSkeleton count={4} />
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 4 }}>
          <StatsCard label="Departments" value={departments.length} icon={DeptIcon} color="#6366f1" delay={0} />
          <StatsCard label="Students" value={totalStudents} icon={PeopleIcon} color="#3b82f6" delay={0.1} />
          <StatsCard label="Faculty" value={totalFaculty} icon={FacultyIcon} color="#059669" delay={0.15} />
          <StatsCard label="Courses" value={totalCourses} icon={CoursesIcon} color="#f59e0b" delay={0.2} />
        </Box>
      )}

      {/* Search */}
      {!loading && departments.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <TextField
            placeholder="Search departments..."
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

      {/* Cards layout for mobile, table for desktop */}
      {loading ? (
        <TableSkeleton rows={4} columns={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={DeptIcon}
          title={searchQuery ? 'No departments match your search' : 'No departments yet'}
          subtitle={searchQuery ? 'Try a different keyword' : 'Create your first department'}
          actionLabel={!searchQuery ? 'Add Department' : undefined}
          onAction={() => handleOpen()}
        />
      ) : isMobile ? (
        /* Card layout for mobile */
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filtered.map((dept) => (
            <Card key={dept.DepartmentID}>
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>
                      {dept.Name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                      <LocationIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        {dept.OfficeLocation}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleOpen(dept)}
                      disabled={isPreviewMode}
                      sx={{ color: '#6366f1', bgcolor: 'rgba(99,102,241,0.08)' }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteClick(dept)}
                      disabled={isPreviewMode}
                      sx={{ color: '#ef4444', bgcolor: 'rgba(239,68,68,0.08)' }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip onClick={() => handleDrilldown('Students', dept)} icon={<PeopleIcon sx={{ fontSize: '16px !important' }} />} label={`${parseInt(dept.StudentCount) || 0} Students`} size="small" variant="outlined" sx={{ cursor: 'pointer' }} />
                  <Chip onClick={() => handleDrilldown('Faculty', dept)} icon={<FacultyIcon sx={{ fontSize: '16px !important' }} />} label={`${parseInt(dept.FacultyCount) || 0} Faculty`} size="small" variant="outlined" sx={{ cursor: 'pointer' }} />
                  <Chip onClick={() => handleDrilldown('Courses', dept)} icon={<CoursesIcon sx={{ fontSize: '16px !important' }} />} label={`${parseInt(dept.CourseCount) || 0} Courses`} size="small" variant="outlined" sx={{ cursor: 'pointer' }} />
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Department</TableCell>
                <TableCell>Office Location</TableCell>
                <TableCell align="center">Students</TableCell>
                <TableCell align="center">Faculty</TableCell>
                <TableCell align="center">Courses</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((dept) => (
                <TableRow key={dept.DepartmentID}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '10px',
                          bgcolor: '#ede9fe',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <DeptIcon sx={{ fontSize: 18, color: '#6366f1' }} />
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {dept.Name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocationIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                      <Typography variant="body2" sx={{ color: '#64748b' }}>
                        {dept.OfficeLocation}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={parseInt(dept.StudentCount) || 0}
                      size="small"
                      onClick={() => handleDrilldown('Students', dept)}
                      sx={{
                        bgcolor: (parseInt(dept.StudentCount) || 0) > 0 ? '#eff6ff' : '#f1f5f9',
                        color: (parseInt(dept.StudentCount) || 0) > 0 ? '#2563eb' : '#94a3b8',
                        fontWeight: 700,
                        minWidth: 36,
                        cursor: 'pointer',
                        '&:hover': { opacity: 0.8 },
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={parseInt(dept.FacultyCount) || 0}
                      size="small"
                      onClick={() => handleDrilldown('Faculty', dept)}
                      sx={{
                        bgcolor: (parseInt(dept.FacultyCount) || 0) > 0 ? '#ecfdf5' : '#f1f5f9',
                        color: (parseInt(dept.FacultyCount) || 0) > 0 ? '#059669' : '#94a3b8',
                        fontWeight: 700,
                        minWidth: 36,
                        cursor: 'pointer',
                        '&:hover': { opacity: 0.8 },
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={parseInt(dept.CourseCount) || 0}
                      size="small"
                      onClick={() => handleDrilldown('Courses', dept)}
                      sx={{
                        bgcolor: (parseInt(dept.CourseCount) || 0) > 0 ? '#fefce8' : '#f1f5f9',
                        color: (parseInt(dept.CourseCount) || 0) > 0 ? '#d97706' : '#94a3b8',
                        fontWeight: 700,
                        minWidth: 36,
                        cursor: 'pointer',
                        '&:hover': { opacity: 0.8 },
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpen(dept)}
                        disabled={isPreviewMode}
                        sx={{ color: '#6366f1', bgcolor: 'rgba(99,102,241,0.08)', '&:hover': { bgcolor: 'rgba(99,102,241,0.16)' } }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(dept)}
                        disabled={isPreviewMode}
                        sx={{ color: '#ef4444', bgcolor: 'rgba(239,68,68,0.08)', '&:hover': { bgcolor: 'rgba(239,68,68,0.16)' } }}
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
              <DeptIcon sx={{ color: '#fff', fontSize: 22 }} />
            </Box>
            {editingDepartment ? 'Edit Department' : 'New Department'}
          </Box>
          <IconButton onClick={handleClose} size="small" sx={{ color: '#94a3b8' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1.5 }}>
            {error && <Alert severity="error" sx={{ borderRadius: '12px' }}>{error}</Alert>}
            <TextField name="Name" label="Department Name" value={formData.Name} onChange={handleChange} fullWidth required />
            <TextField name="OfficeLocation" label="Office Location" value={formData.OfficeLocation} onChange={handleChange} fullWidth required />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={handleClose} sx={{ color: '#64748b', fontWeight: 600 }}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={isPreviewMode}>
            {editingDepartment ? 'Update Department' : 'Add Department'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Drilldown Dialog */}
      <Dialog open={drilldown.open} onClose={() => setDrilldown((d) => ({ ...d, open: false }))} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                bgcolor: drilldown.type === 'Students' ? '#eff6ff' : drilldown.type === 'Faculty' ? '#ecfdf5' : '#fefce8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {drilldown.type === 'Students' ? (
                <PeopleIcon sx={{ fontSize: 18, color: '#2563eb' }} />
              ) : drilldown.type === 'Faculty' ? (
                <FacultyIcon sx={{ fontSize: 18, color: '#059669' }} />
              ) : (
                <CoursesIcon sx={{ fontSize: 18, color: '#d97706' }} />
              )}
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {drilldown.type}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                {drilldown.deptName}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setDrilldown((d) => ({ ...d, open: false }))} size="small" sx={{ color: '#94a3b8' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 0 }}>
          {drilldown.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={32} />
            </Box>
          ) : drilldown.rows.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>No records found</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {drilldown.type === 'Students' && (
                      <>
                        <TableCell>Name</TableCell>
                        <TableCell>Gender</TableCell>
                        <TableCell>Phone</TableCell>
                        <TableCell align="center">CGPA</TableCell>
                        <TableCell align="center">Credits</TableCell>
                      </>
                    )}
                    {drilldown.type === 'Faculty' && (
                      <>
                        <TableCell>Name</TableCell>
                        <TableCell>Position</TableCell>
                        <TableCell>Phone</TableCell>
                        <TableCell>Hire Date</TableCell>
                      </>
                    )}
                    {drilldown.type === 'Courses' && (
                      <>
                        <TableCell>Course Name</TableCell>
                        <TableCell align="center">Credit Hours</TableCell>
                      </>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {drilldown.rows.map((row, i) => (
                    <TableRow key={i}>
                      {drilldown.type === 'Students' && (
                        <>
                          <TableCell sx={{ fontWeight: 600 }}>{row.Name}</TableCell>
                          <TableCell>{row.Gender}</TableCell>
                          <TableCell>{row.PhoneNumber}</TableCell>
                          <TableCell align="center">
                            <Chip label={row.CGPA ?? '—'} size="small" sx={{ bgcolor: '#f0fdf4', color: '#16a34a', fontWeight: 700 }} />
                          </TableCell>
                          <TableCell align="center">{row.CompletedCreditHours ?? 0} / {row.RecordedCreditHours ?? 0}</TableCell>
                        </>
                      )}
                      {drilldown.type === 'Faculty' && (
                        <>
                          <TableCell sx={{ fontWeight: 600 }}>{row.Name}</TableCell>
                          <TableCell>{row.Position}</TableCell>
                          <TableCell>{row.PhoneNumber}</TableCell>
                          <TableCell>{row.HireDate ? new Date(row.HireDate).toLocaleDateString() : '—'}</TableCell>
                        </>
                      )}
                      {drilldown.type === 'Courses' && (
                        <>
                          <TableCell sx={{ fontWeight: 600 }}>{row.Name}</TableCell>
                          <TableCell align="center">
                            <Chip label={`${row.CreditHours} cr`} size="small" sx={{ bgcolor: '#fefce8', color: '#d97706', fontWeight: 700 }} />
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          <Typography variant="caption" sx={{ color: '#94a3b8', flexGrow: 1 }}>
            {!drilldown.loading && `${drilldown.rows.length} record${drilldown.rows.length !== 1 ? 's' : ''}`}
          </Typography>
          <Button onClick={() => setDrilldown((d) => ({ ...d, open: false }))} sx={{ color: '#64748b', fontWeight: 600 }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirm.open}
        title="Delete Department"
        message={`Are you sure you want to delete "${deleteConfirm.name}"? This may affect associated students, faculty, and courses.`}
        confirmLabel="Delete"
        severity="error"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm({ open: false, id: null, name: '' })}
      />
    </Box>
  );
}

export default Departments;
