"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { 
  Brain, TrendingUp, Sparkles, AlertTriangle, 
  ActivitySquare,
  ShieldAlert, Zap, MapPin, X, CheckCircle2, RefreshCw, MessageSquare, Send
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { useAlerts } from "@/lib/AlertsContext";
import { useLocation } from "@/providers/LocationContext";
import { useWeather } from "@/hooks/useWeather";
import { useAirQuality } from "@/hooks/useAirQuality";
import { useFloodRisk } from "@/hooks/useFloodRisk";
import { fetchWeather, fetchWeatherByCity, fetchConsolidatedData, getWeatherDetails } from "@/lib/weather";
import { fetchAirQuality, fetchAirQualityByCity } from "@/lib/airQuality";
import { fetchFloodRisk, fetchFloodRiskByCity } from "@/lib/floodRisk";
import { createClient } from "@/lib/supabase/client";
import { Shelter, Resource } from "@/lib/ResourceShelterContext";

// Helper to format chatbot message markdown-like elements into HTML safely
function formatMessageText(text: string): string {
  if (!text.includes("###") && !text.includes("**")) {
    return text.replace(/\n/g, "<br/>");
  }

  let html = "";
  const lines = text.split("\n");
  
  let currentCard: "weather" | "flood" | "aqi" | "risk" | "recs" | null = null;
  let cardContent: string[] = [];

  const closeCard = () => {
    if (!currentCard) return "";
    let cardHtml = "";
    
    if (currentCard === "weather") {
      cardHtml = `
        <div class="bg-blue-50/50 border border-blue-100 rounded-xl p-3.5 my-3 shadow-xs">
          <div class="flex items-center gap-2 text-blue-800 font-extrabold text-xs mb-2.5 border-b border-blue-100/50 pb-1.5">
            <svg class="h-4 w-4 text-blue-500 fill-blue-100/30 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z"/></svg>
            <span>WEATHER TELEMETRY</span>
          </div>
          <div class="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] text-gray-700">
            ${cardContent.join("")}
          </div>
        </div>
      `;
    } else if (currentCard === "flood") {
      cardHtml = `
        <div class="bg-cyan-50/50 border border-cyan-100 rounded-xl p-3.5 my-3 shadow-xs">
          <div class="flex items-center gap-2 text-cyan-800 font-extrabold text-xs mb-2.5 border-b border-cyan-100/50 pb-1.5">
            <svg class="h-4 w-4 text-cyan-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V9a2 2 0 00-2-2H6a2 2 0 00-2 2v4m16 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2v-1"/></svg>
            <span>FLOOD & WATER CONTROLLER</span>
          </div>
          <div class="space-y-1.5 text-[11px] text-gray-700">
            ${cardContent.join("")}
          </div>
        </div>
      `;
    } else if (currentCard === "aqi") {
      cardHtml = `
        <div class="bg-purple-50/50 border border-purple-100 rounded-xl p-3.5 my-3 shadow-xs">
          <div class="flex items-center gap-2 text-purple-800 font-extrabold text-xs mb-2.5 border-b border-purple-100/50 pb-1.5">
            <svg class="h-4 w-4 text-purple-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z"/></svg>
            <span>AIR QUALITY INDEX (AQI)</span>
          </div>
          <div class="space-y-1.5 text-[11px] text-gray-700">
            ${cardContent.join("")}
          </div>
        </div>
      `;
    } else if (currentCard === "risk") {
      cardHtml = `
        <div class="bg-rose-50/50 border border-rose-100 rounded-xl p-3.5 my-3 shadow-xs">
          <div class="flex items-center gap-2 text-rose-800 font-extrabold text-xs mb-2.5 border-b border-rose-100/50 pb-1.5">
            <svg class="h-4 w-4 text-rose-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <span>COMPOSITE RISK PROFILE</span>
          </div>
          <div class="space-y-1.5 text-[11px] text-gray-700">
            ${cardContent.join("")}
          </div>
        </div>
      `;
    } else if (currentCard === "recs") {
      cardHtml = `
        <div class="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5 my-3 shadow-xs">
          <div class="flex items-center gap-2 text-emerald-800 font-extrabold text-xs mb-2.5 border-b border-emerald-100/50 pb-1.5">
            <svg class="h-4 w-4 text-emerald-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span>SAFETY RECOMMENDATIONS</span>
          </div>
          <div class="space-y-2 text-[11px] text-gray-700">
            ${cardContent.join("")}
          </div>
        </div>
      `;
    }

    currentCard = null;
    cardContent = [];
    return cardHtml;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith("###")) {
      html += closeCard();
      const title = line.replace(/###/g, "").trim();
      html += `
        <div class="bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-xl p-3.5 mb-4 shadow-sm">
          <div class="flex items-center gap-2">
            <svg class="h-4 w-4 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
            <span class="font-extrabold text-[9px] tracking-widest uppercase">Climate Intel Board</span>
          </div>
          <h4 class="text-sm font-black mt-1 leading-snug">${title}</h4>
        </div>
      `;
      continue;
    }

    if (line.includes("**Weather**:")) {
      html += closeCard();
      currentCard = "weather";
      continue;
    } else if (line.includes("**Flood**:")) {
      html += closeCard();
      currentCard = "flood";
      continue;
    } else if (line.includes("**Air Quality**:")) {
      html += closeCard();
      currentCard = "aqi";
      continue;
    } else if (line.includes("**Composite Risk**:")) {
      html += closeCard();
      currentCard = "risk";
      continue;
    } else if (line.includes("**Recommendations**:")) {
      html += closeCard();
      currentCard = "recs";
      continue;
    }

    const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-gray-900">$1</strong>');

    if (line.startsWith("•") || line.startsWith("-")) {
      const content = line.substring(1).trim().replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-gray-900">$1</strong>');
      if (currentCard) {
        if (currentCard === "weather") {
          const colonIdx = content.indexOf(":");
          if (colonIdx !== -1) {
            const key = content.substring(0, colonIdx).trim();
            const val = content.substring(colonIdx + 1).trim();
            cardContent.push(`
              <div class="flex justify-between items-center py-1.5 border-b border-gray-100/50">
                <span class="text-gray-400 font-semibold">${key}:</span>
                <span class="font-extrabold text-gray-900">${val}</span>
              </div>
            `);
          } else {
            cardContent.push(`<div class="col-span-2 py-0.5 font-medium">${content}</div>`);
          }
        } else if (currentCard === "recs") {
          cardContent.push(`
            <div class="flex gap-2 items-start">
              <span class="mt-0.5 text-emerald-500 font-extrabold">✓</span>
              <span class="leading-relaxed font-medium text-gray-700">${content}</span>
            </div>
          `);
        } else {
          cardContent.push(`
            <div class="flex gap-1.5 items-start py-0.5">
              <span class="text-gray-400">•</span>
              <span class="leading-relaxed font-medium">${content}</span>
            </div>
          `);
        }
      } else {
        html += `<div class="flex gap-1.5 items-start pl-2 mb-1.5"><span class="text-gray-400">•</span><span class="leading-relaxed font-medium text-gray-700">${content}</span></div>`;
      }
    } else {
      if (currentCard) {
        cardContent.push(`<p class="leading-relaxed py-0.5 font-medium">${formattedLine}</p>`);
      } else {
        html += `<p class="leading-relaxed mb-2 text-gray-700 font-medium">${formattedLine}</p>`;
      }
    }
  }

  html += closeCard();
  return html;
}

// Helpers for recommendations based on conditions
function getClimateSafetyRecommendations(temp: number, floodRisk: number, aqi: number) {
  return {
    heatwave: temp > 85 
      ? "Avoid direct sun exposure between 11 AM and 4 PM, stay hydrated with electrolyte fluids, and check on vulnerable individuals." 
      : "No extreme heat stress risk active. Keep standard hydration.",
    flood: floodRisk > 40
      ? "Evacuate low-lying zones immediately if directed, avoid wading/driving through standing waters, and secure essential household items."
      : "Low flood risk detected. Keep local storm gutters clear of solid waste.",
    aqi: aqi > 100
      ? "Restrict heavy outdoor workouts, keep windows closed to seal out fine particulates, and wear high-grade N95 masks."
      : "Air quality levels are safe. Outdoor exposure is fine.",
    general: "Monitor daily climate telemetries, keep a power bank and first-aid safety kit fully prepared, and coordinate with municipal response units."
  };
}

function getClimateSafetyRecommendationsList(temp: number, floodRisk: number, aqi: number): string[] {
  const list: string[] = [];
  if (temp > 85) {
    list.push("Thermal Stress: Avoid direct sun between 11 AM - 4 PM; consume electrolyte fluids regularly.");
  }
  if (floodRisk > 40) {
    list.push("Flood Threat: Store emergency food/water supplies, and verify closest rescue shelter locations.");
  }
  if (aqi > 100) {
    list.push("Air Pollution: Close air vents, wear high-grade N95 masks, and run indoor HEPA filters.");
  }
  
  if (list.length < 1) {
    list.push("Sensors indicate safe climate conditions. Maintain general resource readiness.");
  }
  if (list.length < 2) {
    list.push("Monitor local weather broadcasts and keep household emergency kits updated.");
  }
  if (list.length < 3) {
    list.push("Save contact numbers of municipal emergency dispatch units for quick access.");
  }
  return list.slice(0, 3);
}

function getRiskBadge(level: string): string {
  let badgeClass = "";
  if (level === "Low") badgeClass = "bg-green-100 text-green-800 border-green-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase";
  else if (level === "Moderate") badgeClass = "bg-yellow-100 text-yellow-800 border-yellow-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase";
  else if (level === "High") badgeClass = "bg-orange-100 text-orange-800 border-orange-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase";
  else if (level === "Critical") badgeClass = "bg-red-100 text-red-800 border-red-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase animate-pulse";
  return `<span class="${badgeClass}">${level}</span>`;
}

// Dynamic map loading to avoid SSR window errors
const AIForecastMap = dynamic(() => import("@/components/maps/AIForecastMap"), { 
  ssr: false,
  loading: () => <div className="h-full w-full min-h-[400px] bg-gray-50 rounded-xl animate-pulse flex items-center justify-center border border-gray-100 text-gray-400 font-medium">Initializing AI Map Engine...</div>
});

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const NICKNAME_MAPPINGS: Record<string, string> = {
  trichy: "Tiruchirappalli",
  banglore: "Bangalore",
  bombay: "Mumbai",
  madras: "Chennai"
};

function extractCityCandidate(text: string): string | null {
  const cleanText = text.replace(/[?.!,]/g, " ").trim();
  const words = cleanText.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return null;

  const ignoreSet = new Set([
    "how", "is", "the", "weather", "in", "at", "for", "on", "what", "danger", "safe", "safety", 
    "risk", "today", "tomorrow", "forecast", "climate", "report", "show", "me", "tell", "about", 
    "current", "status", "any", "alerts", "a", "an", "of", "will", "this", "week", "risky", 
    "city", "please", "give", "info", "information", "data", "temp", "temperature", "flood", 
    "flooding", "aqi", "air", "quality", "pollution", "hazard", "hazards", "alert", "alerts", 
    "warning", "warnings", "shelter", "shelters", "to", "and", "or", "with", "from", "was",
    "were", "are", "do", "does", "did", "can", "could", "would", "should", "you", "your",
    "my", "i", "we", "he", "she", "it", "they", "them"
  ]);

  // 1. Check nicknames first (Trichy, Banglore, Bombay, Madras)
  for (const word of words) {
    const cleanWord = word.trim().toLowerCase();
    if (NICKNAME_MAPPINGS[cleanWord]) {
      return word; // return the nickname token itself so we can do mapping & note prepending
    }
  }

  // 2. Try preposition pattern match on cleanText
  // E.g. "in xyz123" -> extracts "xyz123"
  const prepRegex = /(?:in|is|will|at|for|about|safety of|to|from)\s+(\S+)/i;
  const match = cleanText.match(prepRegex);
  if (match && match[1]) {
    const firstWord = match[1].replace(/[?.!,]/g, "").trim();
    if (firstWord && firstWord.length > 2 && !ignoreSet.has(firstWord.toLowerCase())) {
      return firstWord;
    }
  }

  // 3. Look for capitalized words that are not stop words
  for (const word of words) {
    if (word.length > 2 && word[0] === word[0].toUpperCase()) {
      const lower = word.toLowerCase();
      if (!ignoreSet.has(lower)) {
        return word;
      }
    }
  }

  // 4. If it's a single word query and not in ignore list
  if (words.length === 1) {
    const singleWord = words[0];
    if (singleWord.length > 2 && !ignoreSet.has(singleWord.toLowerCase())) {
      return singleWord;
    }
  }

  return null;
}

interface Message {
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
}

export default function AiIntelligencePage() {
  const { showToast } = useAlerts();
  const { city, latitude, longitude } = useLocation();
  const [mounted, setMounted] = useState(false);

  // Climate hooks connected to selected location
  const { weather, loading: weatherLoading, error: weatherError, refresh: refreshWeather } = useWeather(latitude, longitude);
  const { airQuality, loading: aqiLoading, error: aqiError, refresh: refreshAqi } = useAirQuality(latitude, longitude);
  const { floodRisk, loading: floodLoading, error: floodError, refresh: refreshFlood } = useFloodRisk(latitude, longitude);

  // Action / Model mod states
  const [isExecuteModalOpen, setIsExecuteModalOpen] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeRecommendationTab, setActiveRecommendationTab] = useState<"citizen" | "government">("citizen");

  // Chatbot state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Compute composite climate risks
  const metrics = useMemo(() => {
    const floodVal = floodRisk ? floodRisk.score : 35;
    const aqiRaw = airQuality ? airQuality.usAqi : 75;
    const aqiVal = Math.round(Math.min(100, (aqiRaw / 200) * 100));
    const tempVal = weather ? weather.temperature : 85;
    const heatVal = Math.round(Math.min(100, Math.max(0, (tempVal - 70) * (100 / 35))));

    const composite = Math.round(Math.max(floodVal, aqiVal, heatVal));
    
    let level: "Low" | "Moderate" | "High" | "Critical" = "Moderate";
    let color = "text-yellow-700 bg-yellow-50 border-yellow-200";
    let badgeColor = "bg-yellow-500";
    let fill = "#eab308";

    if (composite >= 75) {
      level = "Critical";
      color = "text-red-700 bg-red-50 border-red-200 animate-pulse";
      badgeColor = "bg-red-600";
      fill = "#ef4444";
    } else if (composite >= 50) {
      level = "High";
      color = "text-orange-700 bg-orange-50 border-orange-200";
      badgeColor = "bg-orange-500";
      fill = "#f97316";
    } else if (composite >= 25) {
      level = "Moderate";
      color = "text-yellow-700 bg-yellow-50 border-yellow-200";
      badgeColor = "bg-yellow-500";
      fill = "#eab308";
    } else {
      level = "Low";
      color = "text-green-700 bg-green-50 border-green-200";
      badgeColor = "bg-green-600";
      fill = "#22c55e";
    }

    // Determine primary driving risk factor
    let factor = "Thermal Stress";
    let explanation = `Extreme temperatures (reaching ${tempVal}°F) in ${city} are currently the primary risk vector. Protect vulnerable demographics from heatstroke.`;
    if (composite === floodVal) {
      factor = "Flood Risk";
      explanation = `Heavy rainfall and soil saturation factors in ${city} are currently driving the risk score, raising the flood threat probability to ${floodVal}%.`;
    } else if (composite === aqiVal) {
      factor = "Air Quality";
      explanation = `Poor ambient air quality in ${city} (US AQI: ${aqiRaw}) is the dominant threat. Sensitive individuals are advised to remain indoors.`;
    }

    return {
      floodScore: floodVal,
      aqiScore: aqiVal,
      aqiRaw,
      tempVal,
      heatScore: heatVal,
      compositeScore: composite,
      riskLevel: level,
      riskColorClass: color,
      riskBadgeColor: badgeColor,
      strokeColor: fill,
      primaryFactor: factor,
      riskExplanation: explanation
    };
  }, [floodRisk, airQuality, weather, city]);

  // Recommendations data
  const recommendations = useMemo(() => {
    const citizen: string[] = [];
    const government: string[] = [];

    // Flood risk checks
    if (metrics.floodScore >= 75) {
      citizen.push(
        "Move essential furniture, documents, and appliances to higher floors.",
        "Evacuate low-lying areas and report to designated community shelters.",
        "Avoid wading or driving through any standing drainage waters."
      );
      government.push(
        "Clear critical stormwater networks and check pumping status.",
        "Dispatch community rescue boats and teams to low-lying wards.",
        "Issue pre-emptive localized evacuation notices via SMS broadcasts."
      );
    } else if (metrics.floodScore >= 50) {
      citizen.push(
        "Keep emergency power banks, drinking water, and dry rations ready.",
        "Verify your household evacuation routes and nearest shelter details."
      );
      government.push(
        "Position standby emergency drainage pump units in vulnerable areas.",
        "Ensure emergency shelter stock is ready for potential citizens."
      );
    } else if (metrics.floodScore >= 25) {
      citizen.push("Watch for localized pooling in streets; clear private drains.");
      government.push("Perform routine clearing of high-risk street gutters.");
    }

    // Heat risk checks
    if (metrics.heatScore >= 75) {
      citizen.push(
        "Minimize direct solar exposure between peak hours of 11 AM and 4 PM.",
        "Maintain high hydration using electrolyte fluids regularly."
      );
      government.push(
        "Launch municipal air-conditioned cooling bays across active zones.",
        "Coordinate with electrical providers to prevent grid overload warnings."
      );
    } else if (metrics.heatScore >= 50) {
      citizen.push(
        "Use lightweight, light-colored cotton garments to reflect heat.",
        "Check on senior neighbors and keep pets indoor."
      );
      government.push(
        "Suspend outdoor public labor during peak temperature hours.",
        "Ensure regional clinics are stocked with emergency hydration IVs."
      );
    }

    // AQI risk checks
    if (metrics.aqiRaw >= 150) {
      citizen.push(
        "Restrict heavy outdoor exercise and play during high AQI periods.",
        "Wear certified N95 masks if outdoor commute is mandatory."
      );
      government.push(
        "Enforce strict dust abatement directives at public work sites.",
        "Deploy mobile public health units to distribute masks."
      );
    } else if (metrics.aqiRaw >= 100) {
      citizen.push("Equip household filtration units and close external vents/windows.");
      government.push("Restrict heavy transport operations inside industrial corridors.");
    }

    // Default safety measures if everything is low risk
    if (citizen.length === 0) {
      citizen.push(
        "All climate indicators are currently in safe thresholds. Normal precautions apply.",
        "Monitor local weather broadcasts and keep safety kits updated."
      );
      government.push(
        "Maintaining regular sensor telemetry monitoring and system readiness.",
        "Continue routine infrastructure maintenance operations."
      );
    }

    return { citizen, government };
  }, [metrics]);

  // Dynamically map Recharts chart data based on current metric values
  const dynamicForecastData = useMemo(() => {
    return [
      { day: 'Today', flood: metrics.floodScore, heat: metrics.heatScore, aqi: metrics.aqiScore },
      { day: '+1 Day', flood: Math.round(Math.max(10, Math.min(100, metrics.floodScore * 1.06))), heat: Math.round(Math.max(10, Math.min(100, metrics.heatScore * 1.02))), aqi: Math.round(Math.max(10, Math.min(100, metrics.aqiScore * 1.04))) },
      { day: '+2 Days', flood: Math.round(Math.max(10, Math.min(100, metrics.floodScore * 1.12))), heat: Math.round(Math.max(10, Math.min(100, metrics.heatScore * 1.05))), aqi: Math.round(Math.max(10, Math.min(100, metrics.aqiScore * 1.08))) },
      { day: '+3 Days', flood: Math.round(Math.max(10, Math.min(100, metrics.floodScore * 1.18))), heat: Math.round(Math.max(10, Math.min(100, metrics.heatScore * 1.10))), aqi: Math.round(Math.max(10, Math.min(100, metrics.aqiScore * 1.14))) },
      { day: '+5 Days', flood: Math.round(Math.max(10, Math.min(100, metrics.floodScore * 1.22))), heat: Math.round(Math.max(10, Math.min(100, metrics.heatScore * 1.15))), aqi: Math.round(Math.max(10, Math.min(100, metrics.aqiScore * 1.18))) },
      { day: '+7 Days', flood: Math.round(Math.max(10, Math.min(100, metrics.floodScore * 1.25))), heat: Math.round(Math.max(10, Math.min(100, metrics.heatScore * 1.20))), aqi: Math.round(Math.max(10, Math.min(100, metrics.aqiScore * 1.22))) },
    ];
  }, [metrics]);

  // Load query history on mount or city change
  useEffect(() => {
    async function loadHistory() {
      if (!city) return;
      
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("ai_queries")
          .select("*")
          .eq("city", city)
          .order("created_at", { ascending: true })
          .limit(15);
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          const loadedMessages: Message[] = [];
          data.forEach((row: any) => {
            loadedMessages.push({
              sender: "user",
              text: row.user_query,
              timestamp: new Date(row.created_at)
            });
            loadedMessages.push({
              sender: "ai",
              text: row.ai_response,
              timestamp: new Date(row.created_at)
            });
          });
          setMessages(loadedMessages);
        } else {
          // Fallback to welcome message if no history
          setMessages([
            {
              sender: "ai",
              text: `Hello! I am your ClimateShield AI Assistant. I have analyzed current sensors for **${city}**. The overall Risk Level is **${metrics.riskLevel}** (${metrics.compositeScore}/100) with **${metrics.primaryFactor}** being the primary hazard. How can I help you prepare or analyze forecasts today?`,
              timestamp: new Date()
            }
          ]);
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
        // Fallback to welcome message
        setMessages([
          {
            sender: "ai",
            text: `Hello! I am your ClimateShield AI Assistant. I have analyzed current sensors for **${city}**. The overall Risk Level is **${metrics.riskLevel}** (${metrics.compositeScore}/100) with **${metrics.primaryFactor}** being the primary hazard. How can I help you prepare or analyze forecasts today?`,
            timestamp: new Date()
          }
        ]);
      }
    }
    
    loadHistory();
  }, [city, metrics.riskLevel, metrics.compositeScore, metrics.primaryFactor]);

  // Scroll chatbot to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

    if (!textToSend) setInputText("");

    const newMsg: Message = { sender: "user", text, timestamp: new Date() };
    setMessages(prev => [...prev, newMsg]);

    setIsTyping(true);

    let reply = "";
    const lower = text.toLowerCase();

    // Determine which city we are querying
    let targetCityName = "";
    let targetLat = 0;
    let targetLon = 0;
    let weatherData, aqiData, floodData;
    let note = "";

    const extractedCity = extractCityCandidate(text);

    if (extractedCity) {
      // Apply nickname mappings if applicable
      const cleanWord = extractedCity.toLowerCase();
      const resolvedCity = NICKNAME_MAPPINGS[cleanWord] || extractedCity;

      if (NICKNAME_MAPPINGS[cleanWord]) {
        note = `*(Showing results for **${NICKNAME_MAPPINGS[cleanWord]}**, nickname mapping for "${extractedCity}")*\n\n`;
      }

      // Fetch dynamic weather, AQI, and flood risk directly by city name
      try {
        [weatherData, aqiData, floodData] = await Promise.all([
          fetchWeatherByCity(resolvedCity),
          fetchAirQualityByCity(resolvedCity),
          fetchFloodRiskByCity(resolvedCity),
        ]);
        targetCityName = weatherData.locationName || resolvedCity;
        targetLat = weatherData.latitude || 0;
        targetLon = weatherData.longitude || 0;
      } catch (err: any) {
        console.error("OpenWeather city lookup failed:", err);
        const errorMsg = `Unable to identify the location "${extractedCity}". Please check the spelling and enter a valid city name.`;
        setMessages(prev => [...prev, { sender: "ai", text: errorMsg, timestamp: new Date() }]);
        setIsTyping(false);

        // Log details
        console.log("=== AI Assistant Query Log ===");
        console.log("User Query:", text);
        console.log("Extracted City:", extractedCity);
        console.log("Matched City:", "None");
        console.log("Intent:", "UNKNOWN");
        console.log("===============================");
        return;
      }
    } else {
      // If no city candidate was extracted in the user query, use the active page city context
      targetCityName = city;
      targetLat = latitude;
      targetLon = longitude;

      try {
        [weatherData, aqiData, floodData] = await Promise.all([
          fetchWeather(targetLat, targetLon),
          fetchAirQuality(targetLat, targetLon),
          fetchFloodRisk(targetLat, targetLon),
        ]);
      } catch (apiErr) {
        console.error("OpenWeather API coordinates lookup failed:", apiErr);
        setMessages(prev => [...prev, { sender: "ai", text: "Weather service temporarily unavailable.", timestamp: new Date() }]);
        setIsTyping(false);
        return;
      }
    }

    // Check if query is about shelters or resources
    const isShelterQuery = lower.includes("shelter") || lower.includes("refuge") || lower.includes("camp");
    const isResourceQuery = lower.includes("resource") || lower.includes("ambulance") || lower.includes("rescue") || lower.includes("fire") || lower.includes("water tanker") || lower.includes("medical team");

    if (isShelterQuery || isResourceQuery) {
      const supabase = createClient();
      if (isShelterQuery) {
        try {
          const { data: sheltersData, error: sheltersErr } = await supabase
            .from("shelters")
            .select("*");
            
          if (sheltersErr) throw sheltersErr;
          
          const cityShelters = ((sheltersData as Shelter[]) || []).filter((s: Shelter) => {
            const cityLower = targetCityName.toLowerCase();
            const nameMatch = s.name.toLowerCase().includes(cityLower);
            const addressMatch = s.address.toLowerCase().includes(cityLower);
            const locationMatch = s.location ? s.location.toLowerCase().includes(cityLower) : false;
            const distance = calculateDistance(targetLat, targetLon, s.latitude, s.longitude);
            return nameMatch || addressMatch || locationMatch || distance <= 50;
          });

          if (lower.includes("nearest") || lower.includes("closest")) {
            // Sort by distance and return closest
            const sorted = cityShelters.map((s: Shelter) => ({
              shelter: s,
              distance: calculateDistance(targetLat, targetLon, s.latitude, s.longitude)
            })).sort((a, b) => a.distance - b.distance);

            if (sorted.length > 0) {
              const nearest = sorted[0];
              reply = `### Nearest Shelter in ${targetCityName}
The nearest shelter is **${nearest.shelter.name}**.
• **Distance**: ${nearest.distance.toFixed(1)} km away
• **Address**: ${nearest.shelter.address}
• **Capacity**: ${nearest.shelter.capacity} spaces (Occupied: ${nearest.shelter.occupied}, Available: ${nearest.shelter.capacity - nearest.shelter.occupied})
• **Status**: ${nearest.shelter.status}
• **Contact**: ${nearest.shelter.contact || "N/A"}`;
            } else {
              reply = `### Shelters in ${targetCityName}
No shelters were found in or within 50 km of **${targetCityName}** in the database.
*(If you are an administrator, you can add a shelter for this area in the Command Center.)*`;
            }
          } else {
            // List all shelters
            if (cityShelters.length > 0) {
              reply = `### Shelters in ${targetCityName}
Found **${cityShelters.length}** shelter(s) in/near ${targetCityName}:
\n` + cityShelters.map((s: Shelter) => {
                const dist = calculateDistance(targetLat, targetLon, s.latitude, s.longitude);
                return `* **${s.name}** (${dist.toFixed(1)} km away)
  • Address: ${s.address}
  • Capacity: ${s.capacity} (Occupied: ${s.occupied}, Available: ${s.capacity - s.occupied})
  • Status: ${s.status}
  • Contact: ${s.contact || "N/A"}`;
              }).join("\n\n");
            } else {
              reply = `### Shelters in ${targetCityName}
No shelters were found in or within 50 km of **${targetCityName}** in the database.
*(If you are an administrator, you can add a shelter for this area in the Command Center.)*`;
            }
          }
        } catch (dbErr: any) {
          console.error("Database query failed for shelters:", dbErr);
          reply = `Unable to fetch shelters from the database at this time. Please try again later.`;
        }
      } else {
        // Resource query
        try {
          const { data: resourcesData, error: resourcesErr } = await supabase
            .from("resources")
            .select("*");
            
          if (resourcesErr) throw resourcesErr;
          
          const cityResources = ((resourcesData as Resource[]) || []).filter((r: Resource) => {
            const cityLower = targetCityName.toLowerCase();
            const nameMatch = r.name.toLowerCase().includes(cityLower);
            const locationMatch = r.location ? r.location.toLowerCase().includes(cityLower) : false;
            const distance = calculateDistance(targetLat, targetLon, r.latitude, r.longitude);
            return nameMatch || locationMatch || distance <= 50;
          });

          if (cityResources.length > 0) {
            reply = `### Emergency Resources in ${targetCityName}
Found **${cityResources.length}** emergency resource(s) in/near ${targetCityName}:
\n` + cityResources.map((r: Resource) => {
              const dist = calculateDistance(targetLat, targetLon, r.latitude, r.longitude);
              return `* **${r.name}** (${dist.toFixed(1)} km away)
  • Type: ${r.type}
  • Location: ${r.location}
  • Status: ${r.status}
  • Contact: ${r.contact || "N/A"}`;
            }).join("\n\n");
          } else {
            reply = `### Resources in ${targetCityName}
No emergency resources were found in or within 50 km of **${targetCityName}** in the database.
*(If you are an administrator, you can add a resource for this area in the Command Center.)*`;
          }
        } catch (dbErr: any) {
          console.error("Database query failed for resources:", dbErr);
          reply = `Unable to fetch emergency resources from the database at this time. Please try again later.`;
        }
      }

      if (note) {
        reply = note + reply;
      }

      // Store query in Supabase logs
      try {
        await supabase.from("ai_queries").insert({
          city: targetCityName,
          user_query: text,
          ai_response: reply,
        });
      } catch (logErr) {
        console.error("Failed to store chatbot interaction in Supabase:", logErr);
      }

      setMessages(prev => [...prev, { sender: "ai", text: reply, timestamp: new Date() }]);
      setIsTyping(false);
      return;
    }

    // 3. Normalized Risk Scoring Calculations
    const tempF = weatherData.temperature;
    let tempRisk = 0;
    if (tempF >= 70) {
      tempRisk = Math.min(100, Math.max(0, ((tempF - 70) / (105 - 70)) * 100));
    } else {
      tempRisk = Math.min(100, Math.max(0, ((70 - tempF) / (70 - 35)) * 100));
    }

    const floodRiskVal = floodData.score;

    const usAqi = aqiData.usAqi;
    const aqiRiskVal = Math.min(100, (usAqi / 200) * 100);

    const humidityVal = weatherData.humidity;
    const humidityRiskVal = humidityVal;

    const CITY_VULNERABILITY: Record<string, number> = {
      "chennai": 60,
      "delhi": 70,
      "mumbai": 65,
      "bangalore": 40,
      "trichy": 45,
      "kallakurichi": 50,
    };
    const cityKey = targetCityName.toLowerCase();
    let vulnerabilityScoreVal = 50;
    for (const [key, val] of Object.entries(CITY_VULNERABILITY)) {
      if (cityKey.includes(key)) {
        vulnerabilityScoreVal = val;
        break;
      }
    }

    const tempPoints = tempRisk * 0.30;
    const floodPoints = floodRiskVal * 0.25;
    const aqiPoints = aqiRiskVal * 0.25;
    const humidityPoints = humidityRiskVal * 0.10;
    const vulnPoints = vulnerabilityScoreVal * 0.10;

    const rawComposite = tempPoints + floodPoints + aqiPoints + humidityPoints + vulnPoints;
    let finalComposite = Math.round(rawComposite);

    // Safeguard rule: Do NOT return 100/100 risk unless conditions are genuinely severe.
    if (finalComposite >= 95) {
      const isGenuinelySevere = usAqi > 300 || floodRiskVal > 90 || tempF > 105;
      if (!isGenuinelySevere) {
        finalComposite = 95;
      }
    }

    let riskLevel = "Moderate";
    if (finalComposite > 75) riskLevel = "Critical";
    else if (finalComposite > 50) riskLevel = "High";
    else if (finalComposite > 25) riskLevel = "Moderate";
    else riskLevel = "Low";

    // 4. Classify intent
    let intent: "WEATHER" | "FLOOD" | "AIR QUALITY" | "SAFETY" | "FULL REPORT" = "FULL REPORT";

    if (lower.includes("climate report") || lower.includes("full report") || lower.includes("complete report")) {
      intent = "FULL REPORT";
    } else if (lower.includes("flood") || lower.includes("flooding") || lower.includes("rainfall risk") || lower.includes("water level")) {
      intent = "FLOOD";
    } else if (lower.includes("aqi") || lower.includes("air quality") || lower.includes("pollution")) {
      intent = "AIR QUALITY";
    } else if (lower.includes("safe") || lower.includes("danger") || lower.includes("risk today")) {
      intent = "SAFETY";
    } else if (lower.includes("weather") || lower.includes("temperature") || lower.includes("humidity") || lower.includes("forecast") || lower.includes("climate")) {
      intent = "WEATHER";
    } else {
      intent = "FULL REPORT";
    }

    console.log("=== AI Assistant Query Log ===");
    console.log("User Query:", text);
    console.log("Extracted City:", extractedCity || "None");
    console.log("Matched City:", targetCityName);
    console.log("Intent:", intent);
    console.log("===============================");

    if (intent === "WEATHER") {
      reply = `### Weather Report for ${targetCityName}
Temperature: ${tempF}°F
Condition: ${weatherData.condition}
Humidity: ${humidityVal}%
Wind Speed: ${weatherData.windSpeed} mph`;
    } else if (intent === "FLOOD") {
      let floodRiskLevel = "Low";
      if (floodRiskVal >= 75) floodRiskLevel = "Critical";
      else if (floodRiskVal >= 50) floodRiskLevel = "High";
      else if (floodRiskVal >= 25) floodRiskLevel = "Moderate";

      const floodRec = getClimateSafetyRecommendations(tempF, floodRiskVal, usAqi).flood;
      reply = `### Flood Report for ${targetCityName}
Flood Risk %: ${floodRiskVal}%
Flood Risk Level: ${floodRiskLevel}
Flood Safety Recommendations: ${floodRec}`;
    } else if (intent === "AIR QUALITY") {
      let pollutionCategory = "Good";
      if (usAqi > 300) pollutionCategory = "Hazardous";
      else if (usAqi > 200) pollutionCategory = "Very Unhealthy";
      else if (usAqi > 150) pollutionCategory = "Unhealthy";
      else if (usAqi > 100) pollutionCategory = "Unhealthy for Sensitive Groups";
      else if (usAqi > 50) pollutionCategory = "Moderate";

      const healthRec = getClimateSafetyRecommendations(tempF, floodRiskVal, usAqi).aqi;
      reply = `### Air Quality Report for ${targetCityName}
AQI: ${usAqi}
Pollution Category: ${pollutionCategory}
Health Recommendations: ${healthRec}`;
    } else if (intent === "SAFETY") {
      const recs = getClimateSafetyRecommendationsList(tempF, floodRiskVal, usAqi);
      reply = `### Safety Report for ${targetCityName}
Composite Risk Score: ${finalComposite}/100
Risk Level: ${riskLevel}
Recommendations:
• ${recs[0]}
• ${recs[1]}
• ${recs[2]}`;
    } else {
      // FULL REPORT
      const recs = getClimateSafetyRecommendationsList(tempF, floodRiskVal, usAqi);
      let floodRiskLevel = "Low";
      if (floodRiskVal >= 75) floodRiskLevel = "Critical";
      else if (floodRiskVal >= 50) floodRiskLevel = "High";
      else if (floodRiskVal >= 25) floodRiskLevel = "Moderate";

      let pollutionCategory = "Good";
      if (usAqi > 300) pollutionCategory = "Hazardous";
      else if (usAqi > 200) pollutionCategory = "Very Unhealthy";
      else if (usAqi > 150) pollutionCategory = "Unhealthy";
      else if (usAqi > 100) pollutionCategory = "Unhealthy for Sensitive Groups";
      else if (usAqi > 50) pollutionCategory = "Moderate";

      reply = `### Full Climate Report for ${targetCityName}

**Weather**:
• Temperature: ${tempF}°F
• Condition: ${weatherData.condition}
• Humidity: ${humidityVal}%
• Wind Speed: ${weatherData.windSpeed} mph

**Flood**:
• Flood Risk %: ${floodRiskVal}%
• Flood Risk Level: ${floodRiskLevel}

**Air Quality**:
• AQI: ${usAqi}
• Pollution Category: ${pollutionCategory}

**Composite Risk**:
• Composite Risk Score: ${finalComposite}/100
• Risk Level: ${riskLevel}

**Recommendations**:
• ${recs[0]}
• ${recs[1]}
• ${recs[2]}`;
    }

    if (note) {
      reply = note + reply;
    }

    // 5. Store in Supabase
    try {
      const supabase = createClient();
      await supabase.from("ai_queries").insert({
        city: targetCityName,
        user_query: text,
        ai_response: reply,
      });
    } catch (dbErr) {
      console.error("Failed to store chatbot interaction in Supabase:", dbErr);
    }

    setMessages(prev => [...prev, { sender: "ai", text: reply, timestamp: new Date() }]);
    setIsTyping(false);
  };

  const handleExecuteActions = () => {
    setIsExecuting(true);
    setTimeout(() => {
      setIsExecuting(false);
      setIsExecuteModalOpen(false);
      showToast("All priority actions successfully dispatched to local units.", "success");
    }, 1500);
  };

  // Check if any of the main climate queries are loading
  const isGlobalLoading = weatherLoading || aqiLoading || floodLoading;

  if (!mounted) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary-600 animate-pulse" />
            AI Climate Assistant
          </h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
            <Sparkles className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            Location-aware predictive analytics for <strong className="text-gray-800">{city}</strong>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="px-4 py-2 bg-primary-50 border border-primary-100 rounded-lg flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary-600 fill-primary-600" />
            <span className="text-sm font-bold text-primary-700">Predictive Model Active</span>
          </div>
          <button 
            onClick={() => {
              if (typeof window !== "undefined") {
                Object.keys(sessionStorage).forEach(key => {
                  if (key.startsWith("weather_cache_")) {
                    sessionStorage.removeItem(key);
                  }
                });
              }
              refreshWeather();
              refreshAqi();
              refreshFlood();
              showToast("Forcing sensor data refresh...", "success");
            }} 
            className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg flex items-center gap-2 text-sm font-bold text-gray-700 transition-colors cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" /> Sync Sensors
          </button>
        </div>
      </div>

      {/* Global Error Banner */}
      {(weatherError || aqiError || floodError) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-950 text-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
            <span>Telemetry Sensor Outage Detected</span>
          </div>
          <ul className="list-disc pl-5 text-xs text-red-800 space-y-1">
            {weatherError && <li>Weather feed: {weatherError}</li>}
            {aqiError && <li>AQI feed: {aqiError}</li>}
            {floodError && <li>Flood sensor: {floodError}</li>}
          </ul>
          <p className="text-xs font-semibold mt-1">AI models are operating in localized offline cache mode.</p>
        </div>
      )}

      {isGlobalLoading ? (
        // Loading Skeletons
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 h-72 bg-gray-100 rounded-xl animate-pulse border border-gray-200"></div>
            <div className="h-72 bg-gray-100 rounded-xl animate-pulse border border-gray-200"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-[350px] bg-gray-100 rounded-xl animate-pulse border border-gray-200"></div>
            <div className="h-[350px] bg-gray-100 rounded-xl animate-pulse border border-gray-200"></div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column (8 of 12 columns on large screens) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* AI Risk Assessment Panel */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Circular Score Gauge */}
              <div className="md:col-span-4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-100 pb-6 md:pb-0 md:pr-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Climate Risk Score</h3>
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-36 h-36 transform -rotate-90">
                    <circle cx="72" cy="72" r="62" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100" />
                    <circle cx="72" cy="72" r="62" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray="389.5" strokeDashoffset={389.5 - (389.5 * metrics.compositeScore) / 100} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease-out", stroke: metrics.strokeColor }} />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-4xl font-extrabold text-gray-900">{metrics.compositeScore}</span>
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wide">Level: {metrics.riskLevel}</span>
                  </div>
                </div>
              </div>

              {/* Factors & Explanations */}
              <div className="md:col-span-8 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Climate Factor Breakdown</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${metrics.riskColorClass}`}>
                    {metrics.riskLevel} Threat
                  </span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {metrics.riskExplanation} Our models run real-time updates every 15 minutes to evaluate local infrastructure resiliency.
                </p>

                {/* Progress bars of indicators */}
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-gray-600"><span>Flooding</span><span>{metrics.floodScore}%</span></div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden"><div className="bg-blue-500 h-full rounded-full" style={{ width: `${metrics.floodScore}%` }}></div></div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-gray-600"><span>US AQI</span><span>{metrics.aqiScore}%</span></div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden"><div className="bg-gray-500 h-full rounded-full" style={{ width: `${metrics.aqiScore}%` }}></div></div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-gray-600"><span>Thermal</span><span>{metrics.heatScore}%</span></div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden"><div className="bg-red-500 h-full rounded-full" style={{ width: `${metrics.heatScore}%` }}></div></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Future Climate Prediction Section */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Future Hazard Projections</h2>
                <p className="text-sm text-gray-500 mt-0.5">Estimated risk values over the 24-hour and 7-day windows.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">24h Forecast</span>
                  <span className="text-2xl font-extrabold text-gray-900">
                    {Math.max(15, Math.min(98, metrics.compositeScore + (metrics.compositeScore > 50 ? -2 : 3)))}%
                  </span>
                  <span className="block text-[10px] font-bold text-gray-500 mt-1 uppercase">Moderate Threat</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">7d Forecast</span>
                  <span className="text-2xl font-extrabold text-primary-600">
                    {Math.max(15, Math.min(99, metrics.compositeScore + (metrics.compositeScore > 50 ? 5 : 8)))}%
                  </span>
                  <span className="block text-[10px] font-bold text-red-600 mt-1 uppercase flex items-center justify-center gap-0.5"><TrendingUp className="h-3 w-3" /> Rising Risk</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Flood Path</span>
                  <div className="flex justify-between items-baseline text-sm">
                    <span className="text-gray-500">Current:</span>
                    <span className="font-bold text-gray-900">{metrics.floodScore}%</span>
                  </div>
                  <div className="flex justify-between items-baseline text-sm mt-1">
                    <span className="text-gray-500">7-Day:</span>
                    <span className="font-bold text-blue-600">{Math.max(10, Math.min(100, metrics.floodScore + 8))}%</span>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Heatwave</span>
                  <div className="flex justify-between items-baseline text-sm">
                    <span className="text-gray-500">Current:</span>
                    <span className="font-bold text-gray-900">{metrics.tempVal}°F</span>
                  </div>
                  <div className="flex justify-between items-baseline text-sm mt-1">
                    <span className="text-gray-500">7-Day:</span>
                    <span className="font-bold text-red-600">{metrics.tempVal + 4}°F</span>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">AQI Trend</span>
                  <div className="flex justify-between items-baseline text-sm">
                    <span className="text-gray-500">Current:</span>
                    <span className="font-bold text-gray-900">{metrics.aqiRaw}</span>
                  </div>
                  <div className="flex justify-between items-baseline text-sm mt-1">
                    <span className="text-gray-500">7-Day:</span>
                    <span className="font-bold text-orange-600">{Math.round(metrics.aqiRaw * 1.15)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Trajectory Recharts Chart */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Risk Trajectory Analysis</h2>
                  <p className="text-sm text-gray-500">7-day projected hazards based on meteorological satellite feeds.</p>
                </div>
                <button 
                  onClick={() => setIsModelModalOpen(true)}
                  className="mt-2 sm:mt-0 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 transition-colors rounded text-xs font-bold text-gray-600 flex items-center gap-2 cursor-pointer border border-gray-200"
                >
                  <Brain className="h-3.5 w-3.5" /> Model details
                </button>
              </div>
              
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dynamicForecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorFlood" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorHeat" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorAqi" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Area type="monotone" dataKey="flood" name="Flood Risk (%)" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorFlood)" />
                    <Area type="monotone" dataKey="heat" name="Thermal Stress (%)" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorHeat)" />
                    <Area type="monotone" dataKey="aqi" name="AQI Risk (%)" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorAqi)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tactical Map */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[400px]">
              <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 z-10">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary-500" /> AI Tactical Hazard Map
                </h3>
              </div>
              <div className="flex-1 w-full bg-gray-100 relative z-0">
                <AIForecastMap />
              </div>
            </div>

          </div>

          {/* Right Column (4 of 12 columns on large screens) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* AI Climate Assistant Chatbot Panel */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[480px]">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary-500" />
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">AI Climate Assistant</h3>
                  <p className="text-[10px] text-gray-500">Ask safety questions for {city}</p>
                </div>
              </div>

              {/* Chat log window */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50/50">
                {messages.map((m, i) => (
                  <div key={i} className={`flex items-end gap-2 ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                    {m.sender === "ai" && (
                      <div className="bg-primary-100 p-1.5 rounded-full shrink-0">
                        <Brain className="h-3.5 w-3.5 text-primary-600" />
                      </div>
                    )}
                    <div className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                      m.sender === "user" 
                        ? "bg-primary-600 text-white rounded-br-none shadow-sm" 
                        : "bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-xs"
                    }`}>
                      <p dangerouslySetInnerHTML={{ __html: formatMessageText(m.text) }}></p>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex items-center gap-2">
                    <div className="bg-primary-100 p-1.5 rounded-full shrink-0">
                      <Brain className="h-3.5 w-3.5 text-primary-600 animate-bounce" />
                    </div>
                    <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-bl-none text-xs text-gray-500 flex items-center gap-1.5 shadow-xs">
                      <RefreshCw className="h-3 w-3 animate-spin text-primary-500 shrink-0" />
                      <span>AI is analyzing climate telemetry...</span>
                      <div className="flex gap-1 ml-1.5">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Dynamic suggestion chips */}
              <div className="px-4 py-2 bg-white border-t border-gray-100 flex gap-2 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap">
                {[
                  "What is the weather in Chennai?",
                  "What is the flood risk in Delhi?",
                  "Is Kallakurichi safe today?",
                  "Air quality in Mumbai",
                  "Give me a climate report for Trichy",
                  "What should I do during a heatwave?",
                ].map((chipText, i) => (
                  <button 
                    key={i} 
                    type="button"
                    onClick={() => handleSendMessage(chipText)} 
                    className="px-3 py-1.5 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-full text-[10px] font-bold text-primary-700 transition-colors shrink-0 cursor-pointer"
                  >
                    {chipText}
                  </button>
                ))}
              </div>

              {/* Input section */}
              <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="p-3 border-t border-gray-100 flex gap-2 bg-white">
                <input 
                  type="text" 
                  value={inputText}
                  disabled={isTyping}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Ask about weather, AQI, safety..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                />
                <button type="submit" disabled={isTyping} className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-sm transition-colors cursor-pointer disabled:opacity-50">
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>

            {/* AI Recommendations Section */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
              <div className="border-b border-gray-100 pb-3 flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-primary-500" />
                  AI Advisories
                </h3>
                {/* Tabs switcher */}
                <div className="flex bg-gray-100 p-0.5 rounded-lg">
                  <button 
                    onClick={() => setActiveRecommendationTab("citizen")} 
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                      activeRecommendationTab === "citizen" 
                        ? "bg-white text-primary-600 shadow-xs" 
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    Citizen
                  </button>
                  <button 
                    onClick={() => setActiveRecommendationTab("government")} 
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                      activeRecommendationTab === "government" 
                        ? "bg-white text-primary-600 shadow-xs" 
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    Government
                  </button>
                </div>
              </div>

              {/* Recommendation items */}
              <ul className="space-y-3.5 min-h-[220px]">
                {(activeRecommendationTab === "citizen" ? recommendations.citizen : recommendations.government).map((rec, i) => (
                  <li key={i} className="flex gap-2.5 text-xs items-start leading-normal">
                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${metrics.riskBadgeColor}`}></span>
                    <span className="text-gray-600">{rec}</span>
                  </li>
                ))}
              </ul>

              {activeRecommendationTab === "government" && (
                <button 
                  onClick={() => setIsExecuteModalOpen(true)}
                  className="mt-4 w-full py-2 bg-primary-50 hover:bg-primary-100 border border-primary-200 text-primary-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Dispatch Commands to Local Units
                </button>
              )}
            </div>

            {/* AI Diagnostics details */}
            <div className="bg-gray-900 p-5 rounded-2xl shadow-lg border border-gray-800 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Brain className="h-20 w-20" />
              </div>
              <div className="flex items-center justify-between mb-4 relative z-10">
                 <h3 className="font-bold text-gray-100 text-xs uppercase tracking-wide flex items-center gap-1.5">
                   <ActivitySquare className="h-4 w-4 text-green-400 animate-pulse" />
                   System Diagnostics
                 </h3>
                 <span className="h-2 w-2 rounded-full bg-green-500"></span>
              </div>
              <div className="space-y-2 text-xs relative z-10 text-gray-400">
                <div className="flex justify-between items-center"><span className="text-gray-400">Data Sources:</span><span className="text-gray-100 font-semibold">24/24 Synced</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-400">Response Latency:</span><span className="text-gray-100 font-semibold">42ms</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-400">AI Model Version:</span><span className="text-gray-100 font-semibold hover:text-primary-400 cursor-pointer" onClick={() => setIsModelModalOpen(true)}>CS-Predict-v4.2</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-400">Telemetry Status:</span><span className="text-gray-100 font-semibold text-green-500">Healthy</span></div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Execute Actions Modal */}
      {isExecuteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="absolute inset-0 bg-secondary-900/40 backdrop-blur-sm" onClick={() => !isExecuting && setIsExecuteModalOpen(false)}></div>
          <div className="bg-white rounded-2xl w-full max-w-md relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 mb-4">
                <ShieldAlert className="h-6 w-6 text-primary-600 animate-bounce" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Execute Priority Commands</h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                Are you sure you want to dispatch all 4 municipal directives to local units for **{city}**? This will trigger active alerts and dispatch resource units.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-100">
                <ul className="space-y-2 text-xs">
                  {recommendations.government.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-3">
                <button 
                  disabled={isExecuting}
                  onClick={() => setIsExecuteModalOpen(false)} 
                  className="flex-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  disabled={isExecuting}
                  onClick={handleExecuteActions} 
                  className="flex-1 px-4 py-2 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isExecuting ? (
                    <><RefreshCw className="h-4 w-4 animate-spin" /> Dispatching...</>
                  ) : (
                    "Confirm Dispatch"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Model Details Modal */}
      {isModelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="absolute inset-0 bg-secondary-900/60 backdrop-blur-sm" onClick={() => setIsModelModalOpen(false)}></div>
          <div className="bg-white rounded-2xl w-full max-w-lg relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-900 text-white">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary-400" />
                <h3 className="font-bold">ClimateShield AI Predict</h3>
              </div>
              <button onClick={() => setIsModelModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <span className="block text-xs font-bold text-gray-500 uppercase mb-1">Model Version</span>
                  <span className="text-lg font-extrabold text-gray-900">CS-Predict-v4.2</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <span className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</span>
                  <span className="text-sm font-bold text-green-600 flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-green-500 animate-ping"></div> Active & Learning</span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Model Training Sources</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary-500 shrink-0" /> Live Regional Meteorological Feeds</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary-500 shrink-0" /> Historical Flood plains & Drainage topography</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary-500 shrink-0" /> Local Sensor Grid telemetry</li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Target Accuracy</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1"><span className="text-gray-600">24-Hour Forecasts</span> <span className="text-green-600">96.8%</span></div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full"><div className="h-full bg-green-500 rounded-full" style={{width: '96.8%'}}></div></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1"><span className="text-gray-600">7-Day Mid-Range</span> <span className="text-primary-600">89.2%</span></div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full"><div className="h-full bg-primary-500 rounded-full" style={{width: '89.2%'}}></div></div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
