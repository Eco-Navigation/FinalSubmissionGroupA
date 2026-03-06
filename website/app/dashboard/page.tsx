"use client";
import React from 'react';
import { useState, useEffect } from 'react';

// --- Types ---
type TripType = 'Business' | 'Personal';

interface Trip {
  id: string;
  date: string; // ISO format
  origin: string;
  destination: string;
  distanceMiles: number;
  purpose: string;
  type: TripType;
  transportMode: string;
}

// --- Helper: Group Trips by Month ---
const groupTripsByMonth = (trips: Trip[]) => {
  const groups: Record<string, Trip[]> = {};
  
  const sortedTrips = [...trips].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  sortedTrips.forEach((trip) => {
    const date = new Date(trip.date);
    const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }
    groups[monthYear].push(trip);
  });
  
  return groups;
};

export default function DashboardPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://noninhibitive-thinkably-billie.ngrok-free.dev/api/trip_data', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          }
        });

        if (!response.ok) throw new Error('Status: ' + response.status);

        const data = await response.json();

        // --- Data Mapping Logic ---
        // We map the raw Python JSON structure to our Frontend Trip interface
        const mappedTrips: Trip[] = data.trips.map((raw: any) => ({
          id: raw.id,
          date: raw.datetime, // Use datetime for sorting/grouping
          origin: raw.start_location.address.split(',')[0], // Get first part of address for brevity
          destination: raw.end_location.address.split(',')[0],
          distanceMiles: parseFloat((raw.distance_km * 0.621371).toFixed(1)), // Convert KM to Miles
          purpose: raw.description,
          type: raw.type as TripType,
          transportMode: raw.transport_mode
        }));

        setTrips(mappedTrips);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const groupedTrips = groupTripsByMonth(trips);

  const totalBusinessMiles = trips
    .filter(t => t.type === 'Business')
    .reduce((acc, curr) => acc + curr.distanceMiles, 0);

  const totalPersonalMiles = trips
    .filter(t => t.type === 'Personal')
    .reduce((acc, curr) => acc + curr.distanceMiles, 0);

  if (loading) return <div className="p-10 text-center text-gray-500">Loading your travel log...</div>;

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Personal Travel Log</h1>
          <p className="text-gray-600 mt-2">Manage your trip history and track your impact.</p>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Business Travel</h3>
            <p className="text-4xl font-bold text-green-600 mt-2">
              {totalBusinessMiles.toFixed(1)} <span className="text-lg text-gray-300 font-normal">miles</span>
            </p>
            <p className="text-xs text-gray-400 mt-1 italic">Reimbursable</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Personal Travel</h3>
            <p className="text-4xl font-bold text-blue-600 mt-2">
              {totalPersonalMiles.toFixed(1)} <span className="text-lg text-gray-300 font-normal">miles</span>
            </p>
            <p className="text-xs text-gray-400 mt-1 italic">Non-reimbursable</p>
          </div>
        </div>

        {/* Trips List */}
        <div className="space-y-12">
          {Object.entries(groupedTrips).map(([month, monthTrips]) => (
            <section key={month}>
              <h2 className="text-md font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                {month}
              </h2>
              
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="divide-y divide-gray-50">
                  {monthTrips.map((trip) => (
                    <div key={trip.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        
                        <div className="flex flex-col sm:w-28 shrink-0">
                          <span className="text-lg font-bold text-gray-800">
                            {new Date(trip.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </span>
                          <span className={`inline-flex items-center w-fit px-2 py-0.5 rounded text-[10px] font-bold uppercase mt-1 ${
                            trip.type === 'Business' 
                              ? 'bg-green-50 text-green-700 border border-green-100' 
                              : 'bg-blue-50 text-blue-700 border border-blue-100'
                          }`}>
                            {trip.type}
                          </span>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-gray-900 font-semibold text-base">
                            {trip.origin} 
                            <span className="text-gray-300 font-light">→</span> 
                            {trip.destination}
                          </div>
                          <div className="text-sm text-gray-400 mt-0.5 flex items-center gap-2">
                            {trip.purpose} • <span className="text-gray-300 italic">{trip.transportMode}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xl font-black text-gray-900">{trip.distanceMiles} mi</div>
                        </div>
                        
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>

      </div>
    </main>
  );
}