import { ShieldAlert } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="h-[calc(100vh-8rem)] flex items-center justify-center p-6 animate-in fade-in">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative">
          <div className="absolute inset-0 bg-primary-100 rounded-full animate-ping opacity-75"></div>
          <div className="relative bg-white p-4 rounded-full border border-gray-100 shadow-sm">
            <ShieldAlert className="h-8 w-8 text-primary-500" />
          </div>
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Loading Module...</h2>
          <p className="text-sm text-gray-500 mt-1">Retrieving latest climate data</p>
        </div>
        {/* Loading Bar */}
        <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
          <div className="h-full bg-primary-500 w-1/2 animate-[pulse_1s_ease-in-out_infinite] rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
