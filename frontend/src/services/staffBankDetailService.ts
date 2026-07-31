import api from './api';

export interface StaffBankDetail {
  id: number;
  staff_id: number;
  staff_name?: string;
  profile_image?: string;
  designation?: string;
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
  verification_status: 'verified' | 'unverified';
  created_at?: string;
  updated_at?: string;
}

export const staffBankDetailService = {
  getAll: (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    staff_id?: number | string;
    verification_status?: string;
  }) => api.get('/staff-bank-details', { params }),

  getById: (id: number) => api.get(`/staff-bank-details/${id}`),

  create: (data: Partial<StaffBankDetail>) => api.post('/staff-bank-details', data),

  update: (id: number, data: Partial<StaffBankDetail>) => api.put(`/staff-bank-details/${id}`, data),

  delete: (id: number) => api.delete(`/staff-bank-details/${id}`),
};
