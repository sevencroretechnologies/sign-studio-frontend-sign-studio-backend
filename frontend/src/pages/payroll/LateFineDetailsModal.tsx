import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';

interface LateFineDetail {
  date: string;
  late_minutes: number;
  penalty_amount: number;
  note: string;
}

interface LateFineDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeName: string;
  details: LateFineDetail[];
}

export default function LateFineDetailsModal({ isOpen, onClose, employeeName, details }: LateFineDetailsModalProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount || 0);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      weekday: 'short'
    }).format(d);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            {employeeName} <span className="text-gray-400 font-normal">| Late Fine Details</span>
          </DialogTitle>
          <DialogDescription>
            Detailed breakdown of late coming fines and waived off days.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-600">Date</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Late By</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Amount</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Status / Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {details && details.length > 0 ? (
                details.map((item, idx) => {
                  const isWaived = item.note.toLowerCase().includes('waive');
                  return (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{formatDate(item.date)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-700">{item.late_minutes} mins</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{formatCurrency(item.penalty_amount)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isWaived ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {item.note}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500 italic">
                    No late fines recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
