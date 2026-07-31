import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { staffService, documentService, documentTypeService } from '../../services/api';
import { showAlert, showConfirmDialog, getErrorMessage } from '../../lib/sweetalert';
const API_BASE_URL = 'http://127.0.0.1:8000';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Skeleton } from '../../components/ui/skeleton';
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  MapPin,
  FileText,
  Building,
  Upload,
  Trash2,
  Download,
  Loader2,
  Eye,
  Calendar,
  Briefcase,
  Layers,
  IndianRupee,
  ShieldAlert,
} from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';

interface StaffMember {
  id: number;
  full_name: string;
  personal_email?: string;
  work_email?: string;
  mobile_number?: string;
  birth_date?: string;
  gender?: string;
  home_address?: string;
  city_name?: string;
  region?: string;
  country_code?: string;
  postal_code?: string;
  job_title?: { title: string } | null;
  division?: { title: string } | null;
  office_location?: { title: string } | null;
  employment_status: string;
  employment_type?: string;
  hire_date?: string;
  ctc?: number;
  compensation_type?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  blood_group?: string;
  hobbies?: string;
  marital_status?: string;
  guardian_name?: string;
  guardian_contact_number?: string;
  guardian_date_of_birth?: string;
  spouse_name?: string;
  spouse_contact_number?: string;
  date_of_anniversary?: string;
  designation?: string;
  date_of_joining?: string;
  profile_image?: string | null;
}

interface DocumentItem {
  id: number;
  document_name: string;
  original_name?: string;
  created_at: string;
  type?: {
    id: number;
    title: string;
  };
  document_type?: { id: number; title: string };
  temporary_url?: string;
  storage_type?: string;
}

interface DocumentType {
  id: number;
  title: string;
  notes?: string;
}

export default function StaffProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [files, setFiles] = useState<DocumentItem[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const response = await staffService.getById(Number(id));
        setStaff(response.data.data);
      } catch (error) {
        console.error('Failed to fetch staff:', error);
        showAlert('error', 'Error', 'Failed to fetch staff details');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStaff();
  }, [id]);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await documentService.getAll({
          owner_type: 'employee',
          owner_id: Number(id),
          per_page: 100
        });
        const docs = response.data.data || [];
        setFiles(docs);
      } catch (error) {
        console.error('Failed to fetch documents:', error);
      }
    };
    const fetchDocTypes = async () => {
      try {
        const response = await documentTypeService.getAll({ page: 1, per_page: 100 });
        const types = response.data.data || [];
        setDocumentTypes(types);
      } catch (error) {
        console.error('Failed to fetch document types:', error);
      }
    };
    if (id) {
      fetchDocuments();
      fetchDocTypes();
    }
  }, [id]);

  const handleFileUpload = async () => {
    if (!selectedFile || !selectedType) return;
    setIsUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('document_type_id', selectedType);
      formData.append('owner_type', 'employee');
      formData.append('owner_id', String(id));

      await documentService.upload(Number(id), formData);
      showAlert('success', 'Success!', 'Document uploaded successfully', 2000);

      const response = await documentService.getAll({
        owner_type: 'employee',
        owner_id: Number(id),
        per_page: 100
      });
      setFiles(response.data.data || []);

      setSelectedFile(null);
      setSelectedType('');
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: unknown) {
      console.error('Failed to upload document:', error);
      showAlert('error', 'Error', getErrorMessage(error, 'Failed to upload document'));
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleFileDelete = async (docId: number) => {
    const result = await showConfirmDialog(
      'Are you sure?',
      'You want to delete this document?'
    );

    if (!result.isConfirmed) return;

    try {
      await documentService.delete(docId);
      showAlert('success', 'Deleted!', 'Document deleted successfully', 2000);
      setFiles(files.filter(f => f.id !== docId));
    } catch (error: unknown) {
      console.error('Failed to delete document:', error);
      showAlert('error', 'Error', getErrorMessage(error, 'Failed to delete document'));
    }
  };

  const handleViewDocument = (file: DocumentItem) => {
    window.open(
      `${API_BASE_URL}/api/documents/${file.id}/view`,
      '_blank'
    );
  };

  const handleDownloadDocument = async (file: DocumentItem) => {
    try {
      const response = await documentService.download(file.id);
      if (response.data && response.data.download_url) {
        window.open(response.data.download_url, '_blank');
      } else {
        const rawRes = await api.get(`/documents/${file.id}/download`, { responseType: 'blob' });
        const blob = new Blob([rawRes.data], { type: rawRes.headers['content-type'] });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = file.document_name || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error(err);
      showAlert('error', 'Download Failed', 'Could not download the document.');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: 'bg-green-500/10 text-green-600 dark:text-green-450 border border-green-500/20',
      inactive: 'bg-slate-500/10 text-slate-650 border border-slate-500/20',
      terminated: 'bg-red-500/10 text-red-500 border border-red-500/20',
      on_leave: 'bg-amber-500/10 text-amber-600 border border-amber-500/20',
    };
    return variants[status] || 'bg-slate-500/10 text-slate-600 border border-slate-500/20';
  };

  const BLOOD_GROUP_LABELS: Record<string, string> = {
    a_plus: 'A+', a_minus: 'A-',
    b_plus: 'B+', b_minus: 'B-',
    ab_plus: 'AB+', ab_minus: 'AB-',
    o_plus: 'O+', o_minus: 'O-',
  };

  const formatEnum = (val?: string) =>
    val ? val.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : undefined;

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  if (isLoading) {
    return (
      <div className="py-12 space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-16 w-1/3 rounded-xl animate-pulse" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 rounded-2xl animate-pulse" />
          <Skeleton className="lg:col-span-2 h-96 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="text-center py-16">
        <ShieldAlert className="mx-auto h-12 w-12 text-slate-400 mb-3" />
        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-350">Staff member not found</h2>
        <Button onClick={() => navigate('/staff')} className="mt-4 rounded-xl">
          Back to Staff List
        </Button>
      </div>
    );
  }

  const groupedFiles = files.reduce<Record<string, DocumentItem[]>>(
    (acc, file) => {
      const type = file.type?.title || 'Uncategorized';
      if (!acc[type]) acc[type] = [];
      acc[type].push(file);
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <Avatar className="h-20 w-20 border border-slate-100 dark:border-slate-800 shadow-sm">
            {staff.profile_image && (
              <AvatarImage
                src={staff.profile_image.startsWith('http') ? staff.profile_image : `${API_BASE_URL}${staff.profile_image.startsWith('/') ? '' : '/'}${staff.profile_image}`}
                alt={staff.full_name}
                className="object-cover"
              />
            )}
            <AvatarFallback className="bg-blue-600 text-white font-bold text-xl">
              {getInitials(staff.full_name)}
            </AvatarFallback>
          </Avatar>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-205">{staff.full_name}</h1>
            <p className="text-xs text-slate-400 font-medium">
               {staff.designation || 'No Designation'}
            </p>
          </div>
        </div>

        <Link to={`/staff/${id}/edit`}>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm">
            <Edit className="mr-2 h-4 w-4" /> Edit Profile
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* QUICK INFO */}
        <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm rounded-2xl h-fit">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-bold">Quick Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow icon={Mail} label="Email" value={staff.work_email || staff.personal_email || 'Not provided'} />
            <InfoRow icon={Phone} label="Phone" value={staff.mobile_number || 'Not provided'} />
            <InfoRow icon={Building} label="Department" value={staff.division?.title || 'Not assigned'} />
            <InfoRow icon={MapPin} label="Location" value={staff.office_location?.title || 'Not assigned'} />

            <div className="pt-2">
              <Badge className={`${getStatusBadge(staff.employment_status)} rounded-lg py-0.5 px-2 font-semibold capitalize text-3xs`}>
                {staff.employment_status.replace('_', ' ')}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* TABS */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl mb-4 flex w-fit gap-1">
              <TabsTrigger value="personal" className="rounded-lg text-xs font-semibold px-4 py-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-[#111827] data-[state=active]:shadow-sm">Personal</TabsTrigger>
              <TabsTrigger value="employment" className="rounded-lg text-xs font-semibold px-4 py-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-[#111827] data-[state=active]:shadow-sm">Employment</TabsTrigger>
              <TabsTrigger value="family" className="rounded-lg text-xs font-semibold px-4 py-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-[#111827] data-[state=active]:shadow-sm">Family Details</TabsTrigger>
              <TabsTrigger value="documents" className="rounded-lg text-xs font-semibold px-4 py-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-[#111827] data-[state=active]:shadow-sm">Documents</TabsTrigger>
            </TabsList>

            {/* PERSONAL */}
            <TabsContent value="personal" className="focus-visible:outline-none">
              <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-sm font-bold">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 sm:grid-cols-2">
                  <Field label="Personal Email" value={staff.personal_email} icon={Mail} />
                  <Field label="Date of Birth" value={staff.birth_date} icon={Calendar} />
                  <Field label="Gender" value={formatEnum(staff.gender)} icon={Briefcase} />
                  <Field label="Blood Group" value={BLOOD_GROUP_LABELS[staff.blood_group || ''] || staff.blood_group} icon={Layers} />
                  <Field label="Marital Status" value={formatEnum(staff.marital_status)} icon={Layers} />
                  <div className="sm:col-span-2">
                    <Field label="Hobbies" value={staff.hobbies} icon={Briefcase} />
                  </div>
                  <div className="sm:col-span-2">
                    <Field
                      label="Home Address"
                      value={[
                        staff.home_address,
                        staff.city_name,
                        staff.region,
                        staff.country_code,
                        staff.postal_code,
                      ]
                        .filter(Boolean)
                        .join(', ') || 'Not provided'}
                      icon={MapPin}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* EMPLOYMENT */}
            <TabsContent value="employment" className="focus-visible:outline-none">
              <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-sm font-bold">Employment Details</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 sm:grid-cols-2">
                  <Field label="Designation" value={staff.designation} icon={Briefcase} />
                  <Field label="Division / Department" value={staff.division?.title} icon={Layers} />
                  <Field label="Office Location" value={staff.office_location?.title} icon={MapPin} />
                  {/* <Field label="Hire Date" value={staff.hire_date} icon={Calendar} /> */}
                  <Field label="Date of Joining" value={staff.date_of_joining} icon={Calendar} />
                  <Field label="Employment Type" value={formatEnum(staff.employment_type)} icon={Briefcase} />
                  <Field label="Compensation Model" value={formatEnum(staff.compensation_type)} icon={Briefcase} />
                  <Field label="CTC" value={staff.ctc ? `₹${staff.ctc}` : 'Not provided'} icon={IndianRupee} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* FAMILY DETAILS */}
            <TabsContent value="family" className="focus-visible:outline-none">
              <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-sm font-bold">Family Details</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 sm:grid-cols-2">
                  <Field label="Guardian Name" value={staff.guardian_name} icon={Briefcase} />
                  <Field label="Guardian Contact" value={staff.guardian_contact_number} icon={Phone} />
                  <Field label="Guardian DOB" value={staff.guardian_date_of_birth} icon={Calendar} />
                  <hr className="sm:col-span-2 border-slate-100 dark:border-slate-800" />
                  <Field label="Spouse Name" value={staff.spouse_name} icon={Briefcase} />
                  <Field label="Spouse Contact" value={staff.spouse_contact_number} icon={Phone} />
                  <Field label="Anniversary Date" value={staff.date_of_anniversary} icon={Calendar} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* DOCUMENTS */}
            <TabsContent value="documents" className="focus-visible:outline-none">
              <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-sm font-bold">Verification Documents</CardTitle>
                  <CardDescription className="text-xs">Manage verification IDs and agreement drafts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* UPLOADER */}
                  <div className="border border-dashed border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10 p-5 rounded-2xl space-y-4">
                    <h4 className="text-xs font-bold">Upload Document File</h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="document-type" className="text-xs font-semibold text-slate-500">Document Type</Label>
                        <Select value={selectedType} onValueChange={setSelectedType}>
                          <SelectTrigger className="rounded-xl text-xs text-left">
                            <SelectValue placeholder="Select Type" />
                          </SelectTrigger>
                          <SelectContent>
                            {documentTypes.map((type) => (
                              <SelectItem key={type.id} value={String(type.id)}>
                                {type.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="file-upload" className="text-xs font-semibold text-slate-500">Attach File</Label>
                        <Input
                          id="file-upload"
                          type="file"
                          className="rounded-xl file:bg-blue-50 file:text-blue-700 text-xs"
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleFileUpload}
                      disabled={!selectedFile || !selectedType || isUploadingFile}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
                    >
                      {isUploadingFile ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" /> Upload Document
                        </>
                      )}
                    </Button>
                  </div>

                  {files.length === 0 ? (
                    <div className="text-center py-10">
                      <FileText className="mx-auto h-12 w-12 text-slate-400 mb-3" />
                      <p className="text-xs font-semibold text-slate-500 mt-1">No documents uploaded yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold">Uploaded Documents list</h4>

                      <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                        {/* Headers */}
                        <div className="grid grid-cols-12 bg-slate-50 dark:bg-slate-800/40 px-4 py-2 text-xs font-bold text-slate-400">
                          <div className="col-span-3">Document Type</div>
                          <div className="col-span-9">File Details & Status</div>
                        </div>

                        {/* List */}
                        {Object.entries(groupedFiles).map(([type, docs]) => (
                          <div key={type} className="grid grid-cols-12 px-4 py-3 gap-4 hover:bg-slate-50/20 dark:hover:bg-slate-800/10">
                            <div className="col-span-3">
                              <span className="font-bold text-xs text-blue-600 dark:text-blue-400">
                                {type}
                              </span>
                              <p className="text-3xs text-slate-400 mt-0.5">
                                {docs.length} file{docs.length > 1 ? 's' : ''}
                              </p>
                            </div>

                            <div className="col-span-9 space-y-2">
                              {docs.map((file) => (
                                <div
                                  key={file.id}
                                  className="flex items-center justify-between border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/30 rounded-xl p-3"
                                >
                                  <div className="flex items-start gap-2.5">
                                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                                    <div>
                                      <p className="font-bold text-xs text-slate-800 dark:text-slate-205">
                                        {file.document_name || file.original_name}
                                      </p>
                                      <p className="text-[10px] text-slate-400 mt-0.5">
                                        Uploaded: {new Date(file.created_at).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex gap-1.5">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="rounded-lg h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800"
                                      onClick={() => handleViewDocument(file)}
                                      title="View Document"
                                    >
                                      <Eye className="h-4 w-4 text-slate-400" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="rounded-lg h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800"
                                      onClick={() => handleDownloadDocument(file)}
                                      title="Download Document"
                                    >
                                      <Download className="h-4 w-4 text-slate-400" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="rounded-lg h-8 w-8 hover:bg-red-50 dark:hover:bg-red-950/20"
                                      onClick={() => handleFileDelete(file.id)}
                                    >
                                      <Trash2 className="h-4 w-4 text-red-555" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-3xs text-slate-400 font-semibold">{label}</p>
        <p className="text-xs font-semibold text-slate-800 dark:text-slate-350">{value}</p>
      </div>
    </div>
  );
}

function Field({ label, value, icon: Icon }: any) {
  return (
    <div className="flex gap-3">
      <div className="p-2 w-9 h-9 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div>
        <p className="text-3xs text-slate-405 font-bold uppercase tracking-wider">{label}</p>
        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">{value || 'Not provided'}</p>
      </div>
    </div>
  );
}
