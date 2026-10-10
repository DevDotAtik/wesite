"use client";

import { useState } from "react";
import { BadgeCheck, Camera, KeyRound, Loader2, Save, User } from "lucide-react";
import { toast } from "sonner";
import AvatarPicker from "./AvatarPicker";
import SectionCard from "./SectionCard";
import { formatDate, type PatchProfile, type SettingsUser } from "./types";

type ProfileSectionProps = {
  user: SettingsUser;
  onPatch: PatchProfile;
  saving: boolean;
};

export default function ProfileSection({ user, onPatch, saving }: ProfileSectionProps) {
  const [name, setName] = useState(user.name ?? "");
  const [email, setEmail] = useState(user.email ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await onPatch({ name, email, avatarUrl }, "Profile updated");
    if (result.ok) {
      toast.success("Profile saved");
    } else {
      toast.error(result.error ?? "Could not save profile");
    }
  }

  return (
    <SectionCard
      icon={User}
      title="Profile"
      description="Your public identity across Wesite. A blank photo falls back to your Google avatar."
      action={
        <span className="nb-tag nb-tag-primary">
          <BadgeCheck className="size-3.5" />
          {user.authProvider === "google" ? "Google account" : "Email & password"}
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <AvatarPicker
          name={name}
          avatarUrl={avatarUrl}
          googleAvatarUrl={user.googleAvatarUrl}
          onChange={setAvatarUrl}
          disabled={saving}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-bold" style={{ color: "var(--nb-fg)" }}>
            Display name
            <input
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              minLength={2}
              maxLength={80}
              required
              className="nb-input mt-2"
            />
          </label>
          <label className="block text-xs font-bold" style={{ color: "var(--nb-fg)" }}>
            Email address
            <input
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="nb-input mt-2"
            />
          </label>
        </div>

        <div className="grid gap-3 rounded-xl border-3 p-4 sm:grid-cols-2" style={{ borderColor: "var(--nb-border)", background: "var(--nb-surface-alt)" }}>
          <div className="flex items-center gap-2">
            <KeyRound className="size-4 shrink-0" style={{ color: "var(--nb-primary)" }} />
            <div>
              <span className="nb-label block">Sign-in method</span>
              <span className="text-xs font-bold" style={{ color: "var(--nb-fg)" }}>
                {user.authProvider === "google" ? "Google (linked)" : "Email & password"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <BadgeCheck className="size-4 shrink-0" style={{ color: "var(--nb-secondary)" }} />
            <div>
              <span className="nb-label block">Member since</span>
              <span className="text-xs font-bold" style={{ color: "var(--nb-fg)" }}>
                {formatDate(user.createdAt)}
              </span>
            </div>
          </div>
          {user.googleAvatarUrl ? (
            <div className="flex items-center gap-2 sm:col-span-2">
              <Camera className="size-4 shrink-0" style={{ color: "var(--nb-accent)" }} />
              <span className="text-xs" style={{ color: "var(--nb-muted)" }}>
                Google profile picture is kept in sync and used automatically when no custom photo is set.
              </span>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={saving} className="nb-btn nb-btn-primary nb-btn-sm">
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            Save changes
          </button>
        </div>
      </form>
    </SectionCard>
  );
}