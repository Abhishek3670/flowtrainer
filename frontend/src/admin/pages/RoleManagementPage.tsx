import React, { useState, useEffect } from 'react';
import {
  Typography,
  Container,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { userApi } from '../services/adminApi';

// Mock data for roles and permissions based on the roles_permissions_matrix.json
const mockRoles = [
  {
    id: 'user',
    name: 'User',
    description: 'Regular authenticated user',
    permissions: ['read_own_profile', 'update_own_profile', 'read_own_workflows']
  },
  {
    id: 'admin',
    name: 'Admin',
    description: 'Administrator with system management capabilities',
    permissions: [
      'read_own_profile', 
      'update_own_profile', 
      'read_own_workflows',
      'read_users',
      'manage_users',
      'read_system_metrics',
      'manage_system_config',
      'read_audit_logs',
      'manage_workflows'
    ]
  },
  {
    id: 'super-admin',
    name: 'Super Admin',
    description: 'Super administrator with full system access',
    permissions: [
      'read_own_profile', 
      'update_own_profile', 
      'read_own_workflows',
      'read_users',
      'manage_users',
      'read_system_metrics',
      'manage_system_config',
      'read_audit_logs',
      'manage_workflows',
      'manage_roles',
      'manage_system',
      'manage_database',
      'view_sensitive_data',
      'impersonate_users'
    ]
  }
];

// Mock permissions data
const mockPermissions = [
  { id: 'read_own_profile', name: 'Read Own Profile', description: 'View own user profile' },
  { id: 'update_own_profile', name: 'Update Own Profile', description: 'Update own user profile' },
  { id: 'read_own_workflows', name: 'Read Own Workflows', description: 'View own workflow history' },
  { id: 'read_users', name: 'Read Users', description: 'View list of users' },
  { id: 'manage_users', name: 'Manage Users', description: 'Create, update, or delete users' },
  { id: 'read_system_metrics', name: 'Read System Metrics', description: 'View system metrics and health' },
  { id: 'manage_system_config', name: 'Manage System Config', description: 'Update system configuration' },
  { id: 'read_audit_logs', name: 'Read Audit Logs', description: 'View system audit logs' },
  { id: 'manage_workflows', name: 'Manage Workflows', description: 'Manage all workflows' },
  { id: 'manage_roles', name: 'Manage Roles', description: 'Create, update, or delete roles' },
  { id: 'manage_system', name: 'Manage System', description: 'Perform system administration tasks' },
  { id: 'manage_database', name: 'Manage Database', description: 'Perform database operations' },
  { id: 'view_sensitive_data', name: 'View Sensitive Data', description: 'View sensitive system information' },
  { id: 'impersonate_users', name: 'Impersonate Users', description: 'Impersonate other users' }
];

interface RoleFormData {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

const RoleManagementPage: React.FC = () => {
  const [roles, setRoles] = useState(mockRoles);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<any | null>(null);
  const [formData, setFormData] = useState<RoleFormData>({
    id: '',
    name: '',
    description: '',
    permissions: []
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [expandedRole, setExpandedRole] = useState<string | false>(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      // In a real implementation, you would fetch roles from the API
      // const response = await userApi.getRoles();
      // setRoles(response.data.roles);
      
      // For now, we'll use mock data
      setRoles(mockRoles);
    } catch (err) {
      setError('Failed to fetch roles');
      console.error('Error fetching roles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (role?: any) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: [...role.permissions]
      });
    } else {
      setEditingRole(null);
      setFormData({
        id: '',
        name: '',
        description: '',
        permissions: []
      });
    }
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRole(null);
    setFormErrors({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handlePermissionChange = (permissionId: string) => {
    setFormData(prev => {
      const permissions = [...prev.permissions];
      const index = permissions.indexOf(permissionId);
      
      if (index >= 0) {
        permissions.splice(index, 1);
      } else {
        permissions.push(permissionId);
      }
      
      return { ...prev, permissions };
    });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Role name is required';
    }
    
    if (!formData.id.trim()) {
      errors.id = 'Role ID is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      if (editingRole) {
        // Update existing role
        // In a real implementation:
        // const response = await userApi.updateRole(editingRole.id, formData);
        
        // For demo, just update in state
        const updatedRoles = roles.map(role => 
          role.id === editingRole.id ? { ...formData } : role
        );
        setRoles(updatedRoles);
        
        setSnackbar({ open: true, message: 'Role updated successfully', severity: 'success' });
      } else {
        // Create new role
        // In a real implementation:
        // const response = await userApi.createRole(formData);
        
        // For demo, just add to state
        const newRole = { ...formData };
        setRoles([...roles, newRole]);
        
        setSnackbar({ open: true, message: 'Role created successfully', severity: 'success' });
      }
      
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving role:', err);
      setSnackbar({ open: true, message: 'Failed to save role', severity: 'error' });
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    // Prevent deletion of system roles
    if (['user', 'admin', 'super-admin'].includes(roleId)) {
      setSnackbar({ open: true, message: 'Cannot delete system roles', severity: 'error' });
      return;
    }
    
    try {
      // In a real implementation:
      // await userApi.deleteRole(roleId);
      
      // For demo, just remove from state
      const updatedRoles = roles.filter(role => role.id !== roleId);
      setRoles(updatedRoles);
      
      setSnackbar({ open: true, message: 'Role deleted successfully', severity: 'success' });
    } catch (err) {
      console.error('Error deleting role:', err);
      setSnackbar({ open: true, message: 'Failed to delete role', severity: 'error' });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleAccordionChange = (roleId: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedRole(isExpanded ? roleId : false);
  };

  const getInheritedPermissions = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return [];
    
    // For simplicity, we'll just return the permissions as-is
    // In a real implementation, you would calculate inherited permissions
    return role.permissions;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">Role Management</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add New Role
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Manage user roles and their associated permissions. System roles (User, Admin, Super Admin) cannot be deleted.
        </Typography>
      </Alert>

      {/* Roles List */}
      <Box sx={{ mb: 3 }}>
        {roles.map((role) => (
          <Accordion 
            key={role.id} 
            expanded={expandedRole === role.id} 
            onChange={handleAccordionChange(role.id)}
            sx={{ mb: 1 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>{role.name}</Typography>
                <Chip label={role.id} size="small" sx={{ mr: 2 }} />
                <Box>
                  <Tooltip title="Edit">
                    <IconButton 
                      size="small" 
                      sx={{ mr: 1 }} 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDialog(role);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  {['user', 'admin', 'super-admin'].includes(role.id) ? (
                    <Tooltip title="System roles cannot be deleted">
                      <span>
                        <IconButton size="small" disabled>
                          <DeleteIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Delete">
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRole(role.id);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {role.description}
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom>
                Permissions ({role.permissions.length}):
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {role.permissions.map((permissionId) => {
                  const permission = mockPermissions.find(p => p.id === permissionId);
                  return (
                    <Tooltip key={permissionId} title={permission?.description || permissionId}>
                      <Chip 
                        label={permission?.name || permissionId} 
                        size="small" 
                        variant="outlined" 
                      />
                    </Tooltip>
                  );
                })}
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      {/* Role Form Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingRole ? 'Edit Role' : 'Add New Role'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              autoFocus
              margin="dense"
              name="name"
              label="Role Name"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.name}
              onChange={handleChange}
              error={!!formErrors.name}
              helperText={formErrors.name}
              sx={{ mb: 2 }}
              disabled={editingRole && ['user', 'admin', 'super-admin'].includes(editingRole.id)}
            />
            
            <TextField
              margin="dense"
              name="id"
              label="Role ID"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.id}
              onChange={handleChange}
              error={!!formErrors.id}
              helperText={formErrors.id || 'Unique identifier for the role'}
              sx={{ mb: 2 }}
              disabled={editingRole && ['user', 'admin', 'super-admin'].includes(editingRole.id)}
            />
            
            <TextField
              margin="dense"
              name="description"
              label="Description"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.description}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
            
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              Permissions:
              <Tooltip title="Select the permissions this role should have">
                <IconButton size="small">
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Typography>
            
            <Box sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid #ddd', borderRadius: 1, p: 1 }}>
              {mockPermissions.map((permission) => (
                <FormControlLabel
                  key={permission.id}
                  control={
                    <Checkbox
                      checked={formData.permissions.includes(permission.id)}
                      onChange={() => handlePermissionChange(permission.id)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2">{permission.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {permission.description}
                      </Typography>
                    </Box>
                  }
                  sx={{ width: '100%', alignItems: 'flex-start', mb: 1 }}
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingRole ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default RoleManagementPage;