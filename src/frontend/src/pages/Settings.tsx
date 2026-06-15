import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export function Settings() {
  const { clear } = useInternetIdentity();
  const [language, setLanguage] = useState("en");
  const [notifications, setNotifications] = useState({
    messages: true,
    kyc: true,
    transactions: true,
    disputes: true,
    marketing: false,
  });
  const [visibility, setVisibility] = useState({
    showPhone: false,
    showEmail: false,
    showLocation: true,
  });

  const handleSave = () => {
    toast.success("Settings saved successfully");
  };

  const handleDeleteAccount = () => {
    clear();
    toast.success("Account deletion request submitted");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="font-display text-2xl font-bold text-foreground mb-6">
        Settings
      </h1>

      <div className="space-y-6">
        {/* Account Info */}
        <Card className="border-border/60 shadow-card">
          <CardContent className="p-6">
            <h2 className="font-display font-semibold text-foreground mb-4">
              Account Information
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium text-foreground">
                  user@example.com
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Phone</span>
                <span className="font-medium text-foreground">
                  +92 300 *** ****
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Member Since</span>
                <span className="font-medium text-foreground">
                  January 2024
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Visibility */}
        <Card className="border-border/60 shadow-card">
          <CardContent className="p-6">
            <h2 className="font-display font-semibold text-foreground mb-4">
              Profile Visibility
            </h2>
            <div className="space-y-4">
              {[
                {
                  id: "showPhone",
                  label: "Show phone number on profile",
                  key: "showPhone" as const,
                },
                {
                  id: "showEmail",
                  label: "Show email on profile",
                  key: "showEmail" as const,
                },
                {
                  id: "showLocation",
                  label: "Show location/country",
                  key: "showLocation" as const,
                },
              ].map(({ id, label, key }) => (
                <div key={id} className="flex items-center justify-between">
                  <Label htmlFor={id} className="text-sm cursor-pointer">
                    {label}
                  </Label>
                  <Switch
                    id={id}
                    checked={visibility[key]}
                    onCheckedChange={(v) =>
                      setVisibility((prev) => ({ ...prev, [key]: v }))
                    }
                    data-ocid={`settings.${id}_switch`}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card className="border-border/60 shadow-card">
          <CardContent className="p-6">
            <h2 className="font-display font-semibold text-foreground mb-4">
              Notification Preferences
            </h2>
            <div className="space-y-4">
              {[
                {
                  id: "msg-notif",
                  label: "New messages",
                  key: "messages" as const,
                },
                {
                  id: "kyc-notif",
                  label: "KYC status updates",
                  key: "kyc" as const,
                },
                {
                  id: "txn-notif",
                  label: "Transaction updates",
                  key: "transactions" as const,
                },
                {
                  id: "dispute-notif",
                  label: "Dispute updates",
                  key: "disputes" as const,
                },
                {
                  id: "mkt-notif",
                  label: "Marketing & promotions",
                  key: "marketing" as const,
                },
              ].map(({ id, label, key }) => (
                <div key={id} className="flex items-center justify-between">
                  <Label htmlFor={id} className="text-sm cursor-pointer">
                    {label}
                  </Label>
                  <Switch
                    id={id}
                    checked={notifications[key]}
                    onCheckedChange={(v) =>
                      setNotifications((prev) => ({ ...prev, [key]: v }))
                    }
                    data-ocid={`settings.notif_${key}_switch`}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Language */}
        <Card className="border-border/60 shadow-card">
          <CardContent className="p-6">
            <h2 className="font-display font-semibold text-foreground mb-4">
              Language
            </h2>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Platform Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger
                  className="w-44"
                  data-ocid="settings.language_select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ur">اردو (Urdu)</SelectItem>
                  <SelectItem value="ar">العربية (Arabic)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Save button */}
        <Button
          className="w-full gap-2 bg-primary text-primary-foreground"
          onClick={handleSave}
          data-ocid="settings.save_button"
        >
          <Save size={15} />
          Save Settings
        </Button>

        <Separator />

        {/* Danger Zone */}
        <Card className="border-destructive/30 shadow-card">
          <CardContent className="p-6">
            <h2 className="font-display font-semibold text-destructive mb-2 flex items-center gap-2">
              <AlertTriangle size={16} />
              Danger Zone
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Permanently delete your account and all associated data. This
              action cannot be undone.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                  data-ocid="settings.delete_account_button"
                >
                  <Trash2 size={14} />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent data-ocid="settings.delete_dialog">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete your Crossing account, all
                    listings, messages, and transaction history. Active escrow
                    funds will be refunded. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-ocid="settings.delete_cancel_button">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    data-ocid="settings.delete_confirm_button"
                  >
                    Yes, Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
