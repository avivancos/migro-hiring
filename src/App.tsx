// Main App component with routing
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/providers/AuthProvider';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useTokenRefresh } from '@/hooks/useTokenRefresh';
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

// CRM Pages
import { CRMDashboardPage } from '@/pages/CRMDashboardPage';
import { CRMContactList } from '@/pages/CRMContactList';
import { CRMLayout } from '@/components/CRM/CRMLayout';
import { CRMContactDetail } from '@/pages/CRMContactDetail';
import { CRMContactEdit } from '@/pages/CRMContactEdit';
import { CRMLeadList } from '@/pages/CRMLeadList';
import { CRMLeadDetail } from '@/pages/CRMLeadDetail';
import { CRMTaskCalendar } from '@/pages/CRMTaskCalendar';
import { CRMSettings } from '@/pages/CRMSettings';
import { CRMTaskTemplatesSettings } from '@/pages/CRMTaskTemplatesSettings';
import { CRMCustomFieldsSettings } from '@/pages/CRMCustomFieldsSettings';
import { CRMActions } from '@/pages/CRMActions';
import { CRMExpedientes } from '@/pages/CRMExpedientes';
import { CRMCallHandler } from '@/pages/CRMCallHandler';
import { CRMTaskDetail } from '@/pages/CRMTaskDetail';
import { CRMContracts } from '@/pages/CRMContracts';

// Admin Pages
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { AdminDashboard as AdminDashboardPage } from '@/pages/admin/AdminDashboard';
import { AdminUsers } from '@/pages/admin/AdminUsers';
import { AdminUserDetail } from '@/pages/admin/AdminUserDetail';
import { AdminUserCreate } from '@/pages/admin/AdminUserCreate';
import { AdminAuditLogs } from '@/pages/admin/AdminAuditLogs';
import { AdminPili } from '@/pages/admin/AdminPili';
import { AdminConversations } from '@/pages/admin/AdminConversations';
import { AdminContracts } from '@/pages/admin/AdminContracts';
import { AdminContractDetail } from '@/pages/admin/AdminContractDetail';
import { AdminContractCreate } from '@/pages/admin/AdminContractCreate';
import { AdminCallTypes } from '@/pages/admin/AdminCallTypes';

function AppContent() {
  // Activar refresh automático de tokens
  useTokenRefresh();
  
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
            <Route index element={<AdminDashboardPage />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="users/create" element={<AdminUserCreate />} />
            <Route path="users/:id" element={<AdminUserDetail />} />
            <Route path="audit-logs" element={<AdminAuditLogs />} />
            <Route path="pili" element={<AdminPili />} />
            <Route path="conversations" element={<AdminConversations />} />
            <Route path="conversations/:id" element={<AdminConversations />} />
            <Route path="contracts" element={<AdminContracts />} />
            <Route path="contracts/create" element={<AdminContractCreate />} />
            <Route path="contracts/:code" element={<AdminContractDetail />} />
            <Route path="call-types" element={<AdminCallTypes />} />
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
            <Route index element={<CRMDashboardPage />} />
            
            {/* CRM Contacts */}
            <Route path="contacts" element={<CRMContactList />} />
            <Route path="contacts/new" element={<CRMContactEdit />} />
            <Route path="contacts/:id/edit" element={<CRMContactEdit />} />
            <Route path="contacts/:id" element={<CRMContactDetail />} />
            
            {/* CRM Contracts */}
            <Route path="contracts" element={<CRMContracts />} />
            
            {/* CRM Leads */}
            <Route path="leads" element={<CRMLeadList />} />
            <Route path="leads/:id" element={<CRMLeadDetail />} />
            
            {/* CRM Calendar */}
            <Route path="calendar" element={<CRMTaskCalendar />} />
            
            {/* CRM Tasks */}
            <Route path="tasks/:id" element={<CRMTaskDetail />} />
            
            {/* CRM Actions & Expedientes */}
            <Route path="actions" element={<CRMActions />} />
            <Route path="expedientes" element={<CRMExpedientes />} />
            
            {/* CRM Call Handler */}
            <Route path="call" element={<CRMCallHandler />} />
            
            {/* CRM Settings */}
            <Route path="settings" element={<CRMSettings />} />
            <Route path="settings/task-templates" element={<CRMTaskTemplatesSettings />} />
            <Route path="settings/custom-fields" element={<CRMCustomFieldsSettings />} />
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
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
