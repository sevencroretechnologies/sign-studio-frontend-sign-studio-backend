import { X, Printer } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { ScrollArea } from '../../components/ui/scroll-area';

interface SalarySlip {
  id: number;
  slip_reference: string;
  salary_period: string;
  basic_salary: string;
  attendance_summary?: {
    total_working_days?: number;
    present_days?: number;
    absent_days?: number;
    half_days?: number;
    paid_leave_days?: number;
    unpaid_leave_days?: number;
    holidays?: number;
    double_present?: number;
    total_hours?: number;
    late_minutes?: number;
    early_leave_minutes?: number;
    overtime_minutes?: number;
    break_minutes?: number;
    lop_days?: number;
    late_days?: number;
  };
  benefits_breakdown: Array<{ name: string; amount: string }>;
  deductions_breakdown: Array<{ name: string; amount: string }>;
  total_earnings: string;
  total_deductions: string;
  net_payable: string;
  status: string;
  generated_at: string;
  paid_at: string | null;
  staff_member: {
    full_name: string;
    staff_code: string;
    personal_email: string | null;
    mobile_number: string | null;
    bank_account_name: string | null;
    bank_account_number: string | null;
    bank_name: string | null;
    job_title?: {
      title: string;
    };
    division?: {
      title: string;
    };
    company?: {
      name: string;
    };
  };
}

interface SalarySlipModalProps {
  slip: SalarySlip | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function SalarySlipModal({ slip, isOpen, onClose }: SalarySlipModalProps) {
  if (!isOpen || !slip) return null;

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(num || 0);
  };

  const getMonthYear = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const paidAmount = slip.status === 'paid' ? parseFloat(slip.net_payable) : 0;
  const pendingAmount = parseFloat(slip.net_payable) - paidAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:p-0 print:bg-white">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm print:hidden"
        onClick={onClose}
      />

      {/* Modal / Print Container */}
      <div className="relative bg-white shadow-xl w-full max-w-[800px] h-[90vh] print:h-auto print:shadow-none print:w-full overflow-hidden z-10 flex flex-col rounded-lg print:rounded-none">
        
        {/* Modal Controls (Hidden in Print) */}
        <div className="flex items-center justify-end p-4 border-b flex-shrink-0 print:hidden bg-gray-50">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint} className="flex items-center gap-2">
              <Printer className="h-4 w-4" /> Print / PDF
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Scrollable Printable Area */}
        <ScrollArea className="flex-grow overflow-y-auto print:overflow-visible">
          <div className="p-8 print:p-0 text-black font-sans">
            
            {/* Document Header */}
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-black uppercase tracking-wider text-gray-800">
                SignStudio
              </h1>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  SignStudio Beautifying Businesses
                </p>
              </div>
            </div>

            {/* Title Box */}
            <div className="bg-[#f0f4f8] py-2 px-4 mb-6 text-center rounded border border-gray-200">
              <h2 className="text-lg font-bold text-gray-800 uppercase">
                Pay Slip for {getMonthYear(slip.salary_period)}
              </h2>
            </div>

            {/* Employee Details Table */}
            <div className="mb-6 border border-gray-300 rounded overflow-hidden">
              <div className="bg-gray-100 font-bold px-4 py-2 border-b border-gray-300 text-sm">
                Employee Details
              </div>
              <div className="grid grid-cols-2 divide-x divide-gray-300">
                <div className="grid grid-cols-[120px_1fr] divide-x divide-gray-300 text-sm">
                  <div className="px-3 py-2 text-gray-600">Employee Name</div>
                  <div className="px-3 py-2 font-semibold">{slip.staff_member.full_name}</div>
                  <div className="px-3 py-2 border-t border-gray-300 text-gray-600">Phone Number</div>
                  <div className="px-3 py-2 border-t border-gray-300 font-semibold">{slip.staff_member.mobile_number || 'N/A'}</div>
                </div>
                <div className="grid grid-cols-[120px_1fr] divide-x divide-gray-300 text-sm">
                  <div className="px-3 py-2 text-gray-600">Salary Amount</div>
                  <div className="px-3 py-2 font-semibold">{formatCurrency(slip.basic_salary)}</div>
                  <div className="px-3 py-2 border-t border-gray-300 text-gray-600">Branch</div>
                  <div className="px-3 py-2 border-t border-gray-300 font-semibold">{slip.staff_member.division?.title || 'Main Office'}</div>
                </div>
              </div>
            </div>

            {/* Salary Calculations Table */}
            <div className="mb-6 border border-gray-300 rounded overflow-hidden">
              <div className="bg-gray-100 font-bold px-4 py-2 border-b border-gray-300 text-sm">
                Salary Calculations
              </div>
              <div className="grid grid-cols-2 divide-x divide-gray-300">
                {/* Earnings Column */}
                <div className="flex flex-col h-full">
                  <div className="grid grid-cols-[1fr_100px] divide-x divide-gray-300 border-b border-gray-300 text-sm font-semibold bg-gray-50">
                    <div className="px-3 py-2">EARNINGS</div>
                    <div className="px-3 py-2 text-right">AMOUNT</div>
                  </div>
                  <div className="flex-grow text-sm">
                    <div className="grid grid-cols-[1fr_100px] divide-x divide-gray-300 border-b border-gray-100">
                      <div className="px-3 py-2 text-gray-700">Basic Salary</div>
                      <div className="px-3 py-2 text-right">{formatCurrency(slip.basic_salary)}</div>
                    </div>
                    {slip.benefits_breakdown?.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr_100px] divide-x divide-gray-300 border-b border-gray-100">
                        <div className="px-3 py-2 text-gray-700">{item.name}</div>
                        <div className="px-3 py-2 text-right">{formatCurrency(item.amount)}</div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-[1fr_100px] divide-x divide-gray-300 border-t border-gray-300 text-sm font-bold bg-green-50">
                    <div className="px-3 py-2 text-green-800">Total Earnings</div>
                    <div className="px-3 py-2 text-right text-green-800">{formatCurrency(slip.total_earnings)}</div>
                  </div>
                </div>
                {/* Deductions Column */}
                <div className="flex flex-col h-full">
                  <div className="grid grid-cols-[1fr_100px] divide-x divide-gray-300 border-b border-gray-300 text-sm font-semibold bg-gray-50">
                    <div className="px-3 py-2">DEDUCTIONS</div>
                    <div className="px-3 py-2 text-right">AMOUNT</div>
                  </div>
                  <div className="flex-grow text-sm">
                    {slip.deductions_breakdown?.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr_100px] divide-x divide-gray-300 border-b border-gray-100">
                        <div className="px-3 py-2 text-gray-700">{item.name}</div>
                        <div className="px-3 py-2 text-right">{formatCurrency(item.amount)}</div>
                      </div>
                    ))}
                    {(!slip.deductions_breakdown || slip.deductions_breakdown.length === 0) && (
                      <div className="px-3 py-2 text-gray-400 italic">No deductions</div>
                    )}
                  </div>
                  <div className="grid grid-cols-[1fr_100px] divide-x divide-gray-300 border-t border-gray-300 text-sm font-bold bg-red-50 mt-auto">
                    <div className="px-3 py-2 text-red-800">Total Deductions</div>
                    <div className="px-3 py-2 text-right text-red-800">{formatCurrency(slip.total_deductions)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Salary Summary Table */}
            <div className="mb-8 border border-gray-300 rounded overflow-hidden">
              <div className="grid grid-cols-3 divide-x divide-gray-300 text-center">
                <div className="bg-blue-50 py-3">
                  <div className="text-sm font-semibold text-gray-600 mb-1">Net Salary</div>
                  <div className="text-xl font-bold text-blue-900">{formatCurrency(slip.net_payable)}</div>
                </div>
                <div className="bg-green-50 py-3">
                  <div className="text-sm font-semibold text-gray-600 mb-1">Paid Amount</div>
                  <div className="text-xl font-bold text-green-700">{formatCurrency(paidAmount)}</div>
                </div>
                <div className="bg-orange-50 py-3">
                  <div className="text-sm font-semibold text-gray-600 mb-1">Pending Salary</div>
                  <div className="text-xl font-bold text-orange-700">{formatCurrency(pendingAmount)}</div>
                </div>
              </div>
            </div>

            {/* Attendance & Time (Side-by-side if Attendance exists) */}
            {slip.attendance_summary && (
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                
                {/* Attendance Summary */}
                <div className="border border-gray-300 rounded overflow-hidden">
                  <div className="bg-gray-100 font-bold px-4 py-2 border-b border-gray-300 text-sm uppercase">
                    Attendance Summary
                  </div>
                  <div className="grid grid-cols-2 text-sm divide-x divide-gray-200">
                    <div className="divide-y divide-gray-200">
                      <div className="flex justify-between px-3 py-2 bg-white">
                        <span className="text-gray-600">Present</span>
                        <span className="font-semibold text-green-600">{slip.attendance_summary.present_days ?? 0}</span>
                      </div>
                      <div className="flex justify-between px-3 py-2 bg-white">
                        <span className="text-gray-600">Half Days</span>
                        <span className="font-semibold text-yellow-600">{slip.attendance_summary.half_days ?? 0}</span>
                      </div>
                      <div className="flex justify-between px-3 py-2 bg-white">
                        <span className="text-gray-600">Double Present</span>
                        <span className="font-semibold text-purple-600">{slip.attendance_summary.double_present ?? 0}</span>
                      </div>
                      <div className="flex justify-between px-3 py-2 bg-white">
                        <span className="text-gray-600">Holidays</span>
                        <span className="font-semibold text-blue-600">{slip.attendance_summary.holidays ?? 0}</span>
                      </div>
                    </div>
                    <div className="divide-y divide-gray-200">
                      <div className="flex justify-between px-3 py-2 bg-white">
                        <span className="text-gray-600">Absent</span>
                        <span className="font-semibold text-red-600">{slip.attendance_summary.absent_days ?? 0}</span>
                      </div>
                      <div className="flex justify-between px-3 py-2 bg-white">
                        <span className="text-gray-600">Paid Leaves</span>
                        <span className="font-semibold text-blue-600">{slip.attendance_summary.paid_leave_days ?? 0}</span>
                      </div>
                      <div className="flex justify-between px-3 py-2 bg-white">
                        <span className="text-gray-600">Unpaid Leaves</span>
                        <span className="font-semibold text-orange-600">{slip.attendance_summary.unpaid_leave_days ?? 0}</span>
                      </div>
                      <div className="flex justify-between px-3 py-2 bg-white">
                        <span className="text-gray-600 font-semibold">Total Days</span>
                        <span className="font-bold text-gray-900">{slip.attendance_summary.total_working_days ?? 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Time Summary */}
                <div className="border border-gray-300 rounded overflow-hidden">
                  <div className="bg-gray-100 font-bold px-4 py-2 border-b border-gray-300 text-sm uppercase">
                    Time
                  </div>
                  <div className="flex justify-around items-center p-6 bg-white">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-800">{Math.floor(slip.attendance_summary.total_hours || 0)}h</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">Hours Worked</div>
                    </div>
                    <div className="w-px h-12 bg-gray-200"></div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-800">{Math.floor((slip.attendance_summary.overtime_minutes || 0) / 60)}h</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">Overtime</div>
                    </div>
                    <div className="w-px h-12 bg-gray-200"></div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-800">{Math.floor((slip.attendance_summary.late_minutes || 0) / 60)}h {((slip.attendance_summary.late_minutes || 0) % 60)}m</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">Late Time</div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Footer */}
            <div className="mt-8 border-t border-gray-200 pt-4 flex justify-between items-center text-xs text-gray-400">
              <div>Generated using SignStudio Payroll System</div>
              <div>Report Date: {new Date().toLocaleString()}</div>
            </div>

          </div>
        </ScrollArea>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:bg-white {
            background-color: white !important;
          }
          .fixed.inset-0.z-50 {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .fixed.inset-0.z-50 > div:last-child {
            visibility: visible;
          }
          .fixed.inset-0.z-50 > div:last-child * {
            visibility: visible;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}} />
    </div>
  );
}