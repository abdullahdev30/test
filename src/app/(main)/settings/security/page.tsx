"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  AlertCircle, Laptop, Smartphone, X, Check,
  Lock, Loader2, Eye, EyeOff, ShieldCheck
} from "lucide-react";
import { useRouter } from "next/navigation";
import { changePassword, setPassword } from "@/lib/api/auth";
import { getSessions, revokeSession, logoutAll } from "@/lib/api/user";

export default function SecuritySettingsPage() {
  const router = useRouter();
  const [passwordMode, setPasswordMode] = useState<'change' | 'set' | null>(null);
  const [isSaving, startSaveTransition] = useTransition();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [sessions, setSessions] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const result = await getSessions();
      setSessions(result.sessions as Record<string, unknown>[]);
    } catch {
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => { fetchSessions(); }, []);

  const handlePasswordSubmit = () => {
    if (passwordForm.new !== passwordForm.confirm) {
      setError("Passwords do not match");
      return;
    }
    setError(null);
    startSaveTransition(async () => {
      const result = passwordMode === 'change'
        ? await changePassword({
          currentPassword: passwordForm.current,
          newPassword: passwordForm.new,
          confirmPassword: passwordForm.confirm,
        })
        : await setPassword({
          password: passwordForm.new,
          confirmPassword: passwordForm.confirm,
        });

      if (result.success) {
        setPasswordMode(null);
        setPasswordForm({ current: "", new: "", confirm: "" });
        setShowSuccessModal(true);
      } else {
        setError(result.error ?? "Operation failed");
      }
    });
  };

  const handleRevokeSession = (id: string) => {
    startSaveTransition(async () => {
      const result = await revokeSession(id);
      if (result.success) {
        setSessions((prev) => prev.filter((s) => (s as { id: string }).id !== id));
      } else {
        setError(result.error ?? "Failed to revoke session");
      }
    });
  };

  const handleLogoutAll = () => {
    startSaveTransition(async () => {
      await logoutAll();
      router.push('/login');
    });
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-4 animate-in fade-in duration-500">
      {showSuccessModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-bg-primary rounded-[32px] p-10 shadow-2xl border border-text-secondary/10 max-w-[340px] w-full text-center">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6"><Check size={32} /></div>
            <h3 className="text-2xl font-black text-text-primary mb-2">Success!</h3>
            <p className="text-sm text-text-secondary mb-8">Security settings updated.</p>
            <button onClick={() => setShowSuccessModal(false)} className="w-full py-4 bg-primary text-white font-black rounded-2xl text-sm uppercase">Continue</button>
          </div>
        </div>
      )}

      {/* Password Management Card */}
      <div className="bg-bg-primary rounded-[40px] border border-text-secondary/10 p-10 shadow-sm">
        {!passwordMode ? (
          <div className="space-y-8">
            <div className="flex items-start gap-5">
              <div className="p-4 bg-primary/10 text-primary rounded-3xl"><Lock size={28} /></div>
              <div>
                <h3 className="text-2xl font-black text-text-primary">Password Security</h3>
                <p className="text-sm text-text-secondary font-medium mt-1">Manage your password or set a credential for Google Auth.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <button onClick={() => setPasswordMode('change')} className="px-8 py-4 bg-primary text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 transition-all">Change Standard Password</button>
              <button onClick={() => setPasswordMode('set')} className="px-8 py-4 bg-secondary text-text-primary border border-text-secondary/10 font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-secondary/80 transition-all">Set Google Account Password</button>
            </div>
          </div>
        ) : (
          <div className="animate-in slide-in-from-top-4 duration-300">
            <h3 className="text-xl font-black text-text-primary mb-8 flex items-center gap-3 capitalize">
              <ShieldCheck className="text-primary" /> {passwordMode === 'change' ? "Update Password" : "Set Google Password"}
            </h3>

            {error && <div className="mb-6 p-4 bg-red-500/10 text-red-500 text-xs font-bold rounded-2xl border border-red-500/20">{error}</div>}

            <div className="space-y-6 max-w-md">
              {passwordMode === 'change' && (
                <PasswordInput label="Current Password" value={passwordForm.current} isVisible={showPass.current} onToggle={() => setShowPass({ ...showPass, current: !showPass.current })} onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })} />
              )}
              <PasswordInput label="New Password" value={passwordForm.new} isVisible={showPass.new} onToggle={() => setShowPass({ ...showPass, new: !showPass.new })} onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })} />
              <PasswordInput label="Confirm New Password" value={passwordForm.confirm} isVisible={showPass.confirm} onToggle={() => setShowPass({ ...showPass, confirm: !showPass.confirm })} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} />

              <div className="flex gap-4 pt-6">
                <button onClick={() => { setPasswordMode(null); setError(null); }} className="flex-1 py-4 text-xs font-black text-text-secondary hover:bg-text-primary/5 rounded-2xl uppercase tracking-widest">Cancel</button>
                <button onClick={handlePasswordSubmit} disabled={isSaving} className="flex-1 py-4 bg-primary text-white font-black rounded-2xl text-xs shadow-lg uppercase tracking-widest flex items-center justify-center gap-2">
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Update Security
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active Sessions */}
      <div className="bg-bg-primary rounded-[40px] border border-text-secondary/10 p-10 shadow-sm">
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-2xl font-black text-text-primary">Logged-in Sessions</h3>
          <button onClick={fetchSessions} className="p-2 text-primary hover:rotate-180 transition-all duration-500"><ShieldCheck size={20} /></button>
        </div>
        <div className="grid gap-4">
          {loadingSessions ? (
            <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></div>
          ) : sessions.length === 0 ? (
            <p className="p-10 text-center text-text-secondary font-bold bg-background rounded-3xl">No other active devices found.</p>
          ) : sessions.map((s) => (
            <div key={s.id as string} className="flex items-center justify-between p-6 bg-background border border-text-secondary/10 rounded-[28px] hover:border-primary/40 transition-all group">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-bg-primary rounded-2xl border border-text-secondary/5 text-text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  {(s.device_id as string)?.toLowerCase().includes('phone') ? <Smartphone size={24} /> : <Laptop size={24} />}
                </div>
                <div>
                  <p className="font-black text-text-primary text-lg tracking-tight uppercase">{(s.device_id as string) || "Unknown Device"}</p>
                  <p className="text-[11px] text-text-secondary font-black uppercase tracking-widest mt-1 opacity-60">
                    Connected: {new Date(s.created_at as string).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button onClick={() => handleRevokeSession(s.id as string)} className="p-3 text-text-secondary hover:text-white hover:bg-red-500 rounded-xl transition-all shadow-sm">
                <X size={20} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-500/5 rounded-[40px] border border-red-500/10 p-10 border-dashed">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-black text-red-600 mb-2 flex items-center gap-3"><AlertCircle /> Global Sign Out</h3>
            <p className="text-sm text-text-secondary font-medium">This will immediately revoke access from all devices and require re-login.</p>
          </div>
          <button onClick={handleLogoutAll} disabled={isSaving} className="px-10 py-5 bg-red-600 text-white font-black rounded-[24px] text-xs uppercase tracking-widest shadow-xl shadow-red-500/30 hover:bg-red-700 active:scale-95 transition-all">
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : "Sign Out All Devices"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PasswordInput({ label, isVisible, onToggle, ...props }: {
  label: string;
  isVisible: boolean;
  onToggle: () => void;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="w-full">
      <label className="block text-[10px] font-black text-text-secondary mb-3 uppercase tracking-[0.2em]">{label}</label>
      <div className="relative">
        <input
          {...props}
          type={isVisible ? "text" : "password"}
          className="w-full px-6 py-5 border-2 bg-background border-text-secondary/10 focus:border-primary rounded-[24px] outline-none text-base font-black text-text-primary transition-all shadow-sm"
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary transition-colors"
        >
          {isVisible ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
    </div>
  );
}