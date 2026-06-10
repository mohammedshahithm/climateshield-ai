"use client";

import React, { useState, useEffect } from "react";
import { 
  User, Bell, Shield, Database, Activity, Moon, Sun, 
  CheckCircle2, Save, X, Monitor, Smartphone, Mail, AlertTriangle, Cloud, ThermometerSun, Droplets, Building, Key, Download, Trash2, MapPin
} from "lucide-react";
import { useTheme } from "next-themes";
import toast from "react-hot-toast";

// Initial default states
const defaultProfile = {
  fullName: "Jane Doe",
  email: "jane.doe@example.gov",
  phone: "+1 (555) 012-3456",
  organization: "Emergency Management Dept"
};

const defaultNotifications = {
  sms: true,
  email: true,
  push: false,
  emergencyOnly: false
};

const defaultRiskMonitoring = {
  flood: true,
  heatwave: true,
  airQuality: false,
  infrastructure: true
};

export default function SettingsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const { setTheme } = useTheme();

  // States
  const [profile, setProfile] = useState(defaultProfile);
  const [notifications, setNotifications] = useState(defaultNotifications);
  const [riskMonitoring, setRiskMonitoring] = useState(defaultRiskMonitoring);
  const [appearance, setAppearance] = useState("system");
  const [twoFactor, setTwoFactor] = useState(false);

  // Modals
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    // Load from localStorage on mount
    const savedProfile = localStorage.getItem("cs_profile");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (savedProfile) setProfile(JSON.parse(savedProfile));

    const savedNotifs = localStorage.getItem("cs_notifications");
    if (savedNotifs) setNotifications(JSON.parse(savedNotifs));

    const savedRisks = localStorage.getItem("cs_risk_monitoring");
    if (savedRisks) setRiskMonitoring(JSON.parse(savedRisks));

    const savedApp = localStorage.getItem("cs_appearance");
    if (savedApp) setAppearance(savedApp);

    const saved2fa = localStorage.getItem("cs_2fa");
    if (saved2fa) setTwoFactor(JSON.parse(saved2fa));

    setIsMounted(true);
  }, []);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("cs_profile", JSON.stringify(profile));
    toast.success("Profile settings saved successfully");
  };

  const toggleNotification = (key: keyof typeof defaultNotifications) => {
    const newNotifs = { ...notifications, [key]: !notifications[key] };
    setNotifications(newNotifs);
    localStorage.setItem("cs_notifications", JSON.stringify(newNotifs));
    toast.success("Notification preferences updated.");
  };

  const toggleRisk = (key: keyof typeof defaultRiskMonitoring) => {
    const newRisks = { ...riskMonitoring, [key]: !riskMonitoring[key] };
    setRiskMonitoring(newRisks);
    localStorage.setItem("cs_risk_monitoring", JSON.stringify(newRisks));
    toast.success("Risk monitoring preferences updated.");
  };

  const changeAppearance = (val: string) => {
    setAppearance(val);
    setTheme(val);
    localStorage.setItem("cs_appearance", val);
    toast.success(`Appearance changed to ${val}.`);
  };

  const toggle2FA = () => {
    const newVal = !twoFactor;
    setTwoFactor(newVal);
    localStorage.setItem("cs_2fa", JSON.stringify(newVal));
    toast.success(newVal ? "Two-Factor Authentication enabled." : "Two-Factor Authentication disabled.");
  };

  const exportUserData = () => {
    const data = {
      profile,
      notifications,
      riskMonitoring,
      appearance,
      twoFactor
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "climateshield_user_data.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("User data exported successfully.");
  };

  const downloadHistory = () => {
    // Mocking an assessment history CSV download
    const csvContent = "data:text/csv;charset=utf-8,Date,Type,Location,Risk Level\n2026-06-01,Flood,Washington DC,High\n2026-06-05,Heatwave,Washington DC,Medium";
    const encodedUri = encodeURI(csvContent);
    const a = document.createElement("a");
    a.href = encodedUri;
    a.download = "assessment_history.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Assessment history downloaded.");
  };

  const handleDeleteAccount = () => {
    localStorage.clear();
    setIsDeleteModalOpen(false);
    toast.success("Account deleted. (Simulation)");
    // In a real app, this would redirect to login or signup
  };

  const tabs = [
    { id: "profile", label: "User Profile", icon: <User className="w-5 h-5" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="w-5 h-5" /> },
    { id: "risk", label: "Risk Monitoring", icon: <Activity className="w-5 h-5" /> },
    { id: "appearance", label: "Appearance", icon: <Sun className="w-5 h-5" /> },
    { id: "security", label: "Security", icon: <Shield className="w-5 h-5" /> },
    { id: "data", label: "Data Management", icon: <Database className="w-5 h-5" /> }
  ];

  if (!isMounted) return null; // Avoid hydration mismatch

  return (
    <div className="space-y-6 relative pb-10">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings & User Management</h1>
        <p className="text-sm text-gray-500">Configure your account, preferences, and system behavior.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1 space-y-2">
          <nav className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="md:col-span-3 space-y-6">
          
          {/* User Profile */}
          {activeTab === "profile" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">User Profile</h2>
                <p className="text-sm text-gray-500 mt-1">Update your personal information and contact details.</p>
              </div>
              <form onSubmit={handleProfileSave} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      type="text"
                      value={profile.fullName}
                      onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Email Address</label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Phone Number</label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">Organization</label>
                    <input
                      type="text"
                      value={profile.organization || ''}
                      onChange={(e) => setProfile({ ...profile, organization: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    />
                  </div>
                </div>
                <div className="pt-4 flex justify-end">
                  <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm">
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Notifications */}
          {activeTab === "notifications" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Notification Preferences</h2>
                <p className="text-sm text-gray-500 mt-1">Manage how and when you receive alerts.</p>
              </div>
              <div className="p-6 space-y-6">
                <ToggleRow 
                  title="SMS Alerts" 
                  description="Receive instant text messages for critical events."
                  icon={<Smartphone className="w-5 h-5 text-gray-500" />}
                  checked={notifications.sms}
                  onChange={() => toggleNotification("sms")}
                />
                <ToggleRow 
                  title="Email Alerts" 
                  description="Daily summaries and detailed reports."
                  icon={<Mail className="w-5 h-5 text-gray-500" />}
                  checked={notifications.email}
                  onChange={() => toggleNotification("email")}
                />
                <ToggleRow 
                  title="Push Notifications" 
                  description="Browser notifications for real-time updates."
                  icon={<Bell className="w-5 h-5 text-gray-500" />}
                  checked={notifications.push}
                  onChange={() => toggleNotification("push")}
                />
                <ToggleRow 
                  title="Emergency Alerts Only" 
                  description="Mute non-critical updates. Only receive extreme weather warnings."
                  icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
                  checked={notifications.emergencyOnly}
                  onChange={() => toggleNotification("emergencyOnly")}
                />
              </div>
            </div>
          )}

          {/* Risk Monitoring */}
          {activeTab === "risk" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Risk Monitoring Preferences</h2>
                <p className="text-sm text-gray-500 mt-1">Select the environmental factors you want to track.</p>
              </div>
              <div className="p-6 space-y-6">
                <ToggleRow 
                  title="Flood Risk" 
                  description="Monitor rising water levels and coastal threats."
                  icon={<Droplets className="w-5 h-5 text-blue-500" />}
                  checked={riskMonitoring.flood}
                  onChange={() => toggleRisk("flood")}
                />
                <ToggleRow 
                  title="Heatwave" 
                  description="Track extreme temperature anomalies."
                  icon={<ThermometerSun className="w-5 h-5 text-orange-500" />}
                  checked={riskMonitoring.heatwave}
                  onChange={() => toggleRisk("heatwave")}
                />
                <ToggleRow 
                  title="Air Quality" 
                  description="Pollution, smoke, and particulate matter tracking."
                  icon={<Cloud className="w-5 h-5 text-gray-500" />}
                  checked={riskMonitoring.airQuality}
                  onChange={() => toggleRisk("airQuality")}
                />
                <ToggleRow 
                  title="Infrastructure" 
                  description="Vulnerabilities to power grids and transportation."
                  icon={<Building className="w-5 h-5 text-slate-500" />}
                  checked={riskMonitoring.infrastructure}
                  onChange={() => toggleRisk("infrastructure")}
                />
              </div>
            </div>
          )}

          {/* Appearance */}
          {activeTab === "appearance" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Appearance</h2>
                <p className="text-sm text-gray-500 mt-1">Customize the interface theme.</p>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button 
                  onClick={() => changeAppearance("light")}
                  className={`flex flex-col items-center justify-center p-6 border-2 rounded-xl transition-all ${appearance === "light" ? "border-primary-600 bg-primary-50" : "border-gray-200 hover:border-primary-300"}`}
                >
                  <Sun className={`w-8 h-8 mb-3 ${appearance === "light" ? "text-primary-600" : "text-gray-400"}`} />
                  <span className={`font-medium ${appearance === "light" ? "text-primary-700" : "text-gray-600"}`}>Light Mode</span>
                </button>
                <button 
                  onClick={() => changeAppearance("dark")}
                  className={`flex flex-col items-center justify-center p-6 border-2 rounded-xl transition-all ${appearance === "dark" ? "border-primary-600 bg-primary-50" : "border-gray-200 hover:border-primary-300"}`}
                >
                  <Moon className={`w-8 h-8 mb-3 ${appearance === "dark" ? "text-primary-600" : "text-gray-400"}`} />
                  <span className={`font-medium ${appearance === "dark" ? "text-primary-700" : "text-gray-600"}`}>Dark Mode</span>
                </button>
                <button 
                  onClick={() => changeAppearance("system")}
                  className={`flex flex-col items-center justify-center p-6 border-2 rounded-xl transition-all ${appearance === "system" ? "border-primary-600 bg-primary-50" : "border-gray-200 hover:border-primary-300"}`}
                >
                  <Monitor className={`w-8 h-8 mb-3 ${appearance === "system" ? "text-primary-600" : "text-gray-400"}`} />
                  <span className={`font-medium ${appearance === "system" ? "text-primary-700" : "text-gray-600"}`}>System Default</span>
                </button>
              </div>
            </div>
          )}

          {/* Security */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900">Security Settings</h2>
                  <p className="text-sm text-gray-500 mt-1">Manage your password and authentication methods.</p>
                </div>
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Key className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">Account Password</h3>
                        <p className="text-sm text-gray-500 mt-1">Last changed 3 months ago.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsPasswordModalOpen(true)}
                      className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                    >
                      Change Password
                    </button>
                  </div>
                  
                  <div className="pt-6 border-t border-gray-100">
                    <ToggleRow 
                      title="Two-Factor Authentication (2FA)" 
                      description="Add an extra layer of security to your account using an authenticator app."
                      icon={<Shield className="w-5 h-5 text-gray-500" />}
                      checked={twoFactor}
                      onChange={toggle2FA}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900">Login Activity</h2>
                </div>
                <div className="p-0">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Device</th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Recent Activity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">MacBook Pro 16&quot;</td>
                        <td className="px-6 py-4 text-sm text-gray-500">Washington, DC</td>
                        <td className="px-6 py-4 text-sm text-green-600 font-medium">Active now</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">iPhone 14 Pro</td>
                        <td className="px-6 py-4 text-sm text-gray-500">Washington, DC</td>
                        <td className="px-6 py-4 text-sm text-gray-500">2 hours ago</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Data Management */}
          {activeTab === "data" && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900">Data Management</h2>
                  <p className="text-sm text-gray-500 mt-1">Export your data or manage your assessment history.</p>
                </div>
                <div className="p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Export User Data</h3>
                      <p className="text-sm text-gray-500 mt-1">Download all your personal settings and profile data in JSON format.</p>
                    </div>
                    <button 
                      onClick={exportUserData}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm shrink-0"
                    >
                      <Download className="w-4 h-4" />
                      Export JSON
                    </button>
                  </div>
                  
                  <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Assessment History</h3>
                      <p className="text-sm text-gray-500 mt-1">Download your historical risk assessments as a CSV file.</p>
                    </div>
                    <button 
                      onClick={downloadHistory}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm shrink-0"
                    >
                      <Download className="w-4 h-4" />
                      Download CSV
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 rounded-2xl border border-red-100 overflow-hidden">
                <div className="p-6">
                  <h2 className="text-lg font-bold text-red-900">Danger Zone</h2>
                  <p className="text-sm text-red-700 mt-1">Permanently delete your account and all associated data.</p>
                  
                  <div className="mt-6">
                    <button 
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Change Password</h3>
              <button onClick={() => setIsPasswordModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              setIsPasswordModalOpen(false);
              toast.success("Password updated successfully");
            }} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Current Password</label>
                <input type="password" required className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">New Password</label>
                <input type="password" required className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
                <input type="password" required className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsPasswordModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm">
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Account?</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete your account? This action cannot be undone and all your assessment history and settings will be permanently removed.
              </p>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200">
                  Cancel
                </button>
                <button type="button" onClick={handleDeleteAccount} className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm">
                  Yes, Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleRow({ title, description, icon, checked, onChange }: { title: string, description: string, icon: React.ReactNode, checked: boolean, onChange: () => void }) {
  return (
    <div className="flex items-start sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 sm:mt-0 p-2 bg-gray-50 rounded-lg">
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-bold text-gray-900">{title}</h4>
          <p className="text-sm text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-2 sm:mt-0">
        <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
      </label>
    </div>
  );
}
