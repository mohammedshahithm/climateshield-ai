"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { 
  AlertTriangle, ShieldAlert, ActivitySquare, Users, 
  MapPin, PlusCircle, Trash2, Edit3, CheckCircle2,
  Clock, BarChart3, X, CheckSquare, Square, Loader2,
  FileText, Send, Ambulance, Home, Droplet, Flame, Shield, Brain, RefreshCw
} from "lucide-react";
import type { AdminMarker } from "@/components/maps/AdminMapComponent";
import { useAlerts } from "@/lib/AlertsContext";
import { useResourceShelters, Shelter, Resource as DbResource, ResourceType, ResourceStatus } from "@/lib/ResourceShelterContext";
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
  assigned_resources?: string[];
  assigned_rescue_teams?: string[];
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { userRole, alerts, addAlert, updateAlert, deleteAlert, showToast } = useAlerts();
  const { 
    shelters, 
    resources, 
    addShelter, 
    updateShelter, 
    deleteShelter, 
    addResource, 
    updateResource, 
    deleteResource 
  } = useResourceShelters();
  const { latitude, longitude } = useLocation();
  const supabase = createClient();

  // State
  const [activeTab, setActiveTabState] = useState<"command" | "resources" | "shelters">("command");
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [incidentsLoading, setIncidentsLoading] = useState(true);
  const [citizensCount, setCitizensCount] = useState<number | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [riskZones, setRiskZones] = useState<{ name: string; score: number; level: string; color: string }[]>([]);
  const [riskZonesLoading, setRiskZonesLoading] = useState(true);

  // Modals & Selections
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isCreateAlertOpen, setIsCreateAlertOpen] = useState(false);
  const [selectedAlertForEdit, setSelectedAlertForEdit] = useState<ClimateAlert | null>(null);
  const [selectedAlertForDelete, setSelectedAlertForDelete] = useState<ClimateAlert | null>(null);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [isSeedModalOpen, setIsSeedModalOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Assignment states
  const [tempAssignedResources, setTempAssignedResources] = useState<string[]>([]);
  const [tempAssignedRescueTeams, setTempAssignedRescueTeams] = useState<string[]>([]);

  // Sync tab with URL parameter
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "command" || tab === "resources" || tab === "shelters") {
        setActiveTabState(tab);
      }
    }
  }, []);

  const setActiveTab = (tab: "command" | "resources" | "shelters") => {
    setActiveTabState(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.pushState({}, "", url.toString());
    }
  };

  useEffect(() => {
    if (selectedIncident) {
      setTempAssignedResources(selectedIncident.assigned_resources || []);
      setTempAssignedRescueTeams(selectedIncident.assigned_rescue_teams || []);
    }
  }, [selectedIncident]);

  // Shelters Modals
  const [isCreateShelterOpen, setIsCreateShelterOpen] = useState(false);
  const [selectedShelterForEdit, setSelectedShelterForEdit] = useState<Shelter | null>(null);
  const [selectedShelterForDelete, setSelectedShelterForDelete] = useState<Shelter | null>(null);

  // Resources Modals
  const [isCreateResourceOpen, setIsCreateResourceOpen] = useState(false);
  const [selectedResourceForEdit, setSelectedResourceForEdit] = useState<DbResource | null>(null);
  const [selectedResourceForDelete, setSelectedResourceForDelete] = useState<DbResource | null>(null);

  // Filters State
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // AI Government Recommendations telemetry state
  const [activeCityMetrics, setActiveCityMetrics] = useState<{
    floodScore: number;
    heatScore: number;
    aqiRaw: number;
    compositeScore: number;
    riskLevel: string;
  } | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [isDispatchingAI, setIsDispatchingAI] = useState(false);
  const [isAIDispatchModalOpen, setIsAIDispatchModalOpen] = useState(false);
  const { city: activeCityName } = useLocation();

  useEffect(() => {
    let active = true;
    const fetchActiveMetrics = async () => {
      setMetricsLoading(true);
      try {
        const [weather, aqi, flood] = await Promise.all([
          fetchWeather(latitude, longitude),
          fetchAirQuality(latitude, longitude),
          fetchFloodRisk(latitude, longitude),
        ]);
        if (!active) return;

        const floodVal = flood.score;
        const aqiVal = aqi.usAqi;
        const aqiScore = Math.round(Math.min(100, (aqiVal / 200) * 100));
        const tempVal = weather.temperature;
        const heatVal = Math.round(Math.min(100, Math.max(0, (tempVal - 70) * (100 / 35))));
        const composite = Math.max(floodVal, aqiScore, heatVal);

        let level = "Moderate";
        if (composite >= 75) level = "Critical";
        else if (composite >= 50) level = "High";
        else if (composite >= 25) level = "Moderate";
        else level = "Low";

        setActiveCityMetrics({
          floodScore: floodVal,
          heatScore: heatVal,
          aqiRaw: aqiVal,
          compositeScore: composite,
          riskLevel: level
        });
      } catch (err) {
        console.error("Failed to load active metrics for admin recommendations:", err);
      } finally {
        if (active) setMetricsLoading(false);
      }
    };

    fetchActiveMetrics();
    return () => { active = false; };
  }, [latitude, longitude]);

  const governmentRecs = useMemo(() => {
    const list: string[] = [];
    if (!activeCityMetrics) return [];

    const { floodScore, heatScore, aqiRaw } = activeCityMetrics;

    if (floodScore >= 75) {
      list.push(
        "Clear all critical stormwater conduits and confirm pump operations.",
        "Dispatch emergency rescue assets and evacuation transport to Zone A.",
        "Broadcast pre-emptive emergency warning notices via regional SMS."
      );
    } else if (floodScore >= 50) {
      list.push(
        "Deploy mobile drainage pumps to waterlogging hotspots.",
        "Alert and prepare relief shelters for potential citizens."
      );
    } else if (floodScore >= 25) {
      list.push("Monitor canal water levels and check critical street drainage.");
    }

    if (heatScore >= 75) {
      list.push(
        "Launch air-conditioned public cooling centers across high-density wards.",
        "Coordinate with electrical grid operators to protect transformer infrastructure."
      );
    } else if (heatScore >= 50) {
      list.push(
        "Enforce strict labor suspension guidelines during peak afternoon heat.",
        "Supply government medical centers with hydration packs and IV lines."
      );
    }

    if (aqiRaw >= 150) {
      list.push(
        "Enforce dust abatement directives at public work and construction sites.",
        "Restrict heavy commercial diesel vehicle entries into city center."
      );
    } else if (aqiRaw >= 100) {
      list.push("Run mist-purifying cannons in congested industrial zones.");
    }

    if (list.length === 0) {
      list.push(
        "Maintain normal sensor monitoring and response unit readiness.",
        "Proceed with scheduled drain-cleaning maintenance."
      );
    }

    return list;
  }, [activeCityMetrics]);

  const handleDispatchAIRecommendations = async () => {
    setIsDispatchingAI(true);
    try {
      const availableResources = resources.filter(r => r.status === "Available");
      const deployPromises: Promise<void>[] = [];

      // Determine resource types to deploy
      const typesToDeploy: ResourceType[] = [];
      if ((activeCityMetrics?.floodScore || 0) >= 50) {
        typesToDeploy.push("Ambulance");
        typesToDeploy.push("Rescue Team");
      }
      if ((activeCityMetrics?.heatScore || 0) >= 50) {
        typesToDeploy.push("Medical Team");
      }
      if (typesToDeploy.length === 0 && (activeCityMetrics?.compositeScore || 0) >= 25) {
        typesToDeploy.push("Ambulance");
      }

      // Find matching available units and deploy them
      const deployedUnits: string[] = [];
      typesToDeploy.forEach(type => {
        const unit = availableResources.find(r => r.type === type && !deployedUnits.includes(r.id));
        if (unit) {
          deployedUnits.push(unit.id);
          deployPromises.push(
            updateResource({
              ...unit,
              status: "Deployed",
              location: `${activeCityName} Response Area`
            })
          );
        }
      });

      // Activate shelters in the active city area
      const inactiveShelters = shelters.filter(s => s.status === "Closed" || s.status === "Full");
      const sheltersToActivate = inactiveShelters.slice(0, 2);
      sheltersToActivate.forEach(shelter => {
        deployPromises.push(
          updateShelter({
            ...shelter,
            status: "Active"
          })
        );
      });

      // Draft and issue alert
      let alertTitle = "General Climate Risk Warning";
      let alertMsg = `A composite climate risk score of ${activeCityMetrics?.compositeScore}/100 has been detected in ${activeCityName}. Municipal response agencies have been placed on high alert.`;
      let severity: Severity = "Moderate";

      if ((activeCityMetrics?.compositeScore || 0) >= 75) {
        severity = "Critical";
        alertTitle = `${activeCityName} Critical Risk Directive`;
        alertMsg = `Critical hazards identified in ${activeCityName}. Flood risk is ${activeCityMetrics?.floodScore}%, heatwave risk is ${activeCityMetrics?.heatScore}%. Immediate evacuation/preparedness protocols active.`;
      } else if ((activeCityMetrics?.compositeScore || 0) >= 50) {
        severity = "High";
        alertTitle = `${activeCityName} High Risk Alert`;
        alertMsg = `High composite climate risk of ${activeCityMetrics?.compositeScore}/100 in ${activeCityName}. Residents are advised to minimize travel and monitor local advisories.`;
      }

      const alertId = `ALRT-${Math.floor(1000 + Math.random() * 9000)}`;
      let alertCategory: AlertCategory = "Flood Risk";
      if (activeCityMetrics && activeCityMetrics.heatScore > activeCityMetrics.floodScore) {
        alertCategory = "Heatwave";
      }

      const newAlert: ClimateAlert = {
        id: alertId,
        title: alertTitle,
        category: alertCategory,
        severity,
        area: activeCityName,
        timestamp: "Just Now",
        status: "Active",
        description: alertMsg,
        recommendedActions: governmentRecs,
        emergencyContacts: [
          { name: "District Disaster Helpline", number: "1077" },
          { name: "Emergency Support", number: "112" }
        ]
      };

      await Promise.all([
        ...deployPromises,
        addAlert(newAlert)
      ]);

      showToast(`AI directives executed. Deployed ${deployedUnits.length} resources, activated ${sheltersToActivate.length} shelters, and broadcasted emergency warning for ${activeCityName}.`, "success");
      setIsAIDispatchModalOpen(false);
    } catch (err) {
      console.error("AI Dispatch failed:", err);
      showToast("Failed to fully dispatch AI recommendations.", "error");
    } finally {
      setIsDispatchingAI(false);
    }
  };

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
    const shelterMarkers = shelters
      .filter(s => s.status !== "Closed")
      .map(s => ({
        id: s.id,
        type: "Shelter" as const,
        name: s.name,
        lat: s.latitude,
        lng: s.longitude,
        details: `Status: ${s.status} | Occupancy: ${s.occupied}/${s.capacity} | Contact: ${s.contact}`
      }));
    return [...incidentMarkers, ...shelterMarkers];
  }, [incidentMarkers, shelters]);

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

  const resourceAvailabilityChartData = useMemo(() => {
    const counts = { Available: 0, Deployed: 0, Maintenance: 0 };
    resources.forEach(r => {
      if (r.status in counts) {
        counts[r.status as keyof typeof counts]++;
      }
    });
    return Object.keys(counts).map(key => ({
      name: key,
      value: counts[key as keyof typeof counts]
    }));
  }, [resources]);

  const shelterOccupancyChartData = useMemo(() => {
    return shelters.map(s => ({
      name: s.name,
      Occupied: s.occupied,
      Free: Math.max(0, s.capacity - s.occupied)
    }));
  }, [shelters]);

  const regionalRiskChartData = useMemo(() => {
    return riskZones.map(z => ({
      name: z.name,
      Score: z.score
    }));
  }, [riskZones]);

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

  const handleSaveAssignments = async (
    incidentId: string,
    newAssignedResources: string[],
    newAssignedRescueTeams: string[]
  ) => {
    try {
      const incident = incidents.find(inc => inc.id === incidentId);
      if (!incident) return;

      const currentAssigned = [
        ...(incident.assigned_resources || []),
        ...(incident.assigned_rescue_teams || [])
      ];
      const nextAssigned = [...newAssignedResources, ...newAssignedRescueTeams];

      const added = nextAssigned.filter(id => !currentAssigned.includes(id));
      const removed = currentAssigned.filter(id => !nextAssigned.includes(id));

      let newStatus = incident.status;
      if (nextAssigned.length > 0 && (newStatus.toLowerCase() === "pending" || newStatus.toLowerCase() === "open")) {
        newStatus = "Assigned";
      } else if (nextAssigned.length === 0 && newStatus.toLowerCase() === "assigned") {
        newStatus = "Pending";
      }

      const { error: incError } = await supabase
        .from("incidents")
        .update({
          assigned_resources: newAssignedResources,
          assigned_rescue_teams: newAssignedRescueTeams,
          status: newStatus
        })
        .eq("id", incidentId);

      if (incError) throw incError;

      const deployPromises = added.map(async (resId) => {
        const res = resources.find(r => r.id === resId);
        if (res) {
          await updateResource({
            ...res,
            status: "Deployed",
            location: incident.location_name
          });
        }
      });

      const releasePromises = removed.map(async (resId) => {
        const res = resources.find(r => r.id === resId);
        if (res) {
          await updateResource({
            ...res,
            status: "Available"
          });
        }
      });

      await Promise.all([...deployPromises, ...releasePromises]);

      setIncidents(prev => prev.map(inc => inc.id === incidentId ? {
        ...inc,
        assigned_resources: newAssignedResources,
        assigned_rescue_teams: newAssignedRescueTeams,
        status: newStatus
      } : inc));

      setSelectedIncident(prev => prev && prev.id === incidentId ? {
        ...prev,
        assigned_resources: newAssignedResources,
        assigned_rescue_teams: newAssignedRescueTeams,
        status: newStatus
      } : prev);

      showToast("Tactical unit assignments updated successfully.", "success");
    } catch (err) {
      console.error("Failed to save assignments:", err);
      showToast("Failed to save assignments.", "error");
    }
  };

  const handleDeployResource = async (deploymentData: { unit: string; location: string; incident: string; priority: string; }) => {
    const matchedRes = resources.find(r => r.name === deploymentData.unit);
    if (matchedRes) {
      try {
        await updateResource({
          ...matchedRes,
          status: "Deployed",
          location: deploymentData.location
        });
        showToast("Tact unit successfully dispatched.", "success");
      } catch (err) {
        console.error("Failed to deploy resource:", err);
        showToast("Failed to dispatch resource.", "error");
      }
    }
    
    if (deploymentData.incident) {
      const matched = incidents.find(inc => inc.title === deploymentData.incident);
      if (matched) {
        handleUpdateIncidentStatus(matched.id, "in progress");
      }
    }

    setIsDeployModalOpen(false);
  };

  const handleQuickOccupancyChange = async (shelter: Shelter, newOccupied: number) => {
    if (newOccupied < 0 || newOccupied > shelter.capacity) {
      showToast("Occupancy must be between 0 and shelter capacity.", "error");
      return;
    }
    try {
      await updateShelter({
        ...shelter,
        occupied: newOccupied,
        status: newOccupied === shelter.capacity ? "Full" : shelter.status === "Full" ? "Active" : shelter.status
      });
      showToast("Shelter occupancy updated successfully.", "success");
    } catch (err) {
      console.error("Failed to update shelter occupancy:", err);
      showToast("Failed to update shelter occupancy.", "error");
    }
  };

  const handleShelterStatusChange = async (shelter: Shelter, newStatus: "Active" | "Full" | "Closed") => {
    try {
      await updateShelter({
        ...shelter,
        status: newStatus
      });
      showToast(`Shelter status changed to ${newStatus}.`, "success");
    } catch (err) {
      console.error("Failed to change shelter status:", err);
      showToast("Failed to change shelter status.", "error");
    }
  };

  const handleResourceStatusChange = async (res: DbResource, newStatus: ResourceStatus) => {
    try {
      await updateResource({
        ...res,
        status: newStatus
      });
      showToast(`Resource status changed to ${newStatus}.`, "success");
    } catch (err) {
      console.error("Failed to change resource status:", err);
      showToast("Failed to change resource status.", "error");
    }
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

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    try {
      const deleteFilterVal = "00000000-0000-0000-0000-000000000000";
      
      const { error: delIncidentsErr } = await supabase
        .from("incidents")
        .delete()
        .neq("id", deleteFilterVal);
      if (delIncidentsErr) throw delIncidentsErr;

      const { error: delAlertsErr } = await supabase
        .from("alerts")
        .delete()
        .neq("id", deleteFilterVal);
      if (delAlertsErr) throw delAlertsErr;

      const { error: delSheltersErr } = await supabase
        .from("shelters")
        .delete()
        .neq("id", deleteFilterVal);
      if (delSheltersErr) throw delSheltersErr;

      const { error: delResourcesErr } = await supabase
        .from("resources")
        .delete()
        .neq("id", deleteFilterVal);
      if (delResourcesErr) throw delResourcesErr;

      const alertsSeed = [
        {
          id: "ALRT-1001",
          title: "Velachery Flash Flood Emergency",
          message: "Severe flood risk calculated in low-lying zones. Residents should move valuable belongings upstairs, avoid all street level transit, and map closest emergency shelter access routes.",
          severity: "critical",
          location: "Chennai",
          status: "active",
        },
        {
          id: "ALRT-1002",
          title: "NCR Hazardous Smog Advisory",
          message: "Unhealthy AQI levels exceeding 380 detected across Delhi metropolitan wards. Construction activity suspended. Mask enforcement (N95) directive active for vulnerable population segments.",
          severity: "critical",
          location: "Delhi",
          status: "active",
        },
        {
          id: "ALRT-1003",
          title: "Mumbai Coastal Inundation Ingress",
          message: "High tide warnings and heavy swell alert active along west coast sea lanes. Sea water encroachment reported near Marine Drive pathways. Stay clear of shoreline walls.",
          severity: "high",
          location: "Mumbai",
          status: "active",
        },
        {
          id: "ALRT-1004",
          title: "Bangalore Severe Thunderstorm Alert",
          message: "Heavy rain downpour expected to cause sudden water pooling on outer ring road arteries. Ground team crews deployed to clear critical drain blocks.",
          severity: "medium",
          location: "Bangalore",
          status: "active",
        }
      ];

      const sheltersSeed = [
        {
          id: "sh-1",
          name: "Velachery Relief Center",
          address: "14 Gandhi Nagar Road, Velachery",
          location: "Velachery",
          latitude: 12.9802,
          longitude: 80.2230,
          capacity: 400,
          occupied: 280,
          contact: "+91 44 2244 5566",
          status: "Active"
        },
        {
          id: "sh-2",
          name: "Bandra Public Shelter Hall",
          address: "Bandra Reclamation Center, Mumbai",
          location: "Bandra",
          latitude: 19.0544,
          longitude: 72.8402,
          capacity: 350,
          occupied: 110,
          contact: "+91 22 2644 1122",
          status: "Active"
        },
        {
          id: "sh-3",
          name: "Connaught Place Emergency Pavilion",
          address: "CP Block B Central Stadium, New Delhi",
          location: "Connaught Place",
          latitude: 28.6304,
          longitude: 77.2177,
          capacity: 500,
          occupied: 500,
          contact: "+91 11 2341 9988",
          status: "Full"
        },
        {
          id: "sh-4",
          name: "Indiranagar Urban Camp Site",
          address: "100 Feet Road Municipal Gym, Bangalore",
          location: "Indiranagar",
          latitude: 12.9719,
          longitude: 77.6412,
          capacity: 200,
          occupied: 0,
          contact: "+91 80 2521 3344",
          status: "Closed"
        },
        {
          id: "sh-5",
          name: "Begumpet Disaster Relief Block",
          address: "Prakash Nagar Colony, Begumpet",
          location: "Begumpet",
          latitude: 17.4411,
          longitude: 78.4722,
          capacity: 300,
          occupied: 180,
          contact: "+91 40 2790 7788",
          status: "Active"
        },
        {
          id: "sh-6",
          name: "Salt Lake Municipal Center",
          address: "Salt Lake Sector V, Kolkata",
          location: "Salt Lake",
          latitude: 22.5733,
          longitude: 88.4311,
          capacity: 250,
          occupied: 60,
          contact: "+91 33 2358 1122",
          status: "Active"
        }
      ];

      const resourcesSeed = [
        {
          id: "res-1",
          name: "Chennai Rescue Squad 1",
          type: "Rescue Team",
          location: "Velachery Depot",
          latitude: 12.9792,
          longitude: 80.2242,
          capacity: 10,
          contact: "+91 94440 12345",
          status: "Available"
        },
        {
          id: "res-2",
          name: "Chennai Water Tanker W-1",
          type: "Water Tanker",
          location: "Guindy Storage Hub",
          latitude: 13.0075,
          longitude: 80.2212,
          capacity: 12000,
          contact: "+91 94440 67890",
          status: "Available"
        },
        {
          id: "res-3",
          name: "Chennai Ambulance Unit A",
          type: "Ambulance",
          location: "Adyar Hospital Yard",
          latitude: 13.0018,
          longitude: 80.2580,
          capacity: 2,
          contact: "+91 94440 55555",
          status: "Deployed"
        },
        {
          id: "res-4",
          name: "Mumbai Emergency Water Squad",
          type: "Water Tanker",
          location: "Bandra Station Yard",
          latitude: 19.0550,
          longitude: 72.8420,
          capacity: 10000,
          contact: "+91 98200 11111",
          status: "Available"
        },
        {
          id: "res-5",
          name: "Mumbai Medical Rapid Unit",
          type: "Medical Team",
          location: "Kurla Medical Depot",
          latitude: 19.0712,
          longitude: 72.8790,
          capacity: 8,
          contact: "+91 98200 22222",
          status: "Deployed"
        },
        {
          id: "res-6",
          name: "Delhi Anti-Smog Water Sprinkler",
          type: "Water Tanker",
          location: "CP Fire Station",
          latitude: 28.6310,
          longitude: 77.2185,
          capacity: 15000,
          contact: "+91 98110 33333",
          status: "Available"
        },
        {
          id: "res-7",
          name: "Delhi Fire Service Unit D",
          type: "Fire Service",
          location: "Connaught Place Annex",
          latitude: 28.6322,
          longitude: 77.2198,
          capacity: 6,
          contact: "+91 98110 44444",
          status: "Available"
        },
        {
          id: "res-8",
          name: "Bangalore Relief Squad B",
          type: "Relief Camp",
          location: "Indiranagar Municipal Hall",
          latitude: 12.9725,
          longitude: 77.6420,
          capacity: 100,
          contact: "+91 98450 55555",
          status: "Available"
        },
        {
          id: "res-9",
          name: "Hyderabad Flood Evac Unit",
          type: "Rescue Team",
          location: "Begumpet Cantonment",
          latitude: 17.4425,
          longitude: 78.4735,
          capacity: 12,
          contact: "+91 98480 66666",
          status: "Available"
        },
        {
          id: "res-10",
          name: "Kolkata Ambulatory Care K",
          type: "Ambulance",
          location: "Salt Lake General Hospital",
          latitude: 22.5745,
          longitude: 88.4325,
          capacity: 3,
          contact: "+91 98300 77777",
          status: "Available"
        }
      ];

      let createdBy = "system-user-id";
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.id) {
        createdBy = userData.user.id;
      }

      const incidentsSeed = [
        {
          id: "inc-1",
          title: "Velachery Block A Waterlogging",
          category: "Flood",
          description: "Substantial flood water accumulation up to 3.5 feet across residential colonies in Velachery. Immediate drainage pump assets requested.",
          location_name: "Velachery Lowlands",
          latitude: 12.9801,
          longitude: 80.2224,
          status: "Pending",
          created_by: createdBy,
          assigned_resources: [],
          assigned_rescue_teams: []
        },
        {
          id: "inc-2",
          title: "CP Substation Overload",
          category: "Power Outage",
          description: "Transformer failure at CP substation blocks power delivery feeds, cutting electrical connectivity to CP blocks and office areas.",
          location_name: "Connaught Place Depot",
          latitude: 28.6305,
          longitude: 77.2188,
          status: "In Progress",
          created_by: createdBy,
          assigned_resources: [],
          assigned_rescue_teams: []
        },
        {
          id: "inc-3",
          title: "Marine Drive Swell Flooding",
          category: "Flood",
          description: "Sea swell waves crossing safety wall barriers, waterlogging pedestrian walkways along Marine Drive. Traffic diverted.",
          location_name: "Marine Drive Promenade",
          latitude: 19.0762,
          longitude: 72.8780,
          status: "Pending",
          created_by: createdBy,
          assigned_resources: [],
          assigned_rescue_teams: []
        },
        {
          id: "inc-4",
          title: "Indiranagar Substation Fire",
          category: "Fire",
          description: "Minor transformer fire due to overheating. Fire rescue and grid maintenance crews dispatched.",
          location_name: "100 Feet Road Grid",
          latitude: 12.9715,
          longitude: 77.6410,
          status: "Resolved",
          created_by: createdBy,
          assigned_resources: [],
          assigned_rescue_teams: []
        },
        {
          id: "inc-5",
          title: "Begumpet Drainage Failure",
          category: "Flood",
          description: "Overflowing storm drains have caused significant street flooding near Prakash Nagar, blocking small vehicle movement.",
          location_name: "Begumpet Lowlands",
          latitude: 17.4410,
          longitude: 78.4720,
          status: "Pending",
          created_by: createdBy,
          assigned_resources: [],
          assigned_rescue_teams: []
        },
        {
          id: "inc-6",
          title: "Salt Lake Power Substation Failure",
          category: "Power Outage",
          description: "Power cut across Sector V industrial parks. Engineering crew working on restoring auxiliary lines.",
          location_name: "Salt Lake Sector V Depot",
          latitude: 22.5732,
          longitude: 88.4310,
          status: "In Progress",
          created_by: createdBy,
          assigned_resources: [],
          assigned_rescue_teams: []
        }
      ];

      const { error: insIncidentsErr } = await supabase.from("incidents").insert(incidentsSeed);
      if (insIncidentsErr) throw insIncidentsErr;

      const { error: insAlertsErr } = await supabase.from("alerts").insert(alertsSeed);
      if (insAlertsErr) throw insAlertsErr;

      const { error: insSheltersErr } = await supabase.from("shelters").insert(sheltersSeed);
      if (insSheltersErr) throw insSheltersErr;

      const { error: insResourcesErr } = await supabase.from("resources").insert(resourcesSeed);
      if (insResourcesErr) throw insResourcesErr;

      await Promise.all([
        fetchIncidents(),
        fetchStats(),
        calculateRiskZones()
      ]);

      showToast("Database successfully reset & populated with premium demo data.", "success");
      setIsSeedModalOpen(false);
    } catch (err) {
      console.error("Database Seeding Failed:", err);
      showToast("Database seeding failed: " + (err instanceof Error ? err.message : String(err)), "error");
    } finally {
      setIsSeeding(false);
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

  const unresolvedIncidentsCount = useMemo(() => {
    return incidents.filter(i => ["pending", "assigned", "in progress", "open", "investigating"].includes(i.status.toLowerCase())).length;
  }, [incidents]);

  const availableResourcesCount = useMemo(() => {
    return resources.filter(r => r.status === "Available").length;
  }, [resources]);

  const shelterOccupancySummary = useMemo(() => {
    let occupied = 0;
    let cap = 0;
    shelters.forEach(s => {
      if (s.status === "Active" || s.status === "Full") {
        occupied += s.occupied;
        cap += s.capacity;
      }
    });
    return {
      occupied,
      capacity: cap,
      percent: cap > 0 ? Math.round((occupied / cap) * 100) : 0
    };
  }, [shelters]);

  const activeAlerts = useMemo(() => {
    return alerts.filter(a => a.status === "Active");
  }, [alerts]);

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
            onClick={() => setIsSeedModalOpen(true)}
            className="px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium rounded-lg hover:bg-amber-100 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className="h-4 w-4 text-amber-500" /> Reset & Seed Data
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

      {/* Tab Switcher */}
      <div className="flex border-b border-gray-200 gap-2 mb-4">
        <button
          onClick={() => setActiveTab("command")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "command"
              ? "border-red-600 text-red-600 font-extrabold"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <ShieldAlert className="h-4 w-4" /> Command Dashboard
        </button>
        <button
          onClick={() => setActiveTab("resources")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "resources"
              ? "border-red-600 text-red-600 font-extrabold"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <Ambulance className="h-4 w-4" /> Resource Management
        </button>
        <button
          onClick={() => setActiveTab("shelters")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "shelters"
              ? "border-red-600 text-red-600 font-extrabold"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <Home className="h-4 w-4" /> Shelter Management
        </button>
      </div>

      {activeTab === "command" && (
        <>
          {/* Telemetry Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-red-100 text-red-600 rounded-lg"><ShieldAlert className="h-6 w-6 animate-pulse" /></div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Active Alerts</p>
                <p className="text-2xl font-black text-gray-900 leading-none mt-1">{activeAlerts.length}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-orange-100 text-orange-600 rounded-lg"><AlertTriangle className="h-6 w-6" /></div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Active Incidents</p>
                {incidentsLoading ? (
                  <div className="h-7 w-12 bg-gray-100 animate-pulse rounded mt-1"></div>
                ) : (
                  <p className="text-2xl font-black text-gray-900 leading-none mt-1">{unresolvedIncidentsCount}</p>
                )}
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg"><Ambulance className="h-6 w-6" /></div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Available Resources</p>
                <p className="text-2xl font-black text-gray-900 leading-none mt-1">{availableResourcesCount}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><Home className="h-6 w-6" /></div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Shelter Occupancy</p>
                <p className="text-2xl font-black text-gray-900 leading-none mt-1">
                  {shelterOccupancySummary.percent}% <span className="text-xs font-semibold text-gray-400">({shelterOccupancySummary.occupied}/{shelterOccupancySummary.capacity})</span>
                </p>
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
                    <BarChart3 className="h-4 w-4 text-primary-500" /> Incidents by Category
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

                {/* Resource Availability Chart */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                  <h4 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                    <ActivitySquare className="h-4 w-4 text-green-500" /> Resource Availability
                  </h4>
                  <div className="h-60 w-full text-xs">
                    {resources.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-gray-400">No resource telemetry.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={resourceAvailabilityChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={75}
                            paddingAngle={3}
                            dataKey="value"
                            label={({ name, value }) => `${name} (${value})`}
                          >
                            {resourceAvailabilityChartData.map((entry, index) => {
                              const colors: Record<string, string> = {
                                Available: "#10b981",
                                Deployed: "#3b82f6",
                                Maintenance: "#f59e0b"
                              };
                              return <Cell key={`cell-${index}`} fill={colors[entry.name] || "#9ca3af"} />;
                            })}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Shelter Occupancy Chart */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                  <h4 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                    <Home className="h-4 w-4 text-indigo-500" /> Shelter Occupancy & Free Space
                  </h4>
                  <div className="h-60 w-full text-xs">
                    {shelters.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-gray-400">No shelter logs found.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={shelterOccupancyChartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" tick={{ fill: "#6b7280" }} />
                          <YAxis tick={{ fill: "#6b7280" }} />
                          <Tooltip />
                          <Bar dataKey="Occupied" stackId="a" fill="#3b82f6" />
                          <Bar dataKey="Free" stackId="a" fill="#e2e8f0" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Risk Distribution Chart */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                  <h4 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" /> Regional Risk Distribution
                  </h4>
                  <div className="h-60 w-full text-xs">
                    {riskZonesLoading ? (
                      <div className="h-full w-full bg-gray-50 rounded-lg animate-pulse"></div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={regionalRiskChartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" tick={{ fill: "#6b7280" }} />
                          <YAxis domain={[0, 100]} tick={{ fill: "#6b7280" }} />
                          <Tooltip />
                          <Bar dataKey="Score" name="Composite Risk Score" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
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
                      <option value="Pending">Pending</option>
                      <option value="Assigned">Assigned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Rejected">Rejected</option>
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
                                inc.status.toLowerCase() === "pending" || inc.status.toLowerCase() === "open" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                                inc.status.toLowerCase() === "assigned" ? "bg-blue-50 text-blue-700 border-blue-200" :
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
                                    onClick={() => handleUpdateIncidentStatus(inc.id, "In Progress")}
                                    className="px-2 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded hover:bg-blue-100 font-bold transition-all cursor-pointer"
                                    title="Approve & Investigate"
                                  >
                                    Approve
                                  </button>
                                  <button 
                                    onClick={() => handleUpdateIncidentStatus(inc.id, "Rejected")}
                                    className="px-2 py-1 bg-red-50 border border-red-200 text-red-700 rounded hover:bg-red-100 font-bold transition-all cursor-pointer"
                                    title="Reject Incident"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {inc.status.toLowerCase() !== "resolved" && (
                                <button 
                                  onClick={() => handleUpdateIncidentStatus(inc.id, "Resolved")}
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
              
              {/* Active Alerts Panel */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <h3 className="font-extrabold text-gray-900 text-sm">Active Alerts Panel</h3>
                </div>
                
                <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                  {activeAlerts.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-xs">
                      No active emergency alerts.
                    </div>
                  ) : (
                    activeAlerts.map(alert => (
                      <div key={alert.id} className="p-4 hover:bg-gray-50 transition-colors flex items-start justify-between gap-3 text-xs">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`px-1.5 py-0.5 rounded-[3px] text-[8px] font-extrabold border uppercase ${
                              alert.severity === "Critical" ? "bg-red-50 text-red-600 border-red-200 animate-pulse" :
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

              {/* High Risk Cities */}
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

              {/* AI Government Recommendations Panel */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                  <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                    <Brain className="h-4.5 w-4.5 text-red-500 animate-pulse" />
                    AI Government Recommendations
                  </h3>
                  <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-extrabold uppercase">
                    Active Zone: {activeCityName}
                  </span>
                </div>

                <div className="p-4 space-y-4 text-xs">
                  {metricsLoading ? (
                    <div className="space-y-2 p-2">
                      <div className="h-8 bg-gray-50 animate-pulse rounded border border-gray-100"></div>
                      <div className="h-8 bg-gray-50 animate-pulse rounded border border-gray-100"></div>
                    </div>
                  ) : !activeCityMetrics ? (
                    <p className="text-gray-400 text-center">Failed to fetch metrics for recommendations.</p>
                  ) : (
                    <>
                      <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 space-y-2">
                        <p className="font-bold text-gray-700">Risk Assessment Analysis:</p>
                        <p className="text-gray-500 leading-normal">
                          The current composite score in {activeCityName} is <strong className="text-gray-900">{activeCityMetrics.compositeScore}/100</strong> ({activeCityMetrics.riskLevel} Risk). Dynamic government directives compiled:
                        </p>
                      </div>

                      <ul className="space-y-3 pl-1">
                        {governmentRecs.map((rec, idx) => (
                          <li key={idx} className="flex gap-2 items-start leading-normal text-gray-600">
                            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>

                      <button
                        onClick={() => setIsAIDispatchModalOpen(true)}
                        className="w-full py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold rounded-lg transition-colors cursor-pointer text-center"
                      >
                        Dispatch AI Recommendations
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Available Resources Panel */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <h3 className="font-extrabold text-gray-900 text-sm">Available Resources</h3>
                  <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-extrabold">
                    Ready: {resources.filter(r => r.status === "Available").length}
                  </span>
                </div>
                <div className="p-2 space-y-2 max-h-[300px] overflow-y-auto">
                  {resources.filter(r => r.status === "Available").map(res => (
                    <div key={res.id} className="p-3 rounded-lg border border-gray-100 flex items-center justify-between hover:border-gray-200 transition-colors text-xs">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-green-50 text-green-600`}>
                          {res.type === "Rescue Team" && <ActivitySquare className="h-4 w-4" />}
                          {res.type === "Ambulance" && <Ambulance className="h-4 w-4" />}
                          {res.type === "Water Tanker" && <Droplet className="h-4 w-4" />}
                          {res.type === "Fire Service" && <Flame className="h-4 w-4" />}
                          {res.type === "Medical Team" && <Shield className="h-4 w-4" />}
                          {res.type === "Relief Camp" && <Home className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{res.name}</p>
                          <p className="text-gray-400 text-[10px] mt-0.5">{res.location}</p>
                        </div>
                      </div>
                      <div>
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded uppercase bg-green-100 text-green-800">{res.status}</span>
                      </div>
                    </div>
                  ))}
                  {resources.filter(r => r.status === "Available").length === 0 && (
                    <p className="text-center text-gray-400 text-xs py-4">No available units.</p>
                  )}
                </div>
              </div>

              {/* Shelter Occupancy summary panel */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <h3 className="font-extrabold text-gray-900 text-sm">Shelter Occupancy Tracker</h3>
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-extrabold">
                    Active: {shelters.filter(s => s.status === "Active").length}
                  </span>
                </div>
                <div className="p-2 space-y-2 max-h-[300px] overflow-y-auto">
                  {shelters.filter(s => s.status !== "Closed").map(shelter => {
                    const utilPercent = Math.min(100, Math.round((shelter.occupied / shelter.capacity) * 100));
                    return (
                      <div key={shelter.id} className="p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors text-xs space-y-2 bg-gray-50/20">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-bold text-gray-900">{shelter.name}</p>
                            <p className="text-gray-400 text-[10px] mt-0.5">{shelter.location || shelter.address}</p>
                          </div>
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                            shelter.status === "Full" ? "bg-red-50 text-red-600 border border-red-200" :
                            "bg-green-50 text-green-600 border border-green-200"
                          }`}>{shelter.status}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-medium text-gray-500">
                            <span>{shelter.occupied} / {shelter.capacity} Occupied</span>
                            <span>{utilPercent}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${
                                utilPercent > 85 ? "bg-red-500" :
                                utilPercent > 60 ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                              style={{ width: `${utilPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>
        </>
      )}

      {activeTab === "resources" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Resource Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><ActivitySquare className="h-6 w-6" /></div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Resources</p>
                <p className="text-2xl font-black text-gray-900 leading-none mt-1">{resources.length}</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-green-100 text-green-600 rounded-lg"><CheckCircle2 className="h-6 w-6" /></div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Available Resources</p>
                <p className="text-2xl font-black text-gray-900 leading-none mt-1">
                  {resources.filter(r => r.status === "Available").length}
                </p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg"><Send className="h-6 w-6" /></div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Deployed Resources</p>
                <p className="text-2xl font-black text-gray-900 leading-none mt-1">
                  {resources.filter(r => r.status === "Deployed").length}
                </p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1.5">Resources by Type</p>
              <div className="flex flex-wrap gap-1.5 max-h-[40px] overflow-y-auto">
                {Object.entries(
                  resources.reduce((acc, r) => {
                    acc[r.type] = (acc[r.type] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([type, count]) => (
                  <span key={type} className="text-[9px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-extrabold">
                    {type}: {count}
                  </span>
                ))}
                {resources.length === 0 && <span className="text-[10px] text-gray-400">No units logged</span>}
              </div>
            </div>
          </div>

          {/* Resource Management Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                  <Ambulance className="h-4 w-4 text-blue-600" />
                  Resource Management Registry
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Track emergency unit locations, status profiles, and active dispatch states.</p>
              </div>
              <button
                onClick={() => setIsCreateResourceOpen(true)}
                className="px-3.5 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <PlusCircle className="h-3.5 w-3.5" /> Add Resource
              </button>
            </div>

            <div className="overflow-x-auto">
              {resources.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <Ambulance className="h-10 w-10 mx-auto mb-3 opacity-40 text-gray-300" />
                  <p className="font-semibold text-sm">No Resources Logged</p>
                  <p className="text-xs text-gray-400 mt-1">Add a resource above to begin dispatcher telemetry.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="px-6 py-3.5">Resource Name</th>
                      <th className="px-6 py-3.5">Type</th>
                      <th className="px-6 py-3.5">Current Location</th>
                      <th className="px-6 py-3.5">Capacity</th>
                      <th className="px-6 py-3.5">Contact</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {resources.map(res => (
                      <tr key={res.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900">
                          {res.name}
                        </td>
                        <td className="px-6 py-4 text-gray-500 font-semibold">
                          {res.type}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-gray-400" /> {res.location}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {res.capacity} {res.type === "Ambulance" ? "Patients" : res.type === "Water Tanker" ? "Liters" : "Personnel"}
                        </td>
                        <td className="px-6 py-4 text-gray-500 font-mono">
                          {res.contact}
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={res.status}
                            onChange={(e) => handleResourceStatusChange(res, e.target.value as ResourceStatus)}
                            className={`bg-white border border-gray-200 rounded-lg text-xs font-semibold px-2 py-1 focus:ring-1 focus:ring-primary-500 focus:outline-none cursor-pointer ${
                              res.status === "Available" ? "text-green-700 border-green-200 bg-green-50/30" :
                              res.status === "Deployed" ? "text-blue-700 border-blue-200 bg-blue-50/30" :
                              "text-red-700 border-red-200 bg-red-50/30"
                            }`}
                          >
                            <option value="Available">Available</option>
                            <option value="Deployed">Deployed</option>
                            <option value="Maintenance">Maintenance</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-right space-x-1.5">
                          <button
                            onClick={() => setSelectedResourceForEdit(res)}
                            className="px-2 py-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded font-semibold transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setSelectedResourceForDelete(res)}
                            className="px-2 py-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded font-semibold transition-colors cursor-pointer"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "shelters" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Shelter Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg"><Home className="h-6 w-6" /></div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Shelters</p>
                <p className="text-2xl font-black text-gray-900 leading-none mt-1">{shelters.length}</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-green-100 text-green-600 rounded-lg"><CheckCircle2 className="h-6 w-6" /></div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Active Shelters</p>
                <p className="text-2xl font-black text-gray-900 leading-none mt-1">
                  {shelters.filter(s => s.status === "Active").length}
                </p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-red-100 text-red-600 rounded-lg"><X className="h-6 w-6 text-red-500" /></div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Closed Shelters</p>
                <p className="text-2xl font-black text-gray-900 leading-none mt-1">
                  {shelters.filter(s => s.status === "Closed").length}
                </p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><Users className="h-6 w-6" /></div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Occupancy Ratio</p>
                <p className="text-2xl font-black text-gray-900 leading-none mt-1">
                  {(() => {
                    let occupied = 0;
                    let cap = 0;
                    shelters.forEach(s => { occupied += s.occupied; cap += s.capacity; });
                    return cap > 0 ? `${Math.round((occupied / cap) * 100)}%` : "0%";
                  })()}
                </p>
              </div>
            </div>
          </div>

          {/* Shelter Management Panel */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                  <Home className="h-4 w-4 text-emerald-600" />
                  Shelter Management Registry
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Configure emergency shelters, occupancy limits, and active statuses.</p>
              </div>
              <button
                onClick={() => setIsCreateShelterOpen(true)}
                className="px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <PlusCircle className="h-3.5 w-3.5" /> Add Shelter
              </button>
            </div>

            <div className="overflow-x-auto">
              {shelters.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <Home className="h-10 w-10 mx-auto mb-3 opacity-40 text-gray-300" />
                  <p className="font-semibold text-sm">No Shelters Logged</p>
                  <p className="text-xs text-gray-400 mt-1">Add a shelter above to begin resource telemetry.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="px-6 py-3.5">Shelter Name</th>
                      <th className="px-6 py-3.5">Location / Address</th>
                      <th className="px-6 py-3.5">Capacity / Occupancy</th>
                      <th className="px-6 py-3.5">Utilization</th>
                      <th className="px-6 py-3.5">Emergency Contact</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {shelters.map(shelter => {
                      const utilPercent = Math.min(100, Math.round((shelter.occupied / shelter.capacity) * 100));
                      const available = shelter.capacity - shelter.occupied;
                      return (
                        <tr key={shelter.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-900">
                            {shelter.name}
                          </td>
                          <td className="px-6 py-4 text-gray-500 max-w-[200px] truncate">
                            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-gray-400" /> {shelter.location || shelter.address}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-700">Occupied:</span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleQuickOccupancyChange(shelter, shelter.occupied - 1)}
                                    className="px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 rounded font-black text-gray-700 disabled:opacity-40 cursor-pointer"
                                    disabled={shelter.occupied <= 0}
                                  >
                                    -
                                  </button>
                                  <span className="font-extrabold text-gray-900 w-8 text-center">{shelter.occupied}</span>
                                  <button
                                    onClick={() => handleQuickOccupancyChange(shelter, shelter.occupied + 1)}
                                    className="px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 rounded font-black text-gray-700 disabled:opacity-40 cursor-pointer"
                                    disabled={shelter.occupied >= shelter.capacity}
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              <div className="text-[10px] text-gray-400 font-medium">
                                Total Limit: {shelter.capacity} | {available} space{available !== 1 ? "s" : ""} free
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="w-36 space-y-1">
                              <div className="flex justify-between text-[10px] font-bold text-gray-500">
                                <span>{utilPercent}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    utilPercent > 85 ? "bg-red-500" :
                                    utilPercent > 60 ? "bg-amber-500" : "bg-emerald-500"
                                  }`}
                                  style={{ width: `${utilPercent}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-500 font-mono">
                            {shelter.contact}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1.5">
                              <select
                                value={shelter.status}
                                onChange={(e) => handleShelterStatusChange(shelter, e.target.value as any)}
                                className={`bg-white border border-gray-200 rounded-lg text-xs font-semibold px-2 py-1 focus:ring-1 focus:ring-primary-500 focus:outline-none cursor-pointer ${
                                  shelter.status === "Active" ? "text-green-700 border-green-200 bg-green-50/30" :
                                  shelter.status === "Full" ? "text-red-700 border-red-200 bg-red-50/30" :
                                  "text-yellow-700 border-yellow-200 bg-yellow-50/30"
                                }`}
                              >
                                <option value="Active">Active</option>
                                <option value="Full">Full</option>
                                <option value="Closed">Closed</option>
                              </select>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right space-x-1.5">
                            <button
                              onClick={() => setSelectedShelterForEdit(shelter)}
                              className="px-2 py-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded font-semibold transition-colors cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setSelectedShelterForDelete(shelter)}
                              className="px-2 py-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded font-semibold transition-colors cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

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

              {/* Resource Assignment Section */}
              {selectedIncident.status.toLowerCase() !== "resolved" && selectedIncident.status.toLowerCase() !== "rejected" && (
                <div className="border-t border-gray-100 pt-4 mt-4 space-y-4">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-extrabold">Emergency Dispatch Assignments</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Support Resources Checkbox List */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Support Resources</label>
                      <div className="border border-gray-100 rounded-lg p-2.5 max-h-36 overflow-y-auto space-y-2 bg-gray-50">
                        {resources
                          .filter(r => r.type !== "Rescue Team" && (r.status === "Available" || (selectedIncident.assigned_resources || []).includes(r.id)))
                          .map(res => {
                            const isChecked = (tempAssignedResources || []).includes(res.id);
                            return (
                              <label key={res.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setTempAssignedResources([...(tempAssignedResources || []), res.id]);
                                    } else {
                                      setTempAssignedResources((tempAssignedResources || []).filter(id => id !== res.id));
                                    }
                                  }}
                                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <div className="text-[11px]">
                                  <span className="font-semibold text-gray-800">{res.name}</span>{" "}
                                  <span className="text-gray-400">({res.type})</span>
                                </div>
                              </label>
                            );
                          })}
                        {resources.filter(r => r.type !== "Rescue Team" && (r.status === "Available" || (selectedIncident.assigned_resources || []).includes(r.id))).length === 0 && (
                          <p className="text-[10px] text-gray-400 text-center py-2">No support units available</p>
                        )}
                      </div>
                    </div>

                    {/* Rescue Teams Checkbox List */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Rescue Teams</label>
                      <div className="border border-gray-100 rounded-lg p-2.5 max-h-36 overflow-y-auto space-y-2 bg-gray-50">
                        {resources
                          .filter(r => r.type === "Rescue Team" && (r.status === "Available" || (selectedIncident.assigned_rescue_teams || []).includes(r.id)))
                          .map(res => {
                            const isChecked = (tempAssignedRescueTeams || []).includes(res.id);
                            return (
                              <label key={res.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setTempAssignedRescueTeams([...(tempAssignedRescueTeams || []), res.id]);
                                    } else {
                                      setTempAssignedRescueTeams((tempAssignedRescueTeams || []).filter(id => id !== res.id));
                                    }
                                  }}
                                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <div className="text-[11px]">
                                  <span className="font-semibold text-gray-800">{res.name}</span>
                                </div>
                              </label>
                            );
                          })}
                        {resources.filter(r => r.type === "Rescue Team" && (r.status === "Available" || (selectedIncident.assigned_rescue_teams || []).includes(r.id))).length === 0 && (
                          <p className="text-[10px] text-gray-400 text-center py-2">No rescue teams available</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => handleSaveAssignments(selectedIncident.id, tempAssignedResources, tempAssignedRescueTeams)}
                      className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold transition-all text-[11px] cursor-pointer"
                    >
                      Update Dispatch Assignments
                    </button>
                  </div>
                </div>
              )}

              {/* Show assigned resources if already resolved/rejected */}
              {(selectedIncident.status.toLowerCase() === "resolved" || selectedIncident.status.toLowerCase() === "rejected") && (
                <div className="border-t border-gray-100 pt-4 mt-4 space-y-2">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-extrabold">Dispatched Resources</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {[...(selectedIncident.assigned_resources || []), ...(selectedIncident.assigned_rescue_teams || [])].map(resId => {
                      const res = resources.find(r => r.id === resId);
                      return res ? (
                        <span key={resId} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-extrabold uppercase border border-gray-200">
                          {res.name} ({res.type})
                        </span>
                      ) : null;
                    })}
                    {[...(selectedIncident.assigned_resources || []), ...(selectedIncident.assigned_rescue_teams || [])].length === 0 && (
                      <span className="text-[11px] text-gray-400 italic">No resources were assigned.</span>
                    )}
                  </div>
                </div>
              )}

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

      {/* Create Shelter Modal */}
      {isCreateShelterOpen && (
        <CreateShelterModal
          onClose={() => setIsCreateShelterOpen(false)}
          addShelter={addShelter}
          showToast={showToast}
          defaultLat={latitude}
          defaultLng={longitude}
        />
      )}

      {/* Edit Shelter Modal */}
      {selectedShelterForEdit && (
        <EditShelterModal
          shelter={selectedShelterForEdit}
          onClose={() => setSelectedShelterForEdit(null)}
          updateShelter={updateShelter}
          showToast={showToast}
        />
      )}

      {/* Delete Shelter Modal */}
      {selectedShelterForDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="absolute inset-0 bg-secondary-900/40 backdrop-blur-sm" onClick={() => setSelectedShelterForDelete(null)}></div>
          <div className="bg-white rounded-2xl w-full max-w-md relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 text-center mb-2 font-black">Delete Shelter</h3>
              <p className="text-xs text-gray-500 text-center mb-6 leading-relaxed">
                Are you sure you want to permanently delete shelter <strong>&quot;{selectedShelterForDelete.name}&quot;</strong>? This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button 
                  onClick={() => setSelectedShelterForDelete(null)} 
                  className="flex-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    try {
                      await deleteShelter(selectedShelterForDelete.id);
                      showToast("Shelter successfully deleted.", "success");
                      setSelectedShelterForDelete(null);
                    } catch (err) {
                      console.error("Error deleting shelter:", err);
                      showToast("Failed to delete shelter.", "error");
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 cursor-pointer"
                >
                  Delete Shelter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Resource Modal */}
      {isCreateResourceOpen && (
        <CreateResourceModal
          onClose={() => setIsCreateResourceOpen(false)}
          addResource={addResource}
          showToast={showToast}
          defaultLat={latitude}
          defaultLng={longitude}
        />
      )}

      {/* Edit Resource Modal */}
      {selectedResourceForEdit && (
        <EditResourceModal
          resource={selectedResourceForEdit}
          onClose={() => setSelectedResourceForEdit(null)}
          updateResource={updateResource}
          showToast={showToast}
        />
      )}

      {/* Delete Resource Modal */}
      {selectedResourceForDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="absolute inset-0 bg-secondary-900/40 backdrop-blur-sm" onClick={() => setSelectedResourceForDelete(null)}></div>
          <div className="bg-white rounded-2xl w-full max-w-md relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 text-center mb-2 font-black">Delete Resource</h3>
              <p className="text-xs text-gray-500 text-center mb-6 leading-relaxed">
                Are you sure you want to permanently delete resource <strong>&quot;{selectedResourceForDelete.name}&quot;</strong>? This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button 
                  onClick={() => setSelectedResourceForDelete(null)} 
                  className="flex-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    try {
                      await deleteResource(selectedResourceForDelete.id);
                      showToast("Resource successfully deleted.", "success");
                      setSelectedResourceForDelete(null);
                    } catch (err) {
                      console.error("Error deleting resource:", err);
                      showToast("Failed to delete resource.", "error");
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 cursor-pointer"
                >
                  Delete Resource
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Recommendations Dispatch Modal */}
      {isAIDispatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="absolute inset-0 bg-secondary-900/40 backdrop-blur-sm" onClick={() => !isDispatchingAI && setIsAIDispatchModalOpen(false)}></div>
          <div className="bg-white rounded-2xl w-full max-w-md relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <Brain className="h-6 w-6 text-red-600 animate-bounce" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 text-center mb-2 font-black">Dispatch AI Directives</h3>
              <p className="text-xs text-gray-500 text-center mb-6 leading-relaxed">
                Confirm dispatch of all dynamic AI recommendations to municipal field operations in <strong>{activeCityName}</strong>. This will deploy available response units and update telemetry trackers.
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-100">
                <ul className="space-y-2 text-xs">
                  {governmentRecs.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-600">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-3">
                <button 
                  disabled={isDispatchingAI}
                  onClick={() => setIsAIDispatchModalOpen(false)} 
                  className="flex-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  disabled={isDispatchingAI}
                  onClick={handleDispatchAIRecommendations} 
                  className="flex-1 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isDispatchingAI ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Dispatching...
                    </>
                  ) : (
                    "Confirm Dispatch"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset & Seed Database Confirmation Modal */}
      {isSeedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="absolute inset-0 bg-secondary-900/40 backdrop-blur-sm" onClick={() => !isSeeding && setIsSeedModalOpen(false)}></div>
          <div className="bg-white rounded-2xl w-full max-w-md relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 mb-4">
                <RefreshCw className="h-6 w-6 text-amber-600 animate-spin" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 text-center mb-2 font-black">Reset & Seed Demo Data</h3>
              <p className="text-xs text-gray-500 text-center mb-6 leading-relaxed">
                Are you sure you want to proceed? This will **purge all active alerts, reported incidents, shelters, and telemetry resources** from the database and populate it with a premium, multi-city demonstration dataset.
              </p>
              <div className="flex gap-3">
                <button 
                  disabled={isSeeding}
                  onClick={() => setIsSeedModalOpen(false)} 
                  className="flex-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  disabled={isSeeding}
                  onClick={handleSeedDatabase} 
                  className="flex-1 px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSeeding ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Seeding...
                    </>
                  ) : (
                    "Reset & Seed"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CreateAlertModal({ onClose, addAlert, showToast }: { onClose: () => void, addAlert: (alert: ClimateAlert) => Promise<void>, showToast: (msg: string, type: "success" | "error") => void }) {
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    severity: "High",
    location: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.message || !formData.location) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    setIsSubmitting(true);

    const newAlert: ClimateAlert = {
      id: `ALRT-${Math.floor(1000 + Math.random() * 9000)}`,
      title: formData.title,
      category: "Flood Risk", // Auto-inferred dynamically by the context deserializer
      severity: formData.severity as Severity,
      area: formData.location,
      timestamp: "Just Now",
      status: "Active" as const,
      description: formData.message,
      recommendedActions: [],
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
            <div>
              <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">Alert Title <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                placeholder="e.g. Flash Flood Warning"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">Message <span className="text-red-500">*</span></label>
              <textarea 
                rows={4}
                placeholder="Provide detailed information about the emergency..."
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none"
                value={formData.message}
                onChange={e => setFormData({...formData, message: e.target.value})}
                disabled={isSubmitting}
              />
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
    message: alert.description,
    severity: alert.severity,
    location: alert.area,
    status: alert.status,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.location || !formData.message) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const updated: ClimateAlert = {
        ...alert,
        title: formData.title,
        severity: formData.severity as Severity,
        area: formData.location,
        status: formData.status as AlertStatus,
        description: formData.message
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

            <div className="grid grid-cols-1 gap-4">
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
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">Message <span className="text-red-500">*</span></label>
              <textarea 
                rows={4}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none"
                value={formData.message}
                onChange={e => setFormData({...formData, message: e.target.value})}
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
function CreateShelterModal({ 
  onClose, 
  addShelter, 
  showToast,
  defaultLat,
  defaultLng
}: { 
  onClose: () => void, 
  addShelter: (shelter: Omit<Shelter, "id" | "created_at">) => Promise<void>, 
  showToast: (msg: string, type: "success" | "error") => void,
  defaultLat: number,
  defaultLng: number
}) {
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    latitude: defaultLat,
    longitude: defaultLng,
    capacity: 100,
    occupied: 0,
    contact: "",
    status: "Active" as "Active" | "Full" | "Closed"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.location || formData.latitude === undefined || formData.longitude === undefined || !formData.contact) {
      showToast("Please fill in all required fields.", "error");
      return;
    }
    if (formData.capacity <= 0) {
      showToast("Capacity must be greater than 0.", "error");
      return;
    }
    if (formData.occupied < 0 || formData.occupied > formData.capacity) {
      showToast("Occupancy must be between 0 and capacity.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await addShelter({
        name: formData.name,
        address: formData.location, // Keep address matching location for compatibility
        location: formData.location,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        capacity: Number(formData.capacity),
        occupied: Number(formData.occupied),
        contact: formData.contact,
        status: formData.status
      });
      showToast("Shelter successfully created.", "success");
      onClose();
    } catch (err) {
      console.error("Failed to create shelter:", err);
      showToast("Failed to create shelter.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="fixed inset-0 bg-secondary-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-2xl w-full max-w-lg relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 font-extrabold">Add New Shelter</h2>
          <button onClick={onClose} disabled={isSubmitting} className="text-gray-400 hover:text-gray-600 disabled:opacity-50">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="text-xs">
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5 font-bold">Shelter Name <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                placeholder="e.g. Chennai Relief Center"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                disabled={isSubmitting}
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5 font-bold">Location / Address <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                placeholder="e.g. 12 Main St, Velachery"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5 font-bold">Latitude <span className="text-red-500">*</span></label>
                <input 
                  type="number" 
                  step="0.000001"
                  placeholder="e.g. 13.0827"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={formData.latitude}
                  onChange={e => setFormData({...formData, latitude: Number(e.target.value)})}
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5 font-bold">Longitude <span className="text-red-500">*</span></label>
                <input 
                  type="number" 
                  step="0.000001"
                  placeholder="e.g. 80.2707"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={formData.longitude}
                  onChange={e => setFormData({...formData, longitude: Number(e.target.value)})}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5 font-bold">Emergency Contact <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                placeholder="e.g. +91 98765 43210"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                value={formData.contact}
                onChange={e => setFormData({...formData, contact: e.target.value})}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5 font-bold">Capacity <span className="text-red-500">*</span></label>
                <input 
                  type="number" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={formData.capacity}
                  onChange={e => setFormData({...formData, capacity: Number(e.target.value)})}
                  disabled={isSubmitting}
                  min={1}
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5 font-bold">Occupied</label>
                <input 
                  type="number" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={formData.occupied}
                  onChange={e => setFormData({...formData, occupied: Number(e.target.value)})}
                  disabled={isSubmitting}
                  min={0}
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5 font-bold">Status</label>
                <select 
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white"
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value as any})}
                  disabled={isSubmitting}
                >
                  <option value="Active">Active</option>
                  <option value="Full">Full</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 disabled:opacity-50 cursor-pointer">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer">
              Create Shelter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditShelterModal({ 
  shelter,
  onClose, 
  updateShelter, 
  showToast 
}: { 
  shelter: Shelter,
  onClose: () => void, 
  updateShelter: (shelter: Shelter) => Promise<void>, 
  showToast: (msg: string, type: "success" | "error") => void 
}) {
  const [formData, setFormData] = useState({
    name: shelter.name,
    location: shelter.location || shelter.address || "",
    latitude: shelter.latitude,
    longitude: shelter.longitude,
    capacity: shelter.capacity,
    occupied: shelter.occupied,
    contact: shelter.contact || "",
    status: shelter.status
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.location || formData.latitude === undefined || formData.longitude === undefined || !formData.contact) {
      showToast("Please fill in all required fields.", "error");
      return;
    }
    if (formData.capacity <= 0) {
      showToast("Capacity must be greater than 0.", "error");
      return;
    }
    if (formData.occupied < 0 || formData.occupied > formData.capacity) {
      showToast("Occupancy must be between 0 and capacity.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateShelter({
        ...shelter,
        name: formData.name,
        address: formData.location, // Keep address matching location for compatibility
        location: formData.location,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        capacity: Number(formData.capacity),
        occupied: Number(formData.occupied),
        contact: formData.contact,
        status: formData.status
      });
      showToast("Shelter successfully updated.", "success");
      onClose();
    } catch (err) {
      console.error("Failed to update shelter:", err);
      showToast("Failed to update shelter.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="fixed inset-0 bg-secondary-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-2xl w-full max-w-lg relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 font-extrabold">Edit Shelter Details</h2>
          <button onClick={onClose} disabled={isSubmitting} className="text-gray-400 hover:text-gray-600 disabled:opacity-50">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="text-xs">
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5 font-bold">Shelter Name <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                disabled={isSubmitting}
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5 font-bold">Location / Address <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5 font-bold">Latitude <span className="text-red-500">*</span></label>
                <input 
                  type="number" 
                  step="0.000001"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={formData.latitude}
                  onChange={e => setFormData({...formData, latitude: Number(e.target.value)})}
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5 font-bold">Longitude <span className="text-red-500">*</span></label>
                <input 
                  type="number" 
                  step="0.000001"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={formData.longitude}
                  onChange={e => setFormData({...formData, longitude: Number(e.target.value)})}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5 font-bold">Emergency Contact <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                value={formData.contact}
                onChange={e => setFormData({...formData, contact: e.target.value})}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5 font-bold">Capacity <span className="text-red-500">*</span></label>
                <input 
                  type="number" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={formData.capacity}
                  onChange={e => setFormData({...formData, capacity: Number(e.target.value)})}
                  disabled={isSubmitting}
                  min={1}
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5 font-bold">Occupied</label>
                <input 
                  type="number" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={formData.occupied}
                  onChange={e => setFormData({...formData, occupied: Number(e.target.value)})}
                  disabled={isSubmitting}
                  min={0}
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5 font-bold">Status</label>
                <select 
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white"
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value as any})}
                  disabled={isSubmitting}
                >
                  <option value="Active">Active</option>
                  <option value="Full">Full</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 disabled:opacity-50 cursor-pointer">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateResourceModal({ 
  onClose, 
  addResource, 
  showToast,
  defaultLat,
  defaultLng
}: { 
  onClose: () => void, 
  addResource: (resource: Omit<DbResource, "id" | "created_at">) => Promise<void>, 
  showToast: (msg: string, type: "success" | "error") => void,
  defaultLat: number,
  defaultLng: number
}) {
  const [formData, setFormData] = useState({
    name: "",
    type: "Ambulance" as ResourceType,
    location: "",
    latitude: defaultLat,
    longitude: defaultLng,
    capacity: 1,
    contact: "",
    status: "Available" as ResourceStatus
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.type || !formData.location || formData.latitude === undefined || formData.longitude === undefined || !formData.contact) {
      showToast("Please fill in all required fields.", "error");
      return;
    }
    if (formData.capacity <= 0) {
      showToast("Capacity must be greater than 0.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await addResource({
        name: formData.name,
        type: formData.type,
        location: formData.location,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        capacity: Number(formData.capacity),
        contact: formData.contact,
        status: formData.status
      });
      showToast("Resource successfully created.", "success");
      onClose();
    } catch (err) {
      console.error("Failed to create resource:", err);
      showToast("Failed to create resource.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="fixed inset-0 bg-secondary-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-2xl w-full max-w-lg relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 font-extrabold">Add Emergency Resource</h2>
          <button onClick={onClose} disabled={isSubmitting} className="text-gray-400 hover:text-gray-600 disabled:opacity-50">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="text-xs">
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5 font-bold">Resource Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  placeholder="e.g. Rescue Team Alpha"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5 font-bold">Resource Type</label>
                <select 
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value as ResourceType})}
                  disabled={isSubmitting}
                >
                  <option value="Ambulance">Ambulance</option>
                  <option value="Rescue Team">Rescue Team</option>
                  <option value="Fire Service">Fire Service</option>
                  <option value="Medical Team">Medical Team</option>
                  <option value="Relief Camp">Relief Camp</option>
                  <option value="Water Tanker">Water Tanker</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5 font-bold">Current Location / Address <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                placeholder="e.g. T-Nagar Depot"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5 font-bold">Latitude <span className="text-red-500">*</span></label>
                <input 
                  type="number" 
                  step="0.000001"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={formData.latitude}
                  onChange={e => setFormData({...formData, latitude: Number(e.target.value)})}
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5 font-bold">Longitude <span className="text-red-500">*</span></label>
                <input 
                  type="number" 
                  step="0.000001"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={formData.longitude}
                  onChange={e => setFormData({...formData, longitude: Number(e.target.value)})}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5 font-bold">Emergency Contact <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  placeholder="e.g. +91 99999 12345"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={formData.contact}
                  onChange={e => setFormData({...formData, contact: e.target.value})}
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5 font-bold">Capacity <span className="text-red-500">*</span></label>
                <input 
                  type="number" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={formData.capacity}
                  onChange={e => setFormData({...formData, capacity: Number(e.target.value)})}
                  disabled={isSubmitting}
                  min={1}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5 font-bold">Status</label>
              <select 
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white"
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value as ResourceStatus})}
                disabled={isSubmitting}
              >
                <option value="Available">Available</option>
                <option value="Deployed">Deployed</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
          </div>
          
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 disabled:opacity-50 cursor-pointer">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer">
              Add Resource
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditResourceModal({ 
  resource,
  onClose, 
  updateResource, 
  showToast 
}: { 
  resource: DbResource,
  onClose: () => void, 
  updateResource: (resource: DbResource) => Promise<void>, 
  showToast: (msg: string, type: "success" | "error") => void 
}) {
  const [formData, setFormData] = useState({
    name: resource.name,
    type: resource.type,
    location: resource.location,
    latitude: resource.latitude,
    longitude: resource.longitude,
    capacity: resource.capacity || 1,
    contact: resource.contact || "",
    status: resource.status
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.type || !formData.location || formData.latitude === undefined || formData.longitude === undefined || !formData.contact) {
      showToast("Please fill in all required fields.", "error");
      return;
    }
    if (formData.capacity <= 0) {
      showToast("Capacity must be greater than 0.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateResource({
        ...resource,
        name: formData.name,
        type: formData.type,
        location: formData.location,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        capacity: Number(formData.capacity),
        contact: formData.contact,
        status: formData.status
      });
      showToast("Resource successfully updated.", "success");
      onClose();
    } catch (err) {
      console.error("Failed to update resource:", err);
      showToast("Failed to update resource.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="fixed inset-0 bg-secondary-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-2xl w-full max-w-lg relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 font-extrabold">Modify Resource</h2>
          <button onClick={onClose} disabled={isSubmitting} className="text-gray-400 hover:text-gray-600 disabled:opacity-50">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="text-xs">
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5 font-bold">Resource Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5 font-bold">Resource Type</label>
                <select 
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value as ResourceType})}
                  disabled={isSubmitting}
                >
                  <option value="Ambulance">Ambulance</option>
                  <option value="Rescue Team">Rescue Team</option>
                  <option value="Fire Service">Fire Service</option>
                  <option value="Medical Team">Medical Team</option>
                  <option value="Relief Camp">Relief Camp</option>
                  <option value="Water Tanker">Water Tanker</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5 font-bold">Current Location / Address <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5 font-bold">Latitude <span className="text-red-500">*</span></label>
                <input 
                  type="number" 
                  step="0.000001"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={formData.latitude}
                  onChange={e => setFormData({...formData, latitude: Number(e.target.value)})}
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5 font-bold">Longitude <span className="text-red-500">*</span></label>
                <input 
                  type="number" 
                  step="0.000001"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={formData.longitude}
                  onChange={e => setFormData({...formData, longitude: Number(e.target.value)})}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5 font-bold">Emergency Contact <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={formData.contact}
                  onChange={e => setFormData({...formData, contact: e.target.value})}
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5 font-bold">Capacity <span className="text-red-500">*</span></label>
                <input 
                  type="number" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={formData.capacity}
                  onChange={e => setFormData({...formData, capacity: Number(e.target.value)})}
                  disabled={isSubmitting}
                  min={1}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1.5 font-bold">Status</label>
              <select 
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white"
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value as ResourceStatus})}
                disabled={isSubmitting}
              >
                <option value="Available">Available</option>
                <option value="Deployed">Deployed</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
          </div>
          
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 disabled:opacity-50 cursor-pointer">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
