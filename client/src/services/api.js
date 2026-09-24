import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' }
});

// Add auth token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 responses
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('selectedCompany');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth
export const authAPI = {
    login: (username, password) => api.post('/auth/login', { username, password }),
    register: (data) => api.post('/auth/register', data),
    me: () => api.get('/auth/me'),
    getSecurityQuestions: () => api.get('/auth/security-questions'),
    changePassword: (data) => api.post('/auth/change-password', data),
    requestPasswordReset: (username) => api.post('/auth/reset/request', { username }),
    completePasswordReset: (data) => api.post('/auth/reset/complete', data),
};

// Companies
export const companiesAPI = {
    getAll: () => api.get('/companies'),
    getById: (id) => api.get(`/companies/${id}`),
    getBankAccounts: (id) => api.get(`/companies/${id}/bank-accounts`),
    addBankAccount: (companyId, data) => api.post(`/companies/${companyId}/bank-accounts`, data),
    updateBankAccount: (companyId, accountId, data) => api.put(`/companies/${companyId}/bank-accounts/${accountId}`, data),
    deleteBankAccount: (companyId, accountId) => api.delete(`/companies/${companyId}/bank-accounts/${accountId}`),
    getWeighbridges: () => api.get('/companies/weighbridges/all'),
    addWeighbridge: (data) => api.post('/companies/weighbridges', data),
};

// Clients
export const clientsAPI = {
    getAll: (companyId) => api.get(`/clients?company_id=${companyId}`),
    getById: (id) => api.get(`/clients/${id}`),
    create: (data) => api.post('/clients', data),
    update: (id, data) => api.put(`/clients/${id}`, data),
    delete: (id) => api.delete(`/clients/${id}`),
};

// Masters
export const mastersAPI = {
    getAll: (companyId, clientId, status) => {
        let url = `/masters?company_id=${companyId}`;
        if (clientId) url += `&client_id=${clientId}`;
        if (status) url += `&status=${status}`;
        return api.get(url);
    },
    getById: (id) => api.get(`/masters/${id}`),
    createBlank: (data) => api.post('/masters/blank', data),
    importFrom: (sourceId, data) => api.post(`/masters/${sourceId}/import`, data),
    update: (id, data) => api.put(`/masters/${id}`, data),
    delete: (id, version) => api.delete(`/masters/${id}`, { data: { version } }),
    generatePDF: (masterId, docType, containerId) => api.get(
        `/pdf/master/${masterId}/${docType}${containerId ? `?container_id=${encodeURIComponent(containerId)}` : ''}`,
        { responseType: 'blob' }
    ),
    addContainer: (masterId, data) => api.post(`/masters/${masterId}/containers`, data),
    updateContainer: (masterId, containerId, data) => api.put(`/masters/${masterId}/containers/${containerId}`, data),
    deleteContainer: (masterId, containerId, version) => api.delete(
        `/masters/${masterId}/containers/${containerId}`,
        { data: { version } }
    ),
    setCoaTests: (masterId, tests, version, fields = {}) => api.post(`/masters/${masterId}/coa-tests`, {
        ...fields,
        tests,
        version
    }),
    setDocuments: (masterId, documentTypes, version) => api.post(`/masters/${masterId}/documents`, {
        document_types: documentTypes,
        version
    }),
    documentSave: (masterId, documentType, data = {}, version) => api.post(`/masters/${masterId}/document-save`, {
        ...data,
        document_type: documentType,
        version: version ?? data.version
    }),
    getOverrides: (masterId, docType) => api.get(`/masters/${masterId}/overrides/${docType}`),
    saveOverrides: (masterId, docType, data, version) => api.post(`/masters/${masterId}/overrides/${docType}`, {
        ...data,
        version: version ?? data?.version
    }),
};

export default api;
