import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { staffBankDetailService, StaffBankDetail } from '../../services/staffBankDetailService';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { ArrowLeft, Loader2, Edit, CheckCircle2, AlertCircle } from 'lucide-react';
import { Avatar, Chip } from '@mui/material';

export default function StaffBankDetailsView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [bankDetails, setBankDetails] = useState<StaffBankDetail | null>(null);

  useEffect(() => {
    const fetchBankDetails = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const response = await staffBankDetailService.getById(Number(id));
        setBankDetails(response.data.data);
      } catch (err) {
        console.error('Failed to load bank details:', err);
        setError('Failed to load bank details record');
      } finally {
        setIsLoading(false);
      }
    };
    fetchBankDetails();
  }, [id]);

  const API_BASE_URL = 'http://127.0.0.1:8000';

  const getProfileImageUrl = (path?: string | null) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'verified':
        return 'success';
      case 'unverified':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-sm text-slate-500">Loading bank details record...</p>
      </div>
    );
  }

  if (error || !bankDetails) {
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
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">View Staff Bank Details</h2>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <div>{error || 'Bank details record not found.'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-10">
      <div className="flex items-center justify-between">
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
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">View Staff Bank Details</h2>
            <p className="text-sm text-slate-500">Read-only view of bank details credentials</p>
          </div>
        </div>

        {hasPermission('edit_staff') && (
          <Link to={`/staff-bank-details/${id}/edit`} style={{ textDecoration: 'none' }}>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 gap-2">
              <Edit className="h-4 w-4" />
              Edit Details
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left pane: Employee Profile Card */}
        <div className="md:col-span-1">
          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Employee Details</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 p-6 border-t border-slate-100 bg-slate-50">
              <Avatar
                src={getProfileImageUrl(bankDetails.profile_image)}
                sx={{ width: 90, height: 90, border: '3px solid #fff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
              >
                {bankDetails.staff_name ? bankDetails.staff_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : 'ST'}
              </Avatar>
              <div className="text-center w-full">
                <div className="font-bold text-lg text-slate-800">{bankDetails.staff_name}</div>
                <div className="text-sm text-slate-500 mt-1">{bankDetails.designation || 'No Designation'}</div>
                <div className="text-xs text-slate-400 mt-0.5">Staff ID: #{bankDetails.staff_id}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right pane: Bank Details values */}
        <div className="md:col-span-2">
          <Card className="border-slate-200 shadow-sm bg-white h-full">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Bank Information</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <Label className="text-xs text-slate-400">Bank Name</Label>
                  <div className="text-sm font-semibold text-slate-800 mt-1">{bankDetails.bank_name}</div>
                </div>

                <div>
                  <Label className="text-xs text-slate-400">Account Holder Name</Label>
                  <div className="text-sm font-semibold text-slate-800 mt-1">{bankDetails.account_holder_name}</div>
                </div>

                <div>
                  <Label className="text-xs text-slate-400">Account Number</Label>
                  <div className="text-sm font-semibold text-slate-800 mt-1 tracking-wider">{bankDetails.account_number}</div>
                </div>

                <div>
                  <Label className="text-xs text-slate-400">IFSC Code</Label>
                  <div className="text-sm font-semibold text-slate-800 mt-1 text-transform: uppercase">{bankDetails.ifsc_code}</div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                <div>
                  <Label className="text-xs text-slate-400">Verification Status</Label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Chip
                      label={bankDetails.verification_status}
                      color={getStatusColor(bankDetails.verification_status)}
                      size="small"
                      sx={{
                        textTransform: 'capitalize',
                        fontWeight: 600,
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        height: '24px'
                      }}
                    />
                    {bankDetails.verification_status === 'verified' && (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
