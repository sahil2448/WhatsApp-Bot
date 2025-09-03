// frontend/src/app/page.tsx
"use client";

import { useSocket } from "@/hooks/useSocket";
import { useEffect, useState } from "react";
import { MessageStats } from "@/types";
import { 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle 
} from "lucide-react";

export default function Dashboard() {
  const { status, isConnected } = useSocket();
  const [stats, setStats] = useState<MessageStats | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000"}/api/stats`);
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const getStatusIcon = () => {
    switch (status.state) {
      case "ready":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "qr":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "disconnected":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Monitor your WhatsApp bot activity</p>
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Connection Status</h2>
            <p className="text-sm text-gray-600">
              {status.message || "Checking connection..."}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className={`text-sm font-medium ${
              status.state === "ready" ? "text-green-600" :
              status.state === "qr" ? "text-yellow-600" :
              "text-red-600"
            }`}>
              {status.state.charAt(0).toUpperCase() + status.state.slice(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Messages</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalMessages}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unique Contacts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.uniqueContacts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Messages</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayMessages}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Response Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.incomingCount > 0 ? 
                    Math.round((stats.outgoingCount / stats.incomingCount) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => window.location.href = '/connection'}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
          >
            <h3 className="font-medium text-gray-900">Check Connection</h3>
            <p className="text-sm text-gray-600">View QR code and connection status</p>
          </button>
          
          <button
            onClick={() => window.location.href = '/messages'}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
          >
            <h3 className="font-medium text-gray-900">View Messages</h3>
            <p className="text-sm text-gray-600">Browse conversation history</p>
          </button>
          
          <button
            onClick={() => window.location.href = '/rules'}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
          >
            <h3 className="font-medium text-gray-900">Manage Rules</h3>
            <p className="text-sm text-gray-600">Configure auto-reply rules</p>
          </button>
        </div>
      </div>
    </div>
  );
}
