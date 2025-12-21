// Contracts Service - API endpoints for contracts (hiring codes) management

import { api } from './api';
import { hiringService } from './hiringService';
import type {
  Contract,
  ContractListResponse,
  ContractFilters,
  ContractCreateRequest,
  ContractUpdateRequest,
} from '@/types/contracts';

/**
 * Normalize hiring code response to Contract format
 */
function normalizeHiringCode(hiringCode: any): Contract {
    // Helper to clean "N/A" values and provide defaults
    const cleanServiceName = (value: any): string => {
      if (!value || value === 'N/A' || value === 'n/a' || value === null || value === undefined || String(value).trim() === '') {
        // Valores por defecto según el tipo de servicio común
        return 'Autorización inicial de Residencia y Trabajo';
      }
      return String(value).trim();
    };
    
    const cleanServiceDescription = (value: any): string => {
      if (!value || value === 'N/A' || value === 'n/a' || value === null || value === undefined || String(value).trim() === '') {
        return 'Tramitación de expediente para obtención de la primera residencia temporal laboral en España';
      }
      return String(value).trim();
    };
    
    return {
      id: String(hiringCode.id || hiringCode.hiring_code),
      hiring_code: hiringCode.hiring_code,
      client_name: hiringCode.client_name || hiringCode.user_name || '',
      client_email: hiringCode.client_email || hiringCode.user_email || '',
      service_name: cleanServiceName(hiringCode.service_name),
      service_description: cleanServiceDescription(hiringCode.service_description),
      amount: hiringCode.amount || 0,
      currency: hiringCode.currency || 'EUR',
      status: (hiringCode.status || 'pending') as Contract['status'],
      kyc_status: hiringCode.kyc_status || null,
      grade: hiringCode.grade,
      payment_type: hiringCode.payment_type,
      expires_at: hiringCode.expires_at || new Date().toISOString(),
      created_at: hiringCode.created_at || new Date().toISOString(),
      updated_at: hiringCode.updated_at || new Date().toISOString(),
      short_url: hiringCode.short_url || '',
      client_passport: hiringCode.client_passport,
      client_nie: hiringCode.client_nie,
      client_nationality: hiringCode.client_nationality,
      client_address: hiringCode.client_address,
      client_city: hiringCode.client_city,
      client_province: hiringCode.client_province,
      client_postal_code: hiringCode.client_postal_code,
      contract_date: hiringCode.contract_date,
      contract_accepted: hiringCode.contract_accepted,
      contract_accepted_at: hiringCode.contract_accepted_at,
      contract_pdf_url: hiringCode.contract_pdf_url,
      manual_payment_confirmed: hiringCode.manual_payment_confirmed,
      manual_payment_note: hiringCode.manual_payment_note,
      manual_payment_method: hiringCode.manual_payment_method,
      payment_intent_id: hiringCode.payment_intent_id,
      subscription_id: hiringCode.subscription_id,
      subscription_status: hiringCode.subscription_status,
      first_payment_amount: hiringCode.first_payment_amount,
      contact_id: hiringCode.contact_id,
    };
}

export const contractsService = {
  /**
   * Get all contracts (hiring codes) with filters and pagination
   * Uses /admin/contracts/ endpoint with X-Admin-Password header
   */
  async getContracts(filters?: ContractFilters): Promise<ContractListResponse> {
    try {
      const params: any = {
        skip: filters?.skip || 0,
        limit: filters?.limit || 20,
      };
      
      if (filters?.status && filters.status !== 'all') {
        params.status_filter = filters.status;
      }
      
      // Use the contracts endpoint with admin password
      const { data } = await api.get<Contract[]>('/admin/contracts/', {
        params,
        headers: {
          'X-Admin-Password': 'Pomelo2005.1',
        },
      });
      
      // Normalize to Contract format
      let contracts = (Array.isArray(data) ? data : []).map((hc) => normalizeHiringCode(hc));
      
      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        contracts = contracts.filter((c) => c.status === filters.status);
      }
      if (filters?.kyc_status && filters.kyc_status !== 'all') {
        contracts = contracts.filter((c) => c.kyc_status === filters.kyc_status);
      }
      if (filters?.grade && filters.grade !== 'all') {
        contracts = contracts.filter((c) => c.grade === filters.grade);
      }
      if (filters?.payment_type && filters.payment_type !== 'all') {
        contracts = contracts.filter((c) => c.payment_type === filters.payment_type);
      }
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        contracts = contracts.filter(
          (c) =>
            c.hiring_code.toLowerCase().includes(searchLower) ||
            c.client_name.toLowerCase().includes(searchLower) ||
            c.client_email.toLowerCase().includes(searchLower) ||
            c.service_name.toLowerCase().includes(searchLower)
        );
      }
      
      const total = contracts.length;
      const skip = filters?.skip || 0;
      const limit = filters?.limit || 20;
      const items = contracts.slice(skip, skip + limit);
      
      return {
        items,
        total,
        skip,
        limit,
      };
    } catch (error: any) {
      console.error('Error fetching contracts:', error);
      // Return empty response on error
      return {
        items: [],
        total: 0,
        skip: filters?.skip || 0,
        limit: filters?.limit || 20,
      };
    }
  },

  /**
   * Get contract by hiring code
   * Uses /admin/contracts/{code} endpoint with X-Admin-Password header
   * Falls back to public /hiring/{code} endpoint to get complete data (service_name, service_description)
   */
  async getContract(code: string): Promise<Contract> {
    try {
      // Try admin endpoint first
      const { data: adminData } = await api.get<Contract>(`/admin/contracts/${code}`, {
        headers: {
          'X-Admin-Password': 'Pomelo2005.1',
        },
      });
      
      // Get public endpoint data to ensure we have service_name and service_description
      try {
        const publicData = await hiringService.getDetails(code);
        console.log('📋 Datos del endpoint público (raw):', publicData);
        console.log('📋 service_name del público:', publicData.service_name, typeof publicData.service_name);
        console.log('📋 service_description del público:', publicData.service_description, typeof publicData.service_description);
        console.log('📋 Datos del endpoint admin (raw):', adminData);
        console.log('📋 service_name del admin:', adminData.service_name, typeof adminData.service_name);
        console.log('📋 service_description del admin:', adminData.service_description, typeof adminData.service_description);
        
        // Helper to check if value is valid (not empty, not "N/A")
        const isValidValue = (value: any) => {
          if (!value) return false;
          const str = String(value).trim();
          return str !== '' && str !== 'N/A' && str !== 'n/a';
        };
        
        // Merge: use admin data but fill in service info from public endpoint if missing or invalid
        const mergedData = {
          ...adminData,
          service_name: isValidValue(adminData.service_name) 
            ? adminData.service_name 
            : (isValidValue(publicData.service_name) ? publicData.service_name : 'Servicio de Migro'),
          service_description: isValidValue(adminData.service_description)
            ? adminData.service_description
            : (isValidValue(publicData.service_description) ? publicData.service_description : 'Tramitación de expediente administrativo'),
        };
        
        console.log('📋 Datos mergeados finales:', {
          service_name: mergedData.service_name,
          service_description: mergedData.service_description,
        });
        
        return normalizeHiringCode(mergedData);
      } catch (publicError) {
        // If public endpoint fails, just use admin data
        console.warn('⚠️ No se pudo obtener datos del endpoint público, usando solo datos del admin');
        return normalizeHiringCode(adminData);
      }
    } catch (error) {
      // Fallback to public hiring endpoint
      console.warn('⚠️ Endpoint admin falló, usando endpoint público');
      const data = await hiringService.getDetails(code);
      return normalizeHiringCode(data);
    }
  },

  /**
   * Get contract by hiring code (alias)
   */
  async getContractByCode(code: string): Promise<Contract> {
    return this.getContract(code);
  },

  /**
   * Create a new contract (hiring code)
   * Uses /admin/contracts/ endpoint with X-Admin-Password header
   */
  async createContract(request: ContractCreateRequest): Promise<Contract> {
    const body: any = {
      service_name: request.service_name,
      service_description: request.service_description,
      amount: request.amount ? Math.round(request.amount * 100) : undefined, // Convert to cents
      currency: request.currency || 'EUR',
      payment_type: request.payment_type || 'one_time',
    };
    
    if (request.contract_template) {
      body.contract_template = request.contract_template;
    }
    if (request.grade) {
      body.grade = request.grade;
    }
    if (request.expires_in_days) {
      body.expires_in_days = request.expires_in_days;
    }
    if (request.client_name) {
      body.client_name = request.client_name;
    }
    if (request.client_email) {
      body.client_email = request.client_email;
    }
    if (request.client_passport) {
      body.client_passport = request.client_passport;
    }
    if (request.client_nie) {
      body.client_nie = request.client_nie;
    }
    if (request.client_address) {
      body.client_address = request.client_address;
    }
    if (request.client_city) {
      body.client_city = request.client_city;
    }
    if (request.client_province) {
      body.client_province = request.client_province;
    }
    if (request.client_postal_code) {
      body.client_postal_code = request.client_postal_code;
    }
    
    const { data } = await api.post<Contract>('/admin/contracts/', body, {
      headers: {
        'X-Admin-Password': 'Pomelo2005.1',
      },
    });
    
    return normalizeHiringCode(data);
  },

  /**
   * Update contract
   * Uses PATCH /admin/contracts/{code} endpoint with X-Admin-Password header
   */
  async updateContract(code: string, request: ContractUpdateRequest): Promise<Contract> {
    const body: any = {};
    
    // Solo incluir campos que están presentes en el request
    if (request.service_name !== undefined) body.service_name = request.service_name;
    if (request.service_description !== undefined) body.service_description = request.service_description;
    if (request.amount !== undefined) body.amount = Math.round(request.amount * 100); // Convert to cents
    if (request.currency !== undefined) body.currency = request.currency;
    if (request.grade !== undefined) body.grade = request.grade;
    if (request.payment_type !== undefined) body.payment_type = request.payment_type;
    if (request.expires_in_days !== undefined) body.expires_in_days = request.expires_in_days;
    if (request.notes !== undefined) body.notes = request.notes;
    if (request.client_name !== undefined) body.client_name = request.client_name;
    if (request.client_email !== undefined) body.client_email = request.client_email;
    if (request.client_passport !== undefined) body.client_passport = request.client_passport;
    if (request.client_nie !== undefined) body.client_nie = request.client_nie;
    if (request.client_address !== undefined) body.client_address = request.client_address;
    if (request.client_city !== undefined) body.client_city = request.client_city;
    if (request.client_province !== undefined) body.client_province = request.client_province;
    if (request.client_postal_code !== undefined) body.client_postal_code = request.client_postal_code;
    if (request.status !== undefined) body.status = request.status;
    if (request.manual_payment_confirmed !== undefined) body.manual_payment_confirmed = request.manual_payment_confirmed;
    if (request.manual_payment_note !== undefined) body.manual_payment_note = request.manual_payment_note;
    if (request.manual_payment_method !== undefined) body.manual_payment_method = request.manual_payment_method;
    if (request.subscription_id !== undefined) body.subscription_id = request.subscription_id;
    if (request.subscription_status !== undefined) body.subscription_status = request.subscription_status;
    if (request.first_payment_amount !== undefined) body.first_payment_amount = Math.round(request.first_payment_amount * 100); // Convert to cents
    if (request.payment_type !== undefined) body.payment_type = request.payment_type;
    
    // Intentar primero con PATCH, si falla con 405, intentar con PUT
    try {
      const { data } = await api.patch<Contract>(`/admin/contracts/${code}`, body, {
        headers: {
          'X-Admin-Password': 'Pomelo2005.1',
        },
      });
      return normalizeHiringCode(data);
    } catch (error: any) {
      // Si el error es 405 (Method Not Allowed), intentar con PUT
      if (error?.response?.status === 405) {
        console.warn('⚠️ PATCH no disponible, intentando con PUT...');
        const { data } = await api.put<Contract>(`/admin/contracts/${code}`, body, {
          headers: {
            'X-Admin-Password': 'Pomelo2005.1',
          },
        });
        return normalizeHiringCode(data);
      }
      // Si es otro error, relanzarlo
      throw error;
    }
  },

  /**
   * Delete contract
   * Uses /admin/contracts/{code} DELETE endpoint with X-Admin-Password header
   */
  async deleteContract(code: string): Promise<void> {
    await api.delete(`/admin/contracts/${code}`, {
      headers: {
        'X-Admin-Password': 'Pomelo2005.1',
      },
    });
  },

  /**
   * Expire contract manually
   * Uses /admin/contracts/{code}/expire endpoint with X-Admin-Password header
   */
  async expireContract(code: string): Promise<Contract> {
    const { data } = await api.post<Contract>(`/admin/contracts/${code}/expire`, {}, {
      headers: {
        'X-Admin-Password': 'Pomelo2005.1',
      },
    });
    return normalizeHiringCode(data);
  },

  /**
   * Download contract PDF
   */
  async downloadContract(code: string): Promise<Blob> {
    const { data } = await api.get<Blob>(`/hiring/${code}/contract/download`, {
      responseType: 'blob',
    });
    return data;
  },

  /**
   * Download final contract PDF
   */
  async downloadFinalContract(code: string): Promise<Blob> {
    const { data } = await api.get<Blob>(`/hiring/${code}/final-contract/download`, {
      responseType: 'blob',
      maxRedirects: 5,
    });
    return data;
  },

  /**
   * Helper: Download contract and trigger browser download
   */
  async downloadContractFile(code: string, filename?: string, isFinal: boolean = false): Promise<void> {
    const blob = isFinal 
      ? await this.downloadFinalContract(code)
      : await this.downloadContract(code);
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `contrato-migro-${code}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Export contracts to CSV (client-side generation)
   */
  async exportContracts(filters?: ContractFilters): Promise<Blob> {
    // Get all contracts
    const response = await this.getContracts({
      ...filters,
      skip: 0,
      limit: 10000, // Get all
    });
    
    // Generate CSV
    const headers = [
      'Código',
      'Cliente',
      'Email',
      'Servicio',
      'Monto',
      'Estado',
      'KYC',
      'Grado',
      'Fecha Creación',
      'Fecha Expiración',
    ];
    
    const rows = response.items.map((contract) => [
      contract.hiring_code,
      contract.client_name,
      contract.client_email,
      contract.service_name,
      `${contract.amount / 100} ${contract.currency}`,
      contract.status,
      contract.kyc_status || 'null',
      contract.grade || '',
      contract.created_at,
      contract.expires_at,
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  },
};


