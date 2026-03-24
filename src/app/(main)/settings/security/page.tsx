"use client";

import React, { useState, useEffect } from "react";
import { Key, AlertCircle, Laptop, Smartphone, X, Check, Lock, Loader2, LogOut, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

const BASE_URL = "http://135.181.242.234:7860";

export default function SecuritySettingsPage() {
  const router = useRouter();
  const [passwordMode, setPasswordMode] = useState<'change' | 'set' | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Form States
  const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });

  // Helper: Get Token from cookies
  const getAuthToken = () => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; accessToken=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return "";
  };

  // 1. GET SESSIONS (GET /auth/sessions)
  const fetchSessions = async () => {
    setLoadingSessions(true);
    const token = getAuthToken();
    try {
      const res = await fetch(`${BASE_URL}/auth/sessions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSessions(Array.isArray(data) ? data : []);
    } catch {
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => { fetchSessions(); }, []);

  // 2. CHANGE/SET PASSWORD (POST /auth/change-password or /auth/set-password)
  const handlePasswordSubmit = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
      setError("Passwords do not match");
      return;
    }
    
    setIsSaving(true);
    setError(null);
    const token = getAuthToken();
    const endpoint = passwordMode === 'change' ? '/auth/change-password' : '/auth/set-password';
    
    // Body logic: set-password doesn't need currentPassword
    const body = passwordMode === 'change' 
      ? { currentPassword: passwordForm.current, newPassword: passwordForm.new, confirmPassword: passwordForm.confirm }
      : { password: passwordForm.new, confirmPassword: passwordForm.confirm };

    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      if (res.ok) {
        setPasswordMode(null);
        setPasswordForm({ current: "", new: "", confirm: "" });
        setShowSuccessModal(true);
      } else {
        setError(data.message || "Operation failed");
      }
    } catch {
      setError("Server connection error");
    } finally {
      setIsSaving(false);
    }
  };

  // 3. REVOKE SINGLE SESSION (DELETE /auth/sessions/{id})
  const handleRevokeSession = async (id: string) => {
    const token = getAuthToken();
    try {
      const res = await fetch(`${BASE_URL}/auth/sessions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setSessions(prev => prev.filter(s => s.id !== id));
    } catch {
      setError("Failed to revoke session");
    }
  };

  // 4. LOGOUT ALL SESSIONS (POST /auth/logout-all)
  const handleLogoutAll = async () => {
    const token = getAuthToken();
    try {
      const res = await fetch(`${BASE_URL}/auth/logout-all`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        // Clear local storage and redirect
        document.cookie = "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        router.push('/login');
      }
    } catch {
      setError("Failed to logout all");
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-4 animate-in fade-in duration-500">
      {/* Success Modal */}
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
                <PasswordInput label="Current Password" value={passwordForm.current} isVisible={showPass.current} onToggle={() => setShowPass({...showPass, current: !showPass.current})} onChange={(e: any) => setPasswordForm({ ...passwordForm, current: e.target.value })} />
              )}
              <PasswordInput label="New Password" value={passwordForm.new} isVisible={showPass.new} onToggle={() => setShowPass({...showPass, new: !showPass.new})} onChange={(e: any) => setPasswordForm({ ...passwordForm, new: e.target.value })} />
              <PasswordInput label="Confirm New Password" value={passwordForm.confirm} isVisible={showPass.confirm} onToggle={() => setShowPass({...showPass, confirm: !showPass.confirm})} onChange={(e: any) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} />
              
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

      {/* Active Sessions List */}
      <div className="bg-bg-primary rounded-[40px] border border-text-secondary/10 p-10 shadow-sm">
        <div className="flex justify-between items-center mb-10">
            <h3 className="text-2xl font-black text-text-primary">Logged-in Sessions</h3>
            <button onClick={fetchSessions} className="p-2 text-primary hover:rotate-180 transition-all duration-500"><ShieldCheck size={20} /></button>
        </div>
        <div className="grid gap-4">
          {loadingSessions ? <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></div> : sessions.length === 0 ? (
            <p className="p-10 text-center text-text-secondary font-bold bg-background rounded-3xl">No other active devices found.</p>
          ) : sessions.map((s: any) => (
            <div key={s.id} className="flex items-center justify-between p-6 bg-background border border-text-secondary/10 rounded-[28px] hover:border-primary/40 transition-all group">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-bg-primary rounded-2xl border border-text-secondary/5 text-text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  {s.device_id?.toLowerCase().includes('phone') ? <Smartphone size={24} /> : <Laptop size={24} />}
                </div>
                <div>
                  <p className="font-black text-text-primary text-lg tracking-tight uppercase">{s.device_id || "Unknown Device"}</p>
                  <p className="text-[11px] text-text-secondary font-black uppercase tracking-widest mt-1 opacity-60">Connected: {new Date(s.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <button onClick={() => handleRevokeSession(s.id)} className="p-3 text-text-secondary hover:text-white hover:bg-red-500 rounded-xl transition-all shadow-sm">
                <X size={20} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone: Logout All */}
      <div className="bg-red-500/5 rounded-[40px] border border-red-500/10 p-10 border-dashed">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
                <h3 className="text-2xl font-black text-red-600 mb-2 flex items-center gap-3"><AlertCircle /> Global Sign Out</h3>
                <p className="text-sm text-text-secondary font-medium">This will immediately revoke access from all devices and require re-login.</p>
            </div>
            <button onClick={handleLogoutAll} className="px-10 py-5 bg-red-600 text-white font-black rounded-[24px] text-xs uppercase tracking-widest shadow-xl shadow-red-500/30 hover:bg-red-700 active:scale-95 transition-all">
              Sign Out All Devices
            </button>
        </div>
      </div>
    </div>
  );
}

// Reusable Password Input Component
function PasswordInput({ label, isVisible, onToggle, ...props }: any) {
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