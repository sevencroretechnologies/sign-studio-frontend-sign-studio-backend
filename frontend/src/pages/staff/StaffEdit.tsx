import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { staffService, settingsService, documentService, documentTypeService } from '../../services/api';
import { showAlert, getErrorMessage } from '../../lib/sweetalert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Skeleton } from '../../components/ui/skeleton';
import { ArrowLeft, Loader2, AlertCircle, Camera, Download, Eye, Trash2, Plus } from 'lucide-react';

interface SelectOption {
  id: number;
  title: string;
}

interface FieldErrors {
  [key: string]: string | undefined;
}

export default function StaffEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [locations, setLocations] = useState<SelectOption[]>([]);
  const [divisions, setDivisions] = useState<SelectOption[]>([]);
  const [jobTitles, setJobTitles] = useState<SelectOption[]>([]);

  const [formData, setFormData] = useState({
    full_name: '',
    profile_image: null as File | null,
    profile_image_preview: '',
    email: '',
    username: '',
    password: '',
    personal_email: '',
    mobile_number: '',
    birth_date: '',
    gender: '',
    blood_group: '',
    hobbies: '',
    marital_status: '',
    guardian_name: '',
    guardian_phone: '',
    guardian_dob: '',
    spouse_name: '',
    spouse_phone: '',
    anniversary_date: '',
    home_address: '',
    // nationality: '',
    // passport_number: '',
    // country_code: '',
    region: '',
    city_name: '',
    postal_code: '',
    biometric_id: '',
    office_location_id: '',
    division_id: '',
    designation: '',
    job_title_id: '',
    hire_date: '',
    employment_status: '',
    employment_type: '',
    compensation_type: '',
    ctc: '',
    date_of_joining: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
  });

  const [docTypes, setDocTypes] = useState<SelectOption[]>([]);
  const [selectedDocType, setSelectedDocType] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  const fetchDocuments = async () => {
    if (!id) return;
    try {
      const res = await documentService.getAll({
        owner_type: 'employee',
        owner_id: Number(id),
      });
      setUploadedDocs(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [staffRes, locRes, divRes, jobRes, docTypesRes, docsRes] = await Promise.all([
          staffService.getById(Number(id)),
          settingsService.getOfficeLocations(),
          settingsService.getDivisions(),
          settingsService.getJobTitles(),
          documentTypeService.getAll({ page: 1, per_page: 100 }),
          documentService.getAll({ owner_type: 'employee', owner_id: Number(id) }),
        ]);

        const staff = staffRes.data.data;
        const profileImagePreview = staff.profile_image
          ? (staff.profile_image.startsWith('http') ? staff.profile_image : `http://127.0.0.1:8000${staff.profile_image.startsWith('/') ? '' : '/'}${staff.profile_image}`)
          : '';

        const userEmail = staff.user?.email || '';
        const displayEmail = (userEmail.includes('@generated.local') || userEmail.includes('@signstudio.local')) ? '' : userEmail;

        setFormData({
          full_name: staff.full_name || '',
          profile_image: null,
          profile_image_preview: profileImagePreview,
          email: displayEmail,
          username: staff.user?.username || '',
          password: '',
          personal_email: staff.personal_email || '',
          mobile_number: staff.mobile_number || '',
          birth_date: staff.birth_date ? staff.birth_date.slice(0, 10) : '',
          gender: staff.gender || '',
          blood_group: staff.blood_group || '',
          hobbies: staff.hobbies || '',
          marital_status: staff.marital_status || '',
          guardian_name: staff.guardian_name || '',
          guardian_phone: staff.guardian_contact_number || '',
          guardian_dob: staff.guardian_date_of_birth ? staff.guardian_date_of_birth.slice(0, 10) : '',
          spouse_name: staff.spouse_name || '',
          spouse_phone: staff.spouse_contact_number || '',
          anniversary_date: staff.date_of_anniversary ? staff.date_of_anniversary.slice(0, 10) : '',
          home_address: staff.home_address || '',
          // nationality: staff.nationality || '',
          // passport_number: staff.passport_number || '',
          // country_code: staff.country_code || '',
          region: staff.region || '',
          city_name: staff.city_name || '',
          postal_code: staff.postal_code || '',
          biometric_id: staff.biometric_id || '',
          office_location_id: staff.office_location_id?.toString() || '',
          division_id: staff.division_id?.toString() || '',
          designation: staff.designation || '',
          job_title_id: staff.job_title_id?.toString() || '',
          hire_date: staff.hire_date ? staff.hire_date.slice(0, 10) : '',
          employment_status: staff.employment_status || '',
          employment_type: staff.employment_type || '',
          compensation_type: staff.compensation_type || '',
          ctc: staff.ctc?.toString() || '',
          date_of_joining: staff.date_of_joining ? staff.date_of_joining.slice(0, 10) : '',
          emergency_contact_name: staff.emergency_contact_name || '',
          emergency_contact_phone: staff.emergency_contact_phone || '',
          emergency_contact_relationship: staff.emergency_contact_relationship || '',
        });

        setLocations(locRes.data.data || []);
        setDivisions(divRes.data.data || []);
        setJobTitles(jobRes.data.data || []);
        setDocTypes(docTypesRes.data.data || []);
        setUploadedDocs(docsRes.data.data || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setError('Failed to load staff data');
        showAlert('error', 'Error', 'Failed to load staff data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: FieldErrors = {};
    let isValid = true;

    const validateRequired = (field: keyof typeof formData, label: string) => {
      // @ts-ignore
      if (!formData[field] || (typeof formData[field] === 'string' && !formData[field].trim())) {
        errors[field] = `${label} is required`;
        isValid = false;
      }
    };

    validateRequired('full_name', 'Full Name');
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid work email address';
      isValid = false;
    }

    if (formData.personal_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.personal_email)) {
      errors.personal_email = 'Please enter a valid email address';
      isValid = false;
    }

    validateRequired('mobile_number', 'Mobile Number');
    if (formData.mobile_number && !/^\d{10}$/.test(formData.mobile_number)) {
      errors.mobile_number = 'Mobile number must be exactly 10 digits';
      isValid = false;
    }

    setFieldErrors(errors);

    if (!isValid) {
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField);
        if (element) {
          element.focus();
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      const errorList = Object.values(errors).join('\n• ');
      showAlert('error', 'Validation Failed', 'Please fix the following errors:\n• ' + errorList);
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      // Map internal field names to the backend API field names
      const FIELD_MAP: Record<string, string> = {
        guardian_phone: 'guardian_contact_number',
        guardian_dob: 'guardian_date_of_birth',
        spouse_phone: 'spouse_contact_number',
        anniversary_date: 'date_of_anniversary',
      };

      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'profile_image_preview') return;
        const value = formData[key as keyof typeof formData];
        if (value === null || value === undefined) return;
        const backendKey = FIELD_MAP[key] || key;
        if (value instanceof File) {
          formDataToSend.append(backendKey, value);
        } else {
          formDataToSend.append(backendKey, String(value));
        }
      });

      // await staffService.update(Number(id), formDataToSend);
      // edit profile image update
      await api.post(
    `/staff-members/${id}?_method=PUT`,
    formDataToSend,
    {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    }
);

      showAlert('success', 'Success!', 'Staff member updated successfully', 2000);
      navigate(`/staff/${id}`);
    } catch (err: any) {
      const errorMessage = getErrorMessage(err, 'Failed to update staff member');
      if (err.response?.data?.errors) {
        const apiErrors: FieldErrors = {};
        const errors = err.response.data.errors;
        Object.keys(errors).forEach(key => {
          apiErrors[key] = errors[key][0];
        });
        setFieldErrors(apiErrors);
      }
      setError(errorMessage);
      showAlert('error', 'Error', errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Edit Employee Profile</h1>
          <p className="text-sm text-slate-400 mt-0.5">Modify information for {formData.full_name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {error && (
          <Alert className="border-red-500/20 bg-red-500/10 text-red-500 rounded-xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-md font-bold">Personal Information</CardTitle>
            <CardDescription className="text-xs">Primary personal identification details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-col sm:flex-row items-center gap-5 pb-2">
              <div className="relative group">
                {formData.profile_image_preview ? (
                  <img
                    src={formData.profile_image_preview}
                    alt="Profile preview"
                    className="w-24 h-24 rounded-2xl object-cover border border-slate-200 dark:border-slate-800"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-dashed border-blue-200 dark:border-blue-800 flex flex-col items-center justify-center text-blue-600 dark:text-blue-400">
                    <Camera className="h-6 w-6 stroke-[1.5]" />
                    <span className="text-3xs font-semibold mt-1">Photo</span>
                  </div>
                )}
                <label className="absolute inset-0 cursor-pointer rounded-2xl flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-3xs font-bold">Change</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData({
                            ...formData,
                            profile_image: file,
                            profile_image_preview: reader.result as string
                          });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
              <div>
                <p className="text-xs font-semibold">Change Photo</p>
                <p className="text-3xs text-slate-400 mt-0.5">JPEG or PNG. Recommended size is 2MB.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-xs font-semibold text-slate-500">Full Name *</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="rounded-xl border border-slate-100 dark:border-slate-800"
                  placeholder="Abbu Sufiyan"
                />
                {fieldErrors.full_name && <p className="text-3xs text-red-500">{fieldErrors.full_name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile_number" className="text-xs font-semibold text-slate-500">Mobile Number *</Label>
                <Input
                  id="mobile_number"
                  name="mobile_number"
                  value={formData.mobile_number}
                  onChange={handleChange}
                  maxLength={10}
                  className="rounded-xl border border-slate-100 dark:border-slate-800"
                  placeholder="9876543210"
                />
                {fieldErrors.mobile_number && <p className="text-3xs text-red-500">{fieldErrors.mobile_number}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="personal_email" className="text-xs font-semibold text-slate-500">Personal Email</Label>
                <Input
                  id="personal_email"
                  name="personal_email"
                  type="email"
                  value={formData.personal_email}
                  onChange={handleChange}
                  className="rounded-xl border border-slate-100 dark:border-slate-800"
                  placeholder="sufiyan@gmail.com"
                />
                {fieldErrors.personal_email && <p className="text-3xs text-red-500">{fieldErrors.personal_email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold text-slate-500">Work Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder='abc@example.com'
                  className="rounded-xl border-slate-100 dark:border-slate-800 text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="text-xs font-semibold text-slate-500">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter username"
                  className="rounded-xl border-slate-100 dark:border-slate-800 text-xs"
                />
                {fieldErrors.username && <p className="text-3xs text-red-500">{fieldErrors.username}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-500">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Leave blank to keep current"
                  className="rounded-xl border-slate-100 dark:border-slate-800 text-xs"
                />
                {fieldErrors.password && <p className="text-3xs text-red-500">{fieldErrors.password}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="birth_date" className="text-xs font-semibold text-slate-500">Date of Birth</Label>
                <Input
                  id="birth_date"
                  name="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={handleChange}
                  className="rounded-xl border border-slate-100 dark:border-slate-800 text-xs"
                />
                {fieldErrors.birth_date && <p className="text-3xs text-red-500">{fieldErrors.birth_date}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender" className="text-xs font-semibold text-slate-500">Gender</Label>
                <Select value={formData.gender} onValueChange={(val) => handleSelectChange('gender', val)}>
                  <SelectTrigger className="rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-left">
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {fieldErrors.gender && <p className="text-3xs text-red-500">{fieldErrors.gender}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="blood_group" className="text-xs font-semibold text-slate-500">Blood Group</Label>
                <Select value={formData.blood_group} onValueChange={(val) => handleSelectChange('blood_group', val)}>
                  <SelectTrigger className="rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-left">
                    <SelectValue placeholder="Select Blood Group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a_plus">A+</SelectItem>
                    <SelectItem value="a_minus">A-</SelectItem>
                    <SelectItem value="b_plus">B+</SelectItem>
                    <SelectItem value="b_minus">B-</SelectItem>
                    <SelectItem value="ab_plus">AB+</SelectItem>
                    <SelectItem value="ab_minus">AB-</SelectItem>
                    <SelectItem value="o_plus">O+</SelectItem>
                    <SelectItem value="o_minus">O-</SelectItem>
                  </SelectContent>
                </Select>
                {fieldErrors.blood_group && <p className="text-3xs text-red-500">{fieldErrors.blood_group}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="marital_status" className="text-xs font-semibold text-slate-500">Marital Status</Label>
                <Select value={formData.marital_status} onValueChange={(val) => handleSelectChange('marital_status', val)}>
                  <SelectTrigger className="rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-left">
                    <SelectValue placeholder="Select Marital Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="divorced">Divorced</SelectItem>
                    <SelectItem value="widowed">Widowed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hobbies" className="text-xs font-semibold text-slate-500">Hobbies</Label>
                <Input id="hobbies" name="hobbies" value={formData.hobbies} onChange={handleChange} className="rounded-xl border border-slate-100 dark:border-slate-800" placeholder="Enter hobbies" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-md font-bold">Residential Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="home_address" className="text-xs font-semibold text-slate-500">Home Address</Label>
              <Textarea
                id="home_address"
                name="home_address"
                value={formData.home_address}
                onChange={handleChange}
                rows={2}
                className="rounded-xl border border-slate-100 dark:border-slate-800"
                placeholder="Full address detail..."
              />
              {fieldErrors.home_address && <p className="text-3xs text-red-500">{fieldErrors.home_address}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city_name" className="text-xs font-semibold text-slate-500">City</Label>
                <Input id="city_name" name="city_name" value={formData.city_name} onChange={handleChange} className="rounded-xl" />
                {fieldErrors.city_name && <p className="text-3xs text-red-500">{fieldErrors.city_name}</p>}
              </div>
             {/* <div className="space-y-2">
                <Label htmlFor="region" className="text-xs font-semibold text-slate-500">State/Region</Label>
                <Input id="region" name="region" value={formData.region} onChange={handleChange} className="rounded-xl" />
                {fieldErrors.region && <p className="text-3xs text-red-500">{fieldErrors.region}</p>}
              </div>*/}
              <div className="space-y-2">
                <Label htmlFor="postal_code" className="text-xs font-semibold text-slate-500">Postal Code</Label>
                <Input id="postal_code" name="postal_code" value={formData.postal_code} onChange={handleChange} className="rounded-xl" />
                {fieldErrors.postal_code && <p className="text-3xs text-red-500">{fieldErrors.postal_code}</p>}
              </div>
            </div>

            {/* <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country_code" className="text-xs font-semibold text-slate-500">Country Code</Label>
                <Input id="country_code" name="country_code" value={formData.country_code} onChange={handleChange} maxLength={3} className="rounded-xl" />
                {fieldErrors.country_code && <p className="text-3xs text-red-500">{fieldErrors.country_code}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationality" className="text-xs font-semibold text-slate-500">Nationality</Label>
                <Input id="nationality" name="nationality" value={formData.nationality} onChange={handleChange} className="rounded-xl" />
                {fieldErrors.nationality && <p className="text-3xs text-red-500">{fieldErrors.nationality}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="passport_number" className="text-xs font-semibold text-slate-500">Passport Number</Label>
                <Input id="passport_number" name="passport_number" value={formData.passport_number} onChange={handleChange} className="rounded-xl" />
                {fieldErrors.passport_number && <p className="text-3xs text-red-500">{fieldErrors.passport_number}</p>}
              </div>
            </div> */}
          </CardContent>
        </Card>

        {/* Family & Guardian */}
        <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-md font-bold">Family & Guardian Info</CardTitle>
            <CardDescription className="text-xs">Guardian and spouse background details</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guardian_name" className="text-xs font-semibold text-slate-500">Guardian Name</Label>
              <Input id="guardian_name" name="guardian_name" value={formData.guardian_name} onChange={handleChange} className="rounded-xl" placeholder="Enter guardian name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guardian_phone" className="text-xs font-semibold text-slate-500">Guardian Contact Number</Label>
              <Input id="guardian_phone" name="guardian_phone" value={formData.guardian_phone} onChange={handleChange} maxLength={10} className="rounded-xl" placeholder="Enter contact number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guardian_dob" className="text-xs font-semibold text-slate-500">Guardian Date of Birth</Label>
              <Input id="guardian_dob" name="guardian_dob" type="date" value={formData.guardian_dob} onChange={handleChange} className="rounded-xl text-xs" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spouse_name" className="text-xs font-semibold text-slate-500">Spouse Name</Label>
              <Input id="spouse_name" name="spouse_name" value={formData.spouse_name} onChange={handleChange} className="rounded-xl" placeholder="Enter spouse name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spouse_phone" className="text-xs font-semibold text-slate-500">Spouse Contact Number</Label>
              <Input id="spouse_phone" name="spouse_phone" value={formData.spouse_phone} onChange={handleChange} maxLength={10} className="rounded-xl" placeholder="Enter contact number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="anniversary_date" className="text-xs font-semibold text-slate-500">Date of Anniversary</Label>
              <Input id="anniversary_date" name="anniversary_date" type="date" value={formData.anniversary_date} onChange={handleChange} className="rounded-xl text-xs" />
            </div>
          </CardContent>
        </Card>

        {/* Job Details */}
        <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-md font-bold">Employment Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="office_location_id" className="text-xs font-semibold text-slate-500">Office Location</Label>
              <Select value={formData.office_location_id} onValueChange={(val) => handleSelectChange('office_location_id', val)}>
                <SelectTrigger className="rounded-xl text-xs text-left">
                  <SelectValue placeholder="Select Location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(l => <SelectItem key={l.id} value={l.id.toString()}>{l.title}</SelectItem>)}
                </SelectContent>
              </Select>
              {fieldErrors.office_location_id && <p className="text-3xs text-red-500">{fieldErrors.office_location_id}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="division_id" className="text-xs font-semibold text-slate-500">Department</Label>
              <Select value={formData.division_id} onValueChange={(val) => handleSelectChange('division_id', val)}>
                <SelectTrigger className="rounded-xl text-xs text-left">
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  {divisions.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.title}</SelectItem>)}
                </SelectContent>
              </Select>
              {fieldErrors.division_id && <p className="text-3xs text-red-500">{fieldErrors.division_id}</p>}
            </div>

            {/* <div className="space-y-2">
              <Label htmlFor="job_title_id" className="text-xs font-semibold text-slate-500">Job Title</Label>
              <Select value={formData.job_title_id} onValueChange={(val) => handleSelectChange('job_title_id', val)}>
                <SelectTrigger className="rounded-xl text-xs text-left">
                  <SelectValue placeholder="Select Job Title" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  {jobTitles.map(j => <SelectItem key={j.id} value={j.id.toString()}>{j.title}</SelectItem>)}
                </SelectContent>
              </Select>
              {fieldErrors.job_title_id && <p className="text-3xs text-red-500">{fieldErrors.job_title_id}</p>}
            </div> */}

            <div className="space-y-2">
              <Label htmlFor="designation" className="text-xs font-semibold text-slate-500">Designation</Label>
              <Input
                id="designation"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                className="rounded-xl"
                placeholder="Enter Designation"
              />
              {fieldErrors.designation && <p className="text-3xs text-red-500">{fieldErrors.designation}</p>}
            </div>

            {/* <div className="space-y-2">
              <Label htmlFor="hire_date" className="text-xs font-semibold text-slate-500">Hire Date</Label>
              <Input id="hire_date" name="hire_date" type="date" value={formData.hire_date} onChange={handleChange} className="rounded-xl text-xs" />
              {fieldErrors.hire_date && <p className="text-3xs text-red-500">{fieldErrors.hire_date}</p>}
            </div> */}

            <div className="space-y-2">
              <Label htmlFor="date_of_joining" className="text-xs font-semibold text-slate-500">Date of Joining</Label>
              <Input id="date_of_joining" name="date_of_joining" type="date" value={formData.date_of_joining} onChange={handleChange} className="rounded-xl text-xs" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employment_status" className="text-xs font-semibold text-slate-500">Status</Label>
              <Select value={formData.employment_status} onValueChange={(val) => handleSelectChange('employment_status', val)}>
                <SelectTrigger className="rounded-xl text-xs text-left">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                  <SelectItem value="resigned">Resigned</SelectItem>
                </SelectContent>
              </Select>
              {fieldErrors.employment_status && <p className="text-3xs text-red-500">{fieldErrors.employment_status}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="employment_type" className="text-xs font-semibold text-slate-500">Employment Type</Label>
              <Select value={formData.employment_type} onValueChange={(val) => handleSelectChange('employment_type', val)}>
                <SelectTrigger className="rounded-xl text-xs text-left">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">Full Time</SelectItem>
                  <SelectItem value="part_time">Part Time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="intern">Intern</SelectItem>
                </SelectContent>
              </Select>
              {fieldErrors.employment_type && <p className="text-3xs text-red-500">{fieldErrors.employment_type}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="compensation_type" className="text-xs font-semibold text-slate-500">Compensation Model</Label>
              <Select value={formData.compensation_type} onValueChange={(val) => handleSelectChange('compensation_type', val)}>
                <SelectTrigger className="rounded-xl text-xs text-left">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly Salary</SelectItem>
                  <SelectItem value="hourly">Hourly Contract</SelectItem>
                  <SelectItem value="daily">Daily Wage</SelectItem>
                </SelectContent>
              </Select>
              {fieldErrors.compensation_type && <p className="text-3xs text-red-500">{fieldErrors.compensation_type}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ctc" className="text-xs font-semibold text-slate-500">CTC (INR)</Label>
              <Input id="ctc" name="ctc" type="number" value={formData.ctc} onChange={handleChange} className="rounded-xl" />
              {fieldErrors.ctc && <p className="text-3xs text-red-500">{fieldErrors.ctc}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Emergency CONTACT */}
        {/* <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-md font-bold">Emergency Contacts</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_name" className="text-xs font-semibold text-slate-500">Contact Name</Label>
              <Input id="emergency_contact_name" name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleChange} className="rounded-xl" />
              {fieldErrors.emergency_contact_name && <p className="text-3xs text-red-500">{fieldErrors.emergency_contact_name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_phone" className="text-xs font-semibold text-slate-500">Contact Phone</Label>
              <Input id="emergency_contact_phone" name="emergency_contact_phone" value={formData.emergency_contact_phone} onChange={handleChange} maxLength={10} className="rounded-xl" />
              {fieldErrors.emergency_contact_phone && <p className="text-3xs text-red-500">{fieldErrors.emergency_contact_phone}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_relationship" className="text-xs font-semibold text-slate-500">Relationship</Label>
              <Input id="emergency_contact_relationship" name="emergency_contact_relationship" value={formData.emergency_contact_relationship} onChange={handleChange} className="rounded-xl" />
              {fieldErrors.emergency_contact_relationship && <p className="text-3xs text-red-500">{fieldErrors.emergency_contact_relationship}</p>}
            </div>
          </CardContent>
        </Card> */}

        {/* Employee Documents Management */}
        <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-md font-bold">Employee Documents</CardTitle>
            <CardDescription className="text-xs">Manage official folders, letters and certificates for this employee</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500">Document Type</Label>
                <Select value={selectedDocType} onValueChange={setSelectedDocType}>
                  <SelectTrigger className="rounded-xl text-xs text-left">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {docTypes.map(t => (
                      <SelectItem key={t.id} value={t.id.toString()}>{t.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500">Choose File</Label>
                <Input
                  id="edit_doc_file"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedFile(file);
                    }
                  }}
                  className="rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 file:mr-2 file:bg-blue-50 dark:file:bg-blue-950/20 file:text-blue-600 dark:file:text-blue-400 file:border-none file:text-xs file:font-semibold"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
                disabled={isUploadingDoc}
                onClick={async () => {
                  if (!selectedDocType || !selectedFile) {
                    showAlert('error', 'Error', 'Please select a document type and choose a file first.');
                    return;
                  }
                  setIsUploadingDoc(true);
                  try {
                    const docFormData = new FormData();
                    docFormData.append('file', selectedFile);
                    docFormData.append('document_type_id', selectedDocType);
                    docFormData.append('owner_type', 'employee');
                    docFormData.append('owner_id', id!.toString());
                    docFormData.append('document_name', selectedFile.name);

                    await documentService.upload(Number(id), docFormData);
                    setSelectedDocType('');
                    setSelectedFile(null);
                    const fileInput = document.getElementById('edit_doc_file') as HTMLInputElement;
                    if (fileInput) fileInput.value = '';

                    showAlert('success', 'Document Uploaded', 'Document was uploaded successfully.', 2000);
                    await fetchDocuments();
                  } catch (err: any) {
                    console.error(err);
                    showAlert('error', 'Upload Failed', getErrorMessage(err, 'Failed to upload document.'));
                  } finally {
                    setIsUploadingDoc(false);
                  }
                }}
              >
                {isUploadingDoc ? (
                  <>
                    <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> Uploading...
                  </>
                ) : (
                  <>
                    <Plus className="mr-1.5 h-3 w-3" /> Upload Document
                  </>
                )}
              </Button>
            </div>

            {uploadedDocs.length > 0 ? (
              <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden mt-4">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                      <th className="p-3">Document Type</th>
                      <th className="p-3">File Name</th>
                      <th className="p-3">Uploaded Date</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadedDocs.map((doc, idx) => (
                      <tr key={doc.id || idx} className="border-b last:border-0 border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                        <td className="p-3 font-semibold">{doc.type?.title || 'Unknown Type'}</td>
                        <td className="p-3 text-slate-400 break-all">{doc.document_name}</td>
                        <td className="p-3 text-slate-400">
                          {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-3 text-right space-x-1.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const viewUrl = doc.temporary_url || `http://127.0.0.1:8000/api/documents/${doc.id}/view`;
                              window.open(viewUrl, '_blank');
                            }}
                            className="text-slate-600 hover:text-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg h-7 w-7"
                            title="View Document"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={async () => {
                              try {
                                const response = await documentService.download(doc.id);
                                if (response.data && response.data.download_url) {
                                  window.open(response.data.download_url, '_blank');
                                } else {
                                  const rawRes = await api.get(`/documents/${doc.id}/download`, { responseType: 'blob' });
                                  const blob = new Blob([rawRes.data], { type: rawRes.headers['content-type'] });
                                  const link = document.createElement('a');
                                  link.href = window.URL.createObjectURL(blob);
                                  link.download = doc.document_name || 'download';
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }
                              } catch (err) {
                                console.error(err);
                                showAlert('error', 'Download Failed', 'Could not download the document.');
                              }
                            }}
                            className="text-slate-600 hover:text-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg h-7 w-7"
                            title="Download Document"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={async () => {
                              try {
                                await documentService.delete(doc.id);
                                showAlert('success', 'Deleted', 'Document deleted successfully.', 2000);
                                await fetchDocuments();
                              } catch (err: any) {
                                showAlert('error', 'Delete Failed', getErrorMessage(err, 'Failed to delete.'));
                              }
                            }}
                            className="text-red-500 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg h-7 w-7"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 dark:bg-slate-800/10 rounded-xl border border-dashed border-slate-100 dark:border-slate-800">
                No documents uploaded yet.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate(-1)} className="rounded-xl text-sm font-semibold">
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
