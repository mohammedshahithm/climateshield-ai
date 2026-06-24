"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ShieldAlert, Activity, Globe, Zap, ArrowRight, BarChart3, 
  AlertTriangle, ShieldCheck, HelpCircle, Users, MessageSquare, ChevronDown
} from "lucide-react";

export default function LandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      question: "How does ClimateShield calculate the composite risk score?",
      answer: "Our AI engine aggregates real-time weather telemetries (temperature, rainfall sum), air quality indices (PM2.5, PM10, ozone), and localized flood risk factors. These are calculated against historical municipal vulnerability maps to produce a unified score from 0 to 100."
    },
    {
      question: "Can citizens report climate incidents directly?",
      answer: "Yes. ClimateShield features a verified citizen reporting portal. Registered residents can report local emergencies like street flooding, transformer failures, or landslides, which are immediately mapped for public awareness and reviewed by authorities."
    },
    {
      question: "How fast are emergency alerts disseminated?",
      answer: "Dissemination is near instantaneous. Once an administrator issues an advisory or a critical threshold is breached by telemetry sensors, warnings are broadcasted across the web dashboard and notification feed in less than 2 seconds."
    },
    {
      question: "Is ClimateShield optimized for mobile devices?",
      answer: "Absolutely. The entire application is built on a responsive mobile-first grid system. Emergency services, citizen reporting logs, and tactical maps can be accessed seamlessly on any smartphone or tablet."
    }
  ];

  const testimonials = [
    {
      quote: "ClimateShield revolutionized our emergency response. During the recent heavy rains, we mobilized stand-by drainage pumps 4 hours before low-lying streets flooded.",
      author: "Dr. R. Subbiah",
      role: "Director of Municipal Disaster Management"
    },
    {
      quote: "Knowing the capacity and availability of local concrete shelters in real-time saved my family from being stranded during the flash flood warning.",
      author: "Meera Krishnan",
      role: "Velachery Neighborhood Representative"
    },
    {
      quote: "The predictive AI assistant gives us precise regional vulnerability reports on demand. It has become our primary tool for asset distribution.",
      author: "Chief K. Raghavan",
      role: "Fire & Rescue Services Command"
    }
  ];

  return (
    <div className="bg-background min-h-screen flex flex-col font-sans">
      {/* Navigation */}
      <nav className="border-b border-gray-200/60 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="h-7 w-7 text-primary-500" />
              <span className="font-extrabold text-xl text-secondary-950 tracking-tight">ClimateShield</span>
              <span className="text-[10px] font-bold bg-primary-500/10 text-primary-600 px-1.5 py-0.5 rounded-full ml-1">v1.2.0-prod</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-semibold text-secondary-650 hover:text-secondary-950 transition-colors">
                Log In
              </Link>
              <Link href="/signup" className="text-sm font-bold bg-primary-500 text-white px-4.5 py-2.5 rounded-xl hover:bg-primary-600 shadow-md hover:shadow-lg transition-all active:scale-98">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-secondary-950 text-white min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary-950 via-secondary-900 to-primary-900/40"></div>
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08)_0,transparent_60%)]"></div>
          
          <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-500/10 border border-primary-500/20 rounded-full text-primary-400 text-xs font-bold uppercase tracking-wider mb-8">
              <Zap className="h-4.5 w-4.5" /> Next-Gen Climate Intelligence
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight mb-6 leading-none">
              Predict. Protect. Prepare.
            </h1>
            <p className="mt-4 max-w-2xl text-lg sm:text-xl text-secondary-200 mx-auto mb-10 leading-relaxed">
              Government-grade AI providing real-time telemetry metrics and actionable insights to safeguard communities from climate risks.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/dashboard" className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3.5 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-98">
                Explore Platform <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="#how-it-works" className="bg-white/10 hover:bg-white/20 text-white px-8 py-3.5 rounded-xl font-bold text-lg border border-white/20 transition-all flex items-center justify-center gap-2">
                Learn More
              </Link>
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-secondary-950 mb-4 tracking-tight">The Climate Crisis Demands Action</h2>
              <p className="text-lg text-gray-500 max-w-3xl mx-auto leading-relaxed">
                Extreme weather events are increasing in frequency and severity. Legacy warning systems cannot keep up with the rapid pace of environmental change.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gray-50/50 p-8 rounded-2xl border border-gray-100 text-center hover:shadow-md transition-all duration-300">
                <div className="w-14 h-14 bg-red-50 text-red-650 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <AlertTriangle className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-secondary-950 mb-3">Unpredictable Disasters</h3>
                <p className="text-gray-500 text-sm leading-relaxed">Traditional weather forecasts fall short during localized micro-climate anomalies.</p>
              </div>
              <div className="bg-gray-50/50 p-8 rounded-2xl border border-gray-100 text-center hover:shadow-md transition-all duration-300">
                <div className="w-14 h-14 bg-orange-50 text-orange-655 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <Globe className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-secondary-950 mb-3">Global Vulnerability</h3>
                <p className="text-gray-500 text-sm leading-relaxed">Densely populated urban sectors are exposed without local risk indicators.</p>
              </div>
              <div className="bg-gray-50/50 p-8 rounded-2xl border border-gray-100 text-center hover:shadow-md transition-all duration-300">
                <div className="w-14 h-14 bg-blue-50 text-blue-650 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <Activity className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-secondary-950 mb-3">Reactive Operations</h3>
                <p className="text-gray-500 text-sm leading-relaxed">Emergency command response often acts too late, costing lives and municipal assets.</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 bg-gray-50/50 border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-secondary-950 mb-4 tracking-tight">The ClimateShield Pipeline</h2>
              <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
                Our technology stack transforms scattered climate data into real-time safety directives.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              <div className="bg-white p-8 rounded-2xl border border-gray-200/60 shadow-sm relative flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-primary-100 text-primary-700 rounded-xl flex items-center justify-center font-black text-xl mb-6 shadow-xs">1</div>
                <h3 className="text-lg font-bold text-secondary-955 mb-2">Sensor Ingestion</h3>
                <p className="text-gray-550 text-sm leading-relaxed">We ingest real-time reports from meteorological agencies, air monitors, and local rainfall logs.</p>
              </div>
              <div className="bg-white p-8 rounded-2xl border border-gray-200/60 shadow-sm relative flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-primary-100 text-primary-700 rounded-xl flex items-center justify-center font-black text-xl mb-6 shadow-xs">2</div>
                <h3 className="text-lg font-bold text-secondary-955 mb-2">Predictive AI Modeling</h3>
                <p className="text-gray-550 text-sm leading-relaxed">Algorithms calculate composite threat indexes, comparing readings with infrastructure thresholds.</p>
              </div>
              <div className="bg-white p-8 rounded-2xl border border-gray-200/60 shadow-sm relative flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-primary-100 text-primary-700 rounded-xl flex items-center justify-center font-black text-xl mb-6 shadow-xs">3</div>
                <h3 className="text-lg font-bold text-secondary-955 mb-2">Emergency Dispatch</h3>
                <p className="text-gray-550 text-sm leading-relaxed">Warnings are pushed to residents while evacuation shelter telemetry updates instantly.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Solution Section */}
        <section id="solution" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1 space-y-6">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-secondary-955 tracking-tight">
                  Proactive Protection Powered by AI
                </h2>
                <p className="text-lg text-gray-500 leading-relaxed">
                  ClimateShield synthesizes millions of telemetry data points from weather sensors and citizen reports in real-time. Our models give you the critical window needed to prepare and protect.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="p-1 bg-emerald-50 rounded-lg text-primary-600 mt-0.5 shrink-0"><ShieldCheck className="h-5 w-5" /></div>
                    <span className="text-gray-750 text-sm"><strong>Hyper-Local Vulnerability:</strong> Ward-level and neighborhood hazard calculations.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="p-1 bg-emerald-50 rounded-lg text-primary-600 mt-0.5 shrink-0"><Zap className="h-5 w-5" /></div>
                    <span className="text-gray-750 text-sm"><strong>Real-Time Broadcasts:</strong> Instant dashboard warnings and notifications.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="p-1 bg-emerald-50 rounded-lg text-primary-600 mt-0.5 shrink-0"><BarChart3 className="h-5 w-5" /></div>
                    <span className="text-gray-750 text-sm"><strong>Unified Command Center:</strong> Resource allocation and shelter tracking for admins.</span>
                  </li>
                </ul>
              </div>
              <div className="flex-1 w-full">
                <div className="bg-gray-50 p-3 rounded-3xl border border-gray-150 shadow-md">
                  <div className="bg-secondary-950 rounded-2xl overflow-hidden aspect-[4/3] relative flex items-center justify-center shadow-inner">
                     <div className="text-center p-6 space-y-3 relative z-10">
                       <ShieldAlert className="h-16 w-16 text-primary-500 mx-auto mb-2 opacity-80 animate-pulse" />
                       <p className="text-white font-extrabold text-xl">AI Tactical Intelligence Engine</p>
                       <p className="text-secondary-300 text-xs max-w-xs mx-auto">Evaluating real-time weather and flood sensors across active regional coordinates.</p>
                     </div>
                     <div className="absolute top-4 right-4 flex gap-2">
                       <span className="flex h-3.5 w-3.5 rounded-full bg-red-500 shadow-xs"></span>
                       <span className="flex h-3.5 w-3.5 rounded-full bg-yellow-500 shadow-xs"></span>
                       <span className="flex h-3.5 w-3.5 rounded-full bg-green-500 shadow-xs"></span>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-gray-50/50 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-secondary-950 tracking-tight">Trusted by Authorities and Citizens</h2>
              <p className="text-lg text-gray-500 max-w-2xl mx-auto mt-2">Hear how ClimateShield is making a real difference in disaster preparedness.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((t, idx) => (
                <div key={idx} className="bg-white p-8 rounded-2xl border border-gray-200/60 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                  <p className="text-gray-650 italic text-sm leading-relaxed mb-6">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div>
                    <h4 className="font-extrabold text-secondary-950 text-sm">{t.author}</h4>
                    <p className="text-xs text-primary-600 font-semibold mt-0.5">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-extrabold text-secondary-950 tracking-tight flex items-center justify-center gap-2">
                <HelpCircle className="h-8 w-8 text-primary-500" /> Frequently Asked Questions
              </h2>
              <p className="text-sm text-gray-500 mt-2">Answers to common inquiries about the ClimateShield platform.</p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div key={idx} className="bg-gray-50/50 border border-gray-150 rounded-xl overflow-hidden transition-all duration-300">
                  <button 
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between p-5 text-left font-bold text-secondary-955 hover:bg-gray-100/50 transition-colors"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown className={`h-4.5 w-4.5 text-gray-400 transition-transform duration-300 ${activeFaq === idx ? 'rotate-180 text-primary-550' : ''}`} />
                  </button>
                  {activeFaq === idx && (
                    <div className="px-5 pb-5 text-xs text-gray-500 leading-relaxed border-t border-gray-150/40 pt-4 bg-white/50">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="py-20 bg-secondary-950 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-secondary-950 to-primary-950/80"></div>
          <div className="relative max-w-5xl mx-auto px-4 text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Take Control of Your Climate Readiness Today</h2>
            <p className="text-secondary-200 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
              Create an account to gain access to real-time climate telemetry, personalized vulnerability assessments, and localized alerts.
            </p>
            <div className="pt-4">
              <Link href="/signup" className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 active:scale-98">
                Sign Up Now <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Impact Metrics Section */}
        <section className="py-16 bg-primary-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <p className="text-4xl font-black text-primary-400 mb-2">99.9%</p>
                <p className="text-primary-100 font-bold text-xs uppercase tracking-wider">Uptime SLA</p>
              </div>
              <div>
                <p className="text-4xl font-black text-primary-400 mb-2">2M+</p>
                <p className="text-primary-100 font-bold text-xs uppercase tracking-wider">Protected Citizens</p>
              </div>
              <div>
                <p className="text-4xl font-black text-primary-400 mb-2">&lt;2s</p>
                <p className="text-primary-100 font-bold text-xs uppercase tracking-wider">Broadcast Latency</p>
              </div>
              <div>
                <p className="text-4xl font-black text-primary-400 mb-2">50+</p>
                <p className="text-primary-100 font-bold text-xs uppercase tracking-wider">Cities Active</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-secondary-950 text-secondary-400 py-12 text-center border-t border-secondary-800">
        <div className="max-w-7xl mx-auto px-4 space-y-4">
          <div className="flex items-center justify-center gap-2.5">
            <ShieldAlert className="h-6 w-6 text-primary-500" />
            <span className="font-extrabold text-lg text-white">ClimateShield</span>
          </div>
          <p className="text-xs">&copy; 2026 ClimateShield AI Operations. All rights reserved.</p>
          <div className="text-[10px] text-secondary-500 font-mono flex justify-center gap-4">
            <span>Version 1.2.0-prod</span>
            <span>•</span>
            <span>Target: Faculty Evaluation Demo</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
