"use client";

import React, { useState, useEffect, useRef } from "react";
import { Camera, Check, Loader2, Edit3, AlertCircle } from "lucide-react";
import { useUser } from "@/hooks/useUser";

// Define your backend base URL
const BASE_URL = "http://135.181.242.234:7860";

export default function ProfileSettingsPage() {
  const { user, updateUser } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profileForm, setProfileForm] = useState({
    firstName: "", lastName: "", email: "", avatar: ""
  });

  // --- HELPER: GET TOKEN FROM COOKIE ---
  const getAuthToken = () => {
    const name = "accessToken=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
    }
    return "";
  };

  // 1. FETCH ACTUAL USER DATA ON LOAD (GET /auth/me)
  useEffect(() => {
    const fetchUserData = async () => {
      const token = getAuthToken();
      if (!token) return;

      try {
        const res = await fetch(`${BASE_URL}/auth/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (res.ok) {
          const data = await res.json();
          // Map backend fields to your form
          const userData = {
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            email: data.email || "",
            avatar: data.avatarUrl || "" 
          };
          setProfileForm(userData);
          updateUser(data); // Sync global hook
        }
      } catch (err) {
        console.error("Failed to load user data", err);
      }
    };

    fetchUserData();
  }, [updateUser]);

  // 2. SAVE PROFILE CHANGES (POST /auth/profile)
  const handleSaveProfile = async () => {
    setIsSaving(true);
    setError(null);
    const token = getAuthToken();

    try {
      const res = await fetch(`${BASE_URL}/auth/profile`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
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
        const data = await res.json();
        setError(data.message || "Failed to update profile");
      }
    } catch (err) {
      setError("Connection error");
    } finally {
      setIsSaving(false);
    }
  };

  // 3. UPLOAD AVATAR (POST /auth/avatar)
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = getAuthToken();
    const formData = new FormData();
    formData.append('file', file); // 'file' matches your Swagger requirement

    setIsSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/avatar`, { 
        method: 'POST', 
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData 
      });
      
      const data = await res.json();
      if (res.ok && data.avatarUrl) {
        setProfileForm(prev => ({ ...prev, avatar: data.avatarUrl }));
        updateUser({ ...user, avatar: data.avatarUrl });
        setShowSuccessModal(true);
      }
    } catch (err) {
      setError("Avatar upload failed");
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return (
    <div className="h-64 flex items-center justify-center">
      <Loader2 className="animate-spin text-primary" size={36} />
    </div>
  );

  return (
    <>
      {showSuccessModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-bg-primary rounded-[32px] p-10 shadow-2xl border border-text-secondary/10 max-w-[340px] w-full text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check size={32} strokeWidth={3} />
            </div>
            <h3 className="text-2xl font-black text-text-primary mb-2">Saved!</h3>
            <p className="text-sm text-text-secondary mb-8 font-medium">Your profile has been updated.</p>
            <button onClick={() => setShowSuccessModal(false)} className="w-full py-4 bg-primary text-white font-black rounded-2xl text-sm uppercase tracking-widest">
              Continue
            </button>
          </div>
        </div>
      )}

      <div className="bg-bg-primary rounded-[40px] border border-text-secondary/10 p-10 shadow-sm animate-in fade-in duration-500">
        
        {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-sm font-bold flex items-center gap-2">
                <AlertCircle size={18} /> {error}
            </div>
        )}

        <div className="flex justify-between items-start mb-12">
          <div className="flex gap-6 items-center">
            <div className="relative group">
              <div className="w-28 h-28 rounded-[32px] overflow-hidden border-2 border-text-secondary/10 bg-secondary shadow-inner">
                <img
                  src={profileForm.avatar || `https://ui-avatars.com/api/?name=${profileForm.firstName}&background=833cf6&color=fff`}
                  alt="Profile" className="w-full h-full object-cover"
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
              <button onClick={() => setIsEditing(false)} className="text-xs font-black text-text-secondary px-5 py-3 hover:text-red-500 transition-all">CANCEL</button>
              <button onClick={handleSaveProfile} disabled={isSaving} className="flex items-center gap-2 text-xs font-black text-white bg-primary px-7 py-3 rounded-2xl shadow-lg shadow-primary/25 active:scale-95 transition-all uppercase tracking-widest">
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <SettingInput label="First Name" value={profileForm.firstName} disabled={!isEditing} onChange={(e: any) => setProfileForm({ ...profileForm, firstName: e.target.value })} />
          <SettingInput label="Last Name" value={profileForm.lastName} disabled={!isEditing} onChange={(e: any) => setProfileForm({ ...profileForm, lastName: e.target.value })} />
          <div className="md:col-span-2 opacity-60">
            <SettingInput label="Email Address (read-only)" type="email" value={profileForm.email} disabled={true} />
          </div>
        </div>
      </div>
    </>
  );
}

function SettingInput({ label, ...props }: any) {
  return (
    <div className="w-full">
      <label className="block text-[10px] font-black text-text-secondary mb-2.5 uppercase tracking-[0.2em]">{label}</label>
      <input
        {...props}
        className={`w-full px-6 py-4 border-2 rounded-[20px] outline-none text-[15px] font-black transition-all ${
          props.disabled
            ? 'bg-secondary/40 border-transparent text-text-secondary/40 cursor-not-allowed'
            : 'bg-background border-text-secondary/10 focus:border-primary text-text-primary shadow-sm'
        }`}
      />
    </div>
  );
}