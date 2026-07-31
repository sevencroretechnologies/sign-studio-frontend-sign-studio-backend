import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Save, Loader2, Clock, AlertCircle } from 'lucide-react';
import { showAlert } from '@/lib/sweetalert';
import api from '@/services/api';

interface LateComingPolicy {
  allowed_late_days: number;
  grace_period_mins: number;
  deduction_type: string;
  third_day_penalty_percentage: number;
}

export default function PenaltyOvertimeDetails() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [policy, setPolicy] = useState<LateComingPolicy>({
    allowed_late_days: 2,
    grace_period_mins: 10,
    deduction_type: 'fixed_hourly_rate',
    third_day_penalty_percentage: 50,
  });

  useEffect(() => {
    fetchPolicy();
  }, []);

  const fetchPolicy = async () => {
    try {
      const res = await api.get('/attendance/late-coming-policy');
      if (res.data.success && res.data.data) {
        setPolicy(res.data.data);
      }
    } catch (err) {
      showAlert('error', 'Error', 'Failed to load late coming policy');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.post('/attendance/late-coming-policy', policy);
      if (res.data.success) {
        showAlert('success', 'Success', 'Late coming policy updated successfully!');
      }
    } catch (err) {
      showAlert('error', 'Error', 'Failed to save policy');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
      <Card className="border-0 shadow-lg rounded-xl overflow-hidden bg-white/50 backdrop-blur-sm dark:bg-slate-900/50">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-6">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                Late Coming Policy
              </CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                Configure how late arrivals are handled and penalized.
              </p>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-md rounded-xl text-sm px-6 h-10 transition-all hover:shadow-lg flex gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Policy
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="max-w-2xl space-y-8">
            
            {/* Allowed Late Days */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Allowed Late Days (Waived Off)
              </Label>
              <Input
                type="number"
                min={0}
                value={policy.allowed_late_days}
                onChange={(e) => setPolicy({...policy, allowed_late_days: parseInt(e.target.value) || 0})}
                className="max-w-md h-11 bg-slate-50/50 rounded-xl"
              />
              <p className="text-xs text-slate-500 flex gap-1.5 items-center">
                <AlertCircle className="w-3.5 h-3.5" />
                Number of days late arrivals are forgiven before penalties apply.
              </p>
            </div>

            {/* Grace Period */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Only deduct if late by more than (minutes)
              </Label>
              <Input
                type="number"
                min={0}
                value={policy.grace_period_mins}
                onChange={(e) => setPolicy({...policy, grace_period_mins: parseInt(e.target.value) || 0})}
                className="max-w-md h-11 bg-slate-50/50 rounded-xl"
              />
              <p className="text-xs text-slate-500">
                Grace period in minutes (e.g. 10 mins).
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">
                Deduction Rules (After Waived Days)
              </h3>
              
              <div className="space-y-6">
                <RadioGroup 
                  value={policy.deduction_type} 
                  onValueChange={(val) => setPolicy({...policy, deduction_type: val})}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-blue-100 bg-blue-50/30 dark:border-blue-900/30 dark:bg-blue-900/10">
                    <RadioGroupItem value="fixed_hourly_rate" id="r1" className="text-blue-600" />
                    <Label htmlFor="r1" className="cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                      Standard Late Minutes × Hourly Rate Deduction
                    </Label>
                  </div>
                </RadioGroup>

                {/* 3rd Day Extra Penalty (n%) */}
                <div className="p-5 rounded-xl border border-amber-100 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-900/10 space-y-4">
                  <div>
                    <Label className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <span className="bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">New</span>
                      Extra Penalty for exactly the {policy.allowed_late_days + 1}rd Late Day
                    </Label>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Configure a dynamic percentage of the employee's Daily Salary to be added as an extra fine on their {policy.allowed_late_days + 1}rd late day.
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="relative max-w-[150px]">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={policy.third_day_penalty_percentage}
                        onChange={(e) => setPolicy({...policy, third_day_penalty_percentage: parseInt(e.target.value) || 0})}
                        className="h-11 pr-8 bg-white dark:bg-slate-800 rounded-xl border-amber-200 dark:border-amber-800/50 focus-visible:ring-amber-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">%</span>
                    </div>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      of Daily Salary
                    </span>
                  </div>
                  
                  <div className="text-xs text-slate-500 bg-white/60 dark:bg-slate-900/40 p-3 rounded-lg border border-amber-100/50 dark:border-amber-900/20">
                    <strong className="text-amber-700 dark:text-amber-400">Example:</strong> If set to 50%, an employee making 100Rs/day will be fined an extra 50Rs on their {policy.allowed_late_days + 1}rd late day.
                  </div>
                </div>

              </div>
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}
