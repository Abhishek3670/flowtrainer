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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Pagination,
  Chip,
  Tooltip,
  IconButton
} from '@mui/material';
import { Search, Refresh, Info } from '@mui/icons-material';
import { activityApi } from '../services/adminApi';
import { ActivityLog } from '../types';

const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    userId: '',
    action: '',
    entityType: '',
    startDate: '',
    endDate: ''
  });
  const [limit] = useState(20);

  useEffect(() => {
    fetchAuditLogs();
  }, [page, filters]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await activityApi.getLogs({
        ...filters,
        page,
        limit
      });
      
      if (response.data.success) {
        setLogs(response.data.data?.logs || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else {
        setError(response.data.error || 'Failed to fetch audit logs');
      }
    } catch (err) {
      setError('Failed to fetch audit logs');
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPage(1); // Reset to first page when filters change
  };

  const handleSearch = () => {
    setPage(1);
    fetchAuditLogs();
  };

  const handleRefresh = () => {
    fetchAuditLogs();
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('ADD')) return 'success';
    if (action.includes('UPDATE') || action.includes('EDIT')) return 'warning';
    if (action.includes('DELETE') || action.includes('REMOVE')) return 'error';
    return 'default';
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
        <Typography variant="h4" component="h1">Audit Logs</Typography>
        <Button 
          variant="outlined" 
          startIcon={<Refresh />}
          onClick={handleRefresh}
        >
          Refresh
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <TextField
            name="userId"
            label="User ID"
            value={filters.userId}
            onChange={handleFilterChange}
            size="small"
          />
          
          <TextField
            name="action"
            label="Action"
            value={filters.action}
            onChange={handleFilterChange}
            size="small"
          />
          
          <TextField
            name="entityType"
            label="Entity Type"
            value={filters.entityType}
            onChange={handleFilterChange}
            size="small"
          />
          
          <TextField
            name="startDate"
            label="Start Date"
            type="date"
            value={filters.startDate}
            onChange={handleFilterChange}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
          
          <TextField
            name="endDate"
            label="End Date"
            type="date"
            value={filters.endDate}
            onChange={handleFilterChange}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
          
          <Button 
            variant="contained" 
            startIcon={<Search />}
            onClick={handleSearch}
          >
            Search
          </Button>
        </Box>
      </Paper>

      {/* Audit Logs Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden', mb: 3 }}>
        <TableContainer>
          <Table stickyHeader aria-label="audit logs table">
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>User ID</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Entity</TableCell>
                <TableCell>Details</TableCell>
                <TableCell>IP Address</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {log.userId}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={log.action} 
                      color={getActionColor(log.action)} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>
                    {log.entityType}
                    {log.entityId && ` (${log.entityId})`}
                  </TableCell>
                  <TableCell>
                    {log.details ? (
                      <Tooltip title={JSON.stringify(log.details, null, 2)}>
                        <IconButton size="small">
                          <Info fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      'No details'
                    )}
                  </TableCell>
                  <TableCell>
                    {log.ipAddress || 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No audit logs found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination 
            count={totalPages} 
            page={page} 
            onChange={handlePageChange} 
            color="primary" 
          />
        </Box>
      )}
    </Container>
  );
};

export default AuditLogsPage;