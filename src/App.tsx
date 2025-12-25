// Main App component with routing
import { lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/providers/AuthProvider';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useTokenRefresh } from '@/hooks/useTokenRefresh';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Home } from '@/pages/Home';
import { HiringFlow } from '@/pages/HiringFlow';
import { Login } from '@/pages/Login';
import { NotFound } from '@/pages/NotFound';
import { Expired } from '@/pages/Expired';
import { AdminLogin } from '@/pages/AdminLogin';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { PrivacyPolicy } from '@/pages/PrivacyPolicy';
import { BorradorPDF } from '@/pages/BorradorPDF';
import { Colaboradores } from '@/pages/Colaboradores';
import { Closer } from '@/pages/Closer';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LazyLoadWrapper } from '@/components/common/LazyLoadWrapper';
import { PerformanceMonitor } from '@/components/common/PerformanceMonitor';

// CRM Pages - Lazy load componentes pesados
import { CRMLayout } from '@/components/CRM/CRMLayout';
// Lazy load de componentes pesados para reducir bundle inicial
const CRMDashboardPage = lazy(() => import('@/pages/CRMDashboardPage').then(m => ({ default: m.CRMDashboardPage })));
const CRMContactList = lazy(() => import('@/pages/CRMContactList').then(m => ({ default: m.CRMContactList })));
const CRMContactDetail = lazy(() => import('@/pages/CRMContactDetail').then(m => ({ default: m.CRMContactDetail })));
const CRMContactEdit = lazy(() => import('@/pages/CRMContactEdit').then(m => ({ default: m.CRMContactEdit })));
const CRMLeadList = lazy(() => import('@/pages/CRMLeadList').then(m => ({ default: m.CRMLeadList })));
const CRMLeadDetail = lazy(() => import('@/pages/CRMLeadDetail').then(m => ({ default: m.CRMLeadDetail })));
const CRMOpportunities = lazy(() => import('@/pages/CRMOpportunities').then(m => ({ default: m.CRMOpportunities })));
const CRMOpportunityDetail = lazy(() => import('@/pages/CRMOpportunityDetail').then(m => ({ default: m.CRMOpportunityDetail })));
const CRMCaseAnalysis = lazy(() => import('@/pages/CRMCaseAnalysis').then(m => ({ default: m.CRMCaseAnalysis })));
const CRMTaskCalendar = lazy(() => import('@/pages/CRMTaskCalendar').then(m => ({ default: m.CRMTaskCalendar })));
const CRMSettings = lazy(() => import('@/pages/CRMSettings').then(m => ({ default: m.CRMSettings })));
const CRMTaskTemplatesSettings = lazy(() => import('@/pages/CRMTaskTemplatesSettings').then(m => ({ default: m.CRMTaskTemplatesSettings })));
const CRMCustomFieldsSettings = lazy(() => import('@/pages/CRMCustomFieldsSettings').then(m => ({ default: m.CRMCustomFieldsSettings })));
const CRMActions = lazy(() => import('@/pages/CRMActions').then(m => ({ default: m.CRMActions })));
const CRMExpedientesList = lazy(() => import('@/pages/CRMExpedientesList').then(m => ({ default: m.CRMExpedientesList })));
const CRMExpedienteDetail = lazy(() => import('@/pages/CRMExpedienteDetail').then(m => ({ default: m.CRMExpedienteDetail })));
const CRMCallHandler = lazy(() => import('@/pages/CRMCallHandler').then(m => ({ default: m.CRMCallHandler })));
const CRMTaskDetail = lazy(() => import('@/pages/CRMTaskDetail').then(m => ({ default: m.CRMTaskDetail })));
const CRMContracts = lazy(() => import('@/pages/CRMContracts').then(m => ({ default: m.CRMContracts })));

// Admin Pages - Lazy load componentes pesados
const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers').then(m => ({ default: m.AdminUsers })));
const AdminUserDetail = lazy(() => import('@/pages/admin/AdminUserDetail').then(m => ({ default: m.AdminUserDetail })));
const AdminUserCreate = lazy(() => import('@/pages/admin/AdminUserCreate').then(m => ({ default: m.AdminUserCreate })));
const AdminAuditLogs = lazy(() => import('@/pages/admin/AdminAuditLogs').then(m => ({ default: m.AdminAuditLogs })));
const AdminPili = lazy(() => import('@/pages/admin/AdminPili').then(m => ({ default: m.AdminPili })));
const AdminConversations = lazy(() => import('@/pages/admin/AdminConversations').then(m => ({ default: m.AdminConversations })));
const AdminContracts = lazy(() => import('@/pages/admin/AdminContracts').then(m => ({ default: m.AdminContracts })));
const AdminContractDetail = lazy(() => import('@/pages/admin/AdminContractDetail').then(m => ({ default: m.AdminContractDetail })));
const AdminContractCreate = lazy(() => import('@/pages/admin/AdminContractCreate').then(m => ({ default: m.AdminContractCreate })));
const AdminCallTypes = lazy(() => import('@/pages/admin/AdminCallTypes').then(m => ({ default: m.AdminCallTypes })));
const AdminTracingDashboard = lazy(() => import('@/pages/admin/AdminTracingDashboard').then(m => ({ default: m.AdminTracingDashboard })));

function AppContent() {
  // Activar refresh automático de tokens
  useTokenRefresh();
  
  // Actualizar título de página automáticamente según la ruta
  usePageTitle();
  
  return (
    <Routes>
          {/* Public routes - NO requieren autenticación */}
          <Route path="/" element={<Home />} />
          <Route path="/contratacion/:code" element={<HiringFlow />} />
          <Route path="/hiring/:code" element={<HiringFlow />} /> {/* Alias en inglés */}
          <Route path="/expirado" element={<Expired />} />
          <Route path="/404" element={<NotFound />} />
          <Route path="/privacidad" element={<PrivacyPolicy />} />
          <Route path="/privacy" element={<PrivacyPolicy />} /> {/* Alias en inglés */}
          <Route path="/borrador" element={<BorradorPDF />} />
          <Route path="/colaboradores" element={<Colaboradores />} />
          <Route path="/closer" element={<Closer />} />
          <Route path="/pili" element={<AdminPili />} />
          
          {/* Servicio de contratación y firma - RUTAS ANTIGUAS (mantener para compatibilidad) */}
          <Route path="/contrato-old/login" element={<AdminLogin />} />
          <Route path="/contrato-old/dashboard" element={<AdminDashboard />} />
          <Route path="/contrato-old" element={<AdminLogin />} />
          
          {/* Rutas de autenticación unificadas */}
          <Route path="/auth/login" element={<AdminLogin />} />
          
          {/* Servicio de contratación y firma - Dashboard */}
          <Route path="/contrato/dashboard" element={<AdminDashboard />} />
          
          {/* Admin Module - Panel de administración */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<LazyLoadWrapper fallback="spinner"><AdminDashboardPage /></LazyLoadWrapper>} />
            <Route path="dashboard" element={<LazyLoadWrapper fallback="spinner"><AdminDashboardPage /></LazyLoadWrapper>} />
            <Route path="users" element={<LazyLoadWrapper fallback="skeleton" skeletonCount={5}><AdminUsers /></LazyLoadWrapper>} />
            <Route path="users/create" element={<LazyLoadWrapper fallback="spinner"><AdminUserCreate /></LazyLoadWrapper>} />
            <Route path="users/:id" element={<LazyLoadWrapper fallback="spinner"><AdminUserDetail /></LazyLoadWrapper>} />
            <Route path="audit-logs" element={<LazyLoadWrapper fallback="skeleton" skeletonCount={5}><AdminAuditLogs /></LazyLoadWrapper>} />
            <Route path="conversations" element={<LazyLoadWrapper fallback="skeleton" skeletonCount={5}><AdminConversations /></LazyLoadWrapper>} />
            <Route path="conversations/:id" element={<LazyLoadWrapper fallback="spinner"><AdminConversations /></LazyLoadWrapper>} />
            <Route path="contracts" element={<LazyLoadWrapper fallback="skeleton" skeletonCount={5}><AdminContracts /></LazyLoadWrapper>} />
            <Route path="contracts/create" element={<LazyLoadWrapper fallback="spinner"><AdminContractCreate /></LazyLoadWrapper>} />
            <Route path="contracts/:code" element={<LazyLoadWrapper fallback="spinner"><AdminContractDetail /></LazyLoadWrapper>} />
            <Route path="call-types" element={<LazyLoadWrapper fallback="spinner"><AdminCallTypes /></LazyLoadWrapper>} />
            <Route path="tracing" element={<LazyLoadWrapper fallback="spinner"><AdminTracingDashboard /></LazyLoadWrapper>} />
          </Route>
          
          {/* CRM Routes with Layout */}
          <Route
            path="/crm"
            element={
              <ProtectedRoute allowedRoles={['lawyer', 'agent', 'admin']}>
                <CRMLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<LazyLoadWrapper fallback="spinner"><CRMDashboardPage /></LazyLoadWrapper>} />
            
            {/* CRM Contacts */}
            <Route path="contacts" element={<LazyLoadWrapper fallback="skeleton" skeletonCount={5}><CRMContactList /></LazyLoadWrapper>} />
            <Route path="contacts/new" element={<LazyLoadWrapper fallback="spinner"><CRMContactEdit /></LazyLoadWrapper>} />
            <Route path="contacts/:id/edit" element={<LazyLoadWrapper fallback="spinner"><CRMContactEdit /></LazyLoadWrapper>} />
            <Route path="contacts/:id" element={<LazyLoadWrapper fallback="spinner"><CRMContactDetail /></LazyLoadWrapper>} />
            
            {/* CRM Contracts */}
            <Route path="contracts" element={<LazyLoadWrapper fallback="spinner"><CRMContracts /></LazyLoadWrapper>} />
            
            {/* CRM Leads */}
            <Route path="leads" element={<LazyLoadWrapper fallback="skeleton" skeletonCount={5}><CRMLeadList /></LazyLoadWrapper>} />
            <Route path="leads/:id" element={<LazyLoadWrapper fallback="spinner"><CRMLeadDetail /></LazyLoadWrapper>} />
            
            {/* CRM Opportunities */}
            <Route path="opportunities" element={<LazyLoadWrapper fallback="skeleton" skeletonCount={5}><CRMOpportunities /></LazyLoadWrapper>} />
            <Route path="opportunities/:id" element={<LazyLoadWrapper fallback="spinner"><CRMOpportunityDetail /></LazyLoadWrapper>} />
            <Route path="opportunities/:opportunityId/analyze" element={<LazyLoadWrapper fallback="spinner"><CRMCaseAnalysis /></LazyLoadWrapper>} />
            
            {/* CRM Calendar */}
            <Route path="calendar" element={<LazyLoadWrapper fallback="spinner"><CRMTaskCalendar /></LazyLoadWrapper>} />
            
            {/* CRM Tasks */}
            <Route path="tasks/:id" element={<LazyLoadWrapper fallback="spinner"><CRMTaskDetail /></LazyLoadWrapper>} />
            
            {/* CRM Actions & Expedientes */}
            <Route path="actions" element={<LazyLoadWrapper fallback="spinner"><CRMActions /></LazyLoadWrapper>} />
            <Route
              path="expedientes"
              element={
                <LazyLoadWrapper fallback="skeleton" skeletonCount={5}>
                  <CRMExpedientesList />
                </LazyLoadWrapper>
              }
            />
            <Route
              path="expedientes/:id"
              element={
                <LazyLoadWrapper fallback="spinner">
                  <CRMExpedienteDetail />
                </LazyLoadWrapper>
              }
            />
            <Route
              path="expedientes/new"
              element={
                <LazyLoadWrapper fallback="spinner">
                  <CRMExpedienteDetail />
                </LazyLoadWrapper>
              }
            />
            
            {/* CRM Call Handler */}
            <Route path="call" element={<LazyLoadWrapper fallback="spinner"><CRMCallHandler /></LazyLoadWrapper>} />
            
            {/* CRM Settings */}
            <Route path="settings" element={<LazyLoadWrapper fallback="spinner"><CRMSettings /></LazyLoadWrapper>} />
            <Route path="settings/task-templates" element={<LazyLoadWrapper fallback="spinner"><CRMTaskTemplatesSettings /></LazyLoadWrapper>} />
            <Route path="settings/custom-fields" element={<LazyLoadWrapper fallback="spinner"><CRMCustomFieldsSettings /></LazyLoadWrapper>} />
          </Route>
          
          {/* Client login (futuro) */}
          <Route path="/login" element={<Login />} />
          
      {/* Catch all - 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <PerformanceMonitor enabled={true} showSlowOnly={true} slowThreshold={1000} />
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
