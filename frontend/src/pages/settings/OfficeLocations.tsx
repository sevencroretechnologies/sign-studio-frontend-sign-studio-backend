import { useState, useEffect, useCallback } from "react";
import { settingsService } from "../../services/api";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";
import { showAlert, showConfirmDialog, getErrorMessage } from "../../lib/sweetalert";
import DataTable, { TableColumn } from "react-data-table-component";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Plus, MapPin, Edit, Trash2, MoreHorizontal, Eye, Phone, Mail, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";

interface Location {
  id: number;
  title: string;
  address: string;
  contact_phone: string;
  contact_email: string;
  latitude: number | null;
  longitude: number | null;
  allowed_radius: number | null;
  is_active: boolean;
}

export default function OfficeLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingLocation, setViewingLocation] = useState<Location | null>(null);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    address: "",
    contact_phone: "",
    contact_email: "",
    latitude: "",
    longitude: "",
    allowed_radius: "",
  });

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      showAlert("error", "Error", "Geolocation is not supported by your browser");
      return;
    }
    
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString()
        }));
        setIsGettingLocation(false);
      },
      (error) => {
        setIsGettingLocation(false);
        showAlert("error", "Error", "Unable to retrieve your location. Please check browser permissions.");
        console.error("Geolocation error:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const fetchLocations = useCallback(async (currentPage: number = 1) => {
    setIsLoading(true);
    try {
      const response = await settingsService.getOfficeLocations({
        page: currentPage,
        per_page: perPage,
        search: search
      });
      const { data, meta } = response.data;
      setLocations(data || []);
      setTotalRows(meta?.total || 0);
    } catch (error) {
      console.error("Failed to fetch locations:", error);
      showAlert("error", "Error", "Failed to fetch office locations");
      setLocations([]);
      setTotalRows(0);
    } finally {
      setIsLoading(false);
    }
  }, [perPage, search]);

  useEffect(() => {
    fetchLocations(page);
  }, [page, fetchLocations]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePerRowsChange = (newPerPage: number) => {
    setPerPage(newPerPage);
    setPage(1);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    let isValid = true;

    if (!formData.title.trim()) {
      errors.title = 'Location name is required';
      isValid = false;
    } else if (formData.title.length > 255) {
      errors.title = 'Location name must be less than 255 characters';
      isValid = false;
    }

    if (!formData.address.trim()) {
      errors.address = 'Address is required';
      isValid = false;
    }

    if (formData.contact_phone && !/^\+?[0-9\s\-()]{7,20}$/.test(formData.contact_phone.trim())) {
      errors.contact_phone = 'Invalid phone number format';
      isValid = false;
    }

    if (formData.contact_email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email.trim())) {
        errors.contact_email = 'Invalid email format';
        isValid = false;
      } else if (formData.contact_email.length > 255) {
        errors.contact_email = 'Email must be less than 255 characters';
        isValid = false;
      }
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    try {
      if (editingLocation) {
        await settingsService.updateOfficeLocation(
          editingLocation.id,
          formData
        );
        showAlert(
          "success",
          "Success!",
          "Office location updated successfully",
          2000
        );
      } else {
        await settingsService.createOfficeLocation(formData);
        showAlert(
          "success",
          "Success!",
          "Office location created successfully",
          2000
        );
      }
      setIsDialogOpen(false);
      setEditingLocation(null);
      resetForm();
      fetchLocations(page);
    } catch (err: any) {
      console.error("Failed to save location:", err);
      
      // Handle backend validation errors (status 422)
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const apiErrors: Record<string, string> = {};
        Object.keys(err.response.data.errors).forEach((key) => {
          apiErrors[key] = err.response.data.errors[key][0];
        });
        setFieldErrors(apiErrors);
        showAlert("error", "Validation Error", "Please fix the errors highlighted below.");
      } else {
        const message = getErrorMessage(err, "Failed to save office location");
        showAlert("error", "Error", message);
      }
    }
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      title: location.title,
      address: location.address || "",
      contact_phone: location.contact_phone || "",
      contact_email: location.contact_email || "",
      latitude: location.latitude?.toString() || "",
      longitude: location.longitude?.toString() || "",
      allowed_radius: location.allowed_radius?.toString() || "",
    });
    setFieldErrors({});
    setIsDialogOpen(true);
  };

  const handleView = (location: Location) => {
    setViewingLocation(location);
    setIsViewDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    const result = await showConfirmDialog(
      "Are you sure?",
      "You want to delete this location?"
    );

    if (!result.isConfirmed) return;

    try {
      await settingsService.deleteOfficeLocation(id);
      showAlert(
        "success",
        "Deleted!",
        "Office location deleted successfully",
        2000
      );
      fetchLocations(page);
    } catch (error: unknown) {
      console.error("Failed to delete location:", error);
      showAlert("error", "Error", getErrorMessage(error, "Failed to delete office location"));
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      address: "",
      contact_phone: "",
      contact_email: "",
      latitude: "",
      longitude: "",
      allowed_radius: "",
    });
    setFieldErrors({});
  };

  const renderError = (field: string) => {
    return fieldErrors[field] ? (
      <p className="text-sm text-red-500 mt-1">{fieldErrors[field]}</p>
    ) : null;
  };

  const columns: TableColumn<Location>[] = [
    {
      name: "Name",
      selector: (row) => row.title,
      sortable: true,
      minWidth: "150px",
    },
    {
      name: "Address",
      selector: (row) => row.address || "-",
      sortable: true,
      grow: 2,
    },
    {
      name: "Contact Phone",
      selector: (row) => row.contact_phone || "-",
      sortable: true,
    },
    {
      name: "Contact Email",
      selector: (row) => row.contact_email || "-",
      sortable: true,
    },
    {
      name: "Latitude",
      selector: (row) => row.latitude || "-",
      sortable: true,
    },
    {
      name: "Longitude",
      selector: (row) => row.longitude || "-",
      sortable: true,
    },
    {
      name: "Status",
      cell: (row) => (
        <Badge
          className={
            row.is_active
              ? "bg-solarized-green/10 text-solarized-green"
              : "bg-solarized-base01/10 text-solarized-base01"
          }
        >
          {row.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
      width: "100px",
    },
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
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDelete(row.id)}
              className="text-solarized-red"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      ignoreRowClick: true,
      width: "80px",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-solarized-base02">
            Office Locations
          </h1>
          <p className="text-solarized-base01">
            Manage company office locations
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-solarized-blue hover:bg-solarized-blue/90"
              onClick={() => {
                setEditingLocation(null);
                resetForm();
                setFieldErrors({});
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingLocation ? "Edit Location" : "Add New Location"}
              </DialogTitle>
              <DialogDescription>
                {editingLocation
                  ? "Update the office location details."
                  : "Add a new office location."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className={fieldErrors.title ? 'text-red-500' : ''}>Location Name *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value });
                      if (fieldErrors.title) setFieldErrors(prev => ({ ...prev, title: '' }));
                    }}
                    placeholder="Enter office name"
                    className={fieldErrors.title ? 'border-red-500' : ''}
                  />
                  {renderError('title')}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className={fieldErrors.address ? 'text-red-500' : ''}>Address *</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => {
                      setFormData({ ...formData, address: e.target.value });
                      if (fieldErrors.address) setFieldErrors(prev => ({ ...prev, address: '' }));
                    }}
                    placeholder="Enter office address"
                    rows={2}
                    className={fieldErrors.address ? 'border-red-500' : ''}
                  />
                  {renderError('address')}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact_phone" className={fieldErrors.contact_phone ? 'text-red-500' : ''}>Contact Phone</Label>
                    <Input
                      id="contact_phone"
                      value={formData.contact_phone}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          contact_phone: e.target.value,
                        });
                        if (fieldErrors.contact_phone) setFieldErrors(prev => ({ ...prev, contact_phone: '' }));
                      }}
                      placeholder="Enter contact number"
                      maxLength={10}

                      className={fieldErrors.contact_phone ? 'border-red-500' : ''}
                    />
                    {renderError('contact_phone')}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_email" className={fieldErrors.contact_email ? 'text-red-500' : ''}>Contact Email</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          contact_email: e.target.value,
                        });
                        if (fieldErrors.contact_email) setFieldErrors(prev => ({ ...prev, contact_email: '' }));
                      }}
                      placeholder="Enter contact email"
                      className={fieldErrors.contact_email ? 'border-red-500' : ''}
                    />
                    {renderError('contact_email')}
                  </div>
                </div>
                <div className="space-y-4 bg-solarized-base3/30 p-4 rounded-lg border border-solarized-base2/50 mt-2">
                  <div className="flex items-center justify-between">
                     <h4 className="text-sm font-semibold text-solarized-base01 uppercase tracking-wider">Geolocation Settings</h4>
                     <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={handleGetCurrentLocation}
                        disabled={isGettingLocation}
                        className="h-8 text-xs bg-white hover:bg-gray-50 border-gray-200 text-solarized-blue shadow-sm"
                     >
                       <MapPin className="h-3.5 w-3.5 mr-1.5" />
                       {isGettingLocation ? "Locating..." : "Use Current Location"}
                     </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="any"
                        value={formData.latitude}
                        onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                        placeholder="e.g. 15.3592"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="any"
                        value={formData.longitude}
                        onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                        placeholder="e.g. 75.1234"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="allowed_radius">Radius (m)</Label>
                      <Input
                        id="allowed_radius"
                        type="number"
                        value={formData.allowed_radius}
                        onChange={(e) => setFormData({ ...formData, allowed_radius: e.target.value })}
                        placeholder="e.g. 100"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-solarized-blue hover:bg-solarized-blue/90"
                >
                  {editingLocation ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="pt-6">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 mb-4">
  {/* Search Input */}
  <div className="relative w-96">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />

    <Input
      className="pl-10"
      placeholder="Search by Department or Office Location..."
      value={searchInput}
      onChange={(e) => setSearchInput(e.target.value)}
    />
  </div>

  {/* Search Button */}
  <Button
    type="submit"
    className="bg-blue-600 hover:bg-blue-700 text-white"
  >
    <Search className="mr-2 h-4 w-4" />
    Search
  </Button>

  {/* Reset Button */}
  <Button
    type="button"
    variant="outline"
    onClick={() => {
      setSearchInput("");
      setSearch("");
      setPage(1);
      // Optional: reload all data
      // fetchDivisions(1, "");
    }}
  >
    Reset
  </Button>
</form>

          <DataTable
            columns={columns}
            data={locations}
            progressPending={isLoading}
            pagination
            paginationServer
            paginationTotalRows={totalRows}
            paginationPerPage={perPage}
            paginationRowsPerPageOptions={[10, 20, 50, 100]}
            onChangePage={handlePageChange}
            onChangeRowsPerPage={handlePerRowsChange}
            highlightOnHover
            responsive
            noDataComponent={
              <div className="text-center py-12">
                <MapPin className="h-12 w-12 text-solarized-base01 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-solarized-base02">
                  No locations found
                </h3>
                <p className="text-solarized-base01 mt-1">
                  Try adjusting your search or add a new location.
                </p>
              </div>
            }
          />
        </CardContent>
      </Card>

      {/* View Location Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-solarized-blue" />
              Office Location Details
            </DialogTitle>
            <DialogDescription>
              View detailed information about the office location.
            </DialogDescription>
          </DialogHeader>
          {viewingLocation && (
            <div className="space-y-6 py-4">
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h3 className="text-xl font-bold text-solarized-base02">{viewingLocation.title}</h3>
                  <Badge className={viewingLocation.is_active ? "bg-solarized-green/10 text-solarized-green mt-2" : "bg-solarized-base01/10 text-solarized-base01 mt-2"}>
                    {viewingLocation.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-solarized-base01 uppercase tracking-wider font-semibold">Address</Label>
                  <p className="text-solarized-base02 bg-solarized-base3/50 p-3 rounded-md border whitespace-pre-wrap">
                    {viewingLocation.address}
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-solarized-base01 uppercase tracking-wider font-semibold">Contact Phone</Label>
                    <div className="flex items-center gap-2 text-solarized-base02">
                      <div className="w-8 h-8 rounded-full bg-solarized-blue/10 flex items-center justify-center">
                        <Phone className="h-4 w-4 text-solarized-blue" />
                      </div>
                      <span>{viewingLocation.contact_phone || "Not provided"}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-solarized-base01 uppercase tracking-wider font-semibold">Contact Email</Label>
                    <div className="flex items-center gap-2 text-solarized-base02">
                      <div className="w-8 h-8 rounded-full bg-solarized-purple/10 flex items-center justify-center">
                        <Mail className="h-4 w-4 text-solarized-purple" />
                      </div>
                      <span className="truncate">{viewingLocation.contact_email || "Not provided"}</span>
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4 pt-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-solarized-base01 uppercase tracking-wider font-semibold">Latitude</Label>
                    <p className="text-solarized-base02 font-medium">{viewingLocation.latitude || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-solarized-base01 uppercase tracking-wider font-semibold">Longitude</Label>
                    <p className="text-solarized-base02 font-medium">{viewingLocation.longitude || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-solarized-base01 uppercase tracking-wider font-semibold">Allowed Radius</Label>
                    <p className="text-solarized-base02 font-medium">{viewingLocation.allowed_radius ? `${viewingLocation.allowed_radius}m` : "-"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            {/* {viewingLocation && (
              <Button 
                className="bg-solarized-blue hover:bg-solarized-blue/90"
                onClick={() => {
                  setIsViewDialogOpen(false);
                  handleEdit(viewingLocation);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Location
              </Button>
            )} */}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
