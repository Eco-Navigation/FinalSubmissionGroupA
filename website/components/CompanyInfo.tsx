import { TrendingDown, TrendingUp, Users, Route, Clock, Briefcase } from 'lucide-react';

export function CompanyStats() {
  const stats = [
    { label: 'Total CO2 Saved', value: '3,247 kg', change: '+18%', icon: TrendingDown, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Total Emissions', value: '12,450 kg', change: '-12%', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Active Employees', value: '247', change: '+5%', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Trips', value: '8,932', change: '+22%', icon: Route, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, i) => (
        <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <div className={`p-2 rounded-lg ${stat.bg}`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
              {stat.change}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
          <p className="text-sm text-gray-500">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

export function RecentActivity() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 h-full">
      <h3 className="font-semibold text-gray-900 mb-4">Live Activity Feed</h3>
      <div className="space-y-4">
        {[1, 2, 3].map((_, i) => (
          <div key={i} className="flex gap-4 items-start pb-4 border-b border-gray-100 last:border-0 last:pb-0">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-xs font-bold text-blue-700">
              JS
            </div>
            <div>
              <p className="text-sm text-gray-900">
                <span className="font-medium">John Smith</span> logged a <span className="font-medium">Train</span> trip.
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                  <Briefcase className="w-3 h-3" /> Business
                </span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Just now
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}