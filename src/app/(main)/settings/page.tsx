"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Shield, Key, LogOut, Factory, ChevronRight,
  AlertCircle, Laptop, Smartphone, X, User,
  Camera, Check, Loader2, Edit3, Lock
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { useAuth } from "@/hooks/useAuth";

export default function SettingsPage() {
  const router = useRouter();
  const { user, updateUser } = useUser();
  const { logout, token } = useAuth(); // CRITICAL: Get token from your auth hook
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UI States
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Password States
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });

  // Data States
  const [sessions, setSessions] = useState<any[]>([]);
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    avatar: ""
  });

  // Helper for Headers (Prevents 401)
  const getAuthHeaders = (isJson = true) => {
    const headers: any = {
      'Authorization': `Bearer ${token}`,
    };
    if (isJson) headers['Content-Type'] = 'application/json';
    return headers;
  };

  // Sync Form with User Hook
  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        avatar: user.avatar || ""
      });
    }
  }, [user]);

  // Fetch Security Sessions
  useEffect(() => {
    const fetchSessions = async () => {
      if (!token) return;
      try {
        const res = await fetch('/api/auth/settings', {
          headers: getAuthHeaders()
        });
        const data = await res.json();
        setSessions(Array.isArray(data) ? data : data.sessions || []);
      } catch (err) {
        setSessions([]);
      } finally {
        setLoadingSessions(false);
      }
    };
    fetchSessions();
  }, [token]);

  /* --- API ACTIONS --- */

  // 1. Update Profile (POST)
  const handleSaveProfile = async () => {
    if (!token) return alert("Session expired. Please login again.");
    setIsSaving(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          firstName: profileForm.firstName,
          lastName: profileForm.lastName,
          timezone: "Asia/Karachi"
        })
      });

      if (res.ok) {
        updateUser({ ...user, ...profileForm });
        setIsEditing(false);
        setShowSuccessModal(true);
      } else {
        const error = await res.json();
        console.error("Error:", error.message);
      }
    } catch (err) {
      console.error("Profile save failed", err);
    } finally {
      setIsSaving(false);
    }
  };

  // 2. Upload Avatar (PUT)
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsSaving(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: getAuthHeaders(false), // False because browser sets multipart boundary
        body: formData
      });

      const data = await res.json();
      if (res.ok && data.avatarUrl) {
        setProfileForm(prev => ({ ...prev, avatar: data.avatarUrl }));
        updateUser({ ...user, avatar: data.avatarUrl });
        setShowSuccessModal(true);
      }
    } catch (err) {
      console.error("Avatar upload failed", err);
    } finally {
      setIsSaving(false);
    }
  };

  // 3. Change Password (POST)
  const handleChangePassword = async () => {
    if (passwordForm.new !== passwordForm.confirm) return alert("Passwords do not match");
    if (!token) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          currentPassword: passwordForm.current,
          newPassword: passwordForm.new
        })
      });

      if (res.ok) {
        setIsChangingPassword(false);
        setPasswordForm({ current: "", new: "", confirm: "" });
        setShowSuccessModal(true);
      }
    } catch (err) {
      console.error("Password change failed", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevokeSession = async (id: string) => {
    const res = await fetch(`/api/auth/settings?id=${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (res.ok) setSessions(prev => prev.filter(s => s.id !== id));
  };

  const handleFinalLogout = async () => {
    await fetch('/api/auth/settings?all=true', {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    logout();
    router.push('/login');
  };

  if (!user) return (
    <div className="h-screen flex items-center justify-center bg-background">
      <Loader2 className="animate-spin text-primary" size={40} />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-10 font-sans relative">

      {/* SUCCESS POPUP */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-bg-primary rounded-[32px] p-10 shadow-2xl border border-text-secondary/10 max-w-[340px] w-full text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check size={32} strokeWidth={3} />
            </div>
            <h3 className="text-2xl font-black text-text-primary mb-2">Success!</h3>
            <p className="text-sm text-text-secondary mb-8 font-medium">Your account details are updated.</p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/25 transition-all text-sm uppercase tracking-widest"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* LOGOUT MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-bg-primary rounded-[32px] p-10 max-w-sm w-full relative animate-in zoom-in-95">
            <div className="w-16 h-16 bg-red-500/10 text-red-600 rounded-2xl flex items-center justify-center mb-6">
              <LogOut size={32} />
            </div>
            <h2 className="text-2xl font-black text-text-primary mb-2">Are you sure?</h2>
            <p className="text-text-secondary font-medium text-sm mb-8">Logging out ends all active sessions.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutModal(false)} className="flex-1 py-3.5 text-sm font-bold text-text-secondary hover:bg-text-primary/5 rounded-xl transition-all">Cancel</button>
              <button onClick={handleFinalLogout} className="flex-1 py-3.5 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 transition-all text-sm">Logout</button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-10">
        <h1 className="text-4xl font-black text-text-primary tracking-tight">Settings</h1>
        <p className="text-text-secondary mt-2 font-bold uppercase text-[11px] tracking-[0.2em]">Account Management</p>
      </div>

      <div className="flex flex-col md:flex-row gap-10">
        <div className="w-full md:w-64 flex-shrink-0">
          <nav className="space-y-2 bg-bg-primary border border-text-secondary/10 p-3 rounded-[32px] shadow-sm">
            <NavItem icon={<User size={18} />} label="Profile" active={activeTab === "profile"} onClick={() => { setActiveTab("profile"); setIsChangingPassword(false); }} />
            <NavItem icon={<Shield size={18} />} label="Security" active={activeTab === "security"} onClick={() => setActiveTab("security")} />
            <NavItem icon={<Factory size={18} />} label="General" active={activeTab === "general"} onClick={() => setActiveTab("general")} />
          </nav>
        </div>

        <div className="flex-1 space-y-8">
          {activeTab === "profile" && (
            <div className="bg-bg-primary rounded-[40px] border border-text-secondary/10 p-10 shadow-sm animate-in fade-in duration-500">
              <div className="flex justify-between items-start mb-12">
                <div className="flex gap-6 items-center">
                  <div className="relative group">
                    <div className="w-28 h-28 rounded-[32px] overflow-hidden border-2 border-text-secondary/10 bg-secondary shadow-inner relative">
                      <img
                        src={profileForm.avatar || `https://ui-avatars.com/api/?name=${profileForm.firstName}&background=833cf6&color=fff`}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 p-3 bg-primary text-white rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all border-4 border-bg-primary"
                    >
                      {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                    </button>
                    <input type="file" ref={fileInputRef} hidden onChange={handleAvatarUpload} accept="image/*" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-text-primary leading-tight">{profileForm.firstName} {profileForm.lastName}</h3>
                    <p className="text-sm text-text-secondary font-bold uppercase tracking-widest mt-1">{profileForm.email}</p>
                  </div>
                </div>

                {!isEditing ? (
                  <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 text-xs font-black text-primary bg-primary/10 px-6 py-3 rounded-2xl hover:bg-primary/20 transition-all uppercase tracking-widest">
                    <Edit3 size={14} /> Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button onClick={() => { setIsEditing(false); setProfileForm(user); }} className="text-xs font-black text-text-secondary px-5 py-3 hover:text-red-500 transition-all">CANCEL</button>
                    <button onClick={handleSaveProfile} disabled={isSaving} className="flex items-center gap-2 text-xs font-black text-white bg-primary px-7 py-3 rounded-2xl shadow-lg shadow-primary/25 active:scale-95 transition-all uppercase tracking-widest">
                      {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <Input label="First Name" value={profileForm.firstName} disabled={!isEditing} onChange={(e: any) => setProfileForm({ ...profileForm, firstName: e.target.value })} />
                <Input label="Last Name" value={profileForm.lastName} disabled={!isEditing} onChange={(e: any) => setProfileForm({ ...profileForm, lastName: e.target.value })} />
                <div className="md:col-span-2 opacity-60">
                  <Input label="Email Address" type="email" value={profileForm.email} disabled={true} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="bg-bg-primary rounded-[40px] border border-text-secondary/10 p-10 shadow-sm">
                {!isChangingPassword ? (
                  <>
                    <div className="flex items-start gap-5 mb-8">
                      <div className="p-4 bg-orange-500/10 text-orange-500 rounded-3xl"><Key size={24} /></div>
                      <div>
                        <h3 className="text-xl font-black text-text-primary leading-tight">Password Security</h3>
                        <p className="text-sm text-text-secondary font-medium mt-1">Keep your account secure.</p>
                      </div>
                    </div>
                    <button onClick={() => setIsChangingPassword(true)} className="px-8 py-3.5 bg-primary text-white font-black rounded-2xl text-sm shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all uppercase tracking-widest">
                      Change Password
                    </button>
                  </>
                ) : (
                  <div className="animate-in slide-in-from-top-4 duration-300">
                    <h3 className="text-xl font-black text-text-primary mb-6 flex items-center gap-3">
                      <Lock size={20} className="text-primary" /> Update Password
                    </h3>
                    <div className="space-y-6 max-w-md">
                      <Input type="password" label="Current Password" placeholder="••••••••" value={passwordForm.current} onChange={(e: any) => setPasswordForm({ ...passwordForm, current: e.target.value })} />
                      <Input type="password" label="New Password" placeholder="••••••••" value={passwordForm.new} onChange={(e: any) => setPasswordForm({ ...passwordForm, new: e.target.value })} />
                      <Input type="password" label="Confirm Password" placeholder="••••••••" value={passwordForm.confirm} onChange={(e: any) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} />
                      <div className="flex gap-4 pt-4">
                        <button onClick={() => setIsChangingPassword(false)} className="flex-1 py-4 text-xs font-black text-text-secondary hover:bg-text-primary/5 rounded-2xl transition-all uppercase">Cancel</button>
                        <button onClick={handleChangePassword} disabled={isSaving} className="flex-1 py-4 bg-primary text-white font-black rounded-2xl text-xs shadow-lg shadow-primary/20 active:scale-95 transition-all uppercase flex items-center justify-center gap-2">
                          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Update
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-bg-primary rounded-[40px] border border-text-secondary/10 p-10 shadow-sm">
                <h3 className="text-xl font-black text-text-primary mb-8">Active Sessions</h3>
                <div className="space-y-4">
                  {loadingSessions ? <p className="italic text-text-secondary text-sm">Loading...</p> : sessions.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-5 bg-background border border-text-secondary/10 rounded-[24px] group hover:border-primary/30 transition-all">
                      <div className="flex items-center gap-5">
                        <div className="p-3.5 bg-bg-primary rounded-2xl border border-text-secondary/5">{s.device_id?.includes('phone') ? <Smartphone size={22} /> : <Laptop size={22} />}</div>
                        <div>
                          <p className="font-black text-text-primary text-sm uppercase tracking-tight">{s.device_id || "Web Browser"}</p>
                          <p className="text-[11px] text-text-secondary font-bold mt-0.5 tracking-wide">Last seen: {new Date(s.created_at).toDateString()}</p>
                        </div>
                      </div>
                      <button onClick={() => handleRevokeSession(s.id)} className="p-2.5 text-text-secondary hover:text-red-500 bg-text-primary/5 hover:bg-red-500/10 rounded-xl transition-all"><X size={18} /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-red-500/5 rounded-[40px] border border-red-500/10 p-10">
                <h3 className="text-xl font-black text-red-600 mb-2 flex items-center gap-2"><AlertCircle size={22} /> Danger Zone</h3>
                <p className="text-sm text-text-secondary font-medium mb-8">Logout everywhere.</p>
                <button onClick={() => setShowLogoutModal(true)} className="px-8 py-4 bg-red-600 text-white font-black rounded-2xl text-sm shadow-xl shadow-red-500/20 hover:bg-red-700 active:scale-95 transition-all uppercase tracking-widest">
                  Logout all
                </button>
              </div>
            </div>
          )}

          {activeTab === "general" && (
            <div className="bg-bg-primary rounded-[40px] border border-text-secondary/10 p-10 shadow-sm">
              <h3 className="text-xl font-black text-text-primary mb-2">General Settings</h3>
              <div className="p-20 border-2 border-dashed border-text-secondary/10 rounded-[32px] text-center">
                <p className="text-sm font-bold text-text-secondary opacity-50 uppercase tracking-[0.2em]">Coming Soon</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${active ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-text-secondary hover:bg-text-primary/5 hover:text-text-primary'}`}>
      <div className="flex items-center gap-4">{icon} {label}</div>
      {active && <ChevronRight size={14} strokeWidth={4} />}
    </button>
  );
}

function Input({ label, ...props }: any) {
  return (
    <div className="w-full">
      <label className="block text-[10px] font-black text-text-secondary mb-2.5 uppercase tracking-[0.2em]">{label}</label>
      <input
        {...props}
        className={`w-full px-6 py-4.5 border-2 rounded-[20px] outline-none text-[15px] font-black transition-all ${props.disabled ? 'bg-secondary/40 border-transparent text-text-secondary/40 cursor-not-allowed' : 'bg-background border-text-secondary/10 focus:border-primary text-text-primary shadow-sm'
          }`}
      />
    </div>
  );
}