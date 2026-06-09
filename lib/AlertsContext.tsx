"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { ClimateAlert, mockAlerts as initialMockAlerts } from "./mockAlerts";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

type Role = "admin" | "citizen";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error";
}

interface AlertsContextProps {
  alerts: ClimateAlert[];
  addAlert: (alert: ClimateAlert) => void;
  userRole: Role;
  setUserRole: (role: Role) => void;
  showToast: (message: string, type: "success" | "error") => void;
  location: string;
  setLocation: (loc: string) => void;
}

const AlertsContext = createContext<AlertsContextProps | undefined>(undefined);

export function AlertsProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<ClimateAlert[]>(initialMockAlerts);
  const [userRole, setUserRole] = useState<Role>("admin"); // Default to admin for testing
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [location, setLocation] = useState<string>("Chennai");

  const addAlert = (newAlert: ClimateAlert) => {
    setAlerts(prev => [newAlert, ...prev]);
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
    <AlertsContext.Provider value={{ alerts, addAlert, userRole, setUserRole, showToast, location, setLocation }}>
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
