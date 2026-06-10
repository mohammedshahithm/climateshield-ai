"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { 
  AlertTriangle, ShieldAlert, ActivitySquare, Users, 
  MapPin, PlusCircle, Send, FileText, CheckCircle2,
  Ambulance, Home, Droplet, Clock, BarChart3,
  X, CheckSquare, Square
} from "lucide-react";
import type { AdminMarker } from "@/components/maps/AdminMapComponent";
import { useAlerts } from "@/lib/AlertsContext";
import { AlertCategory, Severity, ClimateAlert } from "@/lib/mockAlerts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const AdminMapComponent = dynamic(() => import("@/components/maps/AdminMapComponent"), { 
  ssr: false,
  loading: () => <div className="h-full w-full min-h-[400px] bg-gray-50 rounded-xl animate-pulse flex items-center justify-center border border-gray-100 text-gray-400">Loading map Engine...</div>
});

// Mock Data Initial State
const initialIncidents = [
  { id: "INC-2026-001", name: "Evacuation Required", location: "Velachery Lowlands", severity: "Critical", status: "Active", team: "Rescue Squad Alpha", desc: "Floodwater levels have exceeded safe thresholds. Immediate evacuation of residents is required." },
  { id: "INC-2026-002", name: "Heatstroke Mass Casualty", location: "Guindy Industrial", severity: "High", status: "Dispatching", team: "Ambulance Unit 4", desc: "Multiple factory workers collapsed due to severe heatwave conditions." },
  { id: "INC-2026-003", name: "Substation Flooded", location: "Tambaram South", severity: "High", status: "Active", team: "TNEB Eng Team", desc: "Main power substation is flooded, resulting in local blackout." },
  { id: "INC-2026-004", name: "Water Scarcity", location: "OMR Tech Park", severity: "Moderate", status: "Resolved", team: "Metro Water Tankers", desc: "Drinking water supply depleted. Tankers successfully delivered." },
  { id: "INC-2026-005", name: "Fallen Trees on Highway", location: "Adyar Signal", severity: "Moderate", status: "Active", team: "Highway Patrol", desc: "Major highway blocked by fallen trees after heavy wind." },
];

type Resource = {
  id: string;
  name: string;
  type: string;
  status: string;
  location?: string;
  capacity?: string;
};

const initialResources: Resource[] = [
  { id: "res1", name: "Rescue Squad Alpha", type: "Rescue Team", status: "Deployed", location: "Velachery" },
  { id: "res2", name: "Ambulance Unit 4", type: "Ambulance", status: "En Route", location: "Guindy" },
  { id: "res3", name: "Velachery Shelter", type: "Shelter", status: "Available", capacity: "140/500" },
  { id: "res4", name: "Water Tanker W-01", type: "Water Unit", status: "Standby", location: "Central Depot" },
  { id: "res5", name: "Rescue Squad Beta", type: "Rescue Team", status: "Standby", location: "Tambaram HQ" },
];

const mapMarkers: AdminMarker[] = [
  { id: "m1", type: "Incident", name: "Evacuation Required", lat: 12.9754, lng: 80.2206, details: "Immediate boat rescue needed." },
  { id: "m2", type: "Incident", name: "Heatstroke Event", lat: 13.0067, lng: 80.2206, details: "Multiple factory workers collapsed." },
  { id: "m3", type: "Rescue", name: "Rescue Squad Alpha", lat: 12.9780, lng: 80.2250, details: "Approaching target zone." },
  { id: "m4", type: "Ambulance", name: "Ambulance Unit 4", lat: 13.0150, lng: 80.2100, details: "En route to Guindy." },
  { id: "m5", type: "Shelter", name: "Velachery Shelter", lat: 12.9720, lng: 80.2215, details: "Accepting evacuees. 140/500 capacity." },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const { userRole, showToast, addAlert } = useAlerts();
  
  const [incidents, setIncidents] = useState(initialIncidents);
  const [resources, setResources] = useState(initialResources);
  
  const [selectedIncident, setSelectedIncident] = useState<typeof initialIncidents[0] | null>(null);
  const [isCreateAlertOpen, setIsCreateAlertOpen] = useState(false);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // RBAC check
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (userRole !== "admin") {
      showToast("Access Denied – Administrator Privileges Required", "error");
      router.push("/dashboard");
    }
  }, [userRole, router, showToast]);

  const generatePDF = () => {
    try {
      const doc = new jsPDF();
      const dateStr = new Date().toISOString().split('T')[0];
      
      // Title
      doc.setFontSize(22);
      doc.setTextColor(30, 58, 138); // Primary blue
      doc.text("ClimateShield AI", 14, 20);
      
      doc.setFontSize(14);
      doc.setTextColor(50, 50, 50);
      doc.text("Emergency Operations Report", 14, 30);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Date: ${dateStr}`, 14, 40);
      doc.text("Location: Chennai, TN (Command Center)", 14, 45);

      // Summary Metrics
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text("Summary Metrics", 14, 55);
      
      const activeIncidentsCount = incidents.filter(i => i.status === 'Active').length || 0;
      const highRiskZonesCount = incidents.filter(i => i.severity === 'Critical' || i.severity === 'High').length || 0;
      const activeSheltersCount = resources.filter(r => r.type === 'Shelter').length || 0;

      autoTable(doc, {
        startY: 60,
        head: [['Metric', 'Value']],
        body: [
          ['Active Incidents', String(activeIncidentsCount)],
          ['High Risk Zones', String(highRiskZonesCount)],
          ['Citizens Evacuated', '1,240'], // Mock static as it's not calculated from arrays
          ['Active Shelters', String(activeSheltersCount)],
        ],
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 138] },
      });

      // Incident Summary
      let nextY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
      doc.text("Incident Summary", 14, nextY);
      
      const incidentBody = incidents.map(inc => [
        inc.name,
        inc.severity,
        inc.status,
        inc.team
      ]);

      autoTable(doc, {
        startY: nextY + 5,
        head: [['Incident Name', 'Severity', 'Status', 'Assigned Team']],
        body: incidentBody,
        theme: 'grid',
        headStyles: { fillColor: [220, 38, 38] }, // Red header for incidents
      });

      // Resource Deployment
      nextY = (doc as any).lastAutoTable.finalY + 15;
      if (nextY > 250) {
        doc.addPage();
        nextY = 20;
      }
      doc.text("Resource Deployment", 14, nextY);

      const resourceBody = resources.map(res => [
        res.name,
        res.status,
        res.location || res.capacity || 'N/A'
      ]);

      autoTable(doc, {
        startY: nextY + 5,
        head: [['Resource Name', 'Status', 'Location/Capacity']],
        body: resourceBody,
        theme: 'grid',
        headStyles: { fillColor: [5, 150, 105] }, // Green header for resources
      });

      // Response Metrics
      nextY = (doc as any).lastAutoTable.finalY + 15;
      if (nextY > 250) {
        doc.addPage();
        nextY = 20;
      }
      doc.text("Response Metrics", 14, nextY);
      
      autoTable(doc, {
        startY: nextY + 5,
        head: [['Metric', 'Value']],
        body: [
          ['Average Dispatch Time', '14 Minutes'],
          ['Resolution Rate', '92%'],
        ],
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 138] },
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Generated by ClimateShield AI - Page ${i} of ${pageCount}`, 14, 290);
      }

      doc.save(`ClimateShield_Emergency_Report_${dateStr}.pdf`);
      showToast("Report Generated Successfully", "success");
    } catch (err) {
      console.error("PDF Generation Error:", err);
      showToast("Failed to generate report", "error");
    }
  };

  const handleDeployResource = (deploymentData: { unit: string; location: string; incident: string; priority: string; }) => {
    // Update resource state
    setResources(prev => prev.map(res => {
      if (res.name === deploymentData.unit) {
        return { ...res, status: "En Route", location: deploymentData.location };
      }
      return res;
    }));
    
    // Also update incident if applicable
    if (deploymentData.incident) {
      setIncidents(prev => prev.map(inc => {
        if (inc.name === deploymentData.incident) {
          return { ...inc, status: "Dispatching", team: deploymentData.unit };
        }
        return inc;
      }));
    }

    showToast("Resource Successfully Deployed", "success");
    setIsDeployModalOpen(false);
  };

  if (!mounted || userRole !== "admin") return null;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      
      {/* Header & Action Buttons */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-red-600" />
            Command Center
          </h1>
          <p className="text-sm text-gray-500 mt-1">Emergency Operations & Response Dashboard</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button 
            onClick={generatePDF}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
          >
            <FileText className="h-4 w-4 text-gray-400" /> Generate Report
          </button>
          <button 
            onClick={() => setIsDeployModalOpen(true)}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
          >
            <Send className="h-4 w-4 text-primary-500" /> Deploy Resource
          </button>
          <button 
            onClick={() => setIsCreateAlertOpen(true)}
            className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 flex items-center gap-2 transition-colors shadow-sm"
          >
            <PlusCircle className="h-4 w-4" /> Create Alert
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-lg"><AlertTriangle className="h-6 w-6" /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Active Incidents</p>
            <p className="text-2xl font-bold text-gray-900 leading-none mt-1">14</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-lg"><MapPin className="h-6 w-6" /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">High Risk Zones</p>
            <p className="text-2xl font-bold text-gray-900 leading-none mt-1">6</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg"><Users className="h-6 w-6" /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Citizens Evacuated</p>
            <p className="text-2xl font-bold text-gray-900 leading-none mt-1">1,240</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><Home className="h-6 w-6" /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Active Shelters</p>
            <p className="text-2xl font-bold text-gray-900 leading-none mt-1">42</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Map & Analytics */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Emergency Response Map */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900">Tactical Operations Map</h3>
              <div className="flex items-center gap-3 text-xs font-medium text-gray-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Incident</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500"></span> Ambulance</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Rescue</span>
              </div>
            </div>
            <div className="h-[400px] w-full p-2 bg-gray-50">
              <AdminMapComponent markers={mapMarkers} center={[13.0827, 80.2707]} />
            </div>
          </div>

          {/* Analytics Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                <BarChart3 className="h-4 w-4 text-primary-500" /> Alerts by Category
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1"><span className="text-gray-600 font-medium">Flood Risk</span><span className="font-bold text-gray-900">45%</span></div>
                  <div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: '45%' }}></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1"><span className="text-gray-600 font-medium">Heatwave</span><span className="font-bold text-gray-900">30%</span></div>
                  <div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-red-500 h-2 rounded-full" style={{ width: '30%' }}></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1"><span className="text-gray-600 font-medium">Infrastructure</span><span className="font-bold text-gray-900">15%</span></div>
                  <div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-purple-500 h-2 rounded-full" style={{ width: '15%' }}></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1"><span className="text-gray-600 font-medium">Air Quality</span><span className="font-bold text-gray-900">10%</span></div>
                  <div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-gray-500 h-2 rounded-full" style={{ width: '10%' }}></div></div>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                <Clock className="h-4 w-4 text-primary-500" /> Response Metrics
              </h3>
              <div className="flex flex-col justify-center items-center h-full pb-4">
                <div className="text-4xl font-extrabold text-gray-900">14<span className="text-xl text-gray-500 font-medium">m</span></div>
                <p className="text-sm text-gray-500 mt-1">Average Dispatch Time</p>
                
                <div className="w-full mt-6 grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-xl font-bold text-green-600">92%</p>
                    <p className="text-xs text-gray-500 font-medium mt-1">Resolution Rate</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-xl font-bold text-blue-600">8.5k</p>
                    <p className="text-xs text-gray-500 font-medium mt-1">Assessments</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tables & Panels */}
        <div className="flex flex-col gap-6">
          
          {/* Incident Management Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-1">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-gray-900">Incident Management</h3>
            </div>
            <div className="divide-y divide-gray-100 overflow-y-auto max-h-[400px]">
              {incidents.map((incident) => (
                <div 
                  key={incident.id} 
                  onClick={() => setSelectedIncident(incident)}
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-sm text-gray-900 group-hover:text-primary-600">{incident.name}</h4>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      incident.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                      incident.severity === 'High' ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>{incident.severity}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                    <MapPin className="h-3 w-3" /> {incident.location}
                  </div>
                  <div className="flex justify-between items-center text-xs font-medium">
                    <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded">Team: {incident.team}</span>
                    <span className={`px-2 py-1 rounded flex items-center gap-1 ${
                      incident.status === 'Active' ? 'text-red-600 bg-red-50' : 
                      incident.status === 'Dispatching' ? 'text-blue-600 bg-blue-50' : 
                      'text-green-600 bg-green-50'
                    }`}>
                      {incident.status === 'Resolved' && <CheckCircle2 className="h-3 w-3" />}
                      {incident.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-gray-100 bg-gray-50 text-center">
              <button onClick={() => showToast("Feature coming soon", "success")} className="text-sm font-medium text-primary-600 hover:text-primary-700">View All Incidents</button>
            </div>
          </div>

          {/* Resource Deployment Panel */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Resource Deployment</h3>
            </div>
            <div className="p-2 space-y-2">
              {resources.map(res => (
                <div key={res.id} className="p-3 rounded-lg border border-gray-100 flex items-center justify-between hover:border-gray-300 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      res.type === 'Rescue Team' ? 'bg-purple-100 text-purple-600' :
                      res.type === 'Ambulance' ? 'bg-orange-100 text-orange-600' :
                      res.type === 'Water Unit' ? 'bg-blue-100 text-blue-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                      {res.type === 'Rescue Team' && <ActivitySquare className="h-4 w-4" />}
                      {res.type === 'Ambulance' && <Ambulance className="h-4 w-4" />}
                      {res.type === 'Water Unit' && <Droplet className="h-4 w-4" />}
                      {res.type === 'Shelter' && <Home className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{res.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{res.location || res.capacity}</p>
                    </div>
                  </div>
                  <div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${
                      res.status === 'Deployed' || res.status === 'En Route' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>{res.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Incident Details Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-secondary-900/40 backdrop-blur-sm" onClick={() => setSelectedIncident(null)}></div>
          <div className="bg-white rounded-2xl w-full max-w-lg relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Incident Details</h2>
              <button onClick={() => setSelectedIncident(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Incident ID: {selectedIncident.id}</p>
                  <h3 className="text-xl font-bold text-gray-900">{selectedIncident.name}</h3>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase ${
                    selectedIncident.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                    selectedIncident.severity === 'High' ? 'bg-orange-100 text-orange-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{selectedIncident.severity}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase ${
                    selectedIncident.status === 'Active' ? 'text-red-600 bg-red-50' : 
                    selectedIncident.status === 'Dispatching' ? 'text-blue-600 bg-blue-50' : 
                    'text-green-600 bg-green-50'
                  }`}>{selectedIncident.status}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <MapPin className="h-4 w-4 text-primary-500 shrink-0" />
                {selectedIncident.location}
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</h4>
                <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  {selectedIncident.desc}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Assigned Team</h4>
                  <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <ActivitySquare className="h-4 w-4 text-purple-500" />
                    {selectedIncident.team}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Resources Deployed</h4>
                  <ul className="text-sm font-medium text-gray-700 space-y-1">
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500"/> Rescue Boat 2</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500"/> Medical Unit 1</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500"/> Transport Bus</li>
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Status Timeline</h4>
                <div className="space-y-3 pl-2">
                  <div className="flex items-center gap-3 text-sm text-gray-900 font-medium"><CheckCircle2 className="h-4 w-4 text-green-500" /> Incident Created</div>
                  <div className="flex items-center gap-3 text-sm text-gray-900 font-medium"><CheckCircle2 className="h-4 w-4 text-green-500" /> Team Assigned</div>
                  <div className="flex items-center gap-3 text-sm text-gray-900 font-medium"><CheckCircle2 className="h-4 w-4 text-green-500" /> Resources Dispatched</div>
                  <div className="flex items-center gap-3 text-sm text-gray-400 font-medium"><div className="h-4 w-4 rounded-full border-2 border-gray-300"></div> Resolved</div>
                </div>
              </div>

            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
              <button onClick={() => setSelectedIncident(null)} className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-900">Close Incident</button>
              <button className="px-4 py-2 text-sm font-bold text-white bg-primary-600 rounded-lg hover:bg-primary-700">Assign Team</button>
              <button 
                onClick={() => {
                  setSelectedIncident(null);
                  setIsDeployModalOpen(true);
                }}
                className="px-4 py-2 text-sm font-bold text-white bg-secondary-900 rounded-lg hover:bg-secondary-950"
              >
                Deploy Resource
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Alert Modal */}
      {isCreateAlertOpen && (
        <CreateAlertModal 
          onClose={() => setIsCreateAlertOpen(false)} 
          addAlert={addAlert}
          showToast={showToast}
        />
      )}

      {/* Deploy Resource Modal */}
      {isDeployModalOpen && (
        <DeployResourceModal 
          onClose={() => setIsDeployModalOpen(false)}
          onDeploy={handleDeployResource}
          showToast={showToast}
        />
      )}
    </div>
  );
}

function CreateAlertModal({ onClose, addAlert, showToast }: { onClose: () => void, addAlert: (alert: ClimateAlert) => void, showToast: (msg: string, type: "success" | "error") => void }) {
  const [formData, setFormData] = useState({
    type: "Flood Risk",
    severity: "High",
    location: "",
    zone: "",
    description: "",
    notifyPush: true,
    notifySms: true,
    notifyEmail: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.location || !formData.description) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    const newAlert: ClimateAlert = {
      id: `ALRT-${Math.floor(1000 + Math.random() * 9000)}`,
      title: `${formData.severity} ${formData.type} Warning`,
      category: formData.type as AlertCategory,
      severity: formData.severity as Severity,
      area: formData.location,
      timestamp: "Just Now",
      status: "Active" as const,
      description: formData.description,
      recommendedActions: ["Stay alert.", "Follow local authorities."],
      emergencyContacts: []
    };

    addAlert(newAlert);
    showToast("Emergency Alert Created Successfully", "success");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-secondary-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-2xl w-full max-w-lg relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Create Emergency Alert</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Alert Type</label>
                <select 
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                >
                  <option value="Flood Risk">Flood</option>
                  <option value="Heatwave">Heatwave</option>
                  <option value="Cyclone Warning">Cyclone</option>
                  <option value="Air Quality">Air Quality</option>
                  <option value="Infrastructure Failure">Infrastructure</option>
                  <option value="Heavy Rainfall">Heavy Rainfall</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Severity</label>
                <select 
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={formData.severity}
                  onChange={e => setFormData({...formData, severity: e.target.value})}
                >
                  <option value="Low">Low</option>
                  <option value="Moderate">Moderate</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Location <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  placeholder="e.g. Velachery"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Target Zone</label>
                <input 
                  type="text" 
                  placeholder="e.g. Zone 13"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={formData.zone}
                  onChange={e => setFormData({...formData, zone: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Description <span className="text-red-500">*</span></label>
              <textarea 
                rows={3}
                placeholder="Provide detailed information about the emergency..."
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Send Notification</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="text-primary-600 group-hover:text-primary-700">
                    {formData.notifyPush ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5 text-gray-300" />}
                  </div>
                  <input type="checkbox" className="hidden" checked={formData.notifyPush} onChange={() => setFormData({...formData, notifyPush: !formData.notifyPush})} />
                  <span className="text-sm font-medium text-gray-700">Push App</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="text-primary-600 group-hover:text-primary-700">
                    {formData.notifySms ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5 text-gray-300" />}
                  </div>
                  <input type="checkbox" className="hidden" checked={formData.notifySms} onChange={() => setFormData({...formData, notifySms: !formData.notifySms})} />
                  <span className="text-sm font-medium text-gray-700">SMS Alert</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="text-primary-600 group-hover:text-primary-700">
                    {formData.notifyEmail ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5 text-gray-300" />}
                  </div>
                  <input type="checkbox" className="hidden" checked={formData.notifyEmail} onChange={() => setFormData({...formData, notifyEmail: !formData.notifyEmail})} />
                  <span className="text-sm font-medium text-gray-700">Email</span>
                </label>
              </div>
            </div>

          </div>
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-900">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 flex items-center gap-2 shadow-sm">
              <AlertTriangle className="h-4 w-4" /> Issue Alert Now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Sub-component for Deploy Resource Modal
function DeployResourceModal({ onClose, onDeploy, showToast }: { onClose: () => void, onDeploy: (data: { type: string, unit: string, location: string, incident: string, priority: string }) => void, showToast: (msg: string, type: "success" | "error") => void }) {
  const [formData, setFormData] = useState({
    type: "Rescue Squad",
    unit: "Rescue Squad Alpha",
    location: "",
    incident: "Evacuation Required",
    priority: "High"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.location) {
      showToast("Please specify a target location", "error");
      return;
    }
    onDeploy(formData);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-secondary-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-2xl w-full max-w-lg relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Deploy Emergency Resource</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Resource Type</label>
                <select 
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                >
                  <option value="Rescue Squad">Rescue Squad</option>
                  <option value="Ambulance">Ambulance</option>
                  <option value="Water Tanker">Water Tanker</option>
                  <option value="Medical Team">Medical Team</option>
                  <option value="Shelter Support Unit">Shelter Support Unit</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Resource Unit</label>
                <select 
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={formData.unit}
                  onChange={e => setFormData({...formData, unit: e.target.value})}
                >
                  <option value="Rescue Squad Alpha">Rescue Squad Alpha</option>
                  <option value="Rescue Squad Beta">Rescue Squad Beta</option>
                  <option value="Ambulance Unit 4">Ambulance Unit 4</option>
                  <option value="Water Tanker W-01">Water Tanker W-01</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Target Location <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                placeholder="e.g. Velachery Lowlands"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Link Incident</label>
                <select 
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={formData.incident}
                  onChange={e => setFormData({...formData, incident: e.target.value})}
                >
                  <option value="Evacuation Required">Evacuation Required</option>
                  <option value="Heatstroke Mass Casualty">Heatstroke Mass Casualty</option>
                  <option value="Substation Flooded">Substation Flooded</option>
                  <option value="Water Scarcity">Water Scarcity</option>
                  <option value="None">None (General Patrol)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Priority</label>
                <select 
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={formData.priority}
                  onChange={e => setFormData({...formData, priority: e.target.value})}
                >
                  <option value="Low">Low</option>
                  <option value="Moderate">Moderate</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

          </div>
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-900">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-primary-600 rounded-lg hover:bg-primary-700 flex items-center gap-2 shadow-sm">
              <Send className="h-4 w-4" /> Deploy Resource
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
