"use client";

import { useState, useEffect, useRef } from "react";
import { 
  ClipboardList, ArrowRight, ArrowLeft, AlertTriangle, CheckCircle2,
  ShieldAlert, ShieldCheck, Download, Droplets, ThermometerSun, 
  ActivitySquare, HeartPulse, CheckSquare, FileText, MapPin, Sparkles, Loader2
} from "lucide-react";

type AssessmentData = {
  city: string;
  area: string;
  pincode: string;
  houseType: string;
  floodProtection: boolean;
  waterAccess: string;
  electricityAccess: string;
  familySize: string;
  elderlyMembers: boolean;
  childrenUnder5: boolean;
  disabledMembers: boolean;
  floodingHistory: boolean;
  heatwaveExposure: boolean;
  airQualityIssues: boolean;
};

const initialData: AssessmentData = {
  city: "",
  area: "",
  pincode: "",
  houseType: "Concrete",
  floodProtection: false,
  waterAccess: "Good",
  electricityAccess: "Good",
  familySize: "1",
  elderlyMembers: false,
  childrenUnder5: false,
  disabledMembers: false,
  floodingHistory: false,
  heatwaveExposure: false,
  airQualityIssues: false,
};

type ChecklistState = {
  kit: boolean;
  water: boolean;
  shelter: boolean;
  contacts: boolean;
};

export default function AssessmentPage() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<AssessmentData>(initialData);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  // Checklist State & Persistence
  const [checklist, setChecklist] = useState<ChecklistState>({
    kit: false, water: false, shelter: false, contacts: false
  });
  
  const reportRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{title: string, error?: boolean} | null>(null);

  const showToast = (title: string, error: boolean = false) => {
    setToastMessage({ title, error });
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
    const savedChecklist = localStorage.getItem("climateshield_checklist");
    if (savedChecklist) {
      try {
        setChecklist(JSON.parse(savedChecklist));
      } catch {
        console.error("Failed to parse checklist state");
      }
    }
  }, []);

  const updateChecklist = (key: keyof ChecklistState, value: boolean) => {
    const updated = { ...checklist, [key]: value };
    setChecklist(updated);
    localStorage.setItem("climateshield_checklist", JSON.stringify(updated));
  };

  const completedTasks = Object.values(checklist).filter(Boolean).length;
  const progressPercent = (completedTasks / 4) * 100;

  const updateData = (fields: Partial<AssessmentData>) => {
    setData((prev) => ({ ...prev, ...fields }));
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, 5));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  // Dynamic Scoring Engine (Total 100)
  const calculateScores = () => {
    let flood = 0;
    if (data.houseType === "Temporary") flood += 10;
    if (data.floodingHistory) flood += 15;
    if (data.floodProtection) flood = Math.max(0, flood - 5);
    
    let heat = 0;
    if (data.heatwaveExposure) heat += 25;
    
    let infra = 0;
    if (data.waterAccess === "Poor") infra += 12.5;
    if (data.electricityAccess === "Poor") infra += 12.5;
    
    let demo = 0;
    if (data.elderlyMembers) demo += 8;
    if (data.childrenUnder5) demo += 8;
    if (data.disabledMembers) demo += 9;
    
    const total = flood + heat + infra + demo;
    return { flood, heat, infra, demo, total };
  };

  const scores = calculateScores();
  
  let riskCategory = "Low";
  let riskColor = "text-green-600";
  let riskStroke = "text-green-500";
  let riskBadgeColor = "bg-green-500 text-white";
  
  if (scores.total >= 26 && scores.total <= 50) {
    riskCategory = "Moderate";
    riskColor = "text-yellow-600";
    riskStroke = "text-yellow-500";
    riskBadgeColor = "bg-yellow-500 text-white";
  } else if (scores.total >= 51 && scores.total <= 75) {
    riskCategory = "High";
    riskColor = "text-orange-600";
    riskStroke = "text-orange-500";
    riskBadgeColor = "bg-orange-500 text-white";
  } else if (scores.total > 75) {
    riskCategory = "Critical";
    riskColor = "text-red-600";
    riskStroke = "text-red-500";
    riskBadgeColor = "bg-red-600 text-white";
  }

  // Dynamic AI Insight
  const generateInsight = () => {
    let insight = "";
    if (scores.flood >= 15) {
      insight += "Your area shows elevated flood exposure due to historical flood patterns and infrastructure limitations. ";
    }
    if (scores.heat >= 25) {
      insight += "Extreme heat events may impact vulnerable household members. ";
    }
    if (scores.infra >= 12.5) {
      insight += "Utility reliability issues increase emergency vulnerability. ";
    }
    if (scores.demo >= 15) {
      insight += "Household demographic composition requires targeted evacuation planning. ";
    }
    if (insight === "") {
      insight = "Your household demonstrates strong resilience metrics. Maintain baseline preparedness and monitor local alerts.";
    }
    return insight.trim();
  };

  const getBadgeColor = (val: number, max: number) => {
    const ratio = val / max;
    if (ratio >= 0.75) return "bg-red-100 text-red-800";
    if (ratio >= 0.5) return "bg-orange-100 text-orange-800";
    if (ratio > 0) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  const getRecommendations = () => {
    const recs = [];
    if (data.houseType === "Temporary") {
       recs.push({ title: "Housing", text: "Identify designated concrete storm shelters in your immediate vicinity." });
    }
    if (data.floodingHistory) {
       recs.push({ title: "Flooding", text: "Invest in robust flood barriers and elevate essential appliances above ground level." });
    }
    if (data.waterAccess === "Poor" || data.electricityAccess === "Poor") {
       recs.push({ title: "Infrastructure", text: "Secure backup battery systems and power banks. Consider solar alternatives." });
    }
    if (data.elderlyMembers || data.disabledMembers || data.childrenUnder5) {
       recs.push({ title: "Assistance", text: "Register with local emergency services for prioritized evacuation assistance for vulnerable members." });
    }
    if (data.heatwaveExposure) {
       recs.push({ title: "Heat", text: "Ensure access to cooling centers and invest in reflective window treatments or blackout curtains." });
    }
    return recs;
  };

  const downloadPDF = async () => {
    setIsDownloading(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      const primaryColor: [number, number, number] = [5, 150, 105];
      const textColor: [number, number, number] = [55, 65, 81];
      const lightGray: [number, number, number] = [107, 114, 128];
      
      let cursorY = 20;

      // Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.setTextColor(...primaryColor);
      doc.text("ClimateShield AI", 14, cursorY);
      cursorY += 8;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(...lightGray);
      doc.text("Government-Grade Climate Vulnerability Assessment", 14, cursorY);
      cursorY += 12;
      
      // Meta Information
      doc.setFontSize(10);
      doc.setTextColor(...textColor);
      const now = new Date();
      const dateStr = now.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
      const timeStr = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      
      let locationStr = "Not specified";
      if (data.city || data.area) {
         locationStr = `${data.area ? data.area + ", " : ""}${data.city || ""}`;
         if (data.pincode) locationStr += ` - ${data.pincode}`;
      } else {
         locationStr = "Saravanampatti, Coimbatore";
      }

      doc.text(`Assessment Date: ${dateStr}`, 14, cursorY); cursorY += 6;
      doc.text(`Assessment Time: ${timeStr}`, 14, cursorY); cursorY += 6;
      doc.text(`User Location: ${locationStr}`, 14, cursorY); cursorY += 14;

      // Professional Summary Section
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, cursorY, pageWidth - 28, 45, 3, 3, "FD");
      
      cursorY += 10;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...textColor);
      doc.text("Vulnerability Score:", 20, cursorY);
      
      doc.setFontSize(28);
      if(riskCategory === "Low") doc.setTextColor(22, 163, 74);
      else if(riskCategory === "Moderate") doc.setTextColor(202, 138, 4);
      else if(riskCategory === "High") doc.setTextColor(234, 88, 12);
      else doc.setTextColor(220, 38, 38);
      doc.text(`${scores.total} / 100`, 20, cursorY + 12);
      
      doc.setFontSize(12);
      doc.setTextColor(...textColor);
      doc.text("Risk Category:", 90, cursorY);
      doc.setFont("helvetica", "bold");
      doc.text(riskCategory.toUpperCase() + " RISK", 90, cursorY + 8);
      
      doc.setFont("helvetica", "normal");
      doc.text("Emergency Priority:", 150, cursorY);
      doc.setFont("helvetica", "bold");
      doc.text(riskCategory.toUpperCase(), 150, cursorY + 8);
      
      cursorY += 45;

      // Risk Breakdown Table
      doc.setFontSize(14);
      doc.setTextColor(...primaryColor);
      doc.text("Risk Breakdown", 14, cursorY);
      
      autoTable(doc, {
        startY: cursorY + 4,
        head: [['Category', 'Score', 'Percentage']],
        body: [
          ['Flood Risk', `${scores.flood} / 25`, `${(scores.flood / 25) * 100}%`],
          ['Heat Risk', `${scores.heat} / 25`, `${(scores.heat / 25) * 100}%`],
          ['Infrastructure Risk', `${scores.infra} / 25`, `${(scores.infra / 25) * 100}%`],
          ['Demographic Risk', `${scores.demo} / 25`, `${(scores.demo / 25) * 100}%`],
        ],
        foot: [['Total', `${scores.total} / 100`, `${scores.total}%`]],
        theme: 'grid',
        headStyles: { fillColor: primaryColor },
        footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42] }
      });
      
      cursorY = (doc as any).lastAutoTable.finalY + 15;

      // AI Insight Section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(...primaryColor);
      doc.text("AI Insight", 14, cursorY);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(...textColor);
      const splitInsight = doc.splitTextToSize(generateInsight(), pageWidth - 28);
      doc.text(splitInsight, 14, cursorY + 8);
      cursorY += 8 + (splitInsight.length * 6) + 6;

      // Personalized Recommendations Section
      const recommendations = getRecommendations();
      if (cursorY > pageHeight - 60) { doc.addPage(); cursorY = 20; }
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(...primaryColor);
      doc.text("Personalized Recommendations", 14, cursorY);
      cursorY += 8;

      doc.setFontSize(11);
      if (recommendations.length === 0) {
         doc.setFont("helvetica", "normal");
         doc.setTextColor(...textColor);
         doc.text("Maintain your current resilience standards. No critical actions needed.", 14, cursorY);
         cursorY += 10;
      } else {
         recommendations.forEach(rec => {
           if (cursorY > pageHeight - 30) { doc.addPage(); cursorY = 20; }
           doc.setFont("helvetica", "bold");
           doc.setTextColor(...textColor);
           doc.text(`${rec.title}:`, 14, cursorY);
           doc.setFont("helvetica", "normal");
           const splitText = doc.splitTextToSize(rec.text, pageWidth - 28);
           doc.text(splitText, 14, cursorY + 6);
           cursorY += 6 + (splitText.length * 6) + 4;
         });
      }

      // Preparedness Checklist
      if (cursorY > pageHeight - 60) { doc.addPage(); cursorY = 20; }
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(...primaryColor);
      doc.text("Preparedness Checklist", 14, cursorY);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...lightGray);
      doc.text(`${progressPercent.toFixed(0)}% Completed`, 150, cursorY);
      cursorY += 10;
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...textColor);
      doc.text("Status", 14, cursorY);
      doc.text("Item", 50, cursorY);
      cursorY += 8;
      
      const drawCheckItem = (checked: boolean, title: string) => {
        if (cursorY > pageHeight - 30) { doc.addPage(); cursorY = 20; }
        
        doc.setFont("helvetica", "bold");
        if (checked) {
          doc.setTextColor(22, 163, 74);
          doc.text("[COMPLETED]", 14, cursorY);
        } else {
          doc.setTextColor(234, 88, 12);
          doc.text("[PENDING]", 14, cursorY);
        }
        
        doc.setFont("helvetica", checked ? "bold" : "normal");
        doc.setTextColor(...textColor);
        doc.text(title, 50, cursorY);
        cursorY += 8;
      };
      
      drawCheckItem(checklist.kit, "Emergency Kit (72-hour go-bag)");
      drawCheckItem(checklist.water, "Water Storage (1 gal/person/day)");
      drawCheckItem(checklist.shelter, "Shelter Awareness (Identified safe zones)");
      drawCheckItem(checklist.contacts, "Emergency Contacts (Saved local numbers)");

      const pageCount = (doc as any).internal.getNumberOfPages();
      for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(156, 163, 175);
        doc.text("Generated by ClimateShield AI", 14, pageHeight - 12);
        doc.text("AI x City Climate Action Hackathon 2026", 14, pageHeight - 8);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 25, pageHeight - 12);
      }
      
      doc.save("ClimateShield_Assessment_Report.pdf");
      showToast("Report downloaded successfully!");
      
    } catch (err) {
      console.error("PDF generation failed", err);
      showToast("Failed to generate PDF. Please try again.", true);
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isClient) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 relative">
      {toastMessage && (
        <div className={`fixed top-24 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-5 ${toastMessage.error ? 'bg-red-500 text-white' : 'bg-gray-900 text-white'}`}>
          {toastMessage.error ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
          <span className="font-medium text-sm">{toastMessage.title}</span>
        </div>
      )}
      {!isSubmitted && (
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Vulnerability Assessment</h1>
          <p className="text-sm text-gray-500">Complete this 5-step evaluation to generate your personalized risk profile.</p>
          
          <div className="mt-6 max-w-3xl">
            <div className="flex justify-between mb-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <div key={s} className={`text-xs font-bold ${step >= s ? 'text-primary-600' : 'text-gray-400'}`}>
                  Step {s}
                </div>
              ))}
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary-500 transition-all duration-300"
                style={{ width: `${((step - 1) / 4) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {!isSubmitted ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 max-w-3xl">
          <form onSubmit={step === 5 ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }}>
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-2">1. Location Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input required type="text" value={data.city} onChange={e => updateData({ city: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none" placeholder="e.g. Coimbatore" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Area / Neighborhood</label>
                    <input required type="text" value={data.area} onChange={e => updateData({ area: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none" placeholder="e.g. Saravanampatti" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode / Zipcode</label>
                    <input required type="text" value={data.pincode} onChange={e => updateData({ pincode: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none" placeholder="e.g. 641035" />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-2">2. Dwelling Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">House Type</label>
                    <select value={data.houseType} onChange={e => updateData({ houseType: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white">
                      <option value="Concrete">Concrete / Permanent</option>
                      <option value="Temporary">Temporary / Semi-Permanent</option>
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input type="checkbox" checked={data.floodProtection} onChange={e => updateData({ floodProtection: e.target.checked })} className="h-5 w-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500" />
                      <span className="text-sm font-medium text-gray-700">Property has active flood protection (sandbags, barriers, elevated foundation)</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-2">3. Infrastructure Access</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Water Access</label>
                    <select value={data.waterAccess} onChange={e => updateData({ waterAccess: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white">
                      <option value="Good">Good (Reliable municipal supply)</option>
                      <option value="Poor">Poor (Frequent shortages, reliant on tankers)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Electricity Access</label>
                    <select value={data.electricityAccess} onChange={e => updateData({ electricityAccess: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white">
                      <option value="Good">Good (Reliable grid connection)</option>
                      <option value="Poor">Poor (Frequent outages, no backup)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-2">4. Demographics</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Family Size</label>
                    <input required type="number" min="1" value={data.familySize} onChange={e => updateData({ familySize: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input type="checkbox" checked={data.elderlyMembers} onChange={e => updateData({ elderlyMembers: e.target.checked })} className="h-5 w-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500" />
                      <span className="text-sm font-medium text-gray-700">Household includes elderly members (65+)</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input type="checkbox" checked={data.childrenUnder5} onChange={e => updateData({ childrenUnder5: e.target.checked })} className="h-5 w-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500" />
                      <span className="text-sm font-medium text-gray-700">Household includes children under 5</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input type="checkbox" checked={data.disabledMembers} onChange={e => updateData({ disabledMembers: e.target.checked })} className="h-5 w-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500" />
                      <span className="text-sm font-medium text-gray-700">Household includes members with disabilities or mobility issues</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-2">5. Environmental History</h2>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input type="checkbox" checked={data.floodingHistory} onChange={e => updateData({ floodingHistory: e.target.checked })} className="h-5 w-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500" />
                    <span className="text-sm font-medium text-gray-700">Area has experienced flooding in the past 5 years</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input type="checkbox" checked={data.heatwaveExposure} onChange={e => updateData({ heatwaveExposure: e.target.checked })} className="h-5 w-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500" />
                    <span className="text-sm font-medium text-gray-700">Frequent exposure to extreme heatwaves</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input type="checkbox" checked={data.airQualityIssues} onChange={e => updateData({ airQualityIssues: e.target.checked })} className="h-5 w-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500" />
                    <span className="text-sm font-medium text-gray-700">Area suffers from chronic poor air quality or wildfire smoke</span>
                  </label>
                </div>
              </div>
            )}

            <div className="mt-8 flex justify-between pt-6 border-t border-gray-100">
              <button 
                type="button" 
                onClick={prevStep}
                disabled={step === 1}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors ${
                  step === 1 ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button 
                type="submit" 
                className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                {step === 5 ? "Submit Assessment" : "Next Step"} {step !== 5 && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Enhanced Results View */
        <div className="space-y-6 animate-in zoom-in-95 duration-500">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Assessment Results</h1>
              <p className="text-sm text-gray-500">Your personalized climate vulnerability profile</p>
            </div>
            <button 
              onClick={downloadPDF}
              disabled={isDownloading}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-medium shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloading ? <Loader2 className="h-4 w-4 animate-spin text-primary-600" /> : <Download className="h-4 w-4 text-primary-600" />}
              {isDownloading ? "Generating PDF..." : "Download Assessment Report"}
            </button>
          </div>

          <div ref={reportRef} className="space-y-6 bg-gray-50/50 p-2 sm:p-4 rounded-3xl -mx-2 sm:mx-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <ClipboardList className="h-48 w-48" />
              </div>
              
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
                <div className="flex-1 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-gray-800 text-sm font-semibold mb-4 shadow-sm">
                    <MapPin className="h-4 w-4 text-primary-600" /> 
                    {data.area || "Saravanampatti"}, {data.city || "Coimbatore"} {data.pincode ? `- ${data.pincode}` : ''}
                  </div>
                  <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
                    <h2 className={`text-4xl md:text-5xl font-extrabold ${riskColor} tracking-tight`}>
                      {riskCategory} Risk
                    </h2>
                    <div className={`px-3 py-1 rounded-lg ${riskBadgeColor} text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm`}>
                      Emergency Priority: {riskCategory}
                    </div>
                  </div>
                  <p className="text-gray-600 max-w-md mx-auto md:mx-0">
                    {riskCategory === "Low" && "Your household shows strong resilience. Maintain basic preparations and stay informed."}
                    {riskCategory === "Moderate" && "You have notable vulnerabilities. Take proactive steps to mitigate specific risks."}
                    {riskCategory === "High" && "Significant vulnerabilities detected. Prioritize implementing the recommendations below."}
                    {riskCategory === "Critical" && "Critical vulnerabilities detected. Immediate action and community support recommended."}
                  </p>
                </div>

                <div className="shrink-0 text-center bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <div className="inline-flex items-center justify-center w-40 h-40 rounded-full border-8 border-white shadow-sm relative mb-3 bg-white">
                    <svg className="absolute inset-0 w-full h-full transform -rotate-90 drop-shadow-sm">
                      <circle cx="80" cy="80" r="72" fill="none" stroke="currentColor" strokeWidth="12" className="text-gray-100" />
                      <circle 
                        cx="80" cy="80" r="72" fill="none" stroke="currentColor" strokeWidth="12" 
                        strokeDasharray="452" strokeDashoffset={452 - (452 * scores.total) / 100} 
                        className={`${riskStroke} transition-all duration-1000 ease-out`} 
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="flex flex-col items-center">
                      <span className="text-5xl font-black text-gray-900">{scores.total}</span>
                      <span className="text-xs font-bold text-gray-400 mt-1">/ 100</span>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Vulnerability Score</p>
                </div>
              </div>
            </div>

            {/* AI Insight Card */}
            <div className="bg-gradient-to-r from-primary-900 to-secondary-900 rounded-2xl p-6 md:p-8 shadow-lg text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Sparkles className="h-32 w-32" />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20 shrink-0 shadow-inner">
                  <Sparkles className="h-8 w-8 text-secondary-300" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    ClimateShield AI Insight
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-secondary-500/20 text-secondary-200 border border-secondary-500/30 uppercase tracking-wider">Generated</span>
                  </h3>
                  <p className="text-primary-100 leading-relaxed text-sm md:text-base">
                    {generateInsight()}
                  </p>
                </div>
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-6">How Your Score Was Calculated</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 flex flex-col hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                      <Droplets className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-bold text-gray-900">{scores.flood} / 25</span>
                  </div>
                  <h4 className="font-bold text-gray-900">Flood Risk</h4>
                  <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full ${getBadgeColor(scores.flood, 25).split(' ')[0]}`} style={{ width: `${(scores.flood / 25) * 100}%` }}></div>
                  </div>
                </div>

                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 flex flex-col hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                      <ThermometerSun className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-bold text-gray-900">{scores.heat} / 25</span>
                  </div>
                  <h4 className="font-bold text-gray-900">Heat Risk</h4>
                  <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full ${getBadgeColor(scores.heat, 25).split(' ')[0]}`} style={{ width: `${(scores.heat / 25) * 100}%` }}></div>
                  </div>
                </div>

                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 flex flex-col hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                      <ActivitySquare className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-bold text-gray-900">{scores.infra} / 25</span>
                  </div>
                  <h4 className="font-bold text-gray-900">Infrastructure</h4>
                  <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full ${getBadgeColor(scores.infra, 25).split(' ')[0]}`} style={{ width: `${(scores.infra / 25) * 100}%` }}></div>
                  </div>
                </div>

                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 flex flex-col hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-red-100 rounded-lg text-red-600">
                      <HeartPulse className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-bold text-gray-900">{scores.demo} / 25</span>
                  </div>
                  <h4 className="font-bold text-gray-900">Demographics</h4>
                  <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full ${getBadgeColor(scores.demo, 25).split(' ')[0]}`} style={{ width: `${(scores.demo / 25) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="h-5 w-5 text-primary-500" />
                      <h3 className="font-bold text-gray-900">Preparedness Checklist</h3>
                    </div>
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{completedTasks} / 4 Completed</span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary-500 transition-all duration-500 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="space-y-4 flex-1">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input type="checkbox" checked={checklist.kit} onChange={(e) => updateChecklist('kit', e.target.checked)} className="mt-1 h-5 w-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500" />
                    <div>
                      <p className={`text-sm font-bold transition-colors ${checklist.kit ? 'text-gray-400 line-through' : 'text-gray-900 group-hover:text-primary-600'}`}>Emergency Kit</p>
                      <p className={`text-xs mt-0.5 ${checklist.kit ? 'text-gray-300' : 'text-gray-500'}`}>Prepare a 72-hour go-bag with first aid, flashlight, and documents.</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input type="checkbox" checked={checklist.water} onChange={(e) => updateChecklist('water', e.target.checked)} className="mt-1 h-5 w-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500" />
                    <div>
                      <p className={`text-sm font-bold transition-colors ${checklist.water ? 'text-gray-400 line-through' : 'text-gray-900 group-hover:text-primary-600'}`}>Water Storage</p>
                      <p className={`text-xs mt-0.5 ${checklist.water ? 'text-gray-300' : 'text-gray-500'}`}>Stockpile 1 gallon of water per person per day for at least 3 days.</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input type="checkbox" checked={checklist.shelter} onChange={(e) => updateChecklist('shelter', e.target.checked)} className="mt-1 h-5 w-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500" />
                    <div>
                      <p className={`text-sm font-bold transition-colors ${checklist.shelter ? 'text-gray-400 line-through' : 'text-gray-900 group-hover:text-primary-600'}`}>Shelter Awareness</p>
                      <p className={`text-xs mt-0.5 ${checklist.shelter ? 'text-gray-300' : 'text-gray-500'}`}>Identify nearest elevated shelters or cooling centers.</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input type="checkbox" checked={checklist.contacts} onChange={(e) => updateChecklist('contacts', e.target.checked)} className="mt-1 h-5 w-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500" />
                    <div>
                      <p className={`text-sm font-bold transition-colors ${checklist.contacts ? 'text-gray-400 line-through' : 'text-gray-900 group-hover:text-primary-600'}`}>Emergency Contacts</p>
                      <p className={`text-xs mt-0.5 ${checklist.contacts ? 'text-gray-300' : 'text-gray-500'}`}>Save local emergency response numbers in your phone.</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <h3 className="font-bold text-gray-900">Personalized Recommendations</h3>
                </div>
                <ul className="space-y-4 list-disc pl-5 flex-1">
                  {getRecommendations().length > 0 ? getRecommendations().map((rec, i) => (
                    <li key={i} className="text-sm text-gray-700"><span className="font-bold">{rec.title}:</span> {rec.text}</li>
                  )) : (
                    <li className="text-sm text-gray-700">Review your general emergency go-bag and keep documents updated. Maintain your current resilience standards.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-8">
             <button onClick={() => { setStep(1); setData(initialData); setIsSubmitted(false); }} className="text-primary-600 font-medium hover:text-primary-700">
               Retake Assessment
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
