import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  useTheme,
  Tabs,
  Tab,
  Badge,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  AdminPanelSettings,
  Report,
  TrendingUp,
  Visibility,
  CheckCircle,
  Cancel,
  Edit,
  Refresh,
  FilterList,
  Search,
} from '@mui/icons-material';
import { useTranslation } from '../../utils/translations';
import {
  useGetAdminDashboardQuery,
  useGetReportsQuery,
  useGetPromotionsQuery,
  useUpdateReportStatusMutation,
  useUpdatePromotionStatusMutation,
} from './adminApiSlice';

const AdminDashboard = () => {
  const { t, currentLanguage } = useTranslation();
  const theme = useTheme();
  
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [reportsPage, setReportsPage] = useState(0);
  const [promotionsPage, setPromotionsPage] = useState(0);
  const [reportsRowsPerPage, setReportsRowsPerPage] = useState(10);
  const [promotionsRowsPerPage, setPromotionsRowsPerPage] = useState(10);
  const [reportStatusFilter, setReportStatusFilter] = useState('');
  const [promotionStatusFilter, setPromotionStatusFilter] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [promotionDialogOpen, setPromotionDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  // API queries
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useGetAdminDashboardQuery();
  const { data: reportsData, isLoading: reportsLoading, error: reportsError } = useGetReportsQuery({
    page: reportsPage + 1,
    limit: reportsRowsPerPage,
    status: reportStatusFilter || undefined,
  });
  const { data: promotionsData, isLoading: promotionsLoading, error: promotionsError } = useGetPromotionsQuery({
    page: promotionsPage + 1,
    limit: promotionsRowsPerPage,
    status: promotionStatusFilter || undefined,
  });

  // Mutations
  const [updateReportStatus, { isLoading: updatingReport }] = useUpdateReportStatusMutation();
  const [updatePromotionStatus, { isLoading: updatingPromotion }] = useUpdatePromotionStatusMutation();

  // Handlers
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleReportsPageChange = (event, newPage) => {
    setReportsPage(newPage);
  };

  const handlePromotionsPageChange = (event, newPage) => {
    setPromotionsPage(newPage);
  };

  const handleReportsRowsPerPageChange = (event) => {
    setReportsRowsPerPage(parseInt(event.target.value, 10));
    setReportsPage(0);
  };

  const handlePromotionsRowsPerPageChange = (event) => {
    setPromotionsRowsPerPage(parseInt(event.target.value, 10));
    setPromotionsPage(0);
  };

  const handleReportStatusUpdate = async (reportId, status) => {
    try {
      await updateReportStatus({
        reportId,
        status,
        adminNotes: adminNotes,
      }).unwrap();
      setReportDialogOpen(false);
      setAdminNotes('');
      setSelectedReport(null);
    } catch (error) {
      console.error('Error updating report status:', error);
    }
  };

  const handlePromotionStatusUpdate = async (postId, processed) => {
    try {
      await updatePromotionStatus({
        postId,
        processed,
      }).unwrap();
      setPromotionDialogOpen(false);
      setSelectedPromotion(null);
    } catch (error) {
      console.error('Error updating promotion status:', error);
    }
  };

  const openReportDialog = (report) => {
    setSelectedReport(report);
    setReportDialogOpen(true);
  };

  const openPromotionDialog = (promotion) => {
    setSelectedPromotion(promotion);
    setPromotionDialogOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'reviewed': return 'info';
      case 'resolved': return 'success';
      case 'dismissed': return 'error';
      default: return 'default';
    }
  };

  const getReasonTypeLabel = (reasonType) => {
    const labels = {
      inappropriate_content: t('inappropriateContent'),
      spam_fake: t('spamFake'),
      duplicate: t('duplicate'),
      wrong_category: t('wrongCategory'),
      suspicious_activity: t('suspiciousActivity'),
      personal_info: t('personalInfo'),
      other: t('other'),
    };
    return labels[reasonType] || reasonType;
  };

  if (dashboardLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (dashboardError) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">
          {t('errorLoadingDashboard')}: {dashboardError?.data?.message || dashboardError?.message}
        </Alert>
      </Container>
    );
  }

  const { statistics, recentReports, recentPromotions } = dashboardData?.data || {};

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <AdminPanelSettings sx={{ fontSize: 40, color: theme.palette.primary.main }} />
          <Typography variant="h4" fontWeight="bold">
            {t('adminDashboard')}
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          {t('adminDashboardDescription')}
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    {t('totalReports')}
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {statistics?.totalReports || 0}
                  </Typography>
                </Box>
                <Badge badgeContent={statistics?.pendingReports || 0} color="error">
                  <Report sx={{ fontSize: 40, color: theme.palette.error.main }} />
                </Badge>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    {t('pendingReports')}
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {statistics?.pendingReports || 0}
                  </Typography>
                </Box>
                <Report sx={{ fontSize: 40, color: theme.palette.warning.main }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    {t('totalPromotions')}
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {statistics?.totalPromotions || 0}
                  </Typography>
                </Box>
                <Badge badgeContent={statistics?.pendingPromotions || 0} color="warning">
                  <TrendingUp sx={{ fontSize: 40, color: theme.palette.primary.main }} />
                </Badge>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    {t('pendingPromotions')}
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {statistics?.pendingPromotions || 0}
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, color: theme.palette.warning.main }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab 
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <Report />
                {t('reports')}
                {statistics?.pendingReports > 0 && (
                  <Chip 
                    label={statistics.pendingReports} 
                    size="small" 
                    color="error" 
                  />
                )}
              </Box>
            } 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <TrendingUp />
                {t('promotions')}
                {statistics?.pendingPromotions > 0 && (
                  <Chip 
                    label={statistics.pendingPromotions} 
                    size="small" 
                    color="warning" 
                  />
                )}
              </Box>
            } 
          />
        </Tabs>
      </Paper>

      {/* Reports Tab */}
      {activeTab === 0 && (
        <Paper>
          <Box p={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                {t('reportedPosts')}
              </Typography>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>{t('filterByStatus')}</InputLabel>
                <Select
                  value={reportStatusFilter}
                  label={t('filterByStatus')}
                  onChange={(e) => setReportStatusFilter(e.target.value)}
                >
                  <MenuItem value="">{t('allStatuses')}</MenuItem>
                  <MenuItem value="pending">{t('pending')}</MenuItem>
                  <MenuItem value="reviewed">{t('reviewed')}</MenuItem>
                  <MenuItem value="resolved">{t('resolved')}</MenuItem>
                  <MenuItem value="dismissed">{t('dismissed')}</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {reportsLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : reportsError ? (
              <Alert severity="error">
                {t('errorLoadingReports')}: {reportsError?.data?.message || reportsError?.message}
              </Alert>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('post')}</TableCell>
                        <TableCell>{t('reason')}</TableCell>
                        <TableCell>{t('reportedBy')}</TableCell>
                        <TableCell>{t('status')}</TableCell>
                        <TableCell>{t('reportedAt')}</TableCell>
                        <TableCell>{t('actions')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportsData?.data?.reports?.map((report) => (
                        <TableRow key={report._id}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {report.postId?.title || t('noTitle')}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {report.postId?.exactLocation || t('noLocation')}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2">
                                {getReasonTypeLabel(report.reasonType)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {report.reason}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {report.reportedBy?.username || t('anonymous')}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={t(report.status)}
                              color={getStatusColor(report.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(report.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Tooltip title={t('viewDetails')}>
                              <IconButton
                                size="small"
                                onClick={() => openReportDialog(report)}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={reportsData?.data?.pagination?.totalReports || 0}
                  rowsPerPage={reportsRowsPerPage}
                  page={reportsPage}
                  onPageChange={handleReportsPageChange}
                  onRowsPerPageChange={handleReportsRowsPerPageChange}
                />
              </>
            )}
          </Box>
        </Paper>
      )}

      {/* Promotions Tab */}
      {activeTab === 1 && (
        <Paper>
          <Box p={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                {t('promotionRequests')}
              </Typography>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>{t('filterByStatus')}</InputLabel>
                <Select
                  value={promotionStatusFilter}
                  label={t('filterByStatus')}
                  onChange={(e) => setPromotionStatusFilter(e.target.value)}
                >
                  <MenuItem value="">{t('allStatuses')}</MenuItem>
                  <MenuItem value="requested">{t('requested')}</MenuItem>
                  <MenuItem value="processed">{t('processed')}</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {promotionsLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : promotionsError ? (
              <Alert severity="error">
                {t('errorLoadingPromotions')}: {promotionsError?.data?.message || promotionsError?.message}
              </Alert>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('post')}</TableCell>
                        <TableCell>{t('user')}</TableCell>
                        <TableCell>{t('category')}</TableCell>
                        <TableCell>{t('location')}</TableCell>
                        <TableCell>{t('requestedAt')}</TableCell>
                        <TableCell>{t('status')}</TableCell>
                        <TableCell>{t('actions')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {promotionsData?.data?.promotions?.map((promotion) => (
                        <TableRow key={promotion._id}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {promotion.title || t('noTitle')}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {promotion.description?.substring(0, 50)}...
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {promotion.user?.username || t('unknown')}
                          </TableCell>
                          <TableCell>
                            {promotion.category?.labels?.en || promotion.category?.code || t('unknown')}
                          </TableCell>
                          <TableCell>
                            {promotion.city?.labels?.en || promotion.city || t('unknown')}
                          </TableCell>
                          <TableCell>
                            {new Date(promotion.promotionRequestedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={promotion.promotionProcessed ? t('processed') : t('pending')}
                              color={promotion.promotionProcessed ? 'success' : 'warning'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Tooltip title={t('viewDetails')}>
                              <IconButton
                                size="small"
                                onClick={() => openPromotionDialog(promotion)}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={promotionsData?.data?.pagination?.totalPromotions || 0}
                  rowsPerPage={promotionsRowsPerPage}
                  page={promotionsPage}
                  onPageChange={handlePromotionsPageChange}
                  onRowsPerPageChange={handlePromotionsRowsPerPageChange}
                />
              </>
            )}
          </Box>
        </Paper>
      )}

      {/* Report Details Dialog */}
      <Dialog
        open={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Report />
            {t('reportDetails')}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedReport && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {t('postInformation')}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('title')}:</strong> {selectedReport.postId?.title || t('noTitle')}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('location')}:</strong> {selectedReport.postId?.exactLocation || t('noLocation')}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('contact')}:</strong> {selectedReport.postId?.contact || t('noContact')}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                {t('reportInformation')}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('reason')}:</strong> {getReasonTypeLabel(selectedReport.reasonType)}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('description')}:</strong> {selectedReport.reason}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('reportedBy')}:</strong> {selectedReport.reportedBy?.username || t('anonymous')}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('reportedAt')}:</strong> {new Date(selectedReport.createdAt).toLocaleString()}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <TextField
                fullWidth
                multiline
                rows={3}
                label={t('adminNotes')}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={t('addNotesForThisReport')}
                sx={{ mt: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialogOpen(false)}>
            {t('cancel')}
          </Button>
          <Button
            onClick={() => handleReportStatusUpdate(selectedReport._id, 'dismissed')}
            color="error"
            disabled={updatingReport}
          >
            {t('dismiss')}
          </Button>
          <Button
            onClick={() => handleReportStatusUpdate(selectedReport._id, 'resolved')}
            color="success"
            disabled={updatingReport}
          >
            {t('resolve')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Promotion Details Dialog */}
      <Dialog
        open={promotionDialogOpen}
        onClose={() => setPromotionDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <TrendingUp />
            {t('promotionDetails')}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedPromotion && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {t('postInformation')}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('title')}:</strong> {selectedPromotion.title || t('noTitle')}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('description')}:</strong> {selectedPromotion.description || t('noDescription')}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('location')}:</strong> {selectedPromotion.exactLocation || t('noLocation')}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('contact')}:</strong> {selectedPromotion.contact || t('noContact')}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                {t('promotionInformation')}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('user')}:</strong> {selectedPromotion.user?.username || t('unknown')}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('category')}:</strong> {selectedPromotion.category?.labels?.en || selectedPromotion.category?.code || t('unknown')}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('requestedAt')}:</strong> {new Date(selectedPromotion.promotionRequestedAt).toLocaleString()}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('status')}:</strong> {selectedPromotion.promotionProcessed ? t('processed') : t('pending')}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPromotionDialogOpen(false)}>
            {t('cancel')}
          </Button>
          {!selectedPromotion?.promotionProcessed && (
            <Button
              onClick={() => handlePromotionStatusUpdate(selectedPromotion._id, true)}
              color="success"
              disabled={updatingPromotion}
            >
              {t('markAsProcessed')}
            </Button>
          )}
          {selectedPromotion?.promotionProcessed && (
            <Button
              onClick={() => handlePromotionStatusUpdate(selectedPromotion._id, false)}
              color="warning"
              disabled={updatingPromotion}
            >
              {t('markAsPending')}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;
