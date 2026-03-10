"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- Initialize Supabase ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Types ---
type TripType = 'Business' | 'Personal';

interface Trip {
  id: string;
  date: string;
  origin: string;
  destination: string;
  distanceMiles: number;
  emissionsKg: number;
  savedKg: number;
  purpose: string;
  type: TripType;
}

const groupTripsByMonth = (trips: Trip[]) => {
  const groups: Record<string, Trip[]> = {};
  const sortedTrips = [...trips].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  sortedTrips.forEach((trip) => {
    const date = new Date(trip.date);
    const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!groups[monthYear]) groups[monthYear] = [];
    groups[monthYear].push(trip);
  });
  return groups;
};

export default function DashboardPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const DUMMY_USER_ID = 3;

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        // Query the 'trips' table directly
        const { data, error } = await supabase
          .from('trips')
          .select('*')
          .eq('user_id', DUMMY_USER_ID)
          .order('date_time', { ascending: false });

        if (error) throw error;

        const mappedTrips: Trip[] = data.map((raw: any) => ({
          id: raw.trip_id.toString(),
          date: raw.date_time,
          origin: raw.start_location_address?.split(',')[0] || 'Unknown',
          destination: raw.end_location_address?.split(',')[0] || 'Unknown',
          distanceMiles: parseFloat((raw.total_actual_distance_km * 0.621371).toFixed(1)),
          emissionsKg: parseFloat((raw.total_actual_co2_kg || 0).toFixed(2)),
          savedKg: parseFloat((raw.total_saved_co2_kg || 0).toFixed(2)),
          purpose: raw.description,
          type: raw.is_business_travel ? 'Business' : 'Personal',
        }));

        setTrips(mappedTrips);
      } catch (err) {
        console.error('Supabase fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, []);

  const groupedTrips = groupTripsByMonth(trips);
  const totalBusinessMiles = trips.filter(t => t.type === 'Business').reduce((acc, curr) => acc + curr.distanceMiles, 0);
  const totalPersonalMiles = trips.filter(t => t.type === 'Personal').reduce((acc, curr) => acc + curr.distanceMiles, 0);
  const totalSavedCO2 = trips.reduce((acc, curr) => acc + curr.savedKg, 0);

  if (loading) return <div className="p-10 text-center text-gray-500">Loading Cloud Data...</div>;

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Personal Travel Log</h1>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-green-600 uppercase tracking-widest">Global Impact</span>
            <p className="text-2xl font-black text-gray-900">{totalSavedCO2.toFixed(1)} kg <span className="text-sm font-normal text-gray-400">CO2 Saved</span></p>
          </div>
        </header>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-xs font-bold text-gray-400 uppercase">Business</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">{totalBusinessMiles.toFixed(1)} <span className="text-base font-normal text-gray-300">mi</span></p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-xs font-bold text-gray-400 uppercase">Personal</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{totalPersonalMiles.toFixed(1)} <span className="text-base font-normal text-gray-300">mi</span></p>
          </div>
          <div className="bg-green-600 p-6 rounded-xl shadow-sm text-white">
            <h3 className="text-xs font-bold text-green-100 uppercase">Total Avoided</h3>
            <p className="text-3xl font-bold mt-2">{totalSavedCO2.toFixed(1)} <span className="text-base font-normal text-green-200">kg</span></p>
          </div>
        </div>

        {/* List Section */}
        <div className="space-y-10 text-gray-900">
          {Object.entries(groupedTrips).map(([month, monthTrips]) => (
            <section key={month}>
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">{month}</h2>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="divide-y divide-gray-50">
                  {monthTrips.map((trip) => (
                    <div key={trip.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex flex-col sm:w-24">
                          <span className="text-lg font-bold">{new Date(trip.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                          <span className={`text-[10px] font-black ${trip.type === 'Business' ? 'text-green-500' : 'text-blue-500'}`}>{trip.type}</span>
                        </div>
                        <div className="flex-1">
                          <div className="font-bold">{trip.origin} → {trip.destination}</div>
                          <div className="text-sm text-gray-400">{trip.purpose}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold">{trip.distanceMiles} mi</div>
                          <div className="text-[10px] font-bold text-green-600">-{trip.savedKg}kg CO2</div>
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