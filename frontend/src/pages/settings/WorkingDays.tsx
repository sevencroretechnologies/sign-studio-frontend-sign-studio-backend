import { useState, useEffect, useCallback } from 'react';
import { workingDaysService, WorkingDayConfig } from '../../services/api';
import { showAlert, getErrorMessage, showConfirmDialog } from '../../lib/sweetalert';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Checkbox } from '../../components/ui/checkbox';
import DataTable, { TableColumn } from 'react-data-table-component';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import { Plus, Calendar, Clock, Loader2, Edit2, Eye, Trash2, MoreHorizontal } from 'lucide-react';
import { format, isBefore, isAfter, startOfDay } from 'date-fns';

export default function WorkingDays() {
  const [configs, setConfigs] = useState<WorkingDayConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
    from_date: '',
    to_date: '',
  });
  
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);

  const fetchConfigs = useCallback(async (currentPage: number = 1) => {
    setIsLoading(true);
    try {
      const response = await workingDaysService.getAll({
        page: currentPage,
        per_page: perPage,
      });
      const { data } = response.data;
      // Depending on API response structure (paginate vs get), data might be directly array or data.data
      const items = data.data || data;
      setConfigs(items || []);
      setTotalRows(data.total || (Array.isArray(items) ? items.length : 0));
    } catch (error) {
      console.error('Failed to fetch working days:', error);
      showAlert('error', 'Error', 'Failed to fetch working day configurations');
      setConfigs([]);
      setTotalRows(0);
    } finally {
      setIsLoading(false);
    }
  }, [perPage]);

  useEffect(() => {
    fetchConfigs(page);
  }, [page, fetchConfigs]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePerRowsChange = (newPerPage: number) => {
    setPerPage(newPerPage);
    setPage(1);
  };

  const handleCheckboxChange = (day: string) => {
    setFormData(prev => ({
      ...prev,
      [day]: !(prev as any)[day]
    }));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    let isValid = true;

    if (!formData.from_date) {
      errors.from_date = 'Effective From Date is required';
      isValid = false;
    }

    if (formData.from_date && formData.to_date) {
      if (new Date(formData.to_date) < new Date(formData.from_date)) {
        errors.to_date = 'To Date must be after or equal to From Date';
        isValid = false;
      }
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleEdit = (row: WorkingDayConfig) => {
    setDialogMode('edit');
    setSelectedId(row.id);
    setFormData({
      monday: row.monday,
      tuesday: row.tuesday,
      wednesday: row.wednesday,
      thursday: row.thursday,
      friday: row.friday,
      saturday: row.saturday,
      sunday: row.sunday,
      from_date: row.from_date ? row.from_date.split('T')[0] : '',
      to_date: row.to_date ? row.to_date.split('T')[0] : '',
    });
    setFieldErrors({});
    setIsDialogOpen(true);
  };

  const handleView = (row: WorkingDayConfig) => {
    setDialogMode('view');
    setSelectedId(row.id);
    setFormData({
      monday: row.monday,
      tuesday: row.tuesday,
      wednesday: row.wednesday,
      thursday: row.thursday,
      friday: row.friday,
      saturday: row.saturday,
      sunday: row.sunday,
      from_date: row.from_date ? row.from_date.split('T')[0] : '',
      to_date: row.to_date ? row.to_date.split('T')[0] : '',
    });
    setFieldErrors({});
    setIsDialogOpen(true);
  };

  const handleDelete = async (row: WorkingDayConfig) => {
    const result = await showConfirmDialog(
      'Delete Configuration',
      'Are you sure you want to delete this working day configuration? This action cannot be undone.',
      'Yes, delete it!'
    );

    if (result.isConfirmed) {
      try {
        await workingDaysService.delete(row.id);
        showAlert('success', 'Deleted!', 'Configuration has been deleted.');
        fetchConfigs(page);
      } catch (error) {
        console.error('Failed to delete configuration:', error);
        showAlert('error', 'Error', getErrorMessage(error, 'Failed to delete configuration'));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        from_date: formData.from_date || null,
        to_date: formData.to_date || null,
      };

      if (dialogMode === 'edit' && selectedId) {
        await workingDaysService.update(selectedId, payload);
        showAlert('success', 'Success!', 'Working day configuration updated successfully', 2000);
      } else {
        await workingDaysService.create(payload);
        showAlert('success', 'Success!', 'Working day configuration created successfully', 2000);
      }
      setIsDialogOpen(false);
      resetForm();
      fetchConfigs(page);
    } catch (error: any) {
      console.error('Failed to save configuration:', error);
      
      if (error.response?.status === 422) {
        if (error.response?.data?.errors) {
          const apiErrors: Record<string, string> = {};
          Object.keys(error.response.data.errors).forEach((key) => {
            apiErrors[key] = error.response.data.errors[key][0];
          });
          setFieldErrors(apiErrors);
        } else if (error.response?.data?.message) {
          showAlert('error', 'Validation Error', error.response.data.message);
        } else {
          showAlert('error', 'Validation Error', 'Please check the provided dates.');
        }
      } else {
        showAlert('error', 'Error', getErrorMessage(error, 'Failed to save configuration'));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({ 
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false,
      from_date: '',
      to_date: '',
    });
    setFieldErrors({});
  };

  const renderError = (field: string) => {
    return fieldErrors[field] ? (
      <p className="text-sm text-red-500 mt-1">{fieldErrors[field]}</p>
    ) : null;
  };

  const getEnabledDaysString = (row: WorkingDayConfig) => {
    const days = [
      { key: 'monday', label: 'Mon' },
      { key: 'tuesday', label: 'Tue' },
      { key: 'wednesday', label: 'Wed' },
      { key: 'thursday', label: 'Thu' },
      { key: 'friday', label: 'Fri' },
      { key: 'saturday', label: 'Sat' },
      { key: 'sunday', label: 'Sun' },
    ];

    return days
      .filter(day => row[day.key as keyof WorkingDayConfig])
      .map(day => day.label)
      .join(', ');
  };

  const getStatus = (row: WorkingDayConfig) => {
    const today = startOfDay(new Date());

    if (!row.to_date) {
        if (row.from_date && isAfter(startOfDay(new Date(row.from_date)), today)) {
            return { label: 'Upcoming', variant: 'warning' as const };
        }
        return { label: 'Current', variant: 'success' as const };
    }

    const toDate = startOfDay(new Date(row.to_date));
    if (isBefore(toDate, today)) {
      return { label: 'Expired', variant: 'secondary' as const };
    }
    
    if (row.from_date) {
       const fromDate = startOfDay(new Date(row.from_date));
       if (isAfter(fromDate, today)) {
          return { label: 'Upcoming', variant: 'warning' as const };
       }
    }

    return { label: 'Current', variant: 'success' as const };
  };

  const columns: TableColumn<WorkingDayConfig>[] = [
    {
      name: "Working Days",
      selector: (row) => getEnabledDaysString(row),
      sortable: false,
      minWidth: "250px",
    },
    {
      name: "Effective From",
      selector: (row) => row.from_date || '-',
      format: (row) => row.from_date ? format(new Date(row.from_date), 'MMM dd, yyyy') : '-',
      sortable: true,
    },
    {
      name: "Effective To",
      selector: (row) => row.to_date || '-',
      format: (row) => row.to_date ? format(new Date(row.to_date), 'MMM dd, yyyy') : '-',
      sortable: true,
    },
    // {
    //   name: "Status",
    //   cell: (row) => {
    //     const status = getStatus(row);
    //     return <Badge variant={status.variant}>{status.label}</Badge>;
    //   },
    // },
    // {
    //   name: "Created Date",
    //   selector: (row) => row.created_at,
    //   format: (row) => format(new Date(row.created_at), 'MMM dd, yyyy'),
    //   sortable: true,
    // },
    {
      name: "Actions",
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleView(row)}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEdit(row)}>
              <Edit2 className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDelete(row)}
              className="text-solarized-red"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      ignoreRowClick: true,
      width: "100px",
    }
  ];

  const customStyles = {
    headRow: {
      style: {
        backgroundColor: '#f9fafb',
        borderBottomWidth: '1px',
        borderBottomColor: '#e5e7eb',
        borderBottomStyle: 'solid' as const,
        minHeight: '56px',
      },
    },
    headCells: {
      style: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#374151',
        paddingLeft: '16px',
        paddingRight: '16px',
      },
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-solarized-base02">Working Days</h1>
          <p className="text-solarized-base01 mt-1">
            Manage company working days and schedule history
          </p>
        </div>
        <Button 
          className="bg-solarized-blue hover:bg-solarized-blue/90"
          onClick={() => {
            setDialogMode('add');
            setSelectedId(null);
            resetForm();
            setIsDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Configuration
        </Button>
      </div>

      <div className="rounded-md border border-solarized-base2/50 bg-white">
          <DataTable
            columns={columns}
            data={configs}
            progressPending={isLoading}
            pagination
            paginationServer
            paginationTotalRows={totalRows}
            onChangeRowsPerPage={handlePerRowsChange}
            onChangePage={handlePageChange}
            customStyles={customStyles}
          />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'add' && 'Add Working Days Configuration'}
              {dialogMode === 'edit' && 'Edit Working Days Configuration'}
              {dialogMode === 'view' && 'View Working Days Configuration'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            
            <div className="space-y-3">
                <Label>Working Days</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                        { id: 'monday', label: 'Monday' },
                        { id: 'tuesday', label: 'Tuesday' },
                        { id: 'wednesday', label: 'Wednesday' },
                        { id: 'thursday', label: 'Thursday' },
                        { id: 'friday', label: 'Friday' },
                        { id: 'saturday', label: 'Saturday' },
                        { id: 'sunday', label: 'Sunday' },
                    ].map((day) => (
                        <div key={day.id} className="flex items-center space-x-2">
                            <Checkbox 
                                id={`day-${day.id}`}
                                checked={(formData as any)[day.id]}
                                onCheckedChange={() => handleCheckboxChange(day.id)}
                                disabled={dialogMode === 'view'}
                            />
                            <Label htmlFor={`day-${day.id}`} className="font-normal cursor-pointer text-sm">
                                {day.label}
                            </Label>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="from_date" className="required">Effective From</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="from_date"
                    type="date"
                    className="pl-9"
                    value={formData.from_date}
                    onChange={(e) => setFormData({ ...formData, from_date: e.target.value })}
                    disabled={dialogMode === 'view'}
                  />
                </div>
                {renderError('from_date')}
              </div>
              <div className="space-y-2">
                <Label htmlFor="to_date">Effective To (Optional)</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="to_date"
                    type="date"
                    className="pl-9"
                    value={formData.to_date}
                    onChange={(e) => setFormData({ ...formData, to_date: e.target.value })}
                    disabled={dialogMode === 'view'}
                  />
                </div>
                {renderError('to_date')}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
                {dialogMode === 'view' ? 'Close' : 'Cancel'}
              </Button>
              {dialogMode !== 'view' && (
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Configuration'
                  )}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
