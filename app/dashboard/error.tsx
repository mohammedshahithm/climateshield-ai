"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error("Dashboard caught error:", error);
  }, [error]);

  return (
    <div className="h-[calc(100vh-8rem)] flex items-center justify-center p-6 animate-in fade-in">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-red-100 shadow-sm text-center">
        <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-sm text-gray-500 mb-6">
          We encountered an unexpected error while loading this module. Our team has been notified.
        </p>
        <div className="bg-gray-50 p-4 rounded-lg text-xs font-mono text-gray-600 text-left overflow-x-auto mb-6 border border-gray-100">
          {error.message || "Unknown error occurred"}
        </div>
        <button
          onClick={() => reset()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      </div>
    </div>
  );
}
