"use client";

import { useState, useEffect } from "react";
import { 
  AlertTriangle, 
  MapPin, 
  Loader2, 
  Send, 
  Droplets, 
  Flame, 
  Zap, 
  Thermometer, 
  CheckCircle2, 
  Clock, 
  Filter, 
  RefreshCw,
  Info,
  FileText
} from "lucide-react";
import { useAuthContext } from "@/providers/AuthProvider";
import { useLocation } from "@/providers/LocationContext";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) {
    toast.error("No data to export.");
    return;
  }
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map(row => 
    Object.values(row).map(val => {
      let str = String(val).replace(/"/g, '""');
      if (str.includes(",") || str.includes("\n") || str.includes('"')) {
        str = `"${str}"`;
      }
      return str;
    }).join(",")
  );
  const csvContent = [headers, ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast.success("CSV exported successfully!");
};

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

const CATEGORIES = ["Flood", "Fire", "Power Outage", "Landslide", "Heat Emergency"] as const;

export default function IncidentsPage() {
  const { user, loading: authLoading } = useAuthContext();
  const { city: activeCity, latitude: activeLat, longitude: activeLng } = useLocation();
  const supabase = createClient();

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<typeof CATEGORIES[number] | "">("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [locationName, setLocationName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // List State
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  
  // Filters State
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Fetch Incidents
  const fetchIncidents = async () => {
    setListLoading(true);
    setListError(null);
    try {
      const { data, error } = await supabase
        .from("incidents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }
      setIncidents(data || []);
    } catch (err: any) {
      console.error("Error fetching incidents:", err);
      setListError("Unable to load incident reports. Please check your network connection.");
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchIncidents();
    }
  }, [user]);

  // Pre-fill / Sync with active dashboard location
  const handleSyncLocation = () => {
    setLatitude(activeLat.toString());
    setLongitude(activeLng.toString());
    setLocationName(activeCity || "Active Location");
    
    // Clear coordinate-related errors
    setFormErrors(prev => {
      const copy = { ...prev };
      delete copy.latitude;
      delete copy.longitude;
      delete copy.locationName;
      return copy;
    });

    toast.success(`Synced location: ${activeCity}`);
  };

  // Form validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors.title = "Incident title is required.";
    } else if (title.trim().length < 5) {
      errors.title = "Title must be at least 5 characters.";
    }

    if (!description.trim()) {
      errors.description = "Description is required.";
    } else if (description.trim().length < 10) {
      errors.description = "Description must be at least 10 characters.";
    }

    if (!category) {
      errors.category = "Please select a category.";
    }

    if (!locationName.trim()) {
      errors.locationName = "Location name is required.";
    } else if (locationName.trim().length < 3) {
      errors.locationName = "Location name must be at least 3 characters.";
    }

    const latVal = parseFloat(latitude);
    if (!latitude.trim()) {
      errors.latitude = "Latitude is required.";
    } else if (isNaN(latVal) || latVal < -90 || latVal > 90) {
      errors.latitude = "Latitude must be a valid number between -90 and 90.";
    }

    const lngVal = parseFloat(longitude);
    if (!longitude.trim()) {
      errors.longitude = "Longitude is required.";
    } else if (isNaN(lngVal) || lngVal < -180 || lngVal > 180) {
      errors.longitude = "Longitude must be a valid number between -180 and 180.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in to submit an incident.");
      return;
    }

    if (!validateForm()) {
      toast.error("Please correct the errors in the form.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("incidents")
        .insert({
          created_by: user.id,
          title: title.trim(),
          description: description.trim(),
          category,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          location_name: locationName.trim(),
          status: "Pending"
        });

      if (error) {
        throw error;
      }

      toast.success("Incident reported successfully! It is now pending review.");
      
      // Clear form
      setTitle("");
      setDescription("");
      setCategory("");
      setLatitude("");
      setLongitude("");
      setLocationName("");
      setFormErrors({});

      // Refresh Incidents List
      fetchIncidents();
    } catch (err: any) {
      console.error("Error submitting incident:", err);
      toast.error(err.message || "Failed to submit incident. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered incidents
  const filteredIncidents = incidents.filter(incident => {
    const matchesCategory = categoryFilter === "All" || incident.category === categoryFilter;
    const matchesStatus = statusFilter === "All" || incident.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesCategory && matchesStatus;
  });

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "Flood":
        return <Droplets className="h-4 w-4 text-blue-500" />;
      case "Fire":
        return <Flame className="h-4 w-4 text-red-500" />;
      case "Power Outage":
        return <Zap className="h-4 w-4 text-yellow-500" />;
      case "Landslide":
        return <AlertTriangle className="h-4 w-4 text-amber-800" />;
      case "Heat Emergency":
        return <Thermometer className="h-4 w-4 text-orange-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryColors = (cat: string) => {
    switch (cat) {
      case "Flood":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "Fire":
        return "bg-red-50 text-red-700 border-red-100";
      case "Power Outage":
        return "bg-yellow-50 text-yellow-700 border-yellow-100";
      case "Landslide":
        return "bg-amber-50 text-amber-900 border-amber-200";
      case "Heat Emergency":
        return "bg-orange-50 text-orange-700 border-orange-100";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStatusColors = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
      case "open":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "assigned":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "resolved":
        return "bg-green-100 text-green-800 border-green-200";
      case "in progress":
      case "investigating":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-[calc(100vh-6rem)] items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary-500 animate-spin" />
        <span className="ml-3 font-semibold text-gray-600">Verifying session details...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Citizen Incident Reporting</h1>
          <p className="text-sm text-gray-500">Report climate-related emergencies or monitor recent community reports.</p>
        </div>
        <button
          onClick={() => {
            const dataToExport = filteredIncidents.map(inc => ({
              ID: inc.id,
              Title: inc.title,
              Category: inc.category,
              LocationName: inc.location_name,
              Latitude: inc.latitude,
              Longitude: inc.longitude,
              Status: inc.status,
              CreatedAt: inc.created_at,
              Description: inc.description
            }));
            exportToCSV(dataToExport, `ClimateShield_Incidents_${new Date().toISOString().split("T")[0]}.csv`);
          }}
          className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 hover:border-gray-300 flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98"
        >
          <FileText className="h-4 w-4 text-gray-400" /> Export Incidents CSV
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Reporting Form */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="border-b border-gray-100 pb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary-500" />
            <h2 className="text-lg font-bold text-gray-900">Report New Incident</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Incident Title *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Localized Street Flooding"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all ${
                  formErrors.title ? "border-red-500 bg-red-50/20" : "border-gray-200"
                }`}
                disabled={isSubmitting}
              />
              {formErrors.title && (
                <p className="text-xs text-red-600 mt-1 font-semibold">{formErrors.title}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Category *
              </label>
              <select
                id="category"
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all bg-white ${
                  formErrors.category ? "border-red-500 bg-red-50/20" : "border-gray-200"
                }`}
                disabled={isSubmitting}
              >
                <option value="">-- Select Incident Category --</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {formErrors.category && (
                <p className="text-xs text-red-600 mt-1 font-semibold">{formErrors.category}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Incident Description *
              </label>
              <textarea
                id="description"
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Provide detailed description of the incident, impact, and immediate safety concerns..."
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all ${
                  formErrors.description ? "border-red-500 bg-red-50/20" : "border-gray-200"
                }`}
                disabled={isSubmitting}
              />
              {formErrors.description && (
                <p className="text-xs text-red-600 mt-1 font-semibold">{formErrors.description}</p>
              )}
            </div>

            {/* Location Section */}
            <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Location & Coordinates</span>
                <button
                  type="button"
                  onClick={handleSyncLocation}
                  disabled={isSubmitting}
                  className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-gray-200 hover:shadow-xs transition-all cursor-pointer"
                >
                  <MapPin className="h-3 w-3" /> Sync Dashboard City
                </button>
              </div>

              {/* Location Name */}
              <div>
                <label htmlFor="locationName" className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                  Location Name / Address *
                </label>
                <input
                  id="locationName"
                  type="text"
                  value={locationName}
                  onChange={e => setLocationName(e.target.value)}
                  placeholder="e.g. Chennai Central, Park Town"
                  className={`w-full px-3 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all bg-white ${
                    formErrors.locationName ? "border-red-500 bg-red-50/20" : "border-gray-200"
                  }`}
                  disabled={isSubmitting}
                />
                {formErrors.locationName && (
                  <p className="text-[10px] text-red-600 mt-0.5 font-semibold">{formErrors.locationName}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Latitude */}
                <div>
                  <label htmlFor="latitude" className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                    Latitude *
                  </label>
                  <input
                    id="latitude"
                    type="text"
                    value={latitude}
                    onChange={e => setLatitude(e.target.value)}
                    placeholder="e.g. 13.0827"
                    className={`w-full px-3 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all bg-white ${
                      formErrors.latitude ? "border-red-500 bg-red-50/20" : "border-gray-200"
                    }`}
                    disabled={isSubmitting}
                  />
                  {formErrors.latitude && (
                    <p className="text-[10px] text-red-600 mt-0.5 font-semibold">{formErrors.latitude}</p>
                  )}
                </div>

                {/* Longitude */}
                <div>
                  <label htmlFor="longitude" className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                    Longitude *
                  </label>
                  <input
                    id="longitude"
                    type="text"
                    value={longitude}
                    onChange={e => setLongitude(e.target.value)}
                    placeholder="e.g. 80.2707"
                    className={`w-full px-3 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all bg-white ${
                      formErrors.longitude ? "border-red-500 bg-red-50/20" : "border-gray-200"
                    }`}
                    disabled={isSubmitting}
                  />
                  {formErrors.longitude && (
                    <p className="text-[10px] text-red-600 mt-0.5 font-semibold">{formErrors.longitude}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Info notice */}
            <div className="flex gap-2 p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-blue-800 text-xs">
              <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <p>Submitted incidents will be visible on the Climate Risk Map immediately to assist with hazard awareness.</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-xl shadow-md transition-all cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Submitting Report...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Submit Incident Report</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Incidents List */}
        <div className="lg:col-span-7 space-y-4">
          {/* Filters Panel */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <Filter className="h-4 w-4 text-gray-500" />
              <span>Filter Incident Reports</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="in progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>

              {/* Refresh Button */}
              <button
                onClick={fetchIncidents}
                disabled={listLoading}
                className="p-1 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                title="Refresh list"
              >
                <RefreshCw className={`h-4 w-4 text-gray-500 ${listLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Incidents List Container */}
          <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
            {listLoading ? (
              // Loading Skeleton
              Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm animate-pulse space-y-3">
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded-md w-1/3" />
                    <div className="h-5 bg-gray-200 rounded-full w-16" />
                  </div>
                  <div className="h-5 bg-gray-200 rounded-md w-3/4" />
                  <div className="h-4 bg-gray-200 rounded-md w-1/2" />
                  <div className="flex justify-between pt-2 border-t border-gray-50">
                    <div className="h-3 bg-gray-200 rounded-md w-1/4" />
                    <div className="h-3 bg-gray-200 rounded-md w-1/4" />
                  </div>
                </div>
              ))
            ) : listError ? (
              // List Load Error
              <div className="bg-red-50 border border-red-200 p-6 rounded-2xl text-center">
                <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-red-950 mb-1">Load Failed</h3>
                <p className="text-xs text-red-800">{listError}</p>
                <button
                  onClick={fetchIncidents}
                  className="mt-3 text-xs font-bold text-red-900 underline hover:no-underline"
                >
                  Try Again
                </button>
              </div>
            ) : filteredIncidents.length === 0 ? (
              // Empty State
              <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center shadow-sm">
                <CheckCircle2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-1">No Incidents Reported</h3>
                <p className="text-sm text-gray-500">No incident reports match your current filter selections.</p>
                {(categoryFilter !== "All" || statusFilter !== "All") && (
                  <button
                    onClick={() => {
                      setCategoryFilter("All");
                      setStatusFilter("All");
                    }}
                    className="mt-4 text-xs font-bold text-primary-600 hover:text-primary-700"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              // Incidents List
              filteredIncidents.map(incident => (
                <div
                  key={incident.id}
                  className="bg-white p-5 rounded-2xl border border-gray-200 hover:border-primary-300 shadow-xs hover:shadow-md transition-all flex flex-col space-y-3"
                >
                  <div className="flex justify-between items-start">
                    {/* Category badge */}
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getCategoryColors(incident.category)}`}>
                      {getCategoryIcon(incident.category)}
                      <span>{incident.category}</span>
                    </div>

                    {/* Status Badge */}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusColors(incident.status)}`}>
                      {incident.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-gray-900 leading-tight mb-1">{incident.title}</h3>
                    <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{incident.description}</p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pt-3 border-t border-gray-50 text-[11px] font-semibold text-gray-500">
                    <div className="flex items-center gap-1 truncate">
                      <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span className="truncate" title={incident.location_name}>{incident.location_name}</span>
                      <span className="text-[10px] text-gray-400 font-normal ml-0.5">
                        ({incident.latitude.toFixed(4)}°, {incident.longitude.toFixed(4)}°)
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span>Reported: {new Date(incident.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
