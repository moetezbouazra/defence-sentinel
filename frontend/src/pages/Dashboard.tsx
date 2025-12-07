import React from 'react';
import { motion } from 'framer-motion';
import { Activity, ShieldAlert, Camera, Eye } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-400">{title}</p>
        <h3 className="text-2xl font-bold mt-2 text-slate-100">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
    <div className="mt-4 flex items-center gap-2">
      <span className="text-xs font-medium text-green-400">{trend}</span>
      <span className="text-xs text-slate-500">vs last 24h</span>
    </div>
  </motion.div>
);

const Dashboard = () => {
  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Events" 
          value="1,284" 
          icon={Activity} 
          trend="+12%"
          color="bg-blue-500/20"
        />
        <StatCard 
          title="Active Threats" 
          value="3" 
          icon={ShieldAlert} 
          trend="+2"
          color="bg-red-500/20"
        />
        <StatCard 
          title="Cameras Online" 
          value="8/8" 
          icon={Camera} 
          trend="Stable"
          color="bg-green-500/20"
        />
        <StatCard 
          title="Detections" 
          value="452" 
          icon={Eye} 
          trend="+5%"
          color="bg-amber-500/20"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Live Feed Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Live Feed</h3>
            <button className="text-sm text-blue-400 hover:text-blue-300">View All</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-video bg-slate-900 rounded-lg border border-slate-800 relative overflow-hidden group">
                <div className="absolute inset-0 flex items-center justify-center text-slate-600">
                  <Camera className="w-8 h-8" />
                </div>
                <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-md rounded text-xs font-medium">
                  CAM_00{i}
                </div>
                <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Recent Alerts</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-lg bg-slate-900/30 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-red-500" />
                  <div>
                    <h4 className="text-sm font-medium text-slate-200">Person Detected</h4>
                    <p className="text-xs text-slate-500 mt-1">CAM_001 • 2 mins ago</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
