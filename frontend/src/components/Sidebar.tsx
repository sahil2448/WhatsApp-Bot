// frontend/src/components/Sidebar.tsx - Add logout functionality
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { 
  MessageSquare, 
  Settings, 
  Smartphone, 
  BarChart3, 
  Bot,
  LogOut,
  User
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Connection", href: "/connection", icon: Smartphone },
  { name: "Messages", href: "/messages", icon: MessageSquare },
  { name: "Rules", href: "/rules", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <Bot className="h-8 w-8 text-green-400" />
          <h1 className="text-xl font-bold">WhatsApp Bot</h1>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="mt-8 flex-1">
        <div className="px-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  group flex items-center px-3 py-2 text-sm font-medium rounded-md mb-1
                  ${isActive 
                    ? "bg-gray-800 text-white" 
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }
                `}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center mb-3">
          <User className="h-5 w-5 text-gray-400 mr-2" />
          <span className="text-sm text-gray-300">{user?.username}</span>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white rounded-md"
        >
          <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
          Logout
        </button>
      </div>
    </div>
  );
}
