"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { ClimateAlert, mockAlerts as initialMockAlerts, Severity, AlertCategory, AlertStatus } from "./mockAlerts";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { useLocation, PREDEFINED_CITIES } from "@/providers/LocationContext";
import { createClient } from "./supabase/client";
import { fetchWeather } from "./weather";
import { fetchAirQuality } from "./airQuality";
import { fetchFloodRisk } from "./floodRisk";

type Role = "admin" | "citizen";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error";
}

interface AlertsContextProps {
  alerts: ClimateAlert[];
  loading: boolean;
  error: string | null;
  addAlert: (alert: ClimateAlert) => Promise<void>;
  updateAlert: (alert: ClimateAlert) => Promise<void>;
  deleteAlert: (alertId: string) => Promise<void>;
  userRole: Role;
  setUserRole: (role: Role) => void;
  showToast: (message: string, type: "success" | "error") => void;
  location: string;
  setLocation: (loc: string) => void;
}

const AlertsContext = createContext<AlertsContextProps | undefined>(undefined);

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just Now";
  if (diffMins < 60) return `${diffMins} Mins Ago`;
  if (diffHours < 24) return `${diffHours} Hour${diffHours > 1 ? 's' : ''} Ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} Day${diffDays > 1 ? 's' : ''} Ago`;
}

function inferCategory(title: string, description: string): AlertCategory {
  const t = (title + " " + description).toLowerCase();
  if (t.includes("flood") || t.includes("water") || t.includes("submerge")) return "Flood Risk";
  if (t.includes("heat") || t.includes("temperature") || t.includes("warmth")) return "Heatwave";
  if (t.includes("air") || t.includes("aqi") || t.includes("smog") || t.includes("pollution")) return "Air Quality";
  if (t.includes("power") || t.includes("grid") || t.includes("outage") || t.includes("blackout") || t.includes("infrastructure")) return "Infrastructure Failure";
  if (t.includes("cyclone") || t.includes("storm") || t.includes("wind") || t.includes("typhoon")) return "Cyclone Warning";
  if (t.includes("rain") || t.includes("downpour") || t.includes("rainfall")) return "Heavy Rainfall";
  return "Flood Risk";
}

function inferRecommendedActions(title: string, description: string): string[] {
  const t = (title + " " + description).toLowerCase();
  if (t.includes("flood")) {
    return [
      "Move essential items and electronics to higher floors.",
      "Avoid driving through flooded roads.",
      "Locate the nearest designated concrete shelter."
    ];
  }
  if (t.includes("heat")) {
    return [
      "Stay indoors during peak heat hours (12 PM - 4 PM).",
      "Stay hydrated and avoid strenuous outdoor activities.",
      "Check on vulnerable neighbors."
    ];
  }
  if (t.includes("air")) {
    return [
      "Limit prolonged outdoor exertion.",
      "Keep windows closed during morning hours.",
      "Use N95 masks if sensitive to respiratory issues."
    ];
  }
  return [
    "Stay alert and follow local news.",
    "Keep emergency numbers handy.",
    "Follow guidance from local authorities."
  ];
}

function inferEmergencyContacts(title: string): { name: string; number: string }[] {
  const t = title.toLowerCase();
  if (t.includes("flood") || t.includes("cyclone") || t.includes("rain")) {
    return [
      { name: "Rescue Services", number: "112" },
      { name: "Disaster Helpline", number: "1070" }
    ];
  }
  if (t.includes("heat") || t.includes("air")) {
    return [
      { name: "Medical Emergency", number: "108" },
      { name: "Health Helpline", number: "104" }
    ];
  }
  return [
    { name: "Disaster Helpline", number: "1070" }
  ];
}

interface DbAlert {
  id: string;
  title: string;
  message?: string;
  description?: string;
  severity: string;
  location: string | null;
  status: string;
  created_at: string;
}

interface RealtimePayload {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: DbAlert;
  old: { id?: string };
}

function deserializeAlert(dbAlert: DbAlert): ClimateAlert {
  // Map severity (DB -> UI)
  let severity: Severity = "Moderate";
  const dbSeverity = (dbAlert.severity || "").toLowerCase();
  if (dbSeverity === "critical") severity = "Critical";
  else if (dbSeverity === "high") severity = "High";
  else if (dbSeverity === "medium" || dbSeverity === "moderate") severity = "Moderate";
  else if (dbSeverity === "low") severity = "Low";
  else {
    severity = dbAlert.severity as Severity;
  }

  // Map status (DB -> UI)
  let status: AlertStatus = "Active";
  const dbStatus = (dbAlert.status || "").toLowerCase();
  if (dbStatus === "active") status = "Active";
  else if (dbStatus === "expired" || dbStatus === "resolved") status = "Resolved";
  else {
    status = dbAlert.status as AlertStatus;
  }

  const area = dbAlert.location || "Unknown Area";
  const timestamp = formatRelativeTime(dbAlert.created_at);

  let rawMessage = dbAlert.message || dbAlert.description || "";
  let description = rawMessage;
  let category: AlertCategory = "Flood Risk";
  let recommendedActions: string[] = [];
  let emergencyContacts: { name: string; number: string }[] = [];

  // Support legacy JSON serialized descriptions (if any exist)
  if (rawMessage.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(rawMessage);
      description = parsed.description || rawMessage;
      category = parsed.category || inferCategory(dbAlert.title, description);
      recommendedActions = parsed.recommendedActions || [];
      emergencyContacts = parsed.emergencyContacts || [];
    } catch (e) {
      console.warn("Failed to parse serialized description JSON:", e);
      category = inferCategory(dbAlert.title, rawMessage);
      recommendedActions = inferRecommendedActions(dbAlert.title, rawMessage);
      emergencyContacts = inferEmergencyContacts(dbAlert.title);
    }
  } else {
    category = inferCategory(dbAlert.title, rawMessage);
    recommendedActions = inferRecommendedActions(dbAlert.title, rawMessage);
    emergencyContacts = inferEmergencyContacts(dbAlert.title);
  }

  return {
    id: dbAlert.id,
    title: dbAlert.title,
    category,
    severity,
    area,
    timestamp,
    status,
    description,
    recommendedActions,
    emergencyContacts
  };
}

export function AlertsProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<ClimateAlert[]>([]);
  const [dynamicAlerts, setDynamicAlerts] = useState<ClimateAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRoleState] = useState<Role>("admin"); // Default to admin for testing
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { city: location, setLocation: setLocationContext, latitude, longitude } = useLocation();
  const supabase = createClient();

  // Dynamically generate alerts based on current weather, air quality, and flood risk
  useEffect(() => {
    let active = true;
    async function generateDynamicAlerts() {
      if (latitude === undefined || longitude === undefined) return;
      try {
        const [weatherData, aqiData, floodData] = await Promise.all([
          fetchWeather(latitude, longitude),
          fetchAirQuality(latitude, longitude),
          fetchFloodRisk(latitude, longitude),
        ]);

        if (!active) return;

        const newAlerts: ClimateAlert[] = [];

        // 1. Heatwave Alert
        if (weatherData.temperature >= 90) {
          const tempC = Math.round(((weatherData.temperature - 32) * 5) / 9);
          const isCritical = weatherData.temperature >= 104;
          const isHigh = weatherData.temperature >= 98;
          newAlerts.push({
            id: `dyn-heat-${location}`,
            title: isCritical ? "Extreme Heat Emergency" : isHigh ? "High Temperature Advisory" : "Warm Weather Warning",
            category: "Heatwave",
            severity: isCritical ? "Critical" : isHigh ? "High" : "Moderate",
            area: location,
            timestamp: "Just Now",
            status: "Active",
            description: `Temperatures are expected to reach ${weatherData.temperature}°F (${tempC}°C) in ${location}. Stay hydrated and limit outdoor activity.`,
            recommendedActions: [
              "Stay indoors during peak heat hours (12 PM - 4 PM).",
              "Maintain high hydration using electrolyte fluids.",
              "Check on elderly neighbors."
            ],
            emergencyContacts: [
              { name: "Medical Emergency", number: "108" },
              { name: "Health Helpline", number: "104" }
            ]
          });
        }

        // 2. Flood Alert
        if (floodData.score >= 40) {
          const isCritical = floodData.score >= 75;
          const isHigh = floodData.score >= 50;
          newAlerts.push({
            id: `dyn-flood-${location}`,
            title: isCritical ? "Flash Flood Emergency" : isHigh ? "Flood Watch Active" : "Minor Waterlogging Warning",
            category: "Flood Risk",
            severity: isCritical ? "Critical" : isHigh ? "High" : "Moderate",
            area: location,
            timestamp: "Just Now",
            status: "Active",
            description: `Elevated flood risk of ${floodData.score}% calculated for ${location}. ${floodData.reasoning}`,
            recommendedActions: [
              "Move essential items and electronics to higher floors.",
              "Avoid driving or walking through flooded roads.",
              "Locate the nearest designated concrete shelter."
            ],
            emergencyContacts: [
              { name: "Rescue Services", number: "112" },
              { name: "Disaster Helpline", number: "1070" }
            ]
          });
        }

        // 3. Air Quality Alert
        if (aqiData.usAqi >= 100) {
          const isCritical = aqiData.usAqi >= 200;
          const isHigh = aqiData.usAqi >= 150;
          newAlerts.push({
            id: `dyn-aqi-${location}`,
            title: isCritical ? "Hazardous Air Quality Emergency" : isHigh ? "Unhealthy Air Quality Warning" : "Moderate Air Pollution Advisory",
            category: "Air Quality",
            severity: isCritical ? "Critical" : isHigh ? "High" : "Moderate",
            area: location,
            timestamp: "Just Now",
            status: "Active",
            description: `US AQI has reached ${aqiData.usAqi} (${aqiData.status}) in ${location}. PM2.5 levels are ${aqiData.pm25} µg/m³.`,
            recommendedActions: [
              "Limit prolonged outdoor exertion.",
              "Keep windows closed to prevent ingress of polluted air.",
              "Wear N95 masks if outdoors."
            ],
            emergencyContacts: [
              { name: "Health Helpline", number: "104" },
              { name: "Medical Emergency", number: "108" }
            ]
          });
        }

        setDynamicAlerts(newAlerts);
      } catch (err) {
        console.error("Failed to generate dynamic alerts:", err);
      }
    }

    generateDynamicAlerts();
    return () => {
      active = false;
    };
  }, [latitude, longitude, location]);

  const combinedAlerts = useMemo(() => {
    const filteredDbAlerts = alerts.filter(
      (a) =>
        a.area.toLowerCase().includes(location.toLowerCase()) ||
        location.toLowerCase().includes(a.area.toLowerCase())
    );
    return [...dynamicAlerts, ...filteredDbAlerts];
  }, [alerts, dynamicAlerts, location]);

  // Load alerts and listen to realtime updates
  useEffect(() => {
    const loadAlerts = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from("alerts")
          .select("*")
          .order("created_at", { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        if (data) {
          const mapped = (data as DbAlert[]).map(deserializeAlert);
          setAlerts(mapped);
        }
      } catch (err: unknown) {
        console.error("Error loading alerts from database:", err);
        setError("Failed to fetch alerts from database. Displaying fallback mock data.");
        setAlerts(initialMockAlerts);
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();

    const channel = supabase
      .channel("alerts-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alerts" },
        (payload: RealtimePayload) => {
          console.log("Received realtime payload:", payload);
          if (payload.eventType === "INSERT") {
            const newAlert = deserializeAlert(payload.new);
            setAlerts((prev) => {
              if (prev.some((a) => a.id === newAlert.id)) return prev;
              return [newAlert, ...prev];
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedAlert = deserializeAlert(payload.new);
            setAlerts((prev) =>
              prev.map((a) => (a.id === updatedAlert.id ? updatedAlert : a))
            );
          } else if (payload.eventType === "DELETE") {
            const deletedId = payload.old.id;
            if (deletedId) {
              setAlerts((prev) => prev.filter((a) => a.id !== deletedId));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const setLocation = (cityName: string) => {
    const found = PREDEFINED_CITIES.find(c => c.name.toLowerCase() === cityName.toLowerCase());
    if (found) {
      setLocationContext(found.name, found.latitude, found.longitude, found.region, found.country);
    } else {
      setLocationContext(cityName, 13.0827, 80.2707);
    }
  };

  const setUserRole = async (role: Role) => {
    setUserRoleState(role);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        
        const dbRole = profile?.role;
        if (role === "admin" && dbRole !== "admin" && dbRole !== "super_admin") {
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ role: "admin" })
            .eq("id", user.id);
          if (updateError) {
            console.error("Failed to update database profile role to admin:", updateError);
          } else {
            console.log("Successfully updated database profile role to admin for testing");
            showToast("Database profile promoted to Admin.", "success");
          }
        } else if (role === "citizen" && dbRole === "admin") {
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ role: "citizen" })
            .eq("id", user.id);
          if (updateError) {
            console.error("Failed to update database profile role to citizen:", updateError);
          } else {
            console.log("Successfully updated database profile role to citizen");
            showToast("Database profile set to Citizen.", "success");
          }
        }
      }
    } catch (e) {
      console.error("Error updating user role in DB:", e);
    }
  };

  const addAlert = async (newAlert: ClimateAlert) => {
    const dbSeverity = newAlert.severity === "Moderate" ? "medium" : newAlert.severity.toLowerCase();
    const dbStatus = newAlert.status === "Active" ? "active" : "expired";

    const { error: insertError } = await supabase
      .from("alerts")
      .insert({
        title: newAlert.title,
        message: newAlert.description,
        severity: dbSeverity,
        location: newAlert.area,
        status: dbStatus
      });

    if (insertError) {
      console.error("Error inserting alert:", insertError);
      throw insertError;
    }
  };

  const updateAlert = async (updatedAlert: ClimateAlert) => {
    const dbSeverity = updatedAlert.severity === "Moderate" ? "medium" : updatedAlert.severity.toLowerCase();
    const dbStatus = updatedAlert.status === "Active" ? "active" : "expired";

    const { error: updateError } = await supabase
      .from("alerts")
      .update({
        title: updatedAlert.title,
        message: updatedAlert.description,
        severity: dbSeverity,
        location: updatedAlert.area,
        status: dbStatus
      })
      .eq("id", updatedAlert.id);

    if (updateError) {
      console.error("Error updating alert:", updateError);
      throw updateError;
    }
  };

  const deleteAlert = async (alertId: string) => {
    const { error: deleteError } = await supabase
      .from("alerts")
      .delete()
      .eq("id", alertId);

    if (deleteError) {
      console.error("Error deleting alert:", deleteError);
      throw deleteError;
    }
  };

  const showToast = (message: string, type: "success" | "error") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <AlertsContext.Provider value={{ alerts: combinedAlerts, loading, error, addAlert, updateAlert, deleteAlert, userRole, setUserRole, showToast, location, setLocation }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`flex items-center justify-between gap-3 min-w-[300px] p-4 rounded-xl shadow-lg border animate-in slide-in-from-right-8 fade-in duration-300 ${
              toast.type === "error" ? "bg-red-50 border-red-200 text-red-900" : "bg-green-50 border-green-200 text-green-900"
            }`}
          >
            <div className="flex items-center gap-3">
              {toast.type === "error" ? (
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
              )}
              <span className="font-bold text-sm">{toast.message}</span>
            </div>
            <button onClick={() => removeToast(toast.id)} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </AlertsContext.Provider>
  );
}

export function useAlerts() {
  const context = useContext(AlertsContext);
  if (!context) {
    throw new Error("useAlerts must be used within an AlertsProvider");
  }
  return context;
}

