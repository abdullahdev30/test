"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import { Camera, Check, Loader2, Edit3, AlertCircle } from "lucide-react";
import { useUser } from "@/hooks/useUser";

export default function ProfileSettingsPage() {
  const { user, isLoading, updateUser, uploadUserAvatar } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, startSaveTransition] = useTransition();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    avatarUrl: "",
  });

  // Sync form when user data arrives from hook
  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: (user.firstName as string) || "",
        lastName: (user.lastName as string) || "",
        email: (user.email as string) || "",
        avatarUrl: (user.avatarUrl as string) || "",
      });
    }
  }, [user]);

  const handleSaveProfile = () => {
    setError(null);
    startSaveTransition(async () => {
      const result = await updateUser({
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        timezone: "Asia/Karachi",
      });
      if (result.success) {
        setIsEditing(false);
        setShowSuccessModal(true);
      } else {
        setError(result.error ?? "Failed to update profile");
      }
    });
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    startSaveTransition(async () => {
      const result = await uploadUserAvatar(formData);
      if (result.success && result.avatarUrl) {
        setProfileForm((prev) => ({ ...prev, avatarUrl: result.avatarUrl as string }));
        setShowSuccessModal(true);
      } else {
        setError(result.error ?? "Avatar upload failed");
      }
    });
  };

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    );
  }

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
                  src={profileForm.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileForm.firstName || "U")}&background=833cf6&color=fff`}
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
              <button onClick={() => setIsEditing(false)} className="text-xs font-black text-text-secondary px-5 py-3 hover:text-red-500 transition-all">CANCEL</button>
              <button onClick={handleSaveProfile} disabled={isSaving} className="flex items-center gap-2 text-xs font-black text-white bg-primary px-7 py-3 rounded-2xl shadow-lg shadow-primary/25 active:scale-95 transition-all uppercase tracking-widest">
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <SettingInput label="First Name" value={profileForm.firstName} disabled={!isEditing} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileForm({ ...profileForm, firstName: e.target.value })} />
          <SettingInput label="Last Name" value={profileForm.lastName} disabled={!isEditing} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileForm({ ...profileForm, lastName: e.target.value })} />
          <div className="md:col-span-2 opacity-60">
            <SettingInput label="Email Address (read-only)" type="email" value={profileForm.email} disabled={true} />
          </div>
        </div>
      </div>
    </>
  );
}

function SettingInput({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
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