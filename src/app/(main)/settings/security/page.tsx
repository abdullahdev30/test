"use client";

import React, { useEffect, useMemo, useState, useTransition } from "react";
import {
  AlertTriangle,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Laptop,
  Link2,
  LogOut,
  Shield,
  Smartphone,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { changePassword, setPassword } from "@/lib/api/auth";
import { getSessions, revokeSession } from "@/lib/api/user";
import { Alert, Button, Card, Input, Spinner } from "@/components/common";

type PasswordAction = "change" | "set";

export default function SecuritySettingsPage() {
  const router = useRouter();
  const [passwordAction, setPasswordAction] = useState<PasswordAction>("change");
  const [isSaving, startSaveTransition] = useTransition();
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [sessions, setSessions] = useState<Record<string, unknown>[]>([]);
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [passwordForm, setPasswordForm] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [showPass, setShowPass] = useState({
    current: false,
    next: false,
    confirm: false,
  });

  async function fetchSessions() {
    setLoadingSessions(true);
    setError(null);
    try {
      const result = await getSessions();
      if (!result.success) {
        setError(result.error ?? "Failed to load sessions.");
        setSessions([]);
        return;
      }
      setSessions(result.sessions as Record<string, unknown>[]);
    } catch {
      setSessions([]);
      setError("Failed to load sessions.");
    } finally {
      setLoadingSessions(false);
    }
  }

  useEffect(() => {
    fetchSessions();
  }, []);

  const visibleSessions = useMemo(
    () => (showAllSessions ? sessions : sessions.slice(0, 2)),
    [sessions, showAllSessions],
  );

  function handlePasswordSubmit() {
    if (passwordForm.next !== passwordForm.confirm) {
      setError("Passwords do not match.");
      return;
    }

    setError(null);
    startSaveTransition(async () => {
      const result =
        passwordAction === "change"
          ? await changePassword({
              currentPassword: passwordForm.current,
              newPassword: passwordForm.next,
              confirmPassword: passwordForm.confirm,
            })
          : await setPassword({
              password: passwordForm.next,
              confirmPassword: passwordForm.confirm,
            });

      if (!result.success) {
        setError(result.error ?? "Unable to update password.");
        return;
      }

      setPasswordForm({ current: "", next: "", confirm: "" });
      setShowSuccessModal(true);
    });
  }

  function handleRevokeSession(id: string) {
    setError(null);
    startSaveTransition(async () => {
      const result = await revokeSession(id);
      if (!result.success) {
        setError(result.error ?? "Failed to revoke session.");
        return;
      }
      setSessions((prev) => prev.filter((session) => String((session as { id?: string }).id ?? "") !== id));
    });
  }

  function handleRevokeAllSessions() {
    setError(null);
    startSaveTransition(async () => {
      try {
        const response = await fetch("/api/auth/sessions/revoke-all", {
          method: "POST",
          credentials: "same-origin",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });

        if (!response.ok) {
          setError("Unable to revoke all sessions. Please try again.");
          return;
        }

        await fetchSessions();
      } catch {
        setError("Unable to revoke all sessions. Please try again.");
      }
    });
  }

  function handleLogoutAll() {
    setError(null);
    startSaveTransition(async () => {
      try {
        const response = await fetch("/api/auth/logout-all", {
          method: "POST",
          credentials: "same-origin",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });

        if (!response.ok) {
          setError("Unable to log out all sessions. Please try again.");
          return;
        }

        router.push("/login");
      } catch {
        setError("Unable to log out all sessions. Please try again.");
      }
    });
  }

  return (
    <div className="space-y-6">
      {showSuccessModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <Card className="w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <Check size={28} />
            </div>
            <h3 className="text-2xl font-black text-text-primary">Security Updated</h3>
            <p className="mt-2 text-sm text-text-secondary">Password settings saved successfully.</p>
            <Button className="mt-6 w-full" onClick={() => setShowSuccessModal(false)}>
              Continue
            </Button>
          </Card>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <Card className="w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-xl bg-red-500/10 p-2 text-red-600">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3 className="text-xl font-black text-text-primary">
                  Are you sure you want to log out?
                </h3>
                <p className="mt-1 text-sm text-text-secondary">
                  This will terminate all active sessions immediately.
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => setShowLogoutConfirm(false)}>
                Cancel
              </Button>
              <Button variant="alert" isLoading={isSaving} onClick={handleLogoutAll}>
                Yes, Log Out All
              </Button>
            </div>
          </Card>
        </div>
      )}

      {error && <Alert variant="alert">{error}</Alert>}

      <div>
        <h2 className="text-5xl font-black text-text-primary tracking-tight">Security Settings</h2>
        <p className="mt-2 text-base text-text-secondary">
          Manage your authentication methods and monitor active sessions across all devices.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6">
        <Card className="rounded-2xl p-6 border-text-secondary/20">
          <div className="flex items-center gap-3">
            <KeyRound size={18} className="text-primary" />
            <h3 className="text-xl font-black text-text-primary">Password & Authentication</h3>
          </div>
          <p className="mt-3 text-sm text-text-secondary leading-relaxed">
            Ensure a strong, unique password. Update your standard password or set one for social-login account access.
          </p>

          <div className="mt-5 space-y-3">
            <Button
              variant={passwordAction === "change" ? "primary" : "outline"}
              className="w-full justify-between"
              onClick={() => setPasswordAction("change")}
            >
              <span className="inline-flex items-center gap-2">
                <Shield size={14} />
                Change Password
              </span>
              <span className="text-xs opacity-80">Standard Account</span>
            </Button>

            <Button
              variant={passwordAction === "set" ? "primary" : "outline"}
              className="w-full justify-between"
              onClick={() => setPasswordAction("set")}
            >
              <span className="inline-flex items-center gap-2">
                <Link2 size={14} />
                Set Password for Google Account
              </span>
              <span className="text-xs opacity-80">OAuth Linked</span>
            </Button>
          </div>
        </Card>

        <Card className="rounded-2xl p-6 border-text-secondary/20">
          <h3 className="text-lg font-black text-text-primary">
            {passwordAction === "change" ? "Change Password" : "Set Password"}
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            {passwordAction === "change"
              ? "Enter current and new password."
              : "Create a password for your linked Google account."}
          </p>

          <div className="mt-5 space-y-4">
            {passwordAction === "change" && (
              <PasswordField
                label="Current Password"
                value={passwordForm.current}
                visible={showPass.current}
                onToggle={() => setShowPass((prev) => ({ ...prev, current: !prev.current }))}
                onChange={(value) => setPasswordForm((prev) => ({ ...prev, current: value }))}
              />
            )}
            <PasswordField
              label="New Password"
              value={passwordForm.next}
              visible={showPass.next}
              onToggle={() => setShowPass((prev) => ({ ...prev, next: !prev.next }))}
              onChange={(value) => setPasswordForm((prev) => ({ ...prev, next: value }))}
            />
            <PasswordField
              label="Confirm Password"
              value={passwordForm.confirm}
              visible={showPass.confirm}
              onToggle={() => setShowPass((prev) => ({ ...prev, confirm: !prev.confirm }))}
              onChange={(value) => setPasswordForm((prev) => ({ ...prev, confirm: value }))}
            />
          </div>

          <Button className="mt-6 w-full" onClick={handlePasswordSubmit} isLoading={isSaving}>
            Save Password Settings
          </Button>
        </Card>
      </div>

      <Card className="rounded-2xl p-6 border-text-secondary/20">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-black text-text-primary">Active Sessions</h3>
            <p className="mt-1 text-sm text-text-secondary">
              Review devices currently signed into your account.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchSessions}>
              Refresh
            </Button>
            <Button
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
              onClick={handleRevokeAllSessions}
              isLoading={isSaving}
            >
              Revoke All Sessions
            </Button>
            {sessions.length > 2 && (
              <Button variant="secondary" onClick={() => setShowAllSessions((prev) => !prev)}>
                {showAllSessions ? "View Less" : "View All"}
              </Button>
            )}
          </div>
        </div>

        {loadingSessions ? (
          <div className="py-12 text-center">
            <Spinner className="mx-auto text-primary" />
          </div>
        ) : visibleSessions.length === 0 ? (
          <p className="rounded-xl bg-secondary px-4 py-10 text-center text-sm text-text-secondary">
            No active sessions found.
          </p>
        ) : (
          <div className="space-y-3">
            {visibleSessions.map((session) => {
              const id = String((session as { id?: string }).id ?? "");
              const device = String((session as { device_id?: string }).device_id ?? "Unknown Device");
              const userAgent = String((session as { user_agent?: string }).user_agent ?? "");
              const ipAddress = String((session as { ip_address?: string }).ip_address ?? "-");
              const location = String((session as { location?: string }).location ?? "-");
              const isPhone = device.toLowerCase().includes("phone");

              return (
                <div
                  key={id}
                  className="grid grid-cols-1 gap-4 rounded-xl border border-text-secondary/10 bg-background p-4 md:grid-cols-[minmax(0,1fr)_140px_140px_120px]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="rounded-lg bg-bg-primary p-2 text-text-primary">
                      {isPhone ? <Smartphone size={18} /> : <Laptop size={18} />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-text-primary">{device}</p>
                      <p className="truncate text-xs text-text-secondary">{userAgent || "Unknown agent"}</p>
                    </div>
                  </div>
                  <p className="text-sm text-text-secondary">{location}</p>
                  <p className="text-sm text-text-secondary">{ipAddress}</p>
                  <div className="flex items-center justify-start md:justify-end">
                    <Button
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-50"
                      onClick={() => handleRevokeSession(id)}
                    >
                      <Trash2 size={14} />
                      Revoke
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-t border-text-secondary/10 pt-5">
          <div>
            <p className="text-sm font-semibold text-text-primary">Precautionary Measures</p>
            <p className="text-xs text-text-secondary">
              Immediately terminate all active tokens except this session.
            </p>
          </div>
          <Button variant="alert" onClick={() => setShowLogoutConfirm(true)} leftIcon={<LogOut size={14} />}>
            Logout of All Devices
          </Button>
        </div>
      </Card>
    </div>
  );
}

function PasswordField({
  label,
  value,
  visible,
  onToggle,
  onChange,
}: {
  label: string;
  value: string;
  visible: boolean;
  onToggle: () => void;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-text-primary">{label}</label>
      <Input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        variant="filled"
        className="rounded-xl"
        placeholder="••••••••"
        rightNode={
          <button type="button" onClick={onToggle} className="text-text-secondary hover:text-primary">
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        }
      />
    </div>
  );
}
