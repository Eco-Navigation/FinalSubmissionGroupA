'use client';

import React from 'react';
import { CompanyStats, RecentActivity } from '@/components/CompanyInfo';
import { EmissionsChart, TransportBreakdown } from '@/components/CompanyCharts';

export default function CompanyDashboard() {
  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Company Overview</h1>
          <p className="text-gray-600 mt-1">Global mobility metrics and sustainability targets.</p>
        </div>

        {/* 1. Key Metrics Cards */}
        <CompanyStats />

        {/* 2. Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 h-full">
            <EmissionsChart />
          </div>
          <div className="h-full">
            <TransportBreakdown />
          </div>
        </div>

        {/* 3. Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentActivity />
          {/* Placeholder for future module (e.g. Leaderboard or Map) */}
          <div className="bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 p-6 flex items-center justify-center text-gray-400">
            Leaderboard Coming Soon
          </div>
        </div>

      </div>
    </main>
  );
}