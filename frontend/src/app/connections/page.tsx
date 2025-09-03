// frontend/src/app/connection/page.tsx
"use client";

import { useSocket } from "@/hooks/useSocket";
import { CheckCircle, AlertCircle, XCircle, Loader } from "lucide-react";

export default function Connection() {
  const { qrCode, status, isConnected } = useSocket();

  const getStatusColor = () => {
    switch (status.state) {
      case "ready": return "text-green-600";
      case "authenticated": return "text-blue-600";
      case "qr": return "text-yellow-600";
      case "disconnected": return "text-red-600";
      case "auth_failure": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  const getStatusIcon = () => {
    switch (status.state) {
      case "ready":
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case "authenticated":
        return <CheckCircle className="h-8 w-8 text-blue-500" />;
      case "qr":
        return <AlertCircle className="h-8 w-8 text-yellow-500" />;
      case "disconnected":
        return <XCircle className="h-8 w-8 text-red-500" />;
      case "auth_failure":
        return <XCircle className="h-8 w-8 text-red-500" />;
      default:
        return <Loader className="h-8 w-8 text-gray-500 animate-spin" />;
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">WhatsApp Connection</h1>
        <p className="text-gray-600">Manage your WhatsApp bot connection</p>
      </div>

      <div className="max-w-2xl">
        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center space-x-4">
            {getStatusIcon()}
            <div>
              <h2 className={`text-xl font-semibold ${getStatusColor()}`}>
                {status.state.charAt(0).toUpperCase() + status.state.slice(1).replace('_', ' ')}
              </h2>
              <p className="text-gray-600">
                {status.message || "Checking connection status..."}
              </p>
              <div className="mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isConnected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}>
                  {isConnected ? "Backend Connected" : "Backend Disconnected"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code */}
        {qrCode && (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Scan QR Code with WhatsApp
            </h3>
            <div className="inline-block p-4 bg-white rounded-lg shadow-inner">
              <img 
                src={qrCode} 
                alt="WhatsApp QR Code" 
                className="w-64 h-64 mx-auto"
              />
            </div>
            <div className="mt-4 space-y-2 text-sm text-gray-600">
              <p>1. Open WhatsApp on your phone</p>
              <p>2. Tap Menu (⋮) → Linked Devices</p>
              <p>3. Tap "Link a Device"</p>
              <p>4. Scan this QR code</p>
            </div>
          </div>
        )}

        {/* Connection Ready */}
        {status.state === "ready" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-green-800">
                  WhatsApp Connected Successfully!
                </h3>
                <p className="text-green-600">
                  Your bot is now active and will automatically reply to incoming messages.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {status.state === "auth_failure" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <XCircle className="h-6 w-6 text-red-500" />
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-red-800">
                  Authentication Failed
                </h3>
                <p className="text-red-600">
                  Please refresh the page and try scanning the QR code again.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
