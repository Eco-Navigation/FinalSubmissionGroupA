'use client';

import React, { useState } from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Bus, Bike, Train, Car, Footprints } from 'lucide-react';

// --- Data ---
const emissionsData = [
  { period: 'Week 1', emitted: 3200, saved: 850 },
  { period: 'Week 2', emitted: 3100, saved: 920 },
  { period: 'Week 3', emitted: 2950, saved: 1050 },
  { period: 'Week 4', emitted: 3050, saved: 980 },
];

const transportData = [
  { name: 'Bus', value: 2847, color: '#3b82f6', icon: Bus },
  { name: 'Train', value: 2134, color: '#8b5cf6', icon: Train },
  { name: 'Bike', value: 1823, color: '#10b981', icon: Bike },
  { name: 'Walk', value: 1456, color: '#06b6d4', icon: Footprints },
  { name: 'Car', value: 672, color: '#f59e0b', icon: Car },
];

export function EmissionsChart() {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-semibold text-gray-900">Emissions Trend</h3>
          <p className="text-sm text-gray-500">CO2 emitted vs saved (kg)</p>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1">
          {['line', 'bar'].map((type) => (
            <button
              key={type}
              onClick={() => setChartType(type as 'line' | 'bar')}
              className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-all ${
                chartType === type ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={emissionsData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="period" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
              />
              <Legend />
              <Line type="monotone" dataKey="emitted" stroke="#ef4444" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="saved" stroke="#10b981" strokeWidth={3} dot={false} />
            </LineChart>
          ) : (
            <BarChart data={emissionsData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="period" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
              />
              <Legend />
              <Bar dataKey="emitted" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="saved" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function TransportBreakdown() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 h-full">
      <h3 className="font-semibold text-gray-900 mb-1">Transport Methods</h3>
      <p className="text-sm text-gray-500 mb-6">Distribution by mode</p>

      <div className="h-[200px] w-full mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={transportData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {transportData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-3">
        {transportData.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <Icon className="w-4 h-4" style={{ color: item.color }} />
                <span>{item.name}</span>
              </div>
              <span className="font-medium text-gray-900">{item.value.toLocaleString()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}