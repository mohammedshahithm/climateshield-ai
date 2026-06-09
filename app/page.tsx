import Link from "next/link";
import { ShieldAlert, Activity, Globe, Zap, ArrowRight, BarChart3, AlertTriangle, ShieldCheck } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="bg-background">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-8 w-8 text-primary-500" />
              <span className="font-bold text-xl text-secondary-950 tracking-tight">ClimateShield</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-medium text-secondary-600 hover:text-secondary-900">
                Log In
              </Link>
              <Link href="/signup" className="text-sm font-medium bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-secondary-950 text-white min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary-950 via-secondary-900 to-primary-900/50"></div>
          
          <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-12">
            <ShieldAlert className="h-24 w-24 text-primary-500 mx-auto mb-8" />
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6">
              <span className="block text-white">Predict. Protect. Prepare.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-xl sm:text-2xl text-secondary-200 mx-auto mb-10">
              Government-grade AI providing actionable insights to safeguard communities from escalating climate risks.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/dashboard" className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-lg font-medium text-lg flex items-center justify-center gap-2 transition-colors">
                Explore Platform <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="#solution" className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-lg font-medium text-lg border border-white/20 transition-colors flex items-center justify-center gap-2">
                Watch Demo
              </Link>
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-secondary-950 mb-4">The Climate Crisis Demands Action</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Extreme weather events are increasing in frequency and severity. Legacy systems cannot keep up with the rapid pace of environmental change.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 text-center">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-secondary-950 mb-3">Unpredictable Disasters</h3>
                <p className="text-gray-600">Traditional forecasting falls short during unprecedented anomalies.</p>
              </div>
              <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 text-center">
                <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Globe className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-secondary-950 mb-3">Global Vulnerability</h3>
                <p className="text-gray-600">Infrastructure and populations are exposed without localized data.</p>
              </div>
              <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 text-center">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Activity className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-secondary-950 mb-3">Reactive Responses</h3>
                <p className="text-gray-600">Emergency management often acts too late, costing lives and resources.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Solution Section */}
        <section id="solution" className="py-20 bg-secondary-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-secondary-950 mb-6">
                  Proactive Protection Powered by AI
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  ClimateShield synthesizes millions of data points from satellites, weather stations, and geological sensors in real-time. Our predictive models give you the critical hours needed to prepare and protect.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <ShieldCheck className="h-6 w-6 text-primary-500 shrink-0" />
                    <span className="text-gray-700"><strong>Hyper-Local Risk Scoring:</strong> Neighborhood-level vulnerability assessments.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Zap className="h-6 w-6 text-primary-500 shrink-0" />
                    <span className="text-gray-700"><strong>Real-Time Alerts:</strong> Automated SMS and push notifications for citizens.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <BarChart3 className="h-6 w-6 text-primary-500 shrink-0" />
                    <span className="text-gray-700"><strong>Actionable Dashboards:</strong> Unified command center for administrators.</span>
                  </li>
                </ul>
              </div>
              <div className="flex-1 w-full">
                <div className="bg-white p-2 rounded-2xl shadow-xl border border-gray-100">
                  <div className="bg-secondary-950 rounded-xl overflow-hidden aspect-[4/3] relative flex items-center justify-center">
                     <div className="text-center p-6">
                       <ShieldAlert className="h-16 w-16 text-primary-500 mx-auto mb-4 opacity-50" />
                       <p className="text-white font-medium text-lg">AI Analytics Engine</p>
                       <p className="text-secondary-400 text-sm mt-2">Processing real-time global climate metrics</p>
                     </div>
                     <div className="absolute top-4 right-4 flex gap-2">
                       <span className="flex h-3 w-3 rounded-full bg-red-500"></span>
                       <span className="flex h-3 w-3 rounded-full bg-yellow-500"></span>
                       <span className="flex h-3 w-3 rounded-full bg-green-500"></span>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Impact Metrics Section */}
        <section className="py-20 bg-primary-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <p className="text-5xl font-extrabold text-primary-400 mb-2">99.9%</p>
                <p className="text-primary-100 font-medium">Uptime Guarantee</p>
              </div>
              <div>
                <p className="text-5xl font-extrabold text-primary-400 mb-2">2M+</p>
                <p className="text-primary-100 font-medium">Citizens Protected</p>
              </div>
              <div>
                <p className="text-5xl font-extrabold text-primary-400 mb-2">&lt;2s</p>
                <p className="text-primary-100 font-medium">Alert Latency</p>
              </div>
              <div>
                <p className="text-5xl font-extrabold text-primary-400 mb-2">50+</p>
                <p className="text-primary-100 font-medium">Cities Onboarded</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-secondary-950 text-secondary-400 py-12 text-center border-t border-secondary-800">
        <div className="flex items-center justify-center gap-2 mb-4">
          <ShieldAlert className="h-6 w-6 text-primary-500" />
          <span className="font-bold text-lg text-white">ClimateShield</span>
        </div>
        <p>&copy; 2026 ClimateShield AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
