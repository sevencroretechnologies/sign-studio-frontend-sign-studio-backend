import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { staffService, settingsService, documentService, documentTypeService } from '../../services/api';
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
import { ArrowLeft, Loader2, AlertCircle, Camera, Check } from 'lucide-react';
import { showAlert, getErrorMessage } from '../../lib/sweetalert';
import { Eye, EyeOff } from "lucide-react";

interface SelectOption {
  id: number;
  title: string;
}

interface FieldErrors {
  [key: string]: string | undefined;
}

export default function StaffCreate() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [locations, setLocations] = useState<SelectOption[]>([]);
  const [allDivisions, setAllDivisions] = useState<SelectOption[]>([]);
  const [divisions, setDivisions] = useState<SelectOption[]>([]);
  const [jobTitles, setJobTitles] = useState<SelectOption[]>([]);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    // timestamp: new Date().toISOString().slice(0, 16),
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
    // nationality: 'Indian',
    // passport_number: '',
    // country_code: 'IND',
    // region: '',
    city_name: '',
    postal_code: '',
    biometric_id: '',
    office_location_id: '',
    division_id: '',
    designation: '',
    // hire_date: '',
    date_of_joining: '',
    employment_status: 'active',
    employment_type: 'full_time',
    compensation_type: 'monthly',
    ctc: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
  });

  const [docTypes, setDocTypes] = useState<SelectOption[]>([]);
  const [selectedDocType, setSelectedDocType] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [queuedDocs, setQueuedDocs] = useState<{ file: File; typeId: string; typeName: string }[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [locRes, divRes, jobRes, docTypesRes] = await Promise.all([
          settingsService.getOfficeLocations(),
          settingsService.getDivisions(),
          settingsService.getJobTitles(),
          documentTypeService.getAll({ page: 1, per_page: 100 }),
        ]);
        setLocations(locRes.data.data || []);
        setAllDivisions(divRes.data.data || []);
        setDivisions(divRes.data.data || []);
        setJobTitles(jobRes.data.data || []);
        setDocTypes(docTypesRes.data.data || []);
      } catch (error) {
        console.error('Failed to fetch options:', error);
      }
    };
    fetchOptions();
  }, []);

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

  // Returns errors for a given step WITHOUT setting state
  const getStepErrors = (stepNumber: number): FieldErrors => {
    const errors: FieldErrors = {};

    const check = (field: keyof typeof formData, label: string) => {
      const val = formData[field];
      if (val === null || val === undefined || (typeof val === 'string' && val.trim() === '')) {
        errors[field] = `${label} is required`;
      }
    };

    if (stepNumber === 1) {
      check('full_name', 'Employee Name');
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'Enter a valid email';
      }
      check('mobile_number', 'Contact Number');
      if (formData.mobile_number && !/^\d{10}$/.test(formData.mobile_number)) {
        errors.mobile_number = 'Contact number must be 10 digits';
      }
    } else if (stepNumber === 2) {
      // All optional
    } else if (stepNumber === 3) {
      // All optional
    }

    return errors;
  };

  // Validates the current step and sets field errors in state
  const validateStep = (stepNumber: number): boolean => {
    const errors = getStepErrors(stepNumber);
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validates all steps at once, sets all errors and navigates to first failing step
  const validateForm = (): boolean => {
    const allErrors: FieldErrors = {};
    let failedStep = 0;

    [1, 2, 3].forEach((step) => {
      const errors = getStepErrors(step);
      if (Object.keys(errors).length > 0) {
        if (!failedStep) failedStep = step;
        Object.assign(allErrors, errors);
      }
    });

    setFieldErrors(allErrors);
    if (failedStep) {
      setCurrentStep(failedStep);
      return false;
    }
    return true;
  };


  // Called ONLY from the Onboard Employee button on step 3
  const handleFinalSubmit = async () => {
    setError('');
    setFieldErrors({});
    if (!validateForm()) {
      showAlert('error', 'Validation Failed', 'Please fix the missing required fields highlighted in the form.');
      return;
    }

    setIsLoading(true);
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
        if (typeof value === 'string' && value === '') return;
        const backendKey = FIELD_MAP[key] || key;
        formDataToSend.append(backendKey, value as string | Blob);
      });

      const res = await staffService.create(formDataToSend);
      const newStaffId = res.data.data.id;

      // Upload queued documents sequentially
      for (const doc of queuedDocs) {
        const docFormData = new FormData();
        docFormData.append('file', doc.file);
        docFormData.append('document_type_id', doc.typeId);
        docFormData.append('owner_type', 'employee');
        docFormData.append('owner_id', newStaffId.toString());
        docFormData.append('document_name', doc.file.name);
        await documentService.upload(newStaffId, docFormData);
      }

      showAlert('success', 'Employee Created', 'Added new employee record successfully, along with queued documents.', 2000);
      navigate('/staff');
    } catch (err: any) {
      const errorMessage = getErrorMessage(err, 'Failed to create staff member');
      setError(errorMessage);
      if (err.response?.data?.errors) {
        const apiErrors: FieldErrors = {};
        Object.keys(err.response.data.errors).forEach(k => {
          apiErrors[k] = err.response.data.errors[k][0];
        });
        setFieldErrors(apiErrors);

        // Navigate to the step that contains the first erroring field
        const step1Fields = ['full_name', 'email', 'personal_email', 'mobile_number', 'birth_date', 'gender', 'blood_group', 'marital_status', 'hobbies'];
        const step2Fields = ['home_address', 'city_name', 'postal_code', 'guardian_name', 'guardian_phone', 'spouse_name'];
        const firstErrorField = Object.keys(apiErrors)[0];
        if (step1Fields.includes(firstErrorField)) {
          setCurrentStep(1);
        } else if (step2Fields.includes(firstErrorField)) {
          setCurrentStep(2);
        } else {
          setCurrentStep(3);
        }
      }
      showAlert('error', 'Failed to Add', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => {
            if (currentStep > 1) {
              setCurrentStep(prev => prev - 1);
            } else {
              navigate(-1);
            }
          }}
          className="hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Add New Employee</h1>
          <p className="text-sm text-slate-400 mt-0.5">Onboard a new employee to SignStudio</p>
        </div>
      </div>

      {/* Progress Stepper Timeline */}
      <div className="bg-white dark:bg-[#111827] border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between max-w-xl mx-auto relative px-4">
          <div className="absolute left-10 right-10 top-5 h-0.5 bg-slate-100 dark:bg-slate-800 z-0">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
            />
          </div>

          {[
            { step: 1, label: "Personal Profile" },
            { step: 2, label: "Family & Residence" },
            { step: 3, label: "Job & Documents" }
          ].map((item) => (
            <button
              key={item.step}
              type="button"
              onClick={() => {
                // Allow going back freely, or forward only up to next unvisited step
                // Do NOT run validateStep here — it would set fieldErrors on the new step
                if (item.step <= currentStep + 1) {
                  setCurrentStep(item.step);
                  setFieldErrors({});
                }
              }}
              className="relative z-10 flex flex-col items-center group cursor-pointer focus:outline-none"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all duration-300 ${currentStep === item.step
                  ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20 ring-4 ring-blue-50 dark:ring-blue-950/30"
                  : currentStep > item.step
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-850 text-slate-400"
                  }`}
              >
                {currentStep > item.step ? (
                  <Check className="w-4 h-4 stroke-[2.5]" />
                ) : (
                  item.step
                )}
              </div>
              <span className={`text-xs font-semibold mt-2 transition-colors ${currentStep === item.step ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-455"}`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {error && (
          <Alert className="border-red-500/20 bg-red-500/10 text-red-500 rounded-xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}


        {currentStep === 1 && (
          <div className="space-y-6 animate-fadeIn">
            {/* 1. Profile Photo and Basic Personal Data */}
            <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-md font-bold">Personal Information</CardTitle>
                <CardDescription className="text-xs">Primary personal identification information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Profile Avatar Upload */}
                <div className="flex flex-col sm:flex-row items-center gap-5 pb-2">
                  <div className="relative group">
                    {formData.profile_image_preview ? (
                      <img
                        src={formData.profile_image_preview}
                        alt="Upload Preview"
                        className="w-24 h-24 rounded-2xl object-cover border border-slate-200 dark:border-slate-800"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-dashed border-blue-200 dark:border-blue-800 flex flex-col items-center justify-center text-blue-600 dark:text-blue-400">
                        <Camera className="h-6 w-6 stroke-[1.5]" />
                        <span className="text-3xs font-semibold mt-1">Photo</span>
                      </div>
                    )}
                    <label className="absolute inset-0 cursor-pointer rounded-2xl flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-3xs font-bold">Upload</span>
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
                  <div className="text-center sm:text-left">
                    <p className="text-xs font-semibold">Upload Photo</p>
                    <p className="text-3xs text-slate-400 mt-0.5">JPEG or PNG files. Recommended maximum file size is 2MB.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* <div className="space-y-1.5">
                    <Label htmlFor="timestamp" className="text-xs font-semibold text-slate-500">Timestamp</Label>
                    <Input
                      id="timestamp"
                      name="timestamp"
                      value={formData.timestamp}
                      disabled
                      className="rounded-xl bg-slate-100 dark:bg-slate-800 cursor-not-allowed border border-slate-100 dark:border-slate-800 text-xs text-slate-400"
                    />
                  </div> */}

                  <div className="space-y-1.5">
                    <Label htmlFor="full_name" className="text-xs font-semibold text-slate-500">Employee Name *</Label>
                    <Input
                      id="full_name"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      className="rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                      placeholder="Enter employee name"
                    />
                    {fieldErrors.full_name && <p className="text-3xs text-red-500">{fieldErrors.full_name}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="mobile_number" className="text-xs font-semibold text-slate-500">Contact Number *</Label>
                    <Input
                      id="mobile_number"
                      name="mobile_number"
                      value={formData.mobile_number}
                      onChange={handleChange}
                      maxLength={10}
                      className="rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                      placeholder="Enter contact number"
                    />
                    {fieldErrors.mobile_number && <p className="text-3xs text-red-500">{fieldErrors.mobile_number}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="birth_date" className="text-xs font-semibold text-slate-500">Date of Birth</Label>
                    <Input
                      id="birth_date"
                      name="birth_date"
                      type="date"
                      value={formData.birth_date}
                      onChange={handleChange}
                      className="rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs"
                    />
                    {fieldErrors.birth_date && <p className="text-3xs text-red-500">{fieldErrors.birth_date}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="gender" className="text-xs font-semibold text-slate-500">Gender</Label>
                    <Select value={formData.gender} onValueChange={(val) => handleSelectChange('gender', val)}>
                      <SelectTrigger className="rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs text-left">
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

                  <div className="space-y-1.5">
                    <Label htmlFor="marital_status" className="text-xs font-semibold text-slate-500">Marital Status</Label>
                    <Select value={formData.marital_status} onValueChange={(val) => handleSelectChange('marital_status', val)}>
                      <SelectTrigger className="rounded-xl bg-slate-55 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs text-left">
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

                  <div className="space-y-1.5">
                    <Label htmlFor="blood_group" className="text-xs font-semibold text-slate-500">Blood Group</Label>
                    <Select value={formData.blood_group} onValueChange={(val) => handleSelectChange('blood_group', val)}>
                      <SelectTrigger className="rounded-xl bg-slate-55 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs text-left">
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
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="hobbies" className="text-xs font-semibold text-slate-500">Hobbies</Label>
                    <Input
                      id="hobbies"
                      name="hobbies"
                      value={formData.hobbies}
                      onChange={handleChange}
                      className="rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                      placeholder="Enter hobbies"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="personal_email" className="text-xs font-semibold text-slate-500">Personal Email</Label>
                    <Input
                      id="personal_email"
                      name="personal_email"
                      type="email"
                      value={formData.personal_email}
                      onChange={handleChange}
                      className="rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                      placeholder="Enter personal email"
                    />
                    {fieldErrors.personal_email && <p className="text-3xs text-red-500">{fieldErrors.personal_email}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-semibold text-slate-500">Work Email </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                      placeholder="Enter work email"
                    />
                    {fieldErrors.email && <p className="text-3xs text-red-500">{fieldErrors.email}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="username" className="text-xs font-semibold text-slate-500">Username (Login Account)</Label>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      value={formData.username}
                      onChange={handleChange}
                      className="rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                      placeholder="Enter username"
                    />
                    {fieldErrors.username && <p className="text-3xs text-red-500">{fieldErrors.username}</p>}
                  </div>

               <div className="space-y-1.5">
  <Label
    htmlFor="password"
    className="text-xs font-semibold text-slate-500"
  >
    Password
  </Label>

  <div className="relative">
    <Input
      id="password"
      name="password"
      type={showPassword ? "text" : "password"}
      value={formData.password}
      onChange={handleChange}
      placeholder="Enter password"
      className="rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 pr-10"
    />

    <button
      type="button"
      onClick={() => setShowPassword((prev) => !prev)}
      className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
    >
      {showPassword ? (
        <EyeOff className="h-4 w-4" />
      ) : (
        <Eye className="h-4 w-4" />
      )}
    </button>
  </div>

  {fieldErrors.password && (
    <p className="text-3xs text-red-500">
      {fieldErrors.password}
    </p>
  )}
</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6 animate-fadeIn">
            {/* 2. Guardian & Spouse Details */}
            <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-md font-bold">Family & Guardian Info</CardTitle>
                <CardDescription className="text-xs">Guardian and spouse background details</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="guardian_name" className="text-xs font-semibold text-slate-500">Guardian Name</Label>
                  <Input
                    id="guardian_name"
                    name="guardian_name"
                    value={formData.guardian_name}
                    onChange={handleChange}
                    className="rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                    placeholder="Enter guardian name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="guardian_phone" className="text-xs font-semibold text-slate-500">Guardian Contact Number</Label>
                  <Input
                    id="guardian_phone"
                    name="guardian_phone"
                    value={formData.guardian_phone}
                    onChange={handleChange}
                    maxLength={10}
                    className="rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                    placeholder="Enter contact number"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="guardian_dob" className="text-xs font-semibold text-slate-500">Guardian Date Of Birth</Label>
                  <Input
                    id="guardian_dob"
                    name="guardian_dob"
                    type="date"
                    value={formData.guardian_dob}
                    onChange={handleChange}
                    className="rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="spouse_name" className="text-xs font-semibold text-slate-500">Spouse Name</Label>
                  <Input
                    id="spouse_name"
                    name="spouse_name"
                    value={formData.spouse_name}
                    onChange={handleChange}
                    className="rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                    placeholder="Enter spouse name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="spouse_phone" className="text-xs font-semibold text-slate-500">Spouse Contact Number</Label>
                  <Input
                    id="spouse_phone"
                    name="spouse_phone"
                    value={formData.spouse_phone}
                    onChange={handleChange}
                    maxLength={10}
                    className="rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                    placeholder="Enter contact number"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="anniversary_date" className="text-xs font-semibold text-slate-500">Date Of Anniversary</Label>
                  <Input
                    id="anniversary_date"
                    name="anniversary_date"
                    type="date"
                    value={formData.anniversary_date}
                    onChange={handleChange}
                    className="rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 2. Residential Address & Passport */}
            <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-md font-bold">Residential Details</CardTitle>
                <CardDescription className="text-xs">Residential address and nationality data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="home_address" className="text-xs font-semibold text-slate-500">Home Address</Label>
                  <Textarea
                    id="home_address"
                    name="home_address"
                    value={formData.home_address}
                    onChange={handleChange}
                    rows={2}
                    className="rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                    placeholder="Enter home address"
                  />
                  {fieldErrors.home_address && <p className="text-3xs text-red-500">{fieldErrors.home_address}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="city_name" className="text-xs font-semibold text-slate-500">City</Label>
                    <Input id="city_name" name="city_name" value={formData.city_name} onChange={handleChange} className="rounded-xl" placeholder="Enter city" />
                    {fieldErrors.city_name && <p className="text-3xs text-red-500">{fieldErrors.city_name}</p>}
                  </div>
               
                  <div className="space-y-1.5">
                    <Label htmlFor="postal_code" className="text-xs font-semibold text-slate-500">Postal Code</Label>
                    <Input id="postal_code" name="postal_code" value={formData.postal_code} onChange={handleChange} className="rounded-xl" placeholder="Enter postal code" />
                    {fieldErrors.postal_code && <p className="text-3xs text-red-500">{fieldErrors.postal_code}</p>}
                  </div>
                </div>

                {/* <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="country_code" className="text-xs font-semibold text-slate-500">Country Code</Label>
                    <Input id="country_code" name="country_code" value={formData.country_code} onChange={handleChange} maxLength={3} className="rounded-xl" placeholder="Enter country code" />
                    {fieldErrors.country_code && <p className="text-3xs text-red-500">{fieldErrors.country_code}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="nationality" className="text-xs font-semibold text-slate-500">Nationality</Label>
                    <Input id="nationality" name="nationality" value={formData.nationality} onChange={handleChange} className="rounded-xl" placeholder="Enter nationality" />
                    {fieldErrors.nationality && <p className="text-3xs text-red-500">{fieldErrors.nationality}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="passport_number" className="text-xs font-semibold text-slate-500">Passport Number</Label>
                    <Input id="passport_number" name="passport_number" value={formData.passport_number} onChange={handleChange} className="rounded-xl" placeholder="Enter passport number" />
                    {fieldErrors.passport_number && <p className="text-3xs text-red-500">{fieldErrors.passport_number}</p>}
                  </div>
                </div> */}
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6 animate-fadeIn">
            {/* 3. Job Profiles / Employment Setup */}
            <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-md font-bold">Employment Details</CardTitle>
                <CardDescription className="text-xs">Setup designation, division, salary, and active rates</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="office_location_id" className="text-xs font-semibold text-slate-500">Office Location</Label>
                  <Select
  value={formData.office_location_id}
  onValueChange={(val) => {
    setFormData((prev) => ({
      ...prev,
      office_location_id: val,
      division_id: "", // Reset department
    }));

    setDivisions(
      allDivisions.filter(
        (d: any) => d.office_location_id === Number(val)
      )
    );
  }}
>
                    <SelectTrigger className="rounded-xl text-xs text-left">
                      <SelectValue placeholder="Select Location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map(l => <SelectItem key={l.id} value={l.id.toString()}>{l.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {fieldErrors.office_location_id && <p className="text-3xs text-red-500">{fieldErrors.office_location_id}</p>}
                </div>

                <div className="space-y-1.5">
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

                <div className="space-y-1.5">
                  <Label htmlFor="designation" className="text-xs font-semibold text-slate-500">Designation</Label>
                  <Input id="designation" name="designation" value={formData.designation} onChange={handleChange} className="rounded-xl" placeholder="Enter Designation" />

                  {fieldErrors.designation && <p className="text-3xs text-red-500">{fieldErrors.designation}</p>}
                </div>

                {/* <div className="space-y-1.5">
                  <Label htmlFor="hire_date" className="text-xs font-semibold text-slate-500">Hire Date</Label>
                  <Input id="hire_date" name="hire_date" type="date" value={formData.hire_date} onChange={handleChange} className="rounded-xl text-xs" />
                  {fieldErrors.hire_date && <p className="text-3xs text-red-500">{fieldErrors.hire_date}</p>}
                </div> */}

                <div className="space-y-1.5">
                  <Label htmlFor="date_of_joining" className="text-xs font-semibold text-slate-500">Date of Joining</Label>
                  <Input id="date_of_joining" name="date_of_joining" type="date" value={formData.date_of_joining} onChange={handleChange} className="rounded-xl text-xs" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="employment_status" className="text-xs font-semibold text-slate-500">Active/Exit</Label>
                  <Select value={formData.employment_status} onValueChange={(val) => handleSelectChange('employment_status', val)}>
                    <SelectTrigger className="rounded-xl text-xs text-left">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="terminated">Exit</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldErrors.employment_status && <p className="text-3xs text-red-500">{fieldErrors.employment_status}</p>}
                </div>

                <div className="space-y-1.5">
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

                <div className="space-y-1.5">
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

                <div className="space-y-1.5">
                  <Label htmlFor="ctc" className="text-xs font-semibold text-slate-500">CTC (INR)</Label>
                  <Input id="ctc" name="ctc" type="number" value={formData.ctc} onChange={handleChange} className="rounded-xl" placeholder="Enter CTC" />
                  {fieldErrors.ctc && <p className="text-3xs text-red-500">{fieldErrors.ctc}</p>}
                </div>

                {/* <div className="space-y-1.5">
                  <Label htmlFor="job_title_id" className="text-xs font-semibold text-slate-500">Job Title</Label>
                  <Select value={formData.job_title_id} onValueChange={(val) => handleSelectChange('job_title_id', val)}>
                    <SelectTrigger className="rounded-xl text-xs text-left">
                      <SelectValue placeholder="Select Job Title" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobTitles.map(j => <SelectItem key={j.id} value={j.id.toString()}>{j.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="biometric_id" className="text-xs font-semibold text-slate-500">Biometric ID</Label>
                  <Input id="biometric_id" name="biometric_id" value={formData.biometric_id} onChange={handleChange} className="rounded-xl" placeholder="Enter Biometric ID" />
                </div> */}
              </CardContent>
            </Card>


            {/* Emergency Contacts */}
            {/* <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-md font-bold">Emergency Contact</CardTitle>
                <CardDescription className="text-xs">Person to contact in an emergency</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="emergency_contact_name" className="text-xs font-semibold text-slate-500">Contact Name</Label>
                  <Input id="emergency_contact_name" name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleChange} className="rounded-xl" placeholder="Enter name" />
                  {fieldErrors.emergency_contact_name && <p className="text-3xs text-red-500">{fieldErrors.emergency_contact_name}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="emergency_contact_phone" className="text-xs font-semibold text-slate-500">Contact Phone</Label>
                  <Input id="emergency_contact_phone" name="emergency_contact_phone" value={formData.emergency_contact_phone} onChange={handleChange} maxLength={10} className="rounded-xl" placeholder="Enter phone number" />
                  {fieldErrors.emergency_contact_phone && <p className="text-3xs text-red-500">{fieldErrors.emergency_contact_phone}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="emergency_contact_relationship" className="text-xs font-semibold text-slate-500">Relationship</Label>
                  <Input id="emergency_contact_relationship" name="emergency_contact_relationship" value={formData.emergency_contact_relationship} onChange={handleChange} className="rounded-xl" placeholder="e.g. Father, Spouse" />
                  {fieldErrors.emergency_contact_relationship && <p className="text-3xs text-red-500">{fieldErrors.emergency_contact_relationship}</p>}
                </div>
              </CardContent>
            </Card> */}

            {/* 5. Documents Upload (Queue) */}
            <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-md font-bold">Employee Documents</CardTitle>
                <CardDescription className="text-xs">Queue initial documents to upload after onboarding</CardDescription>
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
                      id="create_doc_file"
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
                    variant="outline"
                    onClick={() => {
                      if (!selectedDocType || !selectedFile) {
                        showAlert('error', 'Error', 'Please select a document type and choose a file first.');
                        return;
                      }
                      setQueuedDocs(prev => [
                        ...prev,
                        {
                          file: selectedFile,
                          typeId: selectedDocType,
                          typeName: docTypes.find(t => t.id.toString() === selectedDocType)?.title || 'Unknown Type'
                        }
                      ]);
                      setSelectedDocType('');
                      setSelectedFile(null);
                      const fileInput = document.getElementById('create_doc_file') as HTMLInputElement;
                      if (fileInput) fileInput.value = '';
                    }}
                    className="rounded-xl text-xs font-semibold"
                  >
                    Add Document
                  </Button>
                </div>

                {queuedDocs.length > 0 && (
                  <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden mt-4">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                          <th className="p-3">Document Type</th>
                          <th className="p-3">File Name</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {queuedDocs.map((doc, idx) => (
                          <tr key={idx} className="border-b last:border-0 border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                            <td className="p-3 font-medium">{doc.typeName}</td>
                            <td className="p-3 text-slate-400 break-all">{doc.file.name}</td>
                            <td className="p-3 text-right">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setQueuedDocs(prev => prev.filter((_, i) => i !== idx));
                                }}
                                className="text-red-500 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg h-7 px-2"
                              >
                                Delete
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-2">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="rounded-xl text-sm font-semibold"
            >
              Previous Step
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              className="rounded-xl text-sm font-semibold"
            >
              Cancel
            </Button>
          )}

          {currentStep < 3 ? (
            <Button
              type="button"
              onClick={() => {
                if (validateStep(currentStep)) {
                  setCurrentStep(prev => prev + 1);
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold"
            >
              Next Step
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleFinalSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Onboarding...
                </>
              ) : (
                'Onboard Employee'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
