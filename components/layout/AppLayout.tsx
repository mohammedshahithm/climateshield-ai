"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { 
  ShieldAlert, 
  LayoutDashboard, 
  Map, 
  Bell, 
  Settings, 
  Menu, 
  X,
  User,
  LogOut,
  Search,
  ChevronDown,
  MapPin,
  ClipboardList,
  CheckCircle2,
  RefreshCw,
  Brain,
  Trash2,
  HelpCircle,
  Play,
  AlertTriangle
} from "lucide-react";
import { useAlerts } from "@/lib/AlertsContext";
import toast from "react-hot-toast";
import { useAuthContext } from "@/providers/AuthProvider";
import { useLocation, CityLocation } from "@/providers/LocationContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuthContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadIds, setUnreadIds] = useState<string[]>([]);
  const [locationMenuOpen, setLocationMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const pathname = usePathname();
  const router = useRouter();

  const { alerts, userRole, setUserRole } = useAlerts();
  const { city: location, setLocation, recentLocations } = useLocation();

  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<CityLocation[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchCache = useRef<Record<string, CityLocation[]>>({});

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setSearchLoading(false);
      setSearchError(null);
      return;
    }

    if (searchCache.current[trimmed]) {
      setSuggestions(searchCache.current[trimmed]);
      setSearchLoading(false);
      setSearchError(null);
      return;
    }

    setSearchLoading(true);
    setSearchError(null);

    const delayDebounceFn = setTimeout(async () => {
      try {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=5&language=en&format=json`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error("Failed to fetch location suggestions");
        }
        const data = await res.json();
        const results = (data.results || []).map((item: any) => ({
          name: item.name,
          latitude: item.latitude,
          longitude: item.longitude,
          region: item.admin1 || "",
          country: item.country || "",
        }));

        searchCache.current[trimmed] = results;
        setSuggestions(results);
      } catch (err) {
        console.error("Geocoding error:", err);
        setSearchError("Failed to fetch locations");
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const selectCity = (cityObj: CityLocation) => {
    setLocation(cityObj.name, cityObj.latitude, cityObj.longitude, cityObj.region, cityObj.country);
    setSearchQuery("");
    setShowSuggestions(false);
    toast.success(`Location updated to ${cityObj.name}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0) {
        selectCity(suggestions[0]);
      } else if (!searchLoading) {
        toast.error(`No matches found for "${searchQuery}".`);
      }
    }
  };

  // Load latest active alerts as notifications
  const recentActiveAlerts = useMemo(() => alerts.filter(a => a.status === "Active").slice(0, 5), [alerts]);

  useEffect(() => {
    // Whenever new active alerts come in, if they aren't read yet, we'll mark them as unread for the demo.
    // In a real app we'd track read state properly.
    const activeIds = recentActiveAlerts.map(a => a.id);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUnreadIds(prev => {
      const newUnread = activeIds.filter(id => !prev.includes(id));
      return [...prev, ...newUnread];
    });
  }, [recentActiveAlerts]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setLocationMenuOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = (id: string) => {
    setUnreadIds(prev => prev.filter(uid => uid !== id));
  };

  const markAllAsRead = () => {
    setUnreadIds([]);
    toast.success("All notifications marked as read");
  };

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    markAsRead(id);
    // Real implementation would also remove it from context/backend
    toast.success("Notification deleted");
  };

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Assessment", href: "/dashboard/assessment", icon: ClipboardList },
    { name: "Risk Maps", href: "/dashboard/risk-maps", icon: Map },
    { name: "Incidents", href: "/dashboard/incidents", icon: AlertTriangle },
    { name: "Alerts", href: "/dashboard/alerts", icon: Bell },
    { name: "AI Assistant", href: "/dashboard/ai-intelligence", icon: Brain },
    ...(userRole === "admin" ? [{ name: "Admin Center", href: "/dashboard/admin", icon: Settings }] : []),
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? "block" : "hidden"}`}>
        <div className="fixed inset-0 bg-secondary-950/80 backdrop-blur-sm transition-opacity" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-secondary-900 shadow-xl flex flex-col transform transition-transform duration-300">
          <div className="flex items-center justify-between h-16 px-4 bg-secondary-950">
            <Link href="/" className="flex items-center gap-2 text-white">
              <ShieldAlert className="h-6 w-6 text-primary-400" />
              <span className="font-bold text-lg tracking-tight">ClimateShield</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="text-secondary-200 hover:text-white">
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                    isActive 
                      ? "bg-primary-500 text-white" 
                      : "text-secondary-100 hover:bg-secondary-800 hover:text-white"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-secondary-800">
            <button onClick={logout} className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-secondary-100 hover:bg-secondary-800 transition-colors text-left">
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-secondary-900 border-r border-secondary-800">
        <div className="flex items-center h-16 px-6 bg-secondary-950">
          <Link href="/" className="flex items-center gap-2 text-white">
            <ShieldAlert className="h-6 w-6 text-primary-400" />
            <span className="font-bold text-lg tracking-tight">ClimateShield</span>
          </Link>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                  isActive 
                    ? "bg-primary-500/10 text-primary-400 font-medium" 
                    : "text-secondary-200 hover:bg-secondary-800/50 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </div>
                {item.name === "Alerts" && unreadIds.length > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {unreadIds.length}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-secondary-800/50 flex flex-col gap-3">
          {/* RBAC Toggle Button for Testing */}
          <button 
            onClick={() => setUserRole(userRole === "admin" ? "citizen" : "admin")}
            className="flex items-center justify-center gap-2 w-full py-1.5 px-2 rounded bg-secondary-800 text-xs text-secondary-300 hover:text-white hover:bg-secondary-700 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Switch to {userRole === "admin" ? "Citizen" : "Admin"} Role
          </button>

          <div className="flex items-center justify-between px-1 py-1">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 shrink-0">
                <User className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate capitalize">{userRole} User</p>
                <p className="text-xs text-secondary-400 truncate">{userRole}@example.com</p>
              </div>
            </div>
            <button onClick={logout} className="text-secondary-400 hover:text-white transition-colors" title="Sign Out">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:pl-64">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40 gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 focus:outline-none shrink-0"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Search Bar */}
          <div className="flex-1 flex items-center max-w-2xl relative" ref={searchRef}>
            <div className="hidden lg:flex w-full">
              <div className="relative w-full text-gray-400 focus-within:text-gray-600 transition-colors">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="h-5 w-5" />
                </div>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setShowSuggestions(true)}
                  className="block w-full h-10 pl-10 pr-3 border border-gray-200 text-gray-900 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white sm:text-sm transition-all" 
                  placeholder="Search locations (e.g. London, Tokyo, New York)..." 
                />
                
                {/* Suggestions Dropdown */}
                {showSuggestions && (searchLoading || searchError || suggestions.length > 0) && (
                  <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in slide-in-from-top-2 max-h-60 overflow-y-auto">
                    {searchLoading && (
                      <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary-500 border-t-transparent shrink-0" />
                        Searching locations...
                      </div>
                    )}
                    {searchError && (
                      <div className="px-4 py-3 text-sm text-red-500">
                        {searchError}
                      </div>
                    )}
                    {!searchLoading && !searchError && suggestions.length > 0 && (
                      <>
                        <div className="px-3 py-2 border-b border-gray-100 bg-gray-50/50">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Matching Cities</p>
                        </div>
                        {suggestions.map((city, idx) => (
                          <button
                            key={`${city.name}-${idx}`}
                            onClick={() => selectCity(city)}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors text-gray-700 flex items-center justify-between"
                          >
                            <span className="font-medium flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-primary-500 shrink-0" />
                              <span>
                                {city.name}
                                {(city.region || city.country) && (
                                  <span className="text-xs text-gray-400 font-normal ml-1.5">
                                    {city.region ? `${city.region}, ` : ""}{city.country}
                                  </span>
                                )}
                              </span>
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              {city.latitude.toFixed(4)}°N, {city.longitude.toFixed(4)}°E
                            </span>
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="relative hidden sm:block" ref={locationRef}>
              <button 
                onClick={() => setLocationMenuOpen(!locationMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all"
              >
                <MapPin className="h-4 w-4 text-primary-500" />
                <span className="text-sm font-medium text-gray-700">{location}</span>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${locationMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {locationMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in slide-in-from-top-2 max-h-72 overflow-y-auto">
                  <div className="px-3 py-2 border-b border-gray-100 bg-gray-50/50">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Recent Locations</p>
                  </div>
                  {recentLocations.map((cityObj, idx) => (
                    <button
                      key={`${cityObj.name}-${cityObj.latitude}-${idx}`}
                      onClick={() => {
                        setLocation(cityObj.name, cityObj.latitude, cityObj.longitude, cityObj.region, cityObj.country);
                        setLocationMenuOpen(false);
                        toast.success(`Location updated to ${cityObj.name}`);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-gray-50 transition-colors ${location === cityObj.name ? 'text-primary-600 font-medium bg-primary-50/50' : 'text-gray-700'}`}
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold truncate">{cityObj.name}</span>
                        {(cityObj.region || cityObj.country) && (
                          <span className="text-[10px] text-gray-400 truncate">
                            {cityObj.region ? `${cityObj.region}, ` : ""}{cityObj.country}
                          </span>
                        )}
                      </div>
                      {location === cityObj.name && <CheckCircle2 className="h-4 w-4 text-primary-500 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>

            {/* Notification Center */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className={`p-2 relative transition-colors rounded-full ${notificationsOpen ? 'bg-primary-50 text-primary-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
              >
                <Bell className="h-5 w-5" />
                {unreadIds.length > 0 && (
                  <span className="absolute top-1 right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 ring-2 ring-white"></span>
                  </span>
                )}
              </button>

              {/* Dropdown Menu */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h3 className="font-bold text-gray-900">Notifications</h3>
                    {unreadIds.length > 0 && (
                      <button onClick={markAllAsRead} className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {recentActiveAlerts.length > 0 ? (
                      recentActiveAlerts.map(alert => {
                        const isUnread = unreadIds.includes(alert.id);
                        return (
                          <div 
                            key={alert.id} 
                            onClick={() => {
                              markAsRead(alert.id);
                              // In a real app we might redirect to details
                            }}
                            className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${isUnread ? 'bg-blue-50/30' : ''}`}
                          >
                            <div className="flex gap-3">
                              <div className="shrink-0 mt-1">
                                {isUnread ? (
                                  <div className="h-2 w-2 rounded-full bg-primary-500"></div>
                                ) : (
                                  <div className="h-2 w-2 rounded-full border-2 border-gray-300"></div>
                                )}
                              </div>
                              <div>
                                <p className={`text-sm ${isUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                                  {alert.title}
                                </p>
                                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{alert.description}</p>
                                <div className="flex items-center justify-between mt-2">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                      alert.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                                      alert.severity === 'High' ? 'bg-orange-100 text-orange-700' :
                                      'bg-yellow-100 text-yellow-700'
                                    }`}>{alert.severity}</span>
                                    <span className="text-[10px] text-gray-400">{alert.timestamp}</span>
                                  </div>
                                  <button onClick={(e) => deleteNotification(alert.id, e)} className="text-gray-400 hover:text-red-500">
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        <Bell className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                        <p className="text-sm">No new notifications</p>
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-gray-50 text-center border-t border-gray-100">
                    <Link href="/dashboard/alerts" onClick={() => setNotificationsOpen(false)} className="text-sm font-bold text-primary-600 hover:text-primary-700">
                      View All Alerts
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={profileRef}>
              <div 
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="h-8 w-8 rounded-full overflow-hidden border-2 border-gray-100 hover:border-primary-500 transition-all cursor-pointer bg-gray-100 flex items-center justify-center shrink-0"
              >
                <Image src={`https://ui-avatars.com/api/?name=${userRole}+User&background=10b981&color=fff`} alt="Avatar" width={32} height={32} unoptimized className="h-full w-full object-cover" />
              </div>
              
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                    <p className="text-sm font-bold text-gray-900 capitalize">{userRole} User</p>
                    <p className="text-xs text-gray-500 truncate">{userRole}@example.com</p>
                  </div>
                  
                  <div className="py-1">
                    <button 
                      onClick={() => {
                        setProfileMenuOpen(false);
                        setProfileModalOpen(true);
                      }} 
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors flex items-center gap-2"
                    >
                      <User className="h-4 w-4" /> Profile
                    </button>
                    <button 
                      onClick={() => {
                        setProfileMenuOpen(false);
                        router.push("/dashboard/settings");
                      }} 
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors flex items-center gap-2"
                    >
                      <Settings className="h-4 w-4" /> My Settings
                    </button>
                    <button 
                      onClick={() => {
                        setProfileMenuOpen(false);
                        setNotificationsOpen(true);
                      }} 
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2"><Bell className="h-4 w-4" /> Notifications</span>
                      {unreadIds.length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadIds.length}</span>}
                    </button>
                    <button 
                      onClick={() => {
                        setProfileMenuOpen(false);
                        toast("Help Center is coming soon!");
                      }} 
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors flex items-center gap-2"
                    >
                      <HelpCircle className="h-4 w-4" /> Help Center
                    </button>
                    <button 
                      onClick={() => {
                        toast.success("Demo Mode Activated!");
                        setProfileMenuOpen(false);
                      }} 
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors flex items-center gap-2"
                    >
                      <Play className="h-4 w-4 text-green-500" /> Demo Mode
                    </button>
                  </div>
                  
                  <div className="border-t border-gray-100 py-1">
                    <button 
                      onClick={logout} 
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      {/* Profile Modal */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-secondary-900/60 backdrop-blur-sm" onClick={() => setProfileModalOpen(false)}></div>
          <div className="bg-white rounded-2xl w-full max-w-sm relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <User className="h-5 w-5 text-primary-500" /> My Profile
              </h3>
              <button onClick={() => setProfileModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-center mb-6">
                <div className="h-20 w-20 rounded-full overflow-hidden border-4 border-primary-100 bg-gray-100">
                  <Image src={`https://ui-avatars.com/api/?name=${userRole}+User&background=10b981&color=fff&size=128`} alt="Avatar" width={80} height={80} unoptimized className="h-full w-full object-cover" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500">Name</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">{userRole} User</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500">Email</span>
                  <span className="text-sm font-medium text-gray-900">{userRole}@example.com</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500">Role</span>
                  <span className="text-sm font-medium text-primary-600 uppercase tracking-wider">{userRole}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-500">Location</span>
                  <span className="text-sm font-medium text-gray-900">{location}</span>
                </div>
              </div>
              <div className="pt-4">
                <button 
                  onClick={() => {
                    setProfileModalOpen(false);
                    router.push("/dashboard/settings");
                  }}
                  className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-lg transition-colors text-sm border border-gray-200"
                >
                  Edit in Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
