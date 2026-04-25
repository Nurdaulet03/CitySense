"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Settings,
  Heart,
  MapPin,
  Bell,
  Save,
  Loader2,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/lib/store";
import { userAPI } from "@/lib/api";

const INTERESTS = [
  "outdoor",
  "sports",
  "culture",
  "food",
  "nature",
  "nightlife",
  "health",
  "tech",
];

const COMMUTE_MODES = [
  { value: "walk", label: "🚶 Walk" },
  { value: "bike", label: "🚲 Bike" },
  { value: "car", label: "🚗 Car" },
  { value: "transit", label: "🚌 Transit" },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, authLoading, loadAuth } = useAppStore();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [commuteMode, setCommuteMode] = useState("walk");
  const [healthSensitive, setHealthSensitive] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwMessage, setPwMessage] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    loadAuth();
  }, [loadAuth]);

  useEffect(() => {
    if (authLoading) return; // wait for session check
    if (!user) {
      router.push("/login");
      return;
    }
    setName(user.name);
    setCity(user.city || "Almaty");
    setInterests(user.preferences?.interests || []);
    setCommuteMode(user.preferences?.commuteMode || "walk");
    setHealthSensitive(user.preferences?.healthSensitive || false);
    setNotifications(user.preferences?.notifications ?? true);
  }, [user, authLoading, router]);

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      await userAPI.updateProfile({ name, city });
      await userAPI.updatePreferences({
        interests,
        commuteMode,
        healthSensitive,
        notifications,
      });
      // Refresh user from server session
      await loadAuth();
      setMessage("Profile updated successfully!");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setMessage(e.response?.data?.error || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwSaving(true);
    setPwMessage("");
    try {
      await userAPI.changePassword({ currentPassword, newPassword });
      setPwMessage("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setPwMessage(e.response?.data?.error || "Failed to change password");
    } finally {
      setPwSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <User className="h-6 w-6 text-primary" />
          Profile Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account and personalization preferences
        </p>
      </div>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5" />
            General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user.email} disabled className="opacity-60" />
          </div>
        </CardContent>
      </Card>

      {/* Interests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Heart className="h-5 w-5" />
            Interests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Select your interests for personalized recommendations
          </p>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((interest) => (
              <Badge
                key={interest}
                variant={
                  interests.includes(interest) ? "default" : "outline"
                }
                className={`cursor-pointer capitalize text-sm px-3 py-1 transition-colors ${
                  interests.includes(interest)
                    ? "bg-primary hover:bg-primary/80"
                    : "hover:bg-muted"
                }`}
                onClick={() => toggleInterest(interest)}
              >
                {interest}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5" />
            Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Commute Mode</Label>
            <div className="flex gap-2">
              {COMMUTE_MODES.map((mode) => (
                <Button
                  key={mode.value}
                  variant={commuteMode === mode.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCommuteMode(mode.value)}
                >
                  {mode.label}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Health Sensitive</Label>
              <p className="text-xs text-muted-foreground">
                Get extra air quality warnings
              </p>
            </div>
            <Button
              variant={healthSensitive ? "default" : "outline"}
              size="sm"
              onClick={() => setHealthSensitive(!healthSensitive)}
            >
              {healthSensitive ? "ON" : "OFF"}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="flex items-center gap-1.5">
                <Bell className="h-3.5 w-3.5" /> Notifications
              </Label>
              <p className="text-xs text-muted-foreground">
                Smart alerts for weather & pollution
              </p>
            </div>
            <Button
              variant={notifications ? "default" : "outline"}
              size="sm"
              onClick={() => setNotifications(!notifications)}
            >
              {notifications ? "ON" : "OFF"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
        {message && (
          <p
            className={`text-sm ${
              message.includes("success")
                ? "text-green-500"
                : "text-destructive"
            }`}
          >
            {message}
          </p>
        )}
      </div>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" variant="outline" disabled={pwSaving}>
                {pwSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Change Password
              </Button>
              {pwMessage && (
                <p
                  className={`text-sm ${
                    pwMessage.includes("success")
                      ? "text-green-500"
                      : "text-destructive"
                  }`}
                >
                  {pwMessage}
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

