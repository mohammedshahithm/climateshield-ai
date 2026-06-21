"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { 
  AlertTriangle, ShieldAlert, ActivitySquare, Users, 
  MapPin, PlusCircle, Trash2, Edit3, CheckCircle2,
  Clock, BarChart3, X, CheckSquare, Square, Loader2,
  FileText, Send, Ambulance, Home, Droplet
} from "lucide-react";
import type { AdminMarker } from "@/components/maps/AdminMapComponent";
import { useAlerts } from "@/lib/AlertsContext";
import { ClimateAlert, Severity, AlertCategory, AlertStatus } from "@/lib/mockAlerts";
import { useLocation, PREDEFINED_CITIES } from "@/providers/LocationContext";
import { createClient } from "@/lib/supabase/client";
import { fetchWeather } from "@/lib/weather";
import { fetchAirQuality } from "@/lib/airQuality";
import { fetchFloodRisk } from "@/lib/floodRisk";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from "recharts";

const AdminMapComponent = dynamic(() => import("@/components/maps/AdminMapComponent"), { 
  ssr: false,
  loading: () => <div className="h-full w-full min-h-[400px] bg-gray-50 rounded-xl animate-pulse flex items-center justify-center border border-gray-100 text-gray-400">Loading map Engine...</div>
});

interface Incident {
  id: string;
  created_by: string;
  title: string;
  description: string;
  category: "Flood" | "Fire" | "Power Outage" | "Landslide" | "Heat Emergency";
  latitude: number;
  longitude: number;
  location_name: string;
  status: string;
  created_at: string;
}

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

export default function AdminDashboardPage() {
  const router = useRouter();
  const { userRole, alerts, addAlert, updateAlert, deleteAlert, showToast } = useAlerts();
  const { latitude, longitude } = useLocation();
  const supabase = createClient();

  // State
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [incidentsLoading, setIncidentsLoading] = useState(true);
  const [citizensCount, setCitizensCount] = useState<number | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [riskZones, setRiskZones] = useState<{ name: string; score: number; level: string; color: string }[]>([]);
  const [riskZonesLoading, setRiskZonesLoading] = useState(true);
  const [resources, setResources] = useState<Resource[]>(initialResources);

  // Modals & Selections
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isCreateAlertOpen, setIsCreateAlertOpen] = useState(false);
  const [selectedAlertForEdit, setSelectedAlertForEdit] = useState<ClimateAlert | null>(null);
  const [selectedAlertForDelete, setSelectedAlertForDelete] = useState<ClimateAlert | null>(null);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Filters State
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Load Data functions
  const fetchIncidents = async () => {
    setIncidentsLoading(true);
    try {
      const { data, error } = await supabase
        .from("incidents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setIncidents(data || []);
    } catch (err) {
      console.error("Error fetching incidents:", err);
      showToast("Failed to fetch incidents", "error");
    } finally {
      setIncidentsLoading(false);
    }
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const { count, error } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "citizen");

      if (error) throw error;
      setCitizensCount(count ?? 0);
    } catch (err) {
      console.error("Error fetching registered citizens:", err);
      setCitizensCount(0);
    } finally {
      setStatsLoading(false);
    }
  };

  const calculateRiskZones = async () => {
    setRiskZonesLoading(true);
    try {
      const results = await Promise.all(
        PREDEFINED_CITIES.map(async (city) => {
          try {
            const [weather, aqi, flood] = await Promise.all([
              fetchWeather(city.latitude, city.longitude),
              fetchAirQuality(city.latitude, city.longitude),
              fetchFloodRisk(city.latitude, city.longitude),
            ]);

            const aqiScore = Math.round(Math.min(100, (aqi.usAqi / 200) * 100));
            const tempVal = weather.temperature;
            const heatScore = Math.round(Math.min(100, Math.max(0, (tempVal - 70) * (100 / 35))));
            const floodScore = flood.score;

            const composite = Math.round(Math.max(floodScore, aqiScore, heatScore));
            
            let level = "Moderate";
            let color = "text-yellow-700 bg-yellow-50 border-yellow-200";
            if (composite >= 75) {
              level = "Critical";
              color = "text-red-700 bg-red-50 border-red-200 animate-pulse";
            } else if (composite >= 50) {
              level = "High";
              color = "text-orange-700 bg-orange-50 border-orange-200";
            } else if (composite >= 25) {
              level = "Moderate";
              color = "text-yellow-700 bg-yellow-50 border-yellow-200";
            } else {
              level = "Low";
              color = "text-green-700 bg-green-50 border-green-200";
            }

            return {
              name: city.name,
              score: composite,
              level,
              color
            };
          } catch (e) {
            console.error(`Failed to calculate risk for ${city.name}:`, e);
            return {
              name: city.name,
              score: 25,
              level: "Moderate",
              color: "text-yellow-700 bg-yellow-50 border-yellow-200"
            };
          }
        })
      );

      results.sort((a, b) => b.score - a.score);
      setRiskZones(results);
    } catch (err) {
      console.error("Error calculating risk zones:", err);
    } finally {
      setRiskZonesLoading(false);
    }
  };

  // RBAC & Initialize
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (userRole !== "admin") {
      showToast("Access Denied – Administrator Privileges Required", "error");
      router.push("/dashboard");
      return;
    }

    fetchIncidents();
    fetchStats();
    calculateRiskZones();

    // Listen for realtime incident updates to keep table in sync
    const incidentChannel = supabase
      .channel("incidents-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "incidents" },
        () => {
          fetchIncidents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(incidentChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole, router]);

  // Map Data
  const incidentMarkers = useMemo(() => {
    return incidents.map(inc => ({
      id: inc.id,
      type: "Incident" as const,
      name: inc.title,
      lat: inc.latitude,
      lng: inc.longitude,
      details: inc.description
    }));
  }, [incidents]);

  const activeMarkers = useMemo(() => {
    const shelters: AdminMarker[] = [
      { id: "s1", type: "Shelter", name: "Central Relief Station", lat: latitude + 0.006, lng: longitude - 0.006, details: "Accepting citizens. Fully supplied." },
      { id: "s2", type: "Shelter", name: "Municipal Safe Depot", lat: latitude - 0.009, lng: longitude + 0.009, details: "Food & medical units active." }
    ];
    return [...incidentMarkers, ...shelters];
  }, [incidentMarkers, latitude, longitude]);

  // Statistics Computations
  const activeAlertsCount = useMemo(() => {
    return alerts.filter(a => a.status === "Active").length;
  }, [alerts]);

  const highRiskZonesCount = useMemo(() => {
    return riskZones.filter(z => z.score >= 50).length;
  }, [riskZones]);

  // Filters calculation
  const filteredIncidents = useMemo(() => {
    return incidents.filter(inc => {
      const matchesCat = categoryFilter === "All" || inc.category === categoryFilter;
      const matchesStatus = statusFilter === "All" || inc.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesCat && matchesStatus;
    });
  }, [incidents, categoryFilter, statusFilter]);

  // Analytics Computations
  const categoryChartData = useMemo(() => {
    const counts: Record<string, number> = {
      "Flood": 0,
      "Fire": 0,
      "Power Outage": 0,
      "Landslide": 0,
      "Heat Emergency": 0
    };
    incidents.forEach(inc => {
      if (inc.category in counts) {
        counts[inc.category]++;
      }
    });
    return Object.keys(counts).map(key => ({
      name: key,
      value: counts[key]
    }));
  }, [incidents]);

  const timeChartData = useMemo(() => {
    const groups: Record<string, number> = {};
    const reversed = [...incidents].reverse();
    reversed.forEach(inc => {
      const date = new Date(inc.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" });
      groups[date] = (groups[date] || 0) + 1;
    });
    return Object.keys(groups).map(date => ({
      date,
      count: groups[date]
    }));
  }, [incidents]);

  const statusChartData = useMemo(() => {
    let active = 0;
    let resolved = 0;
    incidents.forEach(inc => {
      if (inc.status.toLowerCase() === "resolved") {
        resolved++;
      } else if (inc.status.toLowerCase() !== "rejected") {
        active++;
      }
    });
    return [
      { name: "Active / Pending", value: active },
      { name: "Resolved", value: resolved }
    ];
  }, [incidents]);

  const PIE_COLORS = ["#ef4444", "#10b981"];

  // Incident Actions
  const handleUpdateIncidentStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("incidents")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;
      showToast(`Incident status updated to '${newStatus}'`, "success");
      
      setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status: newStatus } : inc));
      if (selectedIncident?.id === id) {
        setSelectedIncident(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err: unknown) {
      console.error("Error updating incident status:", err);
      const errMsg = err instanceof Error ? err.message : "Failed to update status";
      showToast(errMsg, "error");
    }
  };

  const handleDeployResource = (deploymentData: { unit: string; location: string; incident: string; priority: string; }) => {
    setResources(prev => prev.map(res => {
      if (res.name === deploymentData.unit) {
        return { ...res, status: "En Route", location: deploymentData.location };
      }
      return res;
    }));
    
    if (deploymentData.incident) {
      const matched = incidents.find(inc => inc.title === deploymentData.incident);
      if (matched) {
        handleUpdateIncidentStatus(matched.id, "in progress");
      }
    }

    showToast("Tactical unit successfully dispatched.", "success");
    setIsDeployModalOpen(false);
  };

  // PDF Report
  const generatePDF = () => {
    try {
      const doc = new jsPDF();
      const dateStr = new Date().toISOString().split("T")[0];
      
      doc.setFontSize(22);
      doc.setTextColor(30, 58, 138);
      doc.text("ClimateShield AI", 14, 20);
      
      doc.setFontSize(14);
      doc.setTextColor(50, 50, 50);
      doc.text("Command Center Operations Report", 14, 30);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${dateStr}`, 14, 40);
      doc.text(`Active Incidents Logged: ${incidents.length}`, 14, 45);

      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text("Incident Audit Log", 14, 55);
      
      const incidentBody = incidents.map(inc => [
        inc.title,
        inc.category,
        inc.location_name,
        inc.status,
        new Date(inc.created_at).toLocaleDateString()
      ]);

      autoTable(doc, {
        startY: 60,
        head: [["Title", "Category", "Location", "Status", "Reported Date"]],
        body: incidentBody,
        theme: "grid",
        headStyles: { fillColor: [30, 58, 138] },
      });

      const nextY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
      doc.text("Predefined Zone Risks", 14, nextY);

      const zoneBody = riskZones.map(z => [
        z.name,
        `${z.score}/100`,
        z.level
      ]);

      autoTable(doc, {
        startY: nextY + 5,
        head: [["City", "Risk Score", "Vulnerability Level"]],
        body: zoneBody,
        theme: "grid",
        headStyles: { fillColor: [220, 38, 38] },
      });

      doc.save(`ClimateShield_Command_Report_${dateStr}.pdf`);
      showToast("Operations report generated successfully.", "success");
    } catch (err) {
      console.error("PDF Generation Error:", err);
      showToast("Failed to generate PDF report", "error");
    }
  };

  const handleDeleteAlert = async (id: string) => {
    try {
      await deleteAlert(id);
      showToast("Emergency alert successfully deleted.", "success");
      setSelectedAlertForDelete(null);
    } catch (err) {
      console.error("Error deleting alert:", err);
      showToast("Failed to delete alert.", "error");
    }
  };

  if (!mounted || userRole !== "admin") return null;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-red-600 animate-pulse" />
            Command Center
          </h1>
          <p className="text-sm text-gray-500 mt-1">Government Operations, Telemetry Metrics, & Incident Response</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button 
            onClick={generatePDF}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <FileText className="h-4 w-4 text-gray-400" /> Export Operations Report
          </button>
          <button 
            onClick={() => setIsDeployModalOpen(true)}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Send className="h-4 w-4 text-primary-500" /> Deploy Tactical Unit
          </button>
          <button 
            onClick={() => setIsCreateAlertOpen(true)}
            className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" /> Issue Emergency Alert
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-lg"><AlertTriangle className="h-6 w-6" /></div>
          <div className="flex-1">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Incidents</p>
            {incidentsLoading ? (
              <div className="h-7 w-12 bg-gray-100 animate-pulse rounded mt-1"></div>
            ) : (
              <p className="text-2xl font-black text-gray-900 leading-none mt-1">{incidents.length}</p>
            )}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-lg"><ShieldAlert className="h-6 w-6" /></div>
          <div className="flex-1">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Active Alerts</p>
            <p className="text-2xl font-black text-gray-900 leading-none mt-1">{activeAlertsCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-lg"><MapPin className="h-6 w-6" /></div>
          <div className="flex-1">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">High Risk Zones</p>
            {riskZonesLoading ? (
              <div className="h-7 w-12 bg-gray-100 animate-pulse rounded mt-1"></div>
            ) : (
              <p className="text-2xl font-black text-gray-900 leading-none mt-1">{highRiskZonesCount}</p>
            )}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><Users className="h-6 w-6" /></div>
          <div className="flex-1">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Registered Citizens</p>
            {statsLoading ? (
              <div className="h-7 w-12 bg-gray-100 animate-pulse rounded mt-1"></div>
            ) : (
              <p className="text-2xl font-black text-gray-900 leading-none mt-1">{citizensCount}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Columns (8 of 12) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Tactical Operations Map */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4 text-red-500" /> Tactical Incident Map
              </h3>
              <div className="flex items-center gap-3 text-xs font-semibold text-gray-500">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Incident</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> Shelter</span>
              </div>
            </div>
            <div className="h-[400px] w-full p-2 bg-gray-50 relative z-0">
              <AdminMapComponent markers={activeMarkers} center={[latitude, longitude]} />
            </div>
          </div>

          {/* Visual Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Incident Distribution Chart */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h4 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary-500" /> Incident Categories
              </h4>
              <div className="h-60 w-full text-xs">
                {incidentsLoading ? (
                  <div className="h-full w-full bg-gray-50 rounded-lg animate-pulse"></div>
                ) : incidents.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-400">No incident reports logged.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: "#6b7280" }} />
                      <YAxis allowDecimals={false} tick={{ fill: "#6b7280" }} />
                      <Tooltip />
                      <Bar dataKey="value" name="Report Count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Incidents over time */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h4 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary-500" /> Report Volume Trend
              </h4>
              <div className="h-60 w-full text-xs">
                {incidentsLoading ? (
                  <div className="h-full w-full bg-gray-50 rounded-lg animate-pulse"></div>
                ) : incidents.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-400">No telemetry data.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timeChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: "#6b7280" }} />
                      <YAxis allowDecimals={false} tick={{ fill: "#6b7280" }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" name="Daily Reports" stroke="#6366f1" strokeWidth={2} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Active vs Resolved */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4 md:col-span-2">
              <h4 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" /> Active vs Resolved Ratios
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-5 h-56 text-xs">
                  {incidentsLoading ? (
                    <div className="h-full w-full bg-gray-50 rounded-lg animate-pulse"></div>
                  ) : incidents.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-400">No records.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {statusChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className="md:col-span-7 space-y-4 pl-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                      <p className="text-3xl font-black text-red-600 leading-none">
                        {statusChartData[0]?.value || 0}
                      </p>
                      <p className="text-xs font-semibold text-gray-500 mt-2">Active / Pending</p>
                    </div>
                    <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
                      <p className="text-3xl font-black text-green-600 leading-none">
                        {statusChartData[1]?.value || 0}
                      </p>
                      <p className="text-xs font-semibold text-gray-500 mt-2">Resolved Reports</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Incident Management Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <h3 className="font-extrabold text-gray-900 text-sm">Incident Management Registry</h3>
              
              {/* Table Filters */}
              <div className="flex flex-wrap gap-2">
                <select 
                  className="bg-white border border-gray-200 rounded-lg text-xs font-semibold px-2 py-1 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                >
                  <option value="All">All Categories</option>
                  <option value="Flood">Flood</option>
                  <option value="Fire">Fire</option>
                  <option value="Power Outage">Power Outage</option>
                  <option value="Landslide">Landslide</option>
                  <option value="Heat Emergency">Heat Emergency</option>
                </select>

                <select 
                  className="bg-white border border-gray-200 rounded-lg text-xs font-semibold px-2 py-1 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  <option value="open">Open / Pending</option>
                  <option value="investigating">Investigating</option>
                  <option value="in progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              {incidentsLoading ? (
                <div className="p-8 space-y-4">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="h-10 bg-gray-50 animate-pulse rounded-lg border border-gray-100"></div>
                  ))}
                </div>
              ) : filteredIncidents.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-40 text-gray-300" />
                  <p className="font-semibold text-sm">No Incidents Found</p>
                  <p className="text-xs text-gray-400 mt-1">There are no reports matching the selected filters.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="px-6 py-3.5">Incident Title</th>
                      <th className="px-6 py-3.5">Category</th>
                      <th className="px-6 py-3.5">Location</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5">Date</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {filteredIncidents.map(inc => (
                      <tr 
                        key={inc.id} 
                        className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                        onClick={() => setSelectedIncident(inc)}
                      >
                        <td className="px-6 py-4 font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                          {inc.title}
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {inc.category}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {inc.location_name}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                            inc.status.toLowerCase() === "open" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                            inc.status.toLowerCase() === "investigating" ? "bg-blue-50 text-blue-700 border-blue-200" :
                            inc.status.toLowerCase() === "in progress" ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                            inc.status.toLowerCase() === "resolved" ? "bg-green-50 text-green-700 border-green-200" :
                            "bg-red-50 text-red-700 border-red-200"
                          }`}>
                            {inc.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-400">
                          {new Date(inc.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right space-x-1.5" onClick={e => e.stopPropagation()}>
                          {inc.status.toLowerCase() !== "resolved" && inc.status.toLowerCase() !== "rejected" && (
                            <>
                              <button 
                                onClick={() => handleUpdateIncidentStatus(inc.id, "investigating")}
                                className="px-2 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded hover:bg-blue-100 font-bold transition-all cursor-pointer"
                                title="Approve & Investigate"
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => handleUpdateIncidentStatus(inc.id, "rejected")}
                                className="px-2 py-1 bg-red-50 border border-red-200 text-red-700 rounded hover:bg-red-100 font-bold transition-all cursor-pointer"
                                title="Reject Incident"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {inc.status.toLowerCase() !== "resolved" && (
                            <button 
                              onClick={() => handleUpdateIncidentStatus(inc.id, "resolved")}
                              className="px-2 py-1 bg-green-50 border border-green-200 text-green-700 rounded hover:bg-green-100 font-bold transition-all cursor-pointer"
                              title="Mark Resolved"
                            >
                              Resolve
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>

        {/* Right Columns (4 of 12) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Alert Management Console */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="font-extrabold text-gray-900 text-sm">Alert Management Console</h3>
            </div>
            
            <div className="divide-y divide-gray-100 max-h-[350px] overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs">
                  {"No alerts created yet. Use 'Issue Emergency Alert' to create one."}
                </div>
              ) : (
                alerts.map(alert => (
                  <div key={alert.id} className="p-4 hover:bg-gray-50 transition-colors flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-1.5 py-0.5 rounded-[3px] text-[8px] font-extrabold border uppercase ${
                          alert.severity === "Critical" ? "bg-red-50 text-red-600 border-red-200" :
                          alert.severity === "High" ? "bg-orange-50 text-orange-600 border-orange-200" :
                          alert.severity === "Moderate" ? "bg-yellow-50 text-yellow-600 border-yellow-200" :
                          "bg-green-50 text-green-600 border-green-200"
                        }`}>
                          {alert.severity}
                        </span>
                        <span className="font-extrabold text-gray-900 truncate">{alert.title}</span>
                      </div>
                      <p className="text-gray-500 truncate">{alert.description}</p>
                      <p className="text-[10px] text-gray-400 font-medium">Area: {alert.area}</p>
                    </div>

                    <div className="flex gap-1 shrink-0">
                      <button 
                        onClick={() => setSelectedAlertForEdit(alert)}
                        className="p-1 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                        title="Edit Alert"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button 
                        onClick={() => setSelectedAlertForDelete(alert)}
                        className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                        title="Delete Alert"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* High Risk Zones panel */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-extrabold text-gray-900 text-sm">Zone Vulnerability Ranking</h3>
            </div>
            
            <div className="p-3">
              {riskZonesLoading ? (
                <div className="space-y-3 p-2">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="h-10 bg-gray-50 animate-pulse rounded border border-gray-100"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  {riskZones.map((zone, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2.5 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-all">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800">#{idx + 1} {zone.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-gray-900">{zone.score}/100</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold border ${zone.color}`}>
                          {zone.level}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Resource Deployment Panel */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-extrabold text-gray-900 text-sm">Tactical Resources</h3>
            </div>
            <div className="p-2 space-y-2 max-h-[300px] overflow-y-auto">
              {resources.map(res => (
                <div key={res.id} className="p-3 rounded-lg border border-gray-100 flex items-center justify-between hover:border-gray-200 transition-colors text-xs">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      res.type === "Rescue Team" ? "bg-purple-100 text-purple-600" :
                      res.type === "Ambulance" ? "bg-orange-100 text-orange-600" :
                      res.type === "Water Unit" ? "bg-blue-100 text-blue-600" :
                      "bg-green-100 text-green-600"
                    }`}>
                      {res.type === "Rescue Team" && <ActivitySquare className="h-4 w-4" />}
                      {res.type === "Ambulance" && <Ambulance className="h-4 w-4" />}
                      {res.type === "Water Unit" && <Droplet className="h-4 w-4" />}
                      {res.type === "Shelter" && <Home className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{res.name}</p>
                      <p className="text-gray-400 text-[10px] mt-0.5">{res.location || res.capacity}</p>
                    </div>
                  </div>
                  <div>
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase ${
                      res.status === "Deployed" || res.status === "En Route" ? "bg-blue-100 text-blue-700" :
                      "bg-green-100 text-green-700"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="absolute inset-0 bg-secondary-900/40 backdrop-blur-sm" onClick={() => setSelectedIncident(null)}></div>
          <div className="bg-white rounded-2xl w-full max-w-lg relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Incident Details</h2>
              <button onClick={() => setSelectedIncident(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-6 text-xs">
              
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Incident ID: {selectedIncident.id}</p>
                  <h3 className="text-lg font-black text-gray-900">{selectedIncident.title}</h3>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 rounded text-gray-500 uppercase">{selectedIncident.category}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    selectedIncident.status.toLowerCase() === "open" ? "bg-yellow-50 text-yellow-700 border-yellow-100 border" :
                    selectedIncident.status.toLowerCase() === "resolved" ? "bg-green-50 text-green-700 border-green-100 border" :
                    "bg-blue-50 text-blue-700 border-blue-100 border"
                  }`}>{selectedIncident.status}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <MapPin className="h-4 w-4 text-primary-500 shrink-0" />
                {selectedIncident.location_name}
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Description</h4>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-100 leading-relaxed">
                  {selectedIncident.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Report Coordinates</h4>
                  <p className="text-gray-700 bg-gray-50 p-2.5 rounded-lg border border-gray-100 font-mono">
                    Lat: {selectedIncident.latitude.toFixed(4)}<br/>
                    Lng: {selectedIncident.longitude.toFixed(4)}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Timeline</h4>
                  <ul className="text-gray-500 space-y-1">
                    <li>Reported: {new Date(selectedIncident.created_at).toLocaleString()}</li>
                    <li>Current Status: <strong className="text-gray-800 uppercase">{selectedIncident.status}</strong></li>
                  </ul>
                </div>
              </div>

            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
              <button onClick={() => setSelectedIncident(null)} className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 cursor-pointer">Close</button>
              
              {selectedIncident.status.toLowerCase() !== "resolved" && selectedIncident.status.toLowerCase() !== "rejected" && (
                <>
                  <button 
                    onClick={() => {
                      handleUpdateIncidentStatus(selectedIncident.id, "rejected");
                      setSelectedIncident(null);
                    }}
                    className="px-4 py-2 text-xs font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 cursor-pointer"
                  >
                    Reject Report
                  </button>
                  <button 
                    onClick={() => {
                      handleUpdateIncidentStatus(selectedIncident.id, "investigating");
                      setSelectedIncident(null);
                    }}
                    className="px-4 py-2 text-xs font-bold text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer"
                  >
                    Approve / Investigate
                  </button>
                </>
              )}
              {selectedIncident.status.toLowerCase() !== "resolved" && (
                <button 
                  onClick={() => {
                    handleUpdateIncidentStatus(selectedIncident.id, "resolved");
                    setSelectedIncident(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 cursor-pointer"
                >
                  Mark Resolved
                </button>
              )}
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

      {/* Edit Alert Modal */}
      {selectedAlertForEdit && (
        <EditAlertModal 
          alert={selectedAlertForEdit}
          onClose={() => setSelectedAlertForEdit(null)}
          updateAlert={updateAlert}
          showToast={showToast}
        />
      )}

      {/* Delete Alert Modal */}
      {selectedAlertForDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="absolute inset-0 bg-secondary-900/40 backdrop-blur-sm" onClick={() => setSelectedAlertForDelete(null)}></div>
          <div className="bg-white rounded-2xl w-full max-w-md relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 text-center mb-2 font-black">Delete Emergency Alert</h3>
              <p className="text-xs text-gray-500 text-center mb-6 leading-relaxed">
                Are you sure you want to permanently delete alert <strong>&quot;{selectedAlertForDelete.title}&quot;</strong>? This will remove the warning notice for all citizens immediately.
              </p>

              <div className="flex gap-3">
                <button 
                  onClick={() => setSelectedAlertForDelete(null)} 
                  className="flex-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDeleteAlert(selectedAlertForDelete.id)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 cursor-pointer"
                >
                  Delete Alert
                </button>
              </div>
            </div>
          </div>
        </div>
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

function CreateAlertModal({ onClose, addAlert, showToast }: { onClose: () => void, addAlert: (alert: ClimateAlert) => Promise<void>, showToast: (msg: string, type: "success" | "error") => void }) {
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.location || !formData.description) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    setIsSubmitting(true);

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

    try {
      await addAlert(newAlert);
      showToast("Emergency Alert Created Successfully", "success");
      onClose();
    } catch (err: unknown) {
      console.error("Failed to insert alert:", err);
      const errMsg = err instanceof Error ? err.message : "Failed to issue emergency alert.";
      showToast(errMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="fixed inset-0 bg-secondary-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-2xl w-full max-w-lg relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Create Emergency Alert</h2>
          <button onClick={onClose} disabled={isSubmitting} className="text-gray-400 hover:text-gray-600 disabled:opacity-50">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="text-xs">
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">Alert Type</label>
                <select 
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  disabled={isSubmitting}
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
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">Severity</label>
                <select 
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={formData.severity}
                  onChange={e => setFormData({...formData, severity: e.target.value})}
                  disabled={isSubmitting}
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
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">Location <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  placeholder="e.g. Velachery"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">Target Zone</label>
                <input 
                  type="text" 
                  placeholder="e.g. Zone 13"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={formData.zone}
                  onChange={e => setFormData({...formData, zone: e.target.value})}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">Description <span className="text-red-500">*</span></label>
              <textarea 
                rows={3}
                placeholder="Provide detailed information about the emergency..."
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-2">Send Notification</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="text-primary-600 group-hover:text-primary-700">
                    {formData.notifyPush ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5 text-gray-300" />}
                  </div>
                  <input type="checkbox" className="hidden" checked={formData.notifyPush} onChange={() => setFormData({...formData, notifyPush: !formData.notifyPush})} disabled={isSubmitting} />
                  <span className="text-xs font-semibold text-gray-700">Push App</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="text-primary-600 group-hover:text-primary-700">
                    {formData.notifySms ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5 text-gray-300" />}
                  </div>
                  <input type="checkbox" className="hidden" checked={formData.notifySms} onChange={() => setFormData({...formData, notifySms: !formData.notifySms})} disabled={isSubmitting} />
                  <span className="text-xs font-semibold text-gray-700">SMS Alert</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="text-primary-600 group-hover:text-primary-700">
                    {formData.notifyEmail ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5 text-gray-300" />}
                  </div>
                  <input type="checkbox" className="hidden" checked={formData.notifyEmail} onChange={() => setFormData({...formData, notifyEmail: !formData.notifyEmail})} disabled={isSubmitting} />
                  <span className="text-xs font-semibold text-gray-700">Email</span>
                </label>
              </div>
            </div>

          </div>
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 disabled:opacity-50 cursor-pointer">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 flex items-center gap-2 shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Issuing Alert...
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4" /> Issue Alert Now
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditAlertModal({ alert, onClose, updateAlert, showToast }: { alert: ClimateAlert, onClose: () => void, updateAlert: (alert: ClimateAlert) => Promise<void>, showToast: (msg: string, type: "success" | "error") => void }) {
  const [formData, setFormData] = useState({
    title: alert.title,
    type: alert.category,
    severity: alert.severity,
    location: alert.area,
    status: alert.status,
    description: alert.description
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.location || !formData.description) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const updated: ClimateAlert = {
        ...alert,
        title: formData.title,
        category: formData.type as AlertCategory,
        severity: formData.severity as Severity,
        area: formData.location,
        status: formData.status as AlertStatus,
        description: formData.description
      };
      await updateAlert(updated);
      showToast("Alert successfully updated.", "success");
      onClose();
    } catch (err) {
      console.error("Failed to update alert:", err);
      showToast("Failed to update alert.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="fixed inset-0 bg-secondary-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-2xl w-full max-w-lg relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Modify Emergency Alert</h2>
          <button onClick={onClose} disabled={isSubmitting} className="text-gray-400 hover:text-gray-600 disabled:opacity-50">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="text-xs">
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">Alert Header / Title <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">Alert Type</label>
                <select 
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value as AlertCategory})}
                  disabled={isSubmitting}
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
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">Severity</label>
                <select 
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={formData.severity}
                  onChange={e => setFormData({...formData, severity: e.target.value as Severity})}
                  disabled={isSubmitting}
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
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">Location <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">Status</label>
                <select 
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value as AlertStatus})}
                  disabled={isSubmitting}
                >
                  <option value="Active">Active</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">Description <span className="text-red-500">*</span></label>
              <textarea 
                rows={3}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                disabled={isSubmitting}
              />
            </div>

          </div>
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 disabled:opacity-50 cursor-pointer">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-sm disabled:opacity-50 cursor-pointer">
              {isSubmitting ? "Saving changes..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeployResourceModal({ onClose, onDeploy, showToast }: { onClose: () => void, onDeploy: (data: { type: string, unit: string, location: string, incident: string, priority: string }) => void, showToast: (msg: string, type: "success" | "error") => void }) {
  const [formData, setFormData] = useState({
    type: "Rescue Squad",
    unit: "Rescue Squad Alpha",
    location: "",
    incident: "",
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="fixed inset-0 bg-secondary-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-2xl w-full max-w-lg relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Deploy Emergency Resource</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="text-xs">
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">Resource Type</label>
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
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">Resource Unit</label>
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
              <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">Target Location <span className="text-red-500">*</span></label>
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
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">Link Incident Description</label>
                <input 
                  type="text" 
                  placeholder="e.g. Flood evacuation"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={formData.incident}
                  onChange={e => setFormData({...formData, incident: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">Priority</label>
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
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 cursor-pointer">Cancel</button>
            <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-primary-600 rounded-lg hover:bg-primary-700 flex items-center gap-2 shadow-sm cursor-pointer">
              <Send className="h-4 w-4" /> Deploy Resource Unit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
