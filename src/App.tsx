// Main App component with routing
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import { ErrorBoundary } from '@/components/ErrorBoundary';

// CRM Pages
import { CRMDashboardPage } from '@/pages/CRMDashboardPage';
import { CRMContactList } from '@/pages/CRMContactList';
import { CRMContactDetail } from '@/pages/CRMContactDetail';
import { CRMLeadList } from '@/pages/CRMLeadList';
import { CRMLeadDetail } from '@/pages/CRMLeadDetail';
import { CRMTaskCalendar } from '@/pages/CRMTaskCalendar';
import { CRMSettings } from '@/pages/CRMSettings';
import { CRMTaskTemplatesSettings } from '@/pages/CRMTaskTemplatesSettings';
import { CRMActions } from '@/pages/CRMActions';
import { CRMExpedientes } from '@/pages/CRMExpedientes';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
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
          
          {/* Servicio de contratación y firma */}
          <Route path="/contrato/login" element={<AdminLogin />} />
          <Route path="/contrato/dashboard" element={<AdminDashboard />} />
          <Route path="/contrato" element={<AdminLogin />} />
          
          {/* CRM Dashboard - Nuevo dashboard completo */}
          <Route path="/crm" element={<CRMDashboardPage />} />
          
          {/* CRM Contacts */}
          <Route path="/crm/contacts" element={<CRMContactList />} />
          <Route path="/crm/contacts/:id" element={<CRMContactDetail />} />
          
          {/* CRM Leads */}
          <Route path="/crm/leads" element={<CRMLeadList />} />
          <Route path="/crm/leads/:id" element={<CRMLeadDetail />} />
          
          {/* CRM Calendar */}
          <Route path="/crm/calendar" element={<CRMTaskCalendar />} />
          
          {/* CRM Actions & Expedientes */}
          <Route path="/crm/actions" element={<CRMActions />} />
          <Route path="/crm/expedientes" element={<CRMExpedientes />} />
          
          {/* CRM Settings */}
          <Route path="/crm/settings" element={<CRMSettings />} />
          <Route path="/crm/settings/task-templates" element={<CRMTaskTemplatesSettings />} />
          
          {/* Client login (futuro) */}
          <Route path="/login" element={<Login />} />
          
          {/* Catch all - 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
