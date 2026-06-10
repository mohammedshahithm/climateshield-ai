"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  MapPin, 
  ActivitySquare, CloudRain, Wind, ThermometerSun,
  Droplets, ArrowRight, Siren, PhoneCall, Sun, FileX, CloudLightning
} from "lucide-react";
import { useAlerts } from "@/lib/AlertsContext";
import { AlertCategory, Severity } from "@/lib/mockAlerts";
import { X, Upload, CheckCircle2, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isEvacuationModalOpen, setIsEvacuationModalOpen] = useState(false);
  const [isContactsModalOpen, setIsContactsModalOpen] = useState(false);
  
  const { alerts, location } = useAlerts();

  // Top 3 active alerts for the dashboard widget
  const topActiveAlerts = alerts.filter(a => a.status === "Active").slice(0, 3);

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const getCategoryIcon = (category: AlertCategory) => {
    switch(category) {
      case "Flood Risk": return <Droplets className="h-5 w-5 text-blue-600" />;
      case "Heatwave": return <ThermometerSun className="h-5 w-5 text-red-600" />;
      case "Air Quality": return <Wind className="h-5 w-5 text-gray-500" />;
      case "Infrastructure Failure": return <ActivitySquare className="h-5 w-5 text-purple-600" />;
      case "Cyclone Warning": return <CloudLightning className="h-5 w-5 text-indigo-600" />;
      case "Heavy Rainfall": return <CloudRain className="h-5 w-5 text-blue-400" />;
    }
  };

  const getSeverityBgColor = (severity: Severity) => {
    switch(severity) {
      case "Critical": return "bg-red-100";
      case "High": return "bg-orange-100";
      case "Moderate": return "bg-yellow-100";
      case "Low": return "bg-green-100";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded-lg mb-2"></div>
          <div className="h-4 w-64 bg-gray-200 rounded-lg"></div>
        </div>
        
        {/* Weather Skeleton */}
        <div className="h-28 bg-gray-200 rounded-2xl w-full"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 h-40">
              <div className="flex justify-between items-start mb-4">
                <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
              </div>
              <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 w-16 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[400px] bg-gray-200 rounded-2xl"></div>
          <div className="h-[400px] bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Citizen Dashboard</h1>
          <p className="text-sm text-gray-500">Real-time climate intelligence for your area.</p>
        </div>
      </div>

      {/* Weather Widget */}
      <div className="bg-gradient-to-r from-secondary-900 to-secondary-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden flex items-center justify-between">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Sun className="h-32 w-32" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
          <div className="text-center sm:text-left flex flex-col sm:flex-row sm:items-center gap-4">
            <div>
              <p className="text-5xl sm:text-6xl font-extrabold tracking-tighter">72°</p>
              <p className="text-secondary-200 font-medium mt-1">Clear Skies</p>
            </div>
            <div className="hidden sm:block h-16 w-px bg-white/20 mx-2"></div>
            <div className="text-left mt-2 sm:mt-0">
              <p className="font-bold text-lg sm:text-xl">{location}, TN</p>
              <p className="text-sm text-secondary-300 mt-1">Humidity: 45% • Wind: 12mph NW</p>
            </div>
          </div>
        </div>
        <div className="relative z-10 hidden md:flex gap-4 text-center">
          <div className="bg-white/10 rounded-xl px-5 py-3 backdrop-blur-sm border border-white/10 shadow-sm">
            <p className="text-xs text-secondary-300 uppercase tracking-wider font-semibold mb-2">Tomorrow</p>
            <div className="flex items-center gap-2">
              <CloudRain className="h-6 w-6 text-blue-300" />
              <span className="font-bold text-lg">65°</span>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md hover:border-blue-200 hover:-translate-y-1 transition-all duration-300 cursor-default group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 group-hover:scale-110 transition-all duration-300">
              <Droplets className="h-6 w-6" />
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Low Risk
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Flood Risk</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">12%</p>
          <div className="mt-4 text-sm text-gray-600 flex items-center gap-1 group-hover:text-blue-600 transition-colors">
            <MapPin className="h-4 w-4 opacity-70" /> Downtown Area
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md hover:border-orange-200 hover:-translate-y-1 transition-all duration-300 cursor-default group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg group-hover:bg-orange-100 group-hover:scale-110 transition-all duration-300">
              <ThermometerSun className="h-6 w-6" />
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse">
              High Risk
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Heat Wave</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">104°F</p>
          <div className="mt-4 text-sm text-red-600 font-medium">
            Warning active until 8 PM
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md hover:border-teal-200 hover:-translate-y-1 transition-all duration-300 cursor-default group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-teal-50 text-teal-600 rounded-lg group-hover:bg-teal-100 group-hover:scale-110 transition-all duration-300">
              <Wind className="h-6 w-6" />
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Moderate
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Air Quality Index</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">75</p>
          <div className="mt-4 text-sm text-gray-600">
            PM2.5 slightly elevated
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md hover:border-purple-200 hover:-translate-y-1 transition-all duration-300 cursor-default group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-100 group-hover:scale-110 transition-all duration-300">
              <ActivitySquare className="h-6 w-6" />
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Stable
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Vulnerability Score</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">4.2/10</p>
          <div className="mt-4 text-sm text-gray-600">
            Based on infrastructure
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Alerts Panel */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-900">Recent Alerts</h3>
            <Link href="/dashboard/alerts" className="text-sm text-primary-600 font-medium hover:text-primary-700 transition-colors">
              View All
            </Link>
          </div>
          <div className="divide-y divide-gray-100 flex-1">
            {topActiveAlerts.length > 0 ? (
              topActiveAlerts.map(alert => (
                <Link href="/dashboard/alerts" key={alert.id}>
                  <div className="p-6 hover:bg-gray-50 transition-colors cursor-pointer group">
                    <div className="flex items-start gap-4">
                      <div className={`${getSeverityBgColor(alert.severity)} p-2 rounded-full shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                        {getCategoryIcon(alert.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{alert.title}</p>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            alert.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                            alert.severity === 'High' ? 'bg-orange-100 text-orange-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>{alert.severity}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{alert.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {alert.area}</span>
                          <span>•</span>
                          <span>{alert.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-8 flex flex-col items-center justify-center text-center bg-gray-50/30">
                <div className="bg-gray-100 p-3 rounded-full mb-3 shadow-inner">
                  <FileX className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm font-bold text-gray-900">No active alerts</p>
                <p className="text-xs text-gray-500 mt-1 max-w-xs">You&apos;re all caught up on critical climate notifications for your area.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-fit">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6 space-y-4">
            <button onClick={() => setIsReportModalOpen(true)} className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-primary-500 hover:bg-primary-50 hover:shadow-sm transition-all duration-300 group">
              <div className="flex items-center gap-3">
                <div className="bg-primary-100 p-2 rounded-lg group-hover:bg-primary-200 group-hover:scale-110 transition-all duration-300">
                  <Siren className="h-5 w-5 text-primary-600" />
                </div>
                <span className="font-medium text-gray-900 group-hover:text-primary-700 transition-colors">Report Incident</span>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all duration-300" />
            </button>
            <button onClick={() => setIsEvacuationModalOpen(true)} className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-secondary-500 hover:bg-secondary-50 hover:shadow-sm transition-all duration-300 group">
              <div className="flex items-center gap-3">
                <div className="bg-secondary-100 p-2 rounded-lg group-hover:bg-secondary-200 group-hover:scale-110 transition-all duration-300">
                  <MapPin className="h-5 w-5 text-secondary-600" />
                </div>
                <span className="font-medium text-gray-900 group-hover:text-secondary-700 transition-colors">Evacuation Routes</span>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-secondary-600 group-hover:translate-x-1 transition-all duration-300" />
            </button>
            <button onClick={() => setIsContactsModalOpen(true)} className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-red-500 hover:bg-red-50 hover:shadow-sm transition-all duration-300 group">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-2 rounded-lg group-hover:bg-red-200 group-hover:scale-110 transition-all duration-300">
                  <PhoneCall className="h-5 w-5 text-red-600" />
                </div>
                <span className="font-medium text-gray-900 group-hover:text-red-700 transition-colors">Emergency Contacts</span>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-red-600 group-hover:translate-x-1 transition-all duration-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Report Incident Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Siren className="h-5 w-5 text-primary-500" /> Report Incident</h2>
              <button onClick={() => setIsReportModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              setIsReportModalOpen(false);
              toast.success("Incident reported successfully");
            }} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Incident Type</label>
                <select required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">Select Type...</option>
                  <option value="flood">Flooding / Waterlogging</option>
                  <option value="infrastructure">Fallen Tree / Powerline</option>
                  <option value="fire">Fire / Smoke</option>
                  <option value="other">Other Emergency</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Location</label>
                <div className="relative">
                  <input required type="text" defaultValue={location} className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <textarea required rows={3} placeholder="Describe the situation..." className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"></textarea>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Upload Image</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-primary-400 cursor-pointer transition-colors">
                  <Upload className="h-6 w-6 mb-2 text-gray-400" />
                  <span className="text-sm">Click to upload or drag & drop</span>
                  <span className="text-xs text-gray-400 mt-1">PNG, JPG, up to 5MB</span>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsReportModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Evacuation Routes Modal */}
      {isEvacuationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-secondary-50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><MapPin className="h-5 w-5 text-secondary-600" /> Evacuation Routes</h2>
              <button onClick={() => setIsEvacuationModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                <h3 className="text-sm font-bold text-red-800 uppercase tracking-wider mb-1">Risk Zone</h3>
                <p className="text-red-600 font-medium">{location} - Zone A (High Flood Risk)</p>
              </div>
              
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3">Primary Route Instructions</h3>
                <ol className="relative border-s border-gray-200 ml-3 space-y-4">                  
                  <li className="mb-4 ms-4">
                      <div className="absolute w-3 h-3 bg-gray-200 rounded-full mt-1.5 -start-1.5 border border-white"></div>
                      <p className="text-sm font-normal text-gray-600">Head North on Main St towards the elevated highway.</p>
                  </li>
                  <li className="mb-4 ms-4">
                      <div className="absolute w-3 h-3 bg-gray-200 rounded-full mt-1.5 -start-1.5 border border-white"></div>
                      <p className="text-sm font-normal text-gray-600">Take exit 4B towards the safe zone.</p>
                  </li>
                  <li className="ms-4">
                      <div className="absolute w-3 h-3 bg-secondary-500 rounded-full mt-1.5 -start-1.5 border border-white"></div>
                      <p className="text-sm font-medium text-gray-900">Arrive at Relief Center.</p>
                  </li>
                </ol>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mt-4">
                <h3 className="text-sm font-bold text-gray-900 mb-1">Nearest Shelter</h3>
                <p className="text-gray-600 text-sm">Central High School Gymnasium<br/>1.2 miles away • Capacity: 450/500</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Contacts Modal */}
      {isContactsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-red-50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><PhoneCall className="h-5 w-5 text-red-600" /> Emergency Contacts</h2>
              <button onClick={() => setIsContactsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-2">
              <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg"><ShieldAlert className="h-5 w-5 text-blue-600" /></div>
                  <div><p className="font-bold text-gray-900">Police</p><p className="text-xs text-gray-500">Law enforcement</p></div>
                </div>
                <a href="tel:100" className="bg-blue-600 text-white px-4 py-1.5 rounded-lg font-bold hover:bg-blue-700">100</a>
              </div>
              <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 p-2 rounded-lg"><ThermometerSun className="h-5 w-5 text-orange-600" /></div>
                  <div><p className="font-bold text-gray-900">Fire</p><p className="text-xs text-gray-500">Fire & Rescue</p></div>
                </div>
                <a href="tel:101" className="bg-orange-600 text-white px-4 py-1.5 rounded-lg font-bold hover:bg-orange-700">101</a>
              </div>
              <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-lg"><ActivitySquare className="h-5 w-5 text-green-600" /></div>
                  <div><p className="font-bold text-gray-900">Ambulance</p><p className="text-xs text-gray-500">Medical emergency</p></div>
                </div>
                <a href="tel:108" className="bg-green-600 text-white px-4 py-1.5 rounded-lg font-bold hover:bg-green-700">108</a>
              </div>
              <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 p-2 rounded-lg"><Siren className="h-5 w-5 text-red-600" /></div>
                  <div><p className="font-bold text-gray-900">Disaster Mgmt</p><p className="text-xs text-gray-500">NDRF / SDRF</p></div>
                </div>
                <a href="tel:112" className="bg-red-600 text-white px-4 py-1.5 rounded-lg font-bold hover:bg-red-700">112</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
