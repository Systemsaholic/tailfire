"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  Edit,
  Key,
  Lock,
  Plus,
  Save,
  Settings,
  Shield,
  User,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Label,
  Input,
  Switch,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Separator,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@tailfire/ui-public";

export default function SettingsPage() {
  const [editMode, setEditMode] = useState(false);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button
                variant="ghost"
                size="icon"
                className="text-phoenix-text-muted hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back to Dashboard</span>
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-white">Account Settings</h1>
          </div>
          <p className="text-phoenix-text-muted mt-1 ml-10">
            Manage your account details, security, and preferences
          </p>
        </div>
        <div className="ml-10 sm:ml-0">
          {editMode ? (
            <Button className="btn-phoenix-primary" onClick={() => setEditMode(false)}>
              <Save className="h-4 w-4 mr-2" /> Save Changes
            </Button>
          ) : (
            <Button
              variant="outline"
              className="border-phoenix-gold/30 text-phoenix-gold hover:bg-phoenix-gold/10"
              onClick={() => setEditMode(true)}
            >
              <Edit className="h-4 w-4 mr-2" /> Edit Settings
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="bg-phoenix-charcoal/50 border border-phoenix-gold/30 p-1 w-full sm:w-auto">
          <TabsTrigger
            value="profile"
            className="data-[state=active]:bg-phoenix-gold data-[state=active]:text-white text-phoenix-text-light"
          >
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="data-[state=active]:bg-phoenix-gold data-[state=active]:text-white text-phoenix-text-light"
          >
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger
            value="billing"
            className="data-[state=active]:bg-phoenix-gold data-[state=active]:text-white text-phoenix-text-light"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Billing
          </TabsTrigger>
          <TabsTrigger
            value="advanced"
            className="data-[state=active]:bg-phoenix-gold data-[state=active]:text-white text-phoenix-text-light"
          >
            <Settings className="h-4 w-4 mr-2" />
            Advanced
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="pt-6 space-y-6">
          <Card className="bg-phoenix-charcoal/50 border-phoenix-gold/30">
            <CardHeader>
              <CardTitle className="text-white">Profile Information</CardTitle>
              <CardDescription className="text-phoenix-text-muted">
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex flex-col items-center">
                  <Avatar className="h-32 w-32 border-2 border-phoenix-gold">
                    <AvatarImage src="/professional-headshot.png" alt="John Doe" />
                    <AvatarFallback className="bg-phoenix-gold text-white text-2xl">JD</AvatarFallback>
                  </Avatar>
                  <div className="mt-4 space-y-2">
                    <Button
                      variant="outline"
                      className="w-full border-phoenix-gold/50 text-phoenix-gold hover:bg-phoenix-gold/10"
                      disabled={!editMode}
                    >
                      Change Photo
                    </Button>
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-phoenix-text-light">First Name</Label>
                      <Input
                        defaultValue="John"
                        className="bg-phoenix-charcoal/50 border-phoenix-gold/30 text-white"
                        disabled={!editMode}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-phoenix-text-light">Last Name</Label>
                      <Input
                        defaultValue="Doe"
                        className="bg-phoenix-charcoal/50 border-phoenix-gold/30 text-white"
                        disabled={!editMode}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-phoenix-text-light">Email Address</Label>
                    <Input
                      type="email"
                      defaultValue="john.doe@example.com"
                      className="bg-phoenix-charcoal/50 border-phoenix-gold/30 text-white"
                      disabled={!editMode}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-phoenix-text-light">Phone Number</Label>
                    <Input
                      type="tel"
                      defaultValue="+1 (555) 123-4567"
                      className="bg-phoenix-charcoal/50 border-phoenix-gold/30 text-white"
                      disabled={!editMode}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-phoenix-charcoal/50 border-phoenix-gold/30">
            <CardHeader>
              <CardTitle className="text-white">Communication Preferences</CardTitle>
              <CardDescription className="text-phoenix-text-muted">
                Manage how we contact you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white">Email Notifications</Label>
                  <p className="text-xs text-phoenix-text-muted">
                    Receive trip updates and important information
                  </p>
                </div>
                <Switch defaultChecked disabled={!editMode} />
              </div>
              <Separator className="bg-phoenix-gold/30" />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white">SMS Notifications</Label>
                  <p className="text-xs text-phoenix-text-muted">
                    Receive text messages for urgent updates
                  </p>
                </div>
                <Switch defaultChecked disabled={!editMode} />
              </div>
              <Separator className="bg-phoenix-gold/30" />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white">Marketing Communications</Label>
                  <p className="text-xs text-phoenix-text-muted">
                    Receive special offers and promotions
                  </p>
                </div>
                <Switch disabled={!editMode} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="pt-6 space-y-6">
          <Card className="bg-phoenix-charcoal/50 border-phoenix-gold/30">
            <CardHeader>
              <CardTitle className="text-white">Password</CardTitle>
              <CardDescription className="text-phoenix-text-muted">
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-phoenix-text-light">Current Password</Label>
                <div className="relative">
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="bg-phoenix-charcoal/50 border-phoenix-gold/30 text-white pr-10"
                    disabled={!editMode}
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-phoenix-text-muted" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-phoenix-text-light">New Password</Label>
                <div className="relative">
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="bg-phoenix-charcoal/50 border-phoenix-gold/30 text-white pr-10"
                    disabled={!editMode}
                  />
                  <Key className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-phoenix-text-muted" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-phoenix-text-light">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="bg-phoenix-charcoal/50 border-phoenix-gold/30 text-white pr-10"
                    disabled={!editMode}
                  />
                  <Key className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-phoenix-text-muted" />
                </div>
              </div>
              <div className="pt-2">
                <Button className="btn-phoenix-primary" disabled={!editMode}>
                  Update Password
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-phoenix-charcoal/50 border-phoenix-gold/30">
            <CardHeader>
              <CardTitle className="text-white">Two-Factor Authentication</CardTitle>
              <CardDescription className="text-phoenix-text-muted">
                Add an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white">Two-Factor Authentication</Label>
                  <p className="text-xs text-phoenix-text-muted">
                    Require a verification code when signing in from an unknown device
                  </p>
                </div>
                <Switch defaultChecked disabled={!editMode} />
              </div>
              <Separator className="bg-phoenix-gold/30" />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white">Login Notifications</Label>
                  <p className="text-xs text-phoenix-text-muted">
                    Receive email notifications when your account is accessed from a new device
                  </p>
                </div>
                <Switch defaultChecked disabled={!editMode} />
              </div>
            </CardContent>
            <CardFooter className="border-t border-phoenix-gold/30 flex justify-between bg-phoenix-charcoal/30">
              <div className="flex items-center text-sm text-phoenix-text-muted">
                <Shield className="h-4 w-4 mr-2 text-green-500" />
                Your account is protected with two-factor authentication
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="pt-6 space-y-6">
          <Card className="bg-phoenix-charcoal/50 border-phoenix-gold/30">
            <CardHeader>
              <CardTitle className="text-white">Payment Methods</CardTitle>
              <CardDescription className="text-phoenix-text-muted">
                Manage your saved payment methods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-md bg-phoenix-gold/10 border border-phoenix-gold/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-8 w-8 text-phoenix-gold" />
                  <div>
                    <p className="font-medium text-white">Visa ending in 4567</p>
                    <p className="text-sm text-phoenix-text-muted">Expires 05/27</p>
                  </div>
                </div>
                <Badge className="bg-phoenix-gold/20 text-phoenix-gold border border-phoenix-gold/30">
                  Default
                </Badge>
              </div>
              <div className="p-3 rounded-md bg-phoenix-charcoal/30 border border-phoenix-gold/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-8 w-8 text-phoenix-text-muted" />
                  <div>
                    <p className="font-medium text-white">Mastercard ending in 8901</p>
                    <p className="text-sm text-phoenix-text-muted">Expires 09/26</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-phoenix-gold/30 text-phoenix-gold hover:bg-phoenix-gold/10"
                    disabled={!editMode}
                  >
                    Set Default
                  </Button>
                </div>
              </div>
              <Button className="btn-phoenix-primary mt-2" disabled={!editMode}>
                <Plus className="h-4 w-4 mr-2" /> Add Payment Method
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="pt-6 space-y-6">
          <Card className="bg-phoenix-charcoal/50 border-phoenix-gold/30">
            <CardHeader>
              <CardTitle className="text-white">Language & Region</CardTitle>
              <CardDescription className="text-phoenix-text-muted">
                Set your preferred language and regional settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-phoenix-text-light">Language</Label>
                  <Select disabled={!editMode} defaultValue="en">
                    <SelectTrigger className="bg-phoenix-charcoal/50 border-phoenix-gold/30 text-white">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent className="bg-phoenix-charcoal border-phoenix-gold/30 text-white">
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-phoenix-text-light">Currency</Label>
                  <Select disabled={!editMode} defaultValue="usd">
                    <SelectTrigger className="bg-phoenix-charcoal/50 border-phoenix-gold/30 text-white">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent className="bg-phoenix-charcoal border-phoenix-gold/30 text-white">
                      <SelectItem value="usd">USD ($)</SelectItem>
                      <SelectItem value="eur">EUR (€)</SelectItem>
                      <SelectItem value="gbp">GBP (£)</SelectItem>
                      <SelectItem value="cad">CAD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-phoenix-charcoal/50 border-phoenix-gold/30">
            <CardHeader>
              <CardTitle className="text-white">Account Actions</CardTitle>
              <CardDescription className="text-phoenix-text-muted">
                Manage your account status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-md bg-phoenix-gold/5 border border-phoenix-gold/20">
                <h3 className="text-lg font-medium text-white">Deactivate Account</h3>
                <p className="text-sm text-phoenix-text-muted mt-1">
                  Temporarily deactivate your account. You can reactivate it at any time by signing in.
                </p>
                <Button
                  variant="outline"
                  className="mt-4 border-phoenix-gold/30 text-phoenix-gold hover:bg-phoenix-gold/10"
                  disabled={!editMode}
                >
                  Deactivate Account
                </Button>
              </div>
              <div className="p-4 rounded-md bg-red-900/10 border border-red-900/20">
                <h3 className="text-lg font-medium text-white">Delete Account</h3>
                <p className="text-sm text-phoenix-text-muted mt-1">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <Button
                  variant="destructive"
                  className="mt-4 bg-red-600 hover:bg-red-700 text-white"
                  disabled={!editMode}
                >
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
