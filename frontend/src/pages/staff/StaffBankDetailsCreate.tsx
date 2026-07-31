import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { staffService } from '../../services/api';
import { staffBankDetailService } from '../../services/staffBankDetailService';
import { showAlert, getErrorMessage } from '../../lib/sweetalert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { ArrowLeft, Loader2, AlertCircle, Check } from 'lucide-react';
import { Autocomplete, TextField, Avatar } from '@mui/material';

interface StaffDropdownItem {
  id: number;
  full_name: string;
  staff_code?: string;
}

interface StaffDetails {
  id: number;
  full_name: string;
  profile_image: string | null;
  designation: string | null;
  job_title?: { title: string } | null;
}

export default function StaffBankDetailsCreate() {
  const navigate = useNavigate();
  const [isLoadingStaffList, setIsLoadingStaffList] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [staffList, setStaffList] = useState<StaffDropdownItem[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<StaffDetails | null>(null);
  const [isLoadingStaffDetails, setIsLoadingStaffDetails] = useState(false);

  const [formData, setFormData] = useState({
    staff_id: '',
    bank_name: '',
    account_holder_name: '',
    account_number: '',
    ifsc_code: '',
    verification_status: 'unverified',
  });

  useEffect(() => {
    const fetchStaffList = async () => {
      try {
        const response = await staffService.dropdown();
        setStaffList(response.data.data || []);
      } catch (err) {
        console.error('Failed to load staff list:', err);
        setError('Failed to load employee list');
      } finally {
        setIsLoadingStaffList(false);
      }
    };
    fetchStaffList();
  }, []);

  const handleStaffSelect = async (staffItem: StaffDropdownItem | null) => {
    if (!staffItem) {
      setSelectedStaff(null);
      setFormData((prev) => ({ ...prev, staff_id: '', account_holder_name: '' }));
      return;
    }

    setIsLoadingStaffDetails(true);
    setFieldErrors((prev) => ({ ...prev, staff_id: '' }));
    try {
      const response = await staffService.getById(staffItem.id);
      const details = response.data.data;
      setSelectedStaff(details);
      setFormData((prev) => ({
        ...prev,
        staff_id: staffItem.id.toString(),
        // Automatically default account holder name to staff name if empty
        account_holder_name: prev.account_holder_name || details.full_name,
      }));
    } catch (err) {
      console.error('Failed to fetch staff details:', err);
      showAlert('error', 'Error', 'Failed to fetch selected employee details');
    } finally {
      setIsLoadingStaffDetails(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // Client side validation
    const errors: Record<string, string> = {};
    if (!formData.staff_id) errors.staff_id = 'Please select an employee';
    if (!formData.bank_name.trim()) errors.bank_name = 'Bank name is required';
    if (!formData.account_holder_name.trim()) errors.account_holder_name = 'Account holder name is required';
    if (!formData.account_number.trim()) errors.account_number = 'Account number is required';
    if (!formData.ifsc_code.trim()) errors.ifsc_code = 'IFSC code is required';
    if (!formData.verification_status) errors.verification_status = 'Verification status is required';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      await staffBankDetailService.create({
        staff_id: Number(formData.staff_id),
        bank_name: formData.bank_name,
        account_holder_name: formData.account_holder_name,
        account_number: formData.account_number,
        ifsc_code: formData.ifsc_code,
        verification_status: formData.verification_status as 'verified' | 'unverified',
      });

      showAlert('success', 'Success', 'Bank details added successfully', 2000);
      navigate('/staff-bank-details');
    } catch (err: any) {
      console.error('Failed to create bank details:', err);
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const serverErrors = err.response.data.errors;
        const mappedErrors: Record<string, string> = {};
        Object.keys(serverErrors).forEach((key) => {
          mappedErrors[key] = Array.isArray(serverErrors[key])
            ? serverErrors[key][0]
            : serverErrors[key];
        });
        setFieldErrors(mappedErrors);
      } else {
        setError(getErrorMessage(err, 'Failed to add bank details. Please check the fields and try again.'));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const API_BASE_URL = 'http://127.0.0.1:8000';

  const getProfileImageUrl = (path?: string | null) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-10">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('/staff-bank-details')}
          className="border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Add Staff Bank Details</h2>
          <p className="text-sm text-slate-500">Record bank details and account verification status for a staff member</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left pane: Search and Employee Info Card */}
        <div className="md:col-span-1 flex flex-col gap-6">
          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Employee Selection</CardTitle>
              <CardDescription>Search and select the employee</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="staff_search">Search Employee</Label>
                <Autocomplete
                  id="staff_search"
                  loading={isLoadingStaffList}
                  options={staffList}
                  getOptionLabel={(option) => `${option.full_name} (${option.staff_code || ''})`}
                  onChange={(_, val) => handleStaffSelect(val)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Select Employee..."
                      size="small"
                      error={!!fieldErrors.staff_id}
                      helperText={fieldErrors.staff_id}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '0.875rem',
                        }
                      }}
                    />
                  )}
                />
              </div>

              {isLoadingStaffDetails && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              )}

              {selectedStaff && !isLoadingStaffDetails && (
                <div className="flex flex-col items-center gap-3 p-4 border border-slate-100 rounded-lg bg-slate-50 mt-2">
                  <Avatar
                    src={getProfileImageUrl(selectedStaff.profile_image)}
                    sx={{ width: 80, height: 80, border: '3px solid #fff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                  >
                    {selectedStaff.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                  </Avatar>
                  <div className="text-center">
                    <div className="font-bold text-slate-800">{selectedStaff.full_name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {selectedStaff.designation || selectedStaff.job_title?.title || 'No Designation'}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right pane: Bank Details form */}
        <div className="md:col-span-2">
          <Card className="border-slate-200 shadow-sm bg-white h-full">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Bank Information</CardTitle>
              <CardDescription>Enter the employee's bank account credentials</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="bank_name">Bank Name</Label>
                  <Input
                    id="bank_name"
                    name="bank_name"
                    value={formData.bank_name}
                    onChange={handleChange}
                    placeholder="e.g. State Bank of India"
                    className={`border-slate-200 focus-visible:ring-blue-500 rounded-lg ${fieldErrors.bank_name ? 'border-red-500' : ''}`}
                  />
                  {fieldErrors.bank_name && (
                    <span className="text-xs text-red-500">{fieldErrors.bank_name}</span>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="account_holder_name">Account Holder Name</Label>
                  <Input
                    id="account_holder_name"
                    name="account_holder_name"
                    value={formData.account_holder_name}
                    onChange={handleChange}
                    placeholder="Holder's name as in passbook"
                    className={`border-slate-200 focus-visible:ring-blue-500 rounded-lg ${fieldErrors.account_holder_name ? 'border-red-500' : ''}`}
                  />
                  {fieldErrors.account_holder_name && (
                    <span className="text-xs text-red-500">{fieldErrors.account_holder_name}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="account_number">Account Number</Label>
                  <Input
                    id="account_number"
                    name="account_number"
                    value={formData.account_number}
                    onChange={handleChange}
                    placeholder="Enter account number"
                    className={`border-slate-200 focus-visible:ring-blue-500 rounded-lg ${fieldErrors.account_number ? 'border-red-500' : ''}`}
                  />
                  {fieldErrors.account_number && (
                    <span className="text-xs text-red-500">{fieldErrors.account_number}</span>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="ifsc_code">IFSC Code</Label>
                  <Input
                    id="ifsc_code"
                    name="ifsc_code"
                    value={formData.ifsc_code}
                    onChange={handleChange}
                    placeholder="e.g. SBIN0001234"
                    className={`border-slate-200 focus-visible:ring-blue-500 rounded-lg uppercase ${fieldErrors.ifsc_code ? 'border-red-500' : ''}`}
                  />
                  {fieldErrors.ifsc_code && (
                    <span className="text-xs text-red-500">{fieldErrors.ifsc_code}</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full sm:w-1/2">
                <Label htmlFor="verification_status">Verification Status</Label>
                <Select
                  value={formData.verification_status}
                  onValueChange={(val) => handleSelectChange('verification_status', val)}
                >
                  <SelectTrigger className={`border-slate-200 rounded-lg ${fieldErrors.verification_status ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    <SelectItem value="unverified">Unverified</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                  </SelectContent>
                </Select>
                {fieldErrors.verification_status && (
                  <span className="text-xs text-red-500">{fieldErrors.verification_status}</span>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/staff-bank-details')}
                  className="border-slate-200 rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
