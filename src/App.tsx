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
import { CRMDashboard } from '@/pages/CRMDashboard';
import { CRMLeads } from '@/pages/CRMLeads';
import { LeadDetail } from '@/pages/LeadDetail';
import { CRMContacts } from '@/pages/CRMContacts';
import { ContactDetail } from '@/pages/ContactDetail';
import { CRMCompanies } from '@/pages/CRMCompanies';
import { CRMTasks } from '@/pages/CRMTasks';

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
          
          {/* Admin routes - Original */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin" element={<AdminLogin />} />
          
          {/* CRM routes - New */}
          <Route path="/admin/crm" element={<CRMDashboard />} />
          <Route path="/admin/crm/leads" element={<CRMLeads />} />
          <Route path="/admin/crm/leads/:id" element={<LeadDetail />} />
          <Route path="/admin/crm/contacts" element={<CRMContacts />} />
          <Route path="/admin/crm/contacts/:id" element={<ContactDetail />} />
          <Route path="/admin/crm/companies" element={<CRMCompanies />} />
          <Route path="/admin/crm/tasks" element={<CRMTasks />} />
          <Route path="/admin/crm/pipeline" element={<CRMLeads />} /> {/* Vista Kanban */}
          
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
