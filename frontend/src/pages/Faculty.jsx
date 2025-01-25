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
  Card,
  CardContent,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  School as FacultyIcon,
  AttachMoney as SalaryIcon,
  Work as WorkIcon,
  Close as CloseIcon,
  CalendarMonth as CalendarIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import api from '../utils/api';
import { appConfig } from '../config/appConfig';
import PageHeader from '../components/PageHeader';
import StatsCard from '../components/StatsCard';
import { TableSkeleton, StatsSkeleton } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';

function Faculty() {
  const isPreviewMode = appConfig.previewMode;
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [facultyMembers, setFacultyMembers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingFacultyMember, setEditingFacultyMember] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, name: '' });
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
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [facultyRes, deptsRes] = await Promise.all([
        api.get('/faculty'),
        api.get('/departments'),
      ]);
      setFacultyMembers(facultyRes.data);
      setDepartments(deptsRes.data);
    } catch (err) {
      enqueueSnackbar('Failed to load faculty', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (fm = null) => {
    if (fm) {
      setEditingFacultyMember(fm);
      setFormData({
        ...fm,
        HireDate: fm.HireDate ? new Date(fm.HireDate).toISOString().split('T')[0] : '',
      });
    } else {
      setEditingFacultyMember(null);
      setFormData({ Name: '', Gender: '', PhoneNumber: '', DepartmentID: '', Position: '', Salary: '', HireDate: '' });
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (isPreviewMode) return;
    try {
      const requiredFields = ['Name', 'Gender', 'DepartmentID', 'Position'];
      const missingFields = requiredFields.filter((f) => !formData[f]);
      if (missingFields.length > 0) {
        setError(`Please fill in: ${missingFields.join(', ')}`);
        return;
      }
      if (formData.Salary && (isNaN(formData.Salary) || formData.Salary < 0)) {
        setError('Please enter a valid salary');
        return;
      }
      const phoneRegex = /^\+?[\d\s-]{10,}$/;
      if (formData.PhoneNumber && !phoneRegex.test(formData.PhoneNumber)) {
        setError('Please enter a valid phone number');
        return;
      }

      if (editingFacultyMember) {
        await api.put(`/faculty/${editingFacultyMember.EmployeeID}`, formData);
        enqueueSnackbar('Faculty member updated successfully', { variant: 'success' });
      } else {
        await api.post('/faculty', formData);
        enqueueSnackbar('Faculty member added successfully', { variant: 'success' });
      }
      fetchData();
      handleClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error saving faculty member';
      setError(msg);
      enqueueSnackbar(msg, { variant: 'error' });
    }
  };

  const handleDeleteClick = (fm) => {
    if (isPreviewMode) return;
    setDeleteConfirm({ open: true, id: fm.EmployeeID, name: fm.Name });
  };

  const handleDeleteConfirm = async () => {
    try {
      try {
        const response = await api.delete(`/faculty/${deleteConfirm.id}`);
        if (response.data.message) {
          fetchData();
          enqueueSnackbar('Faculty member deleted', { variant: 'success' });
        }
      } catch (err) {
        if (err.response?.data?.message?.includes('teaching')) {
          // Force delete with teaching assignments
          const forceResponse = await api.delete(`/faculty/${deleteConfirm.id}?force=true`);
          if (forceResponse.data.message) {
            fetchData();
            enqueueSnackbar('Faculty member and teaching assignments deleted', { variant: 'success' });
          }
        } else {
          enqueueSnackbar(err.response?.data?.message || 'Error deleting', { variant: 'error' });
        }
      }
    } catch (err) {
      enqueueSnackbar('An unexpected error occurred', { variant: 'error' });
    } finally {
      setDeleteConfirm({ open: false, id: null, name: '' });
    }
  };

  const formatSalary = (salary) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(salary);
  const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : '—');
  const getDeptName = (id) => departments.find((d) => d.DepartmentID === id)?.Name || '—';
  const getInitials = (name) =>
    name ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : '?';

  const getPositionColor = (pos) => {
    const p = pos?.toLowerCase() || '';
    if (p.includes('professor')) return { bg: '#ede9fe', color: '#6366f1' };
    if (p.includes('assistant') || p.includes('lecturer')) return { bg: '#ecfdf5', color: '#059669' };
    if (p.includes('head') || p.includes('dean')) return { bg: '#fef3c7', color: '#d97706' };
    return { bg: '#f1f5f9', color: '#475569' };
  };

  const filtered = facultyMembers.filter(
    (fm) =>
      fm.Name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fm.Position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getDeptName(fm.DepartmentID)?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSalary = facultyMembers.reduce((sum, fm) => sum + (parseFloat(fm.Salary) || 0), 0);
  const positions = [...new Set(facultyMembers.map((fm) => fm.Position))].length;

  return (
    <Box>
      <PageHeader
        title="Faculty"
        subtitle="Manage faculty members, positions, and salaries"
        icon={FacultyIcon}
        actionLabel="Add Faculty Member"
        onAction={() => handleOpen()}
        actionDisabled={isPreviewMode}
        count={facultyMembers.length}
      />

      {/* Stats */}
      {loading ? (
        <StatsSkeleton count={3} />
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, mb: 4 }}>
          <StatsCard label="Faculty Members" value={facultyMembers.length} icon={FacultyIcon} color="#6366f1" delay={0} />
          <StatsCard label="Total Payroll" value={formatSalary(totalSalary)} icon={SalaryIcon} color="#059669" delay={0.1} />
          <StatsCard label="Unique Positions" value={positions} icon={WorkIcon} color="#f59e0b" delay={0.2} />
        </Box>
      )}

      {/* Search */}
      {!loading && facultyMembers.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <TextField
            placeholder="Search by name, position, or department..."
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
        <TableSkeleton rows={5} columns={7} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FacultyIcon}
          title={searchQuery ? 'No faculty match your search' : 'No faculty yet'}
          subtitle={searchQuery ? 'Try a different keyword' : 'Add your first faculty member'}
          actionLabel={!searchQuery ? 'Add Faculty Member' : undefined}
          onAction={() => handleOpen()}
        />
      ) : isMobile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filtered.map((fm) => {
            const pc = getPositionColor(fm.Position);
            return (
              <Card key={fm.EmployeeID}>
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        }}
                      >
                        {getInitials(fm.Name)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }}>{fm.Name}</Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>{getDeptName(fm.DepartmentID)}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton size="small" onClick={() => handleOpen(fm)} disabled={isPreviewMode} sx={{ color: '#6366f1', bgcolor: 'rgba(99,102,241,0.08)' }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteClick(fm)} disabled={isPreviewMode} sx={{ color: '#ef4444', bgcolor: 'rgba(239,68,68,0.08)' }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label={fm.Position} size="small" sx={{ bgcolor: pc.bg, color: pc.color, fontWeight: 600 }} />
                    <Chip label={formatSalary(fm.Salary)} size="small" sx={{ bgcolor: '#ecfdf5', color: '#059669', fontWeight: 600 }} />
                    <Chip icon={<CalendarIcon sx={{ fontSize: '14px !important' }} />} label={formatDate(fm.HireDate)} size="small" variant="outlined" />
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
                <TableCell>Faculty Member</TableCell>
                <TableCell>Gender</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Position</TableCell>
                <TableCell align="right">Salary</TableCell>
                <TableCell>Hire Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((fm) => {
                const pc = getPositionColor(fm.Position);
                return (
                  <TableRow key={fm.EmployeeID}>
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
                          {getInitials(fm.Name)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>{fm.Name}</Typography>
                          {fm.PhoneNumber && (
                            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 0.3 }}>
                              <PhoneIcon sx={{ fontSize: 11 }} /> {fm.PhoneNumber}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={fm.Gender}
                        size="small"
                        sx={{
                          bgcolor: fm.Gender === 'Male' ? '#eff6ff' : '#fdf2f8',
                          color: fm.Gender === 'Male' ? '#2563eb' : '#db2777',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#64748b' }}>{getDeptName(fm.DepartmentID)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={fm.Position} size="small" sx={{ bgcolor: pc.bg, color: pc.color, fontWeight: 600, fontSize: '0.75rem' }} />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#059669' }}>
                        {formatSalary(fm.Salary)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#64748b' }}>{formatDate(fm.HireDate)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                        <IconButton size="small" onClick={() => handleOpen(fm)} disabled={isPreviewMode} sx={{ color: '#6366f1', bgcolor: 'rgba(99,102,241,0.08)', '&:hover': { bgcolor: 'rgba(99,102,241,0.16)' } }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteClick(fm)} disabled={isPreviewMode} sx={{ color: '#ef4444', bgcolor: 'rgba(239,68,68,0.08)', '&:hover': { bgcolor: 'rgba(239,68,68,0.16)' } }}>
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
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FacultyIcon sx={{ color: '#fff', fontSize: 22 }} />
            </Box>
            {editingFacultyMember ? 'Edit Faculty Member' : 'New Faculty Member'}
          </Box>
          <IconButton onClick={handleClose} size="small" sx={{ color: '#94a3b8' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1.5 }}>
            {error && <Alert severity="error" sx={{ borderRadius: '12px' }}>{error}</Alert>}
            <TextField name="Name" label="Full Name" value={formData.Name} onChange={handleChange} fullWidth required />
            <TextField name="Gender" label="Gender" value={formData.Gender} onChange={handleChange} select fullWidth required>
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
            </TextField>
            <TextField name="PhoneNumber" label="Phone Number" value={formData.PhoneNumber} onChange={handleChange} fullWidth />
            <TextField name="DepartmentID" label="Department" value={formData.DepartmentID} onChange={handleChange} select fullWidth required>
              {departments.map((dept) => (
                <MenuItem key={dept.DepartmentID} value={dept.DepartmentID}>{dept.Name}</MenuItem>
              ))}
            </TextField>
            <TextField name="Position" label="Position" value={formData.Position} onChange={handleChange} fullWidth required />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                name="Salary"
                label="Salary"
                type="number"
                value={formData.Salary}
                onChange={handleChange}
                fullWidth
                required
                inputProps={{ step: '0.01', min: '0' }}
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
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={handleClose} sx={{ color: '#64748b', fontWeight: 600 }}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={isPreviewMode}>
            {editingFacultyMember ? 'Update Faculty' : 'Add Faculty'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirm.open}
        title="Delete Faculty Member"
        message={`Are you sure you want to delete "${deleteConfirm.name}"? Their teaching assignments (lectures/labs) will also be removed.`}
        confirmLabel="Delete"
        severity="error"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm({ open: false, id: null, name: '' })}
      />
    </Box>
  );
}

export default Faculty;
