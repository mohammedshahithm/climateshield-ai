"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { 
  Brain, TrendingUp, Sparkles, AlertTriangle, 
  ThermometerSun, Droplets, Wind, ActivitySquare,
  ShieldAlert, Zap, MapPin, X, CheckCircle2, RefreshCw, BarChart2, MessageSquare, CloudRain, Activity, Leaf
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { useAlerts } from "@/lib/AlertsContext";

// Map needs to be loaded dynamically to avoid SSR window errors
const AIForecastMap = dynamic(() => import("@/components/maps/AIForecastMap"), { 
  ssr: false,
  loading: () => <div className="h-full w-full min-h-[400px] bg-gray-50 rounded-xl animate-pulse flex items-center justify-center border border-gray-100 text-gray-400 font-medium">Initializing AI Map Engine...</div>
});

// Mock Analytics Data
const forecastData = [
  { day: 'Today', flood: 32, heat: 45, aqi: 75, infra: 40 },
  { day: '+1 Day', flood: 38, heat: 52, aqi: 80, infra: 45 },
  { day: '+2 Days', flood: 45, heat: 58, aqi: 85, infra: 50 },
  { day: '+3 Days', flood: 52, heat: 65, aqi: 92, infra: 55 },
  { day: '+5 Days', flood: 55, heat: 68, aqi: 98, infra: 58 },
  { day: '+7 Days', flood: 58, heat: 72, aqi: 102, infra: 63 },
];

export default function AiIntelligencePage() {
  const { showToast } = useAlerts();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeInsightIndex, setActiveInsightIndex] = useState(0);

  const [isExecuteModalOpen, setIsExecuteModalOpen] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  const insights = [
    "Heavy rainfall patterns combined with saturated soil conditions increase localized flood probability in Velachery.",
    "Heat stress indicators suggest elevated risk for elderly populations over the next 72 hours.",
    "Power infrastructure may experience increased outage risk due to projected storm activity.",
    "Air quality indices show moderate deterioration expected near industrial corridors by weekend."
  ];

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    // Simulate loading AI models
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    // Rotate insights
    const interval = setInterval(() => {
      setActiveInsightIndex((prev) => (prev + 1) % insights.length);
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [insights.length]);

  const handleExecuteActions = () => {
    setIsExecuting(true);
    setTimeout(() => {
      setIsExecuting(false);
      setIsExecuteModalOpen(false);
      showToast("All Priority Actions Successfully Executed", "success");
    }, 2000);
  };

  if (!mounted) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary-600" />
            AI Climate Intelligence Center
          </h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            Predictive climate analytics powered by ClimateShield AI
          </p>
        </div>
        <div className="px-4 py-2 bg-primary-50 border border-primary-100 rounded-lg flex items-center gap-2" title="AI Model is actively crunching 24 live data sources">
          <Zap className="h-4 w-4 text-primary-600 fill-primary-600 animate-pulse" />
          <span className="text-sm font-bold text-primary-700">Live Prediction Engine Active</span>
        </div>
      </div>

      {isLoading ? (
        // Loading Skeletons
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse"></div>)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-72 bg-gray-100 rounded-xl animate-pulse"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-48 bg-gray-100 rounded-xl animate-pulse"></div>
                <div className="h-48 bg-gray-100 rounded-xl animate-pulse"></div>
              </div>
              <div className="h-[400px] bg-gray-100 rounded-xl animate-pulse"></div>
            </div>
            <div className="space-y-6">
              <div className="h-96 bg-gray-100 rounded-xl animate-pulse"></div>
              <div className="h-64 bg-gray-100 rounded-xl animate-pulse"></div>
              <div className="h-48 bg-gray-100 rounded-xl animate-pulse"></div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* AI Risk Forecast Panel (4 Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Flood */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-colors">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Droplets className="h-5 w-5" /></div>
                <span className="text-[10px] font-bold px-2 py-1 bg-gray-100 text-gray-600 rounded uppercase cursor-help" title="Calculated based on soil saturation and drainage capacity data.">Confidence: 89%</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-4 relative z-10">Flood Risk Forecast</h3>
              <div className="space-y-2 text-sm relative z-10">
                <div className="flex justify-between items-center"><span className="text-gray-500">Current:</span><span className="font-bold text-gray-900">32%</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-500">Predicted (7 Days):</span><span className="font-bold text-blue-600">58%</span></div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100"><span className="text-gray-500">Trend:</span><span className="font-bold text-red-500 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Increasing</span></div>
              </div>
            </div>

            {/* Heatwave */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-red-300 transition-colors">
              <div className="absolute top-0 right-0 w-20 h-20 bg-red-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="p-2 bg-red-100 text-red-600 rounded-lg"><ThermometerSun className="h-5 w-5" /></div>
                <span className="text-[10px] font-bold px-2 py-1 bg-gray-100 text-gray-600 rounded uppercase cursor-help" title="Derived from high-pressure system models over the next 120 hrs.">Confidence: 92%</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-4 relative z-10">Heatwave Forecast</h3>
              <div className="space-y-2 text-sm relative z-10">
                <div className="flex justify-between items-center"><span className="text-gray-500">Current:</span><span className="font-bold text-gray-900">45%</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-500">Predicted (7 Days):</span><span className="font-bold text-red-600">72%</span></div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100"><span className="text-gray-500">Trend:</span><span className="font-bold text-red-500 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Increasing</span></div>
              </div>
            </div>

            {/* AQI */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-gray-300 transition-colors">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gray-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="p-2 bg-gray-100 text-gray-600 rounded-lg"><Wind className="h-5 w-5" /></div>
                <span className="text-[10px] font-bold px-2 py-1 bg-gray-100 text-gray-600 rounded uppercase cursor-help" title="Wind patterns combined with industrial emission rates.">Confidence: 85%</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-4 relative z-10">Air Quality Forecast</h3>
              <div className="space-y-2 text-sm relative z-10">
                <div className="flex justify-between items-center"><span className="text-gray-500">Current AQI:</span><span className="font-bold text-gray-900">75</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-500">Predicted AQI:</span><span className="font-bold text-orange-500">102</span></div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100"><span className="text-gray-500">Trend:</span><span className="font-bold text-orange-500 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Deteriorating</span></div>
              </div>
            </div>

            {/* Infrastructure */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-purple-300 transition-colors">
              <div className="absolute top-0 right-0 w-20 h-20 bg-purple-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><ActivitySquare className="h-5 w-5" /></div>
                <span className="text-[10px] font-bold px-2 py-1 bg-gray-100 text-gray-600 rounded uppercase cursor-help" title="Predicts grid strain and substation flood risk.">Confidence: 87%</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-4 relative z-10">Infrastructure Stress</h3>
              <div className="space-y-2 text-sm relative z-10">
                <div className="flex justify-between items-center"><span className="text-gray-500">Current:</span><span className="font-bold text-gray-900">40%</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-500">Predicted (7 Days):</span><span className="font-bold text-purple-600">63%</span></div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100"><span className="text-gray-500">Trend:</span><span className="font-bold text-red-500 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Increasing</span></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column (2/3 width on LG) */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* Main Charts Section */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Predicted Risk Trajectory</h2>
                    <p className="text-sm text-gray-500">AI forecasted risk levels across key metrics (Next 7 Days)</p>
                  </div>
                  <button 
                    onClick={() => setIsModelModalOpen(true)}
                    className="mt-2 sm:mt-0 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 transition-colors rounded text-xs font-bold text-gray-600 flex items-center gap-2 cursor-pointer"
                  >
                    <Brain className="h-3.5 w-3.5" /> Model: CS-Predict-v4.2
                  </button>
                </div>
                
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorFlood" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorHeat" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Area type="monotone" dataKey="flood" name="Flood Risk" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorFlood)" />
                      <Area type="monotone" dataKey="heat" name="Heat Risk" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorHeat)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* AI Insights Panel */}
                <div className="bg-gradient-to-br from-primary-900 to-primary-950 p-6 rounded-xl shadow-lg border border-primary-800 text-white relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 opacity-10">
                    <Brain className="w-32 h-32 -mr-8 -mt-8" />
                  </div>
                  <div>
                    <h3 className="font-bold flex items-center gap-2 mb-4 text-primary-100">
                      <Sparkles className="h-5 w-5 text-yellow-400" />
                      ClimateShield AI Insights
                    </h3>
                    <div className="min-h-[80px] flex items-center">
                      <p className="text-primary-50 text-sm leading-relaxed transition-opacity duration-300">
                        &quot;{insights[activeInsightIndex]}&quot;
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 mt-6">
                    {insights.map((_, idx) => (
                      <div key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${idx === activeInsightIndex ? 'w-6 bg-primary-400' : 'w-2 bg-primary-800'}`}></div>
                    ))}
                  </div>
                </div>

                {/* AI Recommendations */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-primary-600" />
                    Priority Actions
                  </h3>
                  <ul className="space-y-3 flex-1">
                    <li className="flex gap-3 text-sm items-start" title="Critical Priority">
                      <span className="mt-0.5 w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
                      <span className="text-gray-700">Deploy additional water tankers to Zone 4 immediately.</span>
                    </li>
                    <li className="flex gap-3 text-sm items-start" title="High Priority">
                      <span className="mt-0.5 w-2 h-2 rounded-full bg-orange-500 shrink-0"></span>
                      <span className="text-gray-700">Prepare emergency shelters in flood-prone areas.</span>
                    </li>
                    <li className="flex gap-3 text-sm items-start" title="High Priority">
                      <span className="mt-0.5 w-2 h-2 rounded-full bg-orange-500 shrink-0"></span>
                      <span className="text-gray-700">Increase cooling center capacity by 15%.</span>
                    </li>
                    <li className="flex gap-3 text-sm items-start" title="Moderate Priority">
                      <span className="mt-0.5 w-2 h-2 rounded-full bg-yellow-500 shrink-0"></span>
                      <span className="text-gray-700">Position rescue units near high-risk locations.</span>
                    </li>
                  </ul>
                  <button 
                    onClick={() => setIsExecuteModalOpen(true)}
                    className="mt-4 w-full py-2 text-sm font-bold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors border border-primary-200"
                  >
                    Execute All Approved Actions
                  </button>
                </div>
              </div>

              {/* AI Forecast Map */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[400px]">
                 <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 z-10">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary-500" /> AI Spatial Forecast
                  </h3>
                  <div className="flex items-center gap-3 text-xs font-medium text-gray-500">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Critical</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500"></span> High</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Moderate</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Low</span>
                  </div>
                </div>
                <div className="flex-1 w-full bg-gray-100 relative z-0">
                  <AIForecastMap />
                </div>
              </div>

            </div>

            {/* Right Column (1/3 width on LG) */}
            <div className="flex flex-col gap-6">
              
              {/* Future Vulnerability Score */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center relative overflow-hidden" title="Composite score combining all forecasted hazard metrics">
                <h3 className="font-bold text-gray-500 uppercase tracking-wider text-xs mb-6 cursor-help">Future Vulnerability Score</h3>
                
                <div className="relative inline-flex items-center justify-center mb-6">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100" />
                    <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray="351.8" strokeDashoffset={351.8 - (351.8 * 45) / 100} className="text-primary-500 transition-all duration-1000 ease-out" />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-3xl font-extrabold text-gray-900">45</span>
                    <span className="text-xs text-gray-500 font-medium">/ 100</span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-6 font-medium">Current Risk Level: Moderate</p>

                <div className="bg-gray-50 rounded-lg p-4 text-left border border-gray-100">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Predicted Trajectory</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center group cursor-help" title="Model projection assuming current meteorological data holds.">
                      <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">7 Days:</span>
                      <span className="text-sm font-bold text-orange-600 flex items-center gap-1">58 <TrendingUp className="h-3 w-3" /></span>
                    </div>
                    <div className="flex justify-between items-center group cursor-help" title="Medium-range extrapolation.">
                      <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">30 Days:</span>
                      <span className="text-sm font-bold text-orange-600 flex items-center gap-1">67 <TrendingUp className="h-3 w-3" /></span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200 group cursor-help" title="Long-term systemic risk estimation.">
                      <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">90 Days:</span>
                      <span className="text-sm font-bold text-red-600 flex items-center gap-1">72 <TrendingUp className="h-3 w-3" /></span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 py-2 bg-red-50 text-red-700 text-sm font-bold rounded-lg border border-red-100 flex items-center justify-center gap-2 shadow-sm">
                  <AlertTriangle className="h-4 w-4" /> ↑ Rising Risk Detected
                </div>
              </div>

              {/* Emergency Impact Estimator */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                  <ActivitySquare className="h-4 w-4 text-primary-600" />
                  Projected Impact (7 Days)
                </h3>
                <div className="space-y-5">
                  <div className="group cursor-help" title="Total population inside the projected Critical and High risk zones.">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 font-medium group-hover:text-gray-900 transition-colors">Citizens at Risk</span>
                      <span className="font-bold text-gray-900">12,450</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden"><div className="bg-red-500 h-full rounded-full animate-in slide-in-from-left duration-1000" style={{ width: '65%' }}></div></div>
                  </div>
                  <div className="group cursor-help" title="Number of citizens requiring structured relocation assistance.">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 font-medium group-hover:text-gray-900 transition-colors">Possible Evacuations</span>
                      <span className="font-bold text-gray-900">1,240</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden"><div className="bg-orange-500 h-full rounded-full animate-in slide-in-from-left duration-1000 delay-150" style={{ width: '45%' }}></div></div>
                  </div>
                  <div className="group cursor-help" title="Projected percentage increase in shelter beds over next week.">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 font-medium group-hover:text-gray-900 transition-colors">Shelter Demand</span>
                      <span className="font-bold text-red-500">+18%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden"><div className="bg-blue-500 h-full rounded-full animate-in slide-in-from-left duration-1000 delay-300" style={{ width: '75%' }}></div></div>
                  </div>
                  <div className="group cursor-help" title="Increase in logistical consumption (water, food, medical).">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 font-medium group-hover:text-gray-900 transition-colors">Resource Demand</span>
                      <span className="font-bold text-red-500">+23%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden"><div className="bg-purple-500 h-full rounded-full animate-in slide-in-from-left duration-1000 delay-500" style={{ width: '85%' }}></div></div>
                  </div>
                </div>
              </div>

              {/* AI Engine Status */}
              <div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-800 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Brain className="h-24 w-24" />
                </div>
                <div className="flex items-center justify-between mb-4 relative z-10">
                   <h3 className="font-bold text-gray-100 flex items-center gap-2">
                     <ActivitySquare className="h-5 w-5 text-green-400" />
                     System Diagnostics
                   </h3>
                   <span className="flex h-3 w-3 relative">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                   </span>
                </div>
                <div className="space-y-3 text-sm relative z-10">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-800">
                    <span className="text-gray-400">Data Sources</span>
                    <span className="text-gray-100 font-medium text-xs">24/24 Synced</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-gray-800">
                    <span className="text-gray-400">Processing Latency</span>
                    <span className="text-gray-100 font-medium text-xs">42ms</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-gray-800">
                    <span className="text-gray-400">Model Version</span>
                    <span className="text-gray-100 font-medium text-xs hover:text-primary-400 cursor-pointer transition-colors" onClick={() => setIsModelModalOpen(true)}>CS-Predict-v4.2</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Last Update</span>
                    <span className="text-gray-100 font-medium text-xs">Just Now</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </>
      )}

      {/* Execute Actions Modal */}
      {isExecuteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-secondary-900/40 backdrop-blur-sm" onClick={() => !isExecuting && setIsExecuteModalOpen(false)}></div>
          <div className="bg-white rounded-2xl w-full max-w-md relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 mb-4">
                <ShieldAlert className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Execute Priority Actions</h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                Are you sure you want to execute all 4 priority recommendations? This will dispatch resources and generate active incident logs.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-100">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Dispatch Water Tankers</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Alert Shelters</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Notify Cooling Centers</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Move Rescue Units</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button 
                  disabled={isExecuting}
                  onClick={() => setIsExecuteModalOpen(false)} 
                  className="flex-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  disabled={isExecuting}
                  onClick={handleExecuteActions} 
                  className="flex-1 px-4 py-2 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isExecuting ? (
                    <><RefreshCw className="h-4 w-4 animate-spin" /> Executing...</>
                  ) : (
                    "Confirm Execution"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Model Details Modal */}
      {isModelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
                  <span className="text-sm font-bold text-green-600 flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-green-500"></div> Active & Learning</span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Training Data Streams</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary-500 shrink-0" /> Local Meteorological Radars (Live)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary-500 shrink-0" /> Historical Flood Plains (1990-2025)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary-500 shrink-0" /> Municipal Infrastructure Topography</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary-500 shrink-0" /> Population Density Census Data</li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Global Confidence Metrics</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1"><span className="text-gray-600">Short-Term Forecasts (24h)</span> <span className="text-green-600">96%</span></div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full"><div className="h-full bg-green-500 rounded-full" style={{width: '96%'}}></div></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1"><span className="text-gray-600">Mid-Term Forecasts (7 Days)</span> <span className="text-primary-600">89%</span></div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full"><div className="h-full bg-primary-500 rounded-full" style={{width: '89%'}}></div></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1"><span className="text-gray-600">Long-Term Extrapolations (30d+)</span> <span className="text-orange-500">74%</span></div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full"><div className="h-full bg-orange-500 rounded-full" style={{width: '74%'}}></div></div>
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
