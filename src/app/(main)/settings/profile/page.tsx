"use client";

import React, { useEffect, useRef, useState, useTransition } from "react";
import { Camera, Check, Edit3, ImagePlus, X } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { Alert, Button, Card, Input, Spinner } from "@/components/common";

const PREVIEW_BOX = 256;
const MAX_OFFSET = 80;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

async function createCroppedAvatarBlob(
  imageUrl: string,
  zoom: number,
  offsetX: number,
  offsetY: number,
): Promise<Blob> {
  const img = new Image();
  img.src = imageUrl;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Unable to load image"));
  });

  const width = img.naturalWidth;
  const height = img.naturalHeight;
  const minSide = Math.min(width, height);
  const cropSize = minSide / zoom;

  const maxShiftX = (width - cropSize) / 2;
  const maxShiftY = (height - cropSize) / 2;
  const shiftRatioX = offsetX / MAX_OFFSET;
  const shiftRatioY = offsetY / MAX_OFFSET;

  const centerX = width / 2 - shiftRatioX * maxShiftX;
  const centerY = height / 2 - shiftRatioY * maxShiftY;
  const sx = clamp(centerX - cropSize / 2, 0, width - cropSize);
  const sy = clamp(centerY - cropSize / 2, 0, height - cropSize);

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Failed to create canvas context");

  context.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, 512, 512);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.92),
  );
  if (!blob) throw new Error("Failed to build cropped image");
  return blob;
}

export default function ProfileSettingsPage() {
  const { user, isLoading, updateUser, uploadUserAvatar } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, startSaveTransition] = useTransition();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isCropOpen, setIsCropOpen] = useState(false);
  const [cropSourceUrl, setCropSourceUrl] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffsetX, setCropOffsetX] = useState(0);
  const [cropOffsetY, setCropOffsetY] = useState(0);

  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    avatarUrl: "",
  });

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- keep local form synchronized with async user payload
      setProfileForm({
        firstName: (user.firstName as string) || "",
        lastName: (user.lastName as string) || "",
        email: (user.email as string) || "",
        avatarUrl: (user.avatarUrl as string) || "",
      });
    }
  }, [user]);

  useEffect(() => {
    return () => {
      if (cropSourceUrl) URL.revokeObjectURL(cropSourceUrl);
    };
  }, [cropSourceUrl]);

  const avatarPreview =
    profileForm.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      `${profileForm.firstName || "U"} ${profileForm.lastName || ""}`.trim(),
    )}&background=1e293b&color=fff`;

  function closeCropper() {
    if (cropSourceUrl) URL.revokeObjectURL(cropSourceUrl);
    setCropSourceUrl(null);
    setCropZoom(1);
    setCropOffsetX(0);
    setCropOffsetY(0);
    setIsCropOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleAvatarSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    const nextUrl = URL.createObjectURL(file);
    if (cropSourceUrl) URL.revokeObjectURL(cropSourceUrl);

    setCropSourceUrl(nextUrl);
    setCropZoom(1);
    setCropOffsetX(0);
    setCropOffsetY(0);
    setIsCropOpen(true);
  }

  async function handleApplyAvatarCrop() {
    if (!cropSourceUrl) return;
    setError(null);

    try {
      const blob = await createCroppedAvatarBlob(
        cropSourceUrl,
        cropZoom,
        cropOffsetX,
        cropOffsetY,
      );
      const file = new File([blob], `avatar-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });

      const formData = new FormData();
      formData.append("file", file);

      startSaveTransition(async () => {
        const result = await uploadUserAvatar(formData);
        if (result.success && result.avatarUrl) {
          setProfileForm((prev) => ({
            ...prev,
            avatarUrl: result.avatarUrl as string,
          }));
          closeCropper();
          setShowSuccessModal(true);
        } else {
          setError(result.error ?? "Avatar upload failed");
        }
      });
    } catch {
      setError("Unable to process image. Please choose another image.");
    }
  }

  function handleSaveProfile() {
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
  }

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Spinner className="text-primary" size="lg" />
      </div>
    );
  }

  return (
    <>
      {showSuccessModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <Card className="rounded-[30px] p-10 shadow-2xl max-w-[360px] w-full text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <Check size={28} />
            </div>
            <h3 className="text-2xl font-black text-text-primary">Profile Updated</h3>
            <p className="mt-2 text-sm text-text-secondary">
              Your profile changes were saved successfully.
            </p>
            <Button
              onClick={() => setShowSuccessModal(false)}
              className="mt-7 w-full py-3 rounded-xl"
            >
              Continue
            </Button>
          </Card>
        </div>
      )}

      {isCropOpen && cropSourceUrl && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-3xl rounded-[28px] p-6 md:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-text-primary">
                  Adjust Profile Image
                </h3>
                <p className="text-sm text-text-secondary mt-1">
                  Crop and align your image before saving.
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={closeCropper}>
                <X size={18} />
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-[280px_minmax(0,1fr)]">
              <div className="mx-auto">
                <div
                  className="relative overflow-hidden rounded-3xl border border-text-secondary/20 bg-secondary"
                  style={{ width: PREVIEW_BOX, height: PREVIEW_BOX }}
                >
                  <img
                    src={cropSourceUrl}
                    alt="Crop preview"
                    className="absolute left-1/2 top-1/2 h-full w-full object-cover"
                    style={{
                      transform: `translate(calc(-50% + ${cropOffsetX}px), calc(-50% + ${cropOffsetY}px)) scale(${cropZoom})`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-5">
                <SliderField
                  label="Zoom"
                  value={cropZoom}
                  min={1}
                  max={2.6}
                  step={0.01}
                  onChange={setCropZoom}
                />
                <SliderField
                  label="Horizontal"
                  value={cropOffsetX}
                  min={-MAX_OFFSET}
                  max={MAX_OFFSET}
                  step={1}
                  onChange={setCropOffsetX}
                />
                <SliderField
                  label="Vertical"
                  value={cropOffsetY}
                  min={-MAX_OFFSET}
                  max={MAX_OFFSET}
                  step={1}
                  onChange={setCropOffsetY}
                />

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button variant="outline" onClick={closeCropper}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleApplyAvatarCrop}
                    isLoading={isSaving}
                    leftIcon={<ImagePlus size={16} />}
                  >
                    Apply & Upload
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[260px_minmax(0,1fr)] gap-6">
        <Card className="rounded-2xl p-6 border-text-secondary/20">
          {error && <Alert variant="alert" className="mb-4">{error}</Alert>}
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <div className="h-40 w-40 overflow-hidden rounded-full border-4 border-background bg-secondary shadow-lg">
                <img
                  src={avatarPreview}
                  alt="Profile avatar"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
            <h2 className="mt-5 text-3xl font-black text-text-primary leading-tight">
              {profileForm.firstName || "User"} {profileForm.lastName}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">Premium Tier User</p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="mt-6 w-full"
              leftIcon={<Camera size={14} />}
            >
              Change Avatar
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept="image/*"
              onChange={handleAvatarSelect}
            />
          </div>
        </Card>

        <Card className="rounded-2xl p-6 md:p-8 border-text-secondary/20">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <SettingInput
              label="First Name"
              value={profileForm.firstName}
              disabled={!isEditing}
              onChange={(e) =>
                setProfileForm((prev) => ({ ...prev, firstName: e.target.value }))
              }
            />
            <SettingInput
              label="Last Name"
              value={profileForm.lastName}
              disabled={!isEditing}
              onChange={(e) =>
                setProfileForm((prev) => ({ ...prev, lastName: e.target.value }))
              }
            />
            <div className="md:col-span-2">
              <SettingInput
                label="Email Address"
                type="email"
                value={profileForm.email}
                disabled
              />
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                variant="primary"
                leftIcon={<Edit3 size={14} />}
                className="px-7 py-3 rounded-xl"
              >
                Edit Profile
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleSaveProfile}
                  isLoading={isSaving}
                  leftIcon={<Check size={14} />}
                  className="px-7 py-3 rounded-xl"
                >
                  Save Changes
                </Button>
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  className="px-7 py-3 rounded-xl"
                >
                  Discard
                </Button>
              </>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-bold text-text-primary">{label}</label>
        <span className="text-xs font-semibold text-text-secondary">
          {value.toFixed(step < 1 ? 2 : 0)}
        </span>
      </div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary"
      />
    </div>
  );
}

function SettingInput({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-text-secondary">
        {label}
      </label>
      <Input
        {...props}
        variant="filled"
        className={`rounded-xl border ${
          props.disabled
            ? "border-transparent bg-secondary/40 text-text-secondary/60"
            : "border-text-secondary/10"
        }`}
      />
    </div>
  );
}
