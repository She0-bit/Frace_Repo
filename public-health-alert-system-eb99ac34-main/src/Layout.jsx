import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { 
  Activity, 
  FileText, 
  MapPin, 
  Bell, 
  Shield,
  Building2,
  LayoutDashboard,
  AlertTriangle,
  Settings,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Layout({ children, currentPageName }) {
  const navigation = [
    { name: 'Dashboard', page: 'Dashboard', icon: LayoutDashboard },
    { name: 'AI Simulation', page: 'AISimulation', icon: Activity },
    { name: 'New Case', page: 'NewCase', icon: FileText },
    { name: 'Cases List', page: 'CasesList', icon: Activity },
    { name: 'Crowd Routing', page: 'CrowdRouting', icon: MapPin },
    { name: 'Risk Predictions', page: 'PredictiveSpread', icon: TrendingUp },
    { name: 'User Risk Scores', page: 'UserRiskDashboard', icon: Activity },
    { name: 'Authorities View', page: 'AuthoritiesView', icon: Shield },
    { name: 'System Logs', page: 'SystemLogs', icon: Bell },
    { name: 'Location Data', page: 'LocationData', icon: MapPin },
    { name: 'Data Management', page: 'DataManagement', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">Public Health Alert System</h1>
                <p className="text-xs text-slate-500">Hospital Administration Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-emerald-700">System Online</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg">
                <Building2 className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Hospital Admin</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-64px)] sticky top-16">
          <nav className="p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-red-50 text-red-700 shadow-sm" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive ? "text-red-600" : "text-slate-400")} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}