"use client";

import { useState } from "react";
import { 
  ShieldAlert, 
  CheckCircle2, 
  Droplets, 
  ThermometerSun, 
  Wind, 
  ActivitySquare, 
  CloudLightning, 
  CloudRain,
  X,
  PhoneCall,
  Clock,
  MapPin,
  ChevronRight
} from "lucide-react";
import { ClimateAlert, Severity, AlertCategory } from "@/lib/mockAlerts";
import { useAlerts } from "@/lib/AlertsContext";

export default function AlertsPage() {
  const { alerts: mockAlerts } = useAlerts();
  const [filter, setFilter] = useState<string>("All Alerts");
  const [selectedAlert, setSelectedAlert] = useState<ClimateAlert | null>(null);

  const filters = [
    "All Alerts", "Active", "Resolved", "Critical", "High", "Moderate", "Low"
  ];

  const filteredAlerts = mockAlerts.filter(alert => {
    if (filter === "All Alerts") return true;
    if (filter === "Active") return alert.status === "Active";
    if (filter === "Resolved") return alert.status === "Resolved";
    if (filter === "Critical") return alert.severity === "Critical";
    if (filter === "High") return alert.severity === "High";
    if (filter === "Moderate") return alert.severity === "Moderate";
    if (filter === "Low") return alert.severity === "Low";
    return true;
  });

  const getSeverityColors = (severity: Severity) => {
    switch(severity) {
      case "Critical": return "bg-red-100 text-red-700 border-red-200";
      case "High": return "bg-orange-100 text-orange-700 border-orange-200";
      case "Moderate": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Low": return "bg-green-100 text-green-700 border-green-200";
    }
  };

  const getCategoryIcon = (category: AlertCategory) => {
    switch(category) {
      case "Flood Risk": return <Droplets className="h-5 w-5 text-blue-500" />;
      case "Heatwave": return <ThermometerSun className="h-5 w-5 text-red-500" />;
      case "Air Quality": return <Wind className="h-5 w-5 text-gray-500" />;
      case "Infrastructure Failure": return <ActivitySquare className="h-5 w-5 text-purple-500" />;
      case "Cyclone Warning": return <CloudLightning className="h-5 w-5 text-indigo-500" />;
      case "Heavy Rainfall": return <CloudRain className="h-5 w-5 text-blue-400" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Climate Alerts</h1>
          <p className="text-sm text-gray-500">Real-time localized emergency and advisory notices.</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 min-w-max">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f 
                  ? "bg-primary-600 text-white shadow-sm" 
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Grid */}
      {filteredAlerts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAlerts.map(alert => (
            <div 
              key={alert.id}
              onClick={() => setSelectedAlert(alert)}
              className={`bg-white rounded-xl border ${alert.status === 'Active' ? 'border-gray-200 hover:border-primary-300' : 'border-gray-200 opacity-75'} p-5 cursor-pointer hover:shadow-md transition-all group flex flex-col`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-primary-50 transition-colors">
                  {getCategoryIcon(alert.category)}
                </div>
                <div className="flex gap-2">
                  {alert.status === "Resolved" && (
                    <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-bold uppercase">
                      <CheckCircle2 className="h-3 w-3" /> Resolved
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase border ${getSeverityColors(alert.severity)}`}>
                    {alert.severity}
                  </span>
                </div>
              </div>
              
              <h3 className="font-bold text-gray-900 text-lg leading-tight mb-2 group-hover:text-primary-700 transition-colors">
                {alert.title}
              </h3>
              
              <div className="space-y-1.5 mt-auto pt-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
                  <span className="truncate">{alert.area}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 text-xs">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                  <span>{alert.status === 'Active' ? 'Issued' : 'Resolved'}: {alert.timestamp}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
          <ShieldAlert className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-1">No Alerts Found</h3>
          <p className="text-gray-500">There are no {filter.toLowerCase()} alerts matching your current filter.</p>
          <button 
            onClick={() => setFilter("All Alerts")}
            className="mt-4 text-primary-600 font-medium hover:text-primary-700"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Alert Details Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-secondary-950/60 backdrop-blur-sm" onClick={() => setSelectedAlert(null)}></div>
          
          <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-full animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className={`p-6 border-b ${
              selectedAlert.severity === 'Critical' ? 'bg-red-50 border-red-100' :
              selectedAlert.severity === 'High' ? 'bg-orange-50 border-orange-100' :
              selectedAlert.severity === 'Moderate' ? 'bg-yellow-50 border-yellow-100' :
              'bg-green-50 border-green-100'
            }`}>
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm">
                    {getCategoryIcon(selectedAlert.category)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getSeverityColors(selectedAlert.severity)}`}>
                        {selectedAlert.severity} Severity
                      </span>
                      {selectedAlert.status === "Active" ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-red-600 bg-red-100 px-2 py-0.5 rounded">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                          </span>
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase text-gray-600 bg-gray-200 px-2 py-0.5 rounded">
                          Resolved
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-extrabold text-gray-900 leading-tight">{selectedAlert.title}</h2>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedAlert(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto">
              <div className="flex flex-wrap gap-4 mb-6 text-sm">
                <div className="flex items-center gap-2 text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                  <MapPin className="h-4 w-4 text-primary-500" />
                  <span className="font-medium">{selectedAlert.area}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                  <Clock className="h-4 w-4 text-primary-500" />
                  <span className="font-medium">Issued: {selectedAlert.timestamp}</span>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  {selectedAlert.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Recommended Actions</h3>
                  <ul className="space-y-3">
                    {selectedAlert.recommendedActions.map((action, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-600 items-start">
                        <ChevronRight className="h-4 w-4 shrink-0 text-primary-500 mt-0.5" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {selectedAlert.emergencyContacts.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Emergency Contacts</h3>
                    <div className="space-y-2">
                      {selectedAlert.emergencyContacts.map((contact, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-primary-200 transition-colors">
                          <span className="text-sm font-medium text-gray-700">{contact.name}</span>
                          <a href={`tel:${contact.number}`} className="flex items-center gap-1.5 text-sm font-bold text-primary-600 hover:text-primary-700">
                            <PhoneCall className="h-3.5 w-3.5" />
                            {contact.number}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
               <button 
                 onClick={() => setSelectedAlert(null)}
                 className="px-6 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
               >
                 Close
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
