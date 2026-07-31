import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useGeolocated } from 'react-geolocated';
import { attendanceService, leaveService } from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { Alert, AlertDescription } from '../../components/ui/alert';
import {
  Clock,
  Calendar,
  LogIn,
  LogOut,
  User,
  IndianRupee,
  FileText,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Timer,
  MapPin,
  MapPinned,
  Camera,
  X,
  RefreshCcw,
} from 'lucide-react';

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
  staff_member_id: number | null;
  organization_name?: string;
  company_name?: string;
}

interface CurrentStatus {
  status: string;
  clock_in: string | null;
  clock_out: string | null;
  total_hours: number | null;
  late_minutes?: number;
  notes?: string;
  on_leave?: boolean;
  leave_details?: {
    category?: {
      title: string;
    };
  };
}

interface LeaveBalance {
  category_id: number;
  category_name: string;
  allocated: number;
  used: number;
  remaining: number;
}

interface RecentLeaveRequest {
  id: number;
  start_date: string;
  end_date: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  reason?: string;
}

const formatTimeString = (timeString: string | null | undefined) => {
  if (!timeString) return '--:--';

  try {
    // Check if it's a datetime string from backend
    // Format: "YYYY-MM-DD HH:MM:SS" or ISO format
    if (timeString.includes(' ') || timeString.includes('T')) {
      // Replace space with T for valid ISO string. No 'Z' added, parses as local time.
      const isoString = (timeString.includes('T') ? timeString : timeString.replace(' ', 'T'));
      const date = new Date(isoString);

      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    }

    // Handle time-only strings (fallback for legacy format)
    const timeParts = timeString.split(':');

    if (timeParts.length >= 2) {
      const hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10);
      const seconds = timeParts.length >= 3 ? parseInt(timeParts[2], 10) : 0;

      // Format as HH:MM:SS AM/PM
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12; // Convert 0 to 12
      const displayMinutes = minutes.toString().padStart(2, '0');
      const displaySeconds = seconds.toString().padStart(2, '0');

      return `${displayHours}:${displayMinutes}:${displaySeconds} ${period}`;
    }

    // If we can't parse it, return the original string
    return timeString;
  } catch (error) {
    console.error('Error formatting time:', error, timeString);
    return timeString;
  }
};

export default function StaffDashboard() {
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [currentStatus, setCurrentStatus] = useState<CurrentStatus | null>(null);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [recentRequests, setRecentRequests] = useState<RecentLeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isLoadingLeave, setIsLoadingLeave] = useState(false);
  const [isClocking, setIsClocking] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Camera states
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const { coords, isGeolocationAvailable, isGeolocationEnabled, getPosition } = useGeolocated({
    positionOptions: {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    },
    watchPosition: false,
    userDecisionTimeout: 10000,
  });

  useEffect(() => {
    const loadUserData = () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userData: UserData = JSON.parse(userStr);
          setCurrentUser(userData);
        }
      } catch (error) {
        console.error('Failed to parse user data:', error);
      }
    };

    loadUserData();
    setIsLoading(false);

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchCurrentStatus = async () => {
      setIsLoadingStatus(true);
      try {
        const response = await attendanceService.getCurrentStatusSelf();
        setCurrentStatus(response.data.data);
      } catch (error) {
        console.error('Failed to fetch current status:', error);
        setCurrentStatus({
          status: 'not_clocked_in',
          clock_in: null,
          clock_out: null,
          total_hours: null,
        });
      } finally {
        setIsLoadingStatus(false);
      }
    };

    fetchCurrentStatus();
  }, [currentUser]);

  useEffect(() => {
    const fetchLeaveData = async () => {
      setIsLoadingLeave(true);
      try {
        const balancesRes = await leaveService.getMyBalances();
        if (balancesRes.data.success) {
          setLeaveBalances(balancesRes.data.data || []);
        }

        const requestsRes = await leaveService.getMyRequests({ per_page: 5 });
        if (requestsRes.data.success) {
          setRecentRequests(requestsRes.data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch leave data:', error);
      } finally {
        setIsLoadingLeave(false);
      }
    };

    fetchLeaveData();
  }, [currentUser]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });
      setStream(mediaStream);
      setIsCameraOpen(true);
      setCapturedImage(null);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setMessage({ type: 'error', text: 'Unable to access camera. Please check permissions.' });
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  }, [stream]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageDataUrl);
        stopCamera();
      }
    }
  };

  // Re-attach stream when video element becomes available
  useEffect(() => {
    if (isCameraOpen && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [isCameraOpen, stream]);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const handleClockIn = async () => {
    setIsClocking(true);
    setMessage(null);

    if (!isGeolocationAvailable) {
      setMessage({ type: 'error', text: 'Geolocation is not supported by your browser.' });
      setIsClocking(false);
      return;
    }

    if (!isGeolocationEnabled) {
      setMessage({ type: 'error', text: 'Please enable location services to clock in.' });
      setIsClocking(false);
      return;
    }

    if (!coords) {
      getPosition();
      setMessage({ type: 'error', text: 'Fetching your location... Please try again in a moment.' });
      setIsClocking(false);
      return;
    }

    try {
      const locationData = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        ...(capturedImage ? { image: capturedImage } : {})
      };
      const response = await attendanceService.clockInSelf(locationData);
      setCurrentStatus(response.data.data);
      setMessage({
        type: 'success',
        text: `Successfully clocked in! Location captured.`
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to clock in';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsClocking(false);
    }
  };

  const handleClockOut = async () => {
    setIsClocking(true);
    setMessage(null);

    if (!isGeolocationAvailable) {
      setMessage({ type: 'error', text: 'Geolocation is not supported by your browser.' });
      setIsClocking(false);
      return;
    }

    if (!isGeolocationEnabled) {
      setMessage({ type: 'error', text: 'Please enable location services to clock out.' });
      setIsClocking(false);
      return;
    }

    if (!coords) {
      getPosition();
      setMessage({ type: 'error', text: 'Fetching your location... Please try again in a moment.' });
      setIsClocking(false);
      return;
    }

    try {
      const locationData = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        ...(capturedImage ? { image: capturedImage } : {})
      };
      const response = await attendanceService.clockOutSelf(locationData);
      setCurrentStatus(response.data.data);
      setMessage({
        type: 'success',
        text: `Successfully clocked out! Location captured.`
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to clock out';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsClocking(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTotalHours = (totalHours: number | string | null | undefined) => {
    if (!totalHours || totalHours === 0) return '0h 0m';

    const hours = typeof totalHours === 'string' ? parseFloat(totalHours) : totalHours;
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);

    if (h === 0 && m === 0) return '0h 0m';
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const formatLateMinutes = (lateMinutes: number | string | null | undefined) => {
    if (!lateMinutes || Number(lateMinutes) <= 0) return '0m';

    const totalMinutes = Math.round(typeof lateMinutes === 'string' ? parseFloat(lateMinutes) : lateMinutes);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;

    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const hasStaffMember = !!currentUser?.staff_member_id;

  // Determine if clock-in is disabled
  const isClockInDisabled = () => {
    if (isLoading || isClocking) return true;
    if (currentStatus?.on_leave) return true;
    if (currentStatus?.status === 'clocked_in') return true;
    return false;
  };

  // Determine if clock-out is disabled
  const isClockOutDisabled = () => {
    if (isLoading || isClocking) return true;
    if (currentStatus?.on_leave) return true;
    if (currentStatus?.status !== 'clocked_in') return true;
    return false;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-slate-100 dark:border-slate-800">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-[#111827] border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Welcome back, {currentUser?.name}!
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {hasStaffMember ? "Here's your work time summary and tasks." : "Manage your personal HR settings."}
          </p>
        </div>
        <div className="text-left md:text-right flex items-center md:justify-end gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-405 flex items-center justify-center flex-shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatTime(currentTime)}</div>
            <div className="text-xs text-slate-400 font-medium">{formatDate(currentTime)}</div>
          </div>
        </div>
      </div>

      {message && (
        <Alert className={`rounded-xl ${message.type === 'error' ? 'border-red-500/20 bg-red-500/10 text-red-500' : 'border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400'}`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription className="text-xs font-semibold">{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Geolocation attendance panel */}
      {hasStaffMember && (
        <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm">
          <CardHeader>
            <CardTitle className="text-md font-bold">Record Attendance</CardTitle>
            <CardDescription className="text-xs">
              {currentStatus?.on_leave ? (
                <span className="text-blue-500">You are on approved leave today</span>
              ) : currentStatus?.status === 'holiday' ? (
                <div className="text-indigo-600 dark:text-indigo-400 font-bold text-sm mt-1 mb-2 bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-lg border border-indigo-100 dark:border-indigo-800/30 inline-block">
                  🎉 {currentStatus.notes || 'Today is a Company Holiday. You can still clock in if required.'}
                </div>
              ) : (
                currentStatus?.status === 'clocked_out'
                  ? 'Your attendance has been recorded for today.'
                  : 'Punch your timings using geo-location capture'
              )}
            </CardDescription>
          </CardHeader>
          
          {currentStatus?.status !== 'clocked_out' && !currentStatus?.on_leave && (
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <div className={`p-2 rounded-lg ${coords ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    <MapPinned className="h-5 w-5" />
                  </div>
                  <div className="text-xs">
                    <p className="font-semibold text-slate-700 dark:text-slate-200">
                      {coords ? "Location Acquired" : "Acquiring Location..."}
                    </p>
                    <p className="text-slate-450 mt-0.5">
                      {isGeolocationAvailable && isGeolocationEnabled && !coords && "Obtaining accurate GPS coordinates from your device..."}
                      {coords && `Location captured successfully. (GPS Signal Variance: ±${coords.accuracy.toFixed(0)} meters. Note: This indicates signal strength.)`}
                      {!isGeolocationAvailable && "GPS is not supported by your browser."}
                      {isGeolocationAvailable && !isGeolocationEnabled && "GPS is blocked. Please allow browser location permissions."}
                    </p>
                  </div>
                </div>

                {/* Selfie Camera Section */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Camera className="h-4 w-4 text-slate-500" />
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Selfie Verification (Optional)</span>
                    </div>
                    {capturedImage && (
                      <Button variant="ghost" size="sm" onClick={() => setCapturedImage(null)} className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-50">
                        <X className="h-3.5 w-3.5 mr-1" /> Remove
                      </Button>
                    )}
                  </div>

                  {!isCameraOpen && !capturedImage && (
                    <Button 
                      variant="outline" 
                      onClick={startCamera}
                      className="w-full border-dashed border-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Turn on Camera
                    </Button>
                  )}

                  {isCameraOpen && (
                    <div className="space-y-3">
                      <div className="relative rounded-lg overflow-hidden bg-black aspect-video flex items-center justify-center">
                        <video 
                          ref={videoRef} 
                          autoPlay 
                          playsInline 
                          muted 
                          className="w-full h-full object-cover"
                        />
                        <canvas ref={canvasRef} className="hidden" />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={capturePhoto} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                          <Camera className="h-4 w-4 mr-2" /> Capture
                        </Button>
                        <Button variant="outline" onClick={stopCamera} className="flex-none text-slate-500">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {capturedImage && (
                    <div className="relative rounded-lg overflow-hidden aspect-video bg-black flex items-center justify-center">
                      <img src={capturedImage} alt="Captured Selfie" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end justify-center pb-3">
                        <Button size="sm" variant="secondary" onClick={startCamera} className="text-xs">
                          <RefreshCcw className="h-3.5 w-3.5 mr-1" /> Retake
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  {currentStatus?.status !== 'clocked_in' && (
                    <Button
                      onClick={handleClockIn}
                      disabled={isClockInDisabled() || !coords}
                      className="flex-1 py-6 text-md font-semibold bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-sm"
                    >
                      <LogIn className="mr-2 h-5 w-5" />
                      {isClocking ? 'Processing In...' : 'Clock In Now'}
                    </Button>
                  )}
                  {currentStatus?.status === 'clocked_in' && (
                    <Button
                      onClick={handleClockOut}
                      disabled={isClockOutDisabled() || !coords}
                      className="flex-1 py-6 text-md font-semibold bg-red-500 hover:bg-red-650 text-white rounded-xl shadow-sm"
                    >
                      <LogOut className="mr-2 h-5 w-5" />
                      {isClocking ? 'Processing Out...' : 'Clock Out Now'}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          )}

          {currentStatus?.status === 'clocked_out' && !currentStatus?.on_leave && (
            <CardContent>
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-slate-800 dark:text-slate-100">Attendance Completed for Today</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">You have successfully recorded your clock in and clock out for today.</p>
              </div>
            </CardContent>
          )}

          {currentStatus?.on_leave && (
            <CardContent>
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-slate-800 dark:text-slate-100">On Approved Leave</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Clock in/out functionality is disabled for today.</p>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Grid structure details */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
        {/* Today status */}
        <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-404 flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Attendance</p>
              <h3 className="text-lg font-bold mt-0.5 capitalize">
                {currentStatus?.status === 'clocked_in' ? 'Clocked In' : 
                 currentStatus?.status === 'clocked_out' ? 'Clocked Out' : 
                 currentStatus?.status === 'holiday' ? 'Holiday' : 
                 'Not Clocked In'}
              </h3>
            </div>
          </CardContent>
        </Card>

        {/* Clock In Time */}
        <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-404 flex items-center justify-center">
              <LogIn className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Clock In</p>
              <h3 className="text-lg font-bold mt-0.5">{formatTimeString(currentStatus?.clock_in) || '--:--'}</h3>
            </div>
          </CardContent>
        </Card>

        {/* Clock Out Time */}
        <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-404 flex items-center justify-center">
              <LogOut className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Clock Out</p>
              <h3 className="text-lg font-bold mt-0.5">{formatTimeString(currentStatus?.clock_out) || '--:--'}</h3>
            </div>
          </CardContent>
        </Card>

        {/* Hours today */}
        <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-404 flex items-center justify-center">
              <Timer className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Hours</p>
              <h3 className="text-lg font-bold mt-0.5">{formatTotalHours(currentStatus?.total_hours)}</h3>
            </div>
          </CardContent>
        </Card>

        {/* Late Hours */}
        <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-500 flex items-center justify-center">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Late</p>
              <h3 className="text-lg font-bold mt-0.5">{formatLateMinutes(currentStatus?.late_minutes)}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave details & recent requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-md font-bold">Leave Balances</CardTitle>
              <CardDescription className="text-xs">Your segmented leave allocations</CardDescription>
            </div>
            <Link to="/leave/my-balances">
              <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400 text-xs hover:bg-slate-50 dark:hover:bg-slate-800">
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoadingLeave ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, idx) => <Skeleton key={idx} className="h-10 w-full rounded-lg" />)}
              </div>
            ) : leaveBalances.length > 0 ? (
              <div className="space-y-2">
                {leaveBalances.slice(0, 4).map((balance) => (
                  <div key={balance.category_id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                    <div>
                      <p className="font-semibold text-sm">{balance.category_name}</p>
                      <p className="text-3xs text-slate-400 mt-0.5">Allocated: {Math.floor(balance.allocated)} | Used: {Math.floor(balance.used)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-md font-bold text-blue-600 dark:text-blue-400">{Math.floor(balance.remaining)}</p>
                      <p className="text-3xs text-slate-450">days left</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-400 font-medium">No leave balances found.</div>
            )}
          </CardContent>
        </Card>

        {/* Recent leave applications */}
        <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-md font-bold">Recent Requests</CardTitle>
              <CardDescription className="text-xs">Track status of your applications</CardDescription>
            </div>
            <Link to="/leave/requests">
              <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400 text-xs hover:bg-slate-50 dark:hover:bg-slate-800">
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoadingLeave ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, idx) => <Skeleton key={idx} className="h-12 w-full rounded-lg" />)}
              </div>
            ) : recentRequests.length > 0 ? (
              <div className="space-y-2">
                {recentRequests.slice(0, 4).map((request) => (
                  <div key={request.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      request.approval_status === 'approved' ? 'bg-green-500/10 text-green-500' :
                      request.approval_status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                      'bg-red-500/10 text-red-500'
                    }`}>
                      {request.approval_status === 'approved' ? <CheckCircle className="h-4.5 w-4.5" /> :
                       request.approval_status === 'pending' ? <Clock className="h-4.5 w-4.5" /> :
                       <AlertCircle className="h-4.5 w-4.5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-center text-xs">
                        <p className="font-semibold capitalize">{request.approval_status}</p>
                        <p className="text-3xs text-slate-450">{new Date(request.start_date).toLocaleDateString()}</p>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{request.reason || "No reason specified"}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-450">
                No leave requests found. Apply for one below.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick features Grid */}
      <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-md font-bold">Quick Shortcuts</CardTitle>
          <CardDescription className="text-xs">Instant access to standard operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Link to="/leave/apply">
              <Button variant="outline" className="w-full py-5 flex flex-col items-center justify-center gap-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-slate-100 dark:border-slate-800">
                <Calendar className="h-5 w-5 text-green-500" />
                <span className="text-xs font-semibold">Request Off</span>
              </Button>
            </Link>
            <Link to="/leave/my-balances">
              <Button variant="outline" className="w-full py-5 flex flex-col items-center justify-center gap-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-slate-100 dark:border-slate-800">
                <FileText className="h-5 w-5 text-amber-500" />
                <span className="text-xs font-semibold">Leave stats</span>
              </Button>
            </Link>
            <Link to="/payroll/my-slips">
              <Button variant="outline" className="w-full py-5 flex flex-col items-center justify-center gap-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-slate-100 dark:border-slate-800">
                <IndianRupee className="h-5 w-5 text-indigo-500" />
                <span className="text-xs font-semibold">Salary Slips</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
