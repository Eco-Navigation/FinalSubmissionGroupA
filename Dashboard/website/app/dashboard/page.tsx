"use client";

import React, { useState, useEffect, useMemo } from 'react';

// --- Types ---
type TripType = 'Business' | 'Personal';

interface ModeDistance {
  modeName: string;
  distanceMiles: number;
}

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
  modeDistances: ModeDistance[]; // Aggregated from trip_legs
  primaryMode: string;         // The mode with the most distance in this trip
}

// --- Constants ---
const COLOURS = ['#f59e0b', '#3b82f6', '#10b956', '#8b5cf6', '#ef4444'];
// Car, bicycle, walking, public transit, other


/**
 * Custom Simple SVG Pie Chart
 * Aggregates data by total distance rather than count.
 */
const SimplePieChart = ({ data }: { data: { name: string, value: number }[] }) => {
  const total = data.reduce((acc, item) => acc + item.value, 0);
  let cumulativePercent = 0;

  function getCoordinatesForPercent(percent: number) {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  }

  if (total === 0) return <div className="h-full flex items-center justify-center text-gray-300 text-xs italic">No data available</div>;

  return (
    <div className="w-full h-full flex flex-row items-center justify-between gap-4">
      {/* Chart Container */}
      <div className="relative flex-1 aspect-square max-h-[180px]">
        <svg viewBox="-1 -1 2 2" className="w-full h-full -rotate-90">
          {data.map((item, index) => {
            const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
            cumulativePercent += item.value / total;
            const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
            const largeArcFlag = item.value / total > 0.5 ? 1 : 0;
            const pathData = [
              `M ${startX} ${startY}`,
              `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
              `L 0 0`,
            ].join(' ');

            return <path key={index} d={pathData} fill={COLOURS[index % COLOURS.length]} />;
          })}
          {/* Inner circle for "Donut" look */}
          <circle cx="0" cy="0" r="0.65" fill="white" />
        </svg>
      </div>
      
      {/* Vertical Legend on the Right */}
      <div className="flex flex-col gap-3 pr-2 min-w-[100px]">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full shrink-0" 
              style={{ backgroundColor: COLOURS[index % COLOURS.length] }}
            ></div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-600 uppercase leading-none tracking-tighter">
                {item.name}
              </span>
              <span className="text-[9px] font-bold text-gray-400 mt-1">
                {item.value.toFixed(1)} mi
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Helpers ---
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
  const DUMMY_USER_ID = '00000000-0000-0000-0000-000000000000';

  useEffect(() => {
    const fetchTrips = async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        setLoading(false);
        return;
      }

      try {
        /**
         * RELATIONAL QUERY LOGIC:
         * We query 'trips' and embed 'trip_legs'.
         * Inside 'trip_legs', we further embed 'travel_modes' to get the descriptive name.
         */
        const url = `${supabaseUrl}/rest/v1/trips?select=*,trip_legs(mode_id,is_baseline,distance_km,travel_modes(mode_name))&user_id=eq.${DUMMY_USER_ID}&order=date_time.desc`;
        
        const response = await fetch(url, {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        const mappedTrips: Trip[] = data.map((raw: any) => {
          // Filter out baseline legs (which represent the 'car alternative' for CO2 calculations)
          const actualLegs = raw.trip_legs?.filter((l: any) => !l.is_baseline) || [];
          
          // Aggregate distances per mode for this specific trip
          const modeDistances: ModeDistance[] = actualLegs.map((l: any) => ({
            modeName: l.travel_modes?.mode_name || 'Other',
            distanceMiles: parseFloat((l.distance_km * 0.621371).toFixed(2))
          }));

          // Identify the mode that accounts for the majority of the distance
          const primaryMode = modeDistances.reduce((prev, current) => 
            (prev.distanceMiles > current.distanceMiles) ? prev : current, 
            { modeName: 'None', distanceMiles: 0 }
          ).modeName;

          return {
            id: raw.trip_id.toString(),
            date: raw.date_time,
            origin: raw.start_location_address?.split(',')[0] || 'Unknown',
            destination: raw.end_location_address?.split(',')[0] || 'Unknown',
            distanceMiles: parseFloat((raw.total_actual_distance_km * 0.621371).toFixed(1)),
            emissionsKg: parseFloat((raw.total_actual_co2_kg || 0).toFixed(2)),
            savedKg: parseFloat((raw.total_saved_co2_kg || 0).toFixed(2)),
            purpose: raw.description,
            type: raw.is_business_travel ? 'Business' : 'Personal',
            modeDistances,
            primaryMode
          };
        });

        setTrips(mappedTrips);
      } catch (err) {
        console.error('Data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, []);

  // --- Derived State ---
  const groupedTrips = useMemo(() => groupTripsByMonth(trips), [trips]);
  
  const stats = useMemo(() => {
    const totalBusinessMiles = trips.filter(t => t.type === 'Business').reduce((acc, curr) => acc + curr.distanceMiles, 0);
    const totalPersonalMiles = trips.filter(t => t.type === 'Personal').reduce((acc, curr) => acc + curr.distanceMiles, 0);
    const totalSavedCO2 = trips.reduce((acc, curr) => acc + curr.savedKg, 0);
    return { totalBusinessMiles, totalPersonalMiles, totalSavedCO2 };
  }, [trips]);

  const pieChartData = useMemo(() => {
    if (trips.length === 0) return [];
    const months = Object.keys(groupedTrips);
    if (months.length === 0) return [];
    
    const latestMonthTrips = groupedTrips[months[0]];
    const modeTotals: Record<string, number> = {};

    // Aggregate distance totals by mode across all legs of all trips in the month
    latestMonthTrips.forEach(trip => {
      trip.modeDistances.forEach(leg => {
        modeTotals[leg.modeName] = (modeTotals[leg.modeName] || 0) + leg.distanceMiles;
      });
    });

    return Object.entries(modeTotals)
      .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value);
  }, [trips, groupedTrips]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-bold uppercase tracking-widest text-[10px]">Retrieving Account Trip Data</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-12 text-gray-900 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Personal Travel Log</h1>
            <p className="text-gray-600 mt-2 font-bold uppercase text-[10px] tracking-widest">
              Account • <span className="text-green-600">you@takethegreenway.com</span>
            </p>
          </div>
          <div className="bg-white px-8 py-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-end">
            <span className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-1">Total CO2 Savings</span>
            <p className="text-3xl font-black text-gray-900 leading-none">
              {stats.totalSavedCO2.toFixed(1)} <span className="text-sm font-medium text-gray-400">kg</span>
            </p>
          </div>
        </header>

        {/* Analytics Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
          
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group">
              <div className="relative z-10">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Business Travel</h3>
                <p className="text-6xl font-black text-green-600 tracking-tighter">
                  {stats.totalBusinessMiles.toFixed(1)}
                  <span className="text-xl font-bold text-gray-400 ml-2 uppercase tracking-tight">mi</span>
                </p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group">
              <div className="relative z-10">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Personal Travel</h3>
                <p className="text-6xl font-black text-blue-600 tracking-tighter">
                  {stats.totalPersonalMiles.toFixed(1)}
                  <span className="text-xl font-bold text-gray-400 ml-2 uppercase tracking-tight">mi</span>
                </p>
              </div>
            </div>

            <div className="md:col-span-2 bg-gradient-to-br from-green-600 to-green-700 p-8 rounded-[2rem] shadow-xl text-white">
              <h3 className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-2">Sustainable Progress</h3>
              <p className="text-3xl font-black leading-tight max-w-sm">
                You've prevented {stats.totalSavedCO2.toFixed(1)}kg of carbon emissions this year.
              </p>
              <div className="mt-6 flex items-center gap-4">
                <div className="h-2 flex-1 bg-green-800 rounded-full overflow-hidden">
                  <div className="h-full bg-green-300 w-[65%] rounded-full"></div>
                </div>
                <span className="text-xs font-black uppercase">65% of Target</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Distance by Mode</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-8">Current Month Distribution</p>
            <div className="flex-1 w-full flex flex-col">
              <div className="flex-1 min-h-[180px]">
                <SimplePieChart data={pieChartData} />
              </div>
            </div>
          </div>

        </div>

        {/* Detailed Logs Section */}
        <div className="space-y-16">
          {Object.entries(groupedTrips).map(([month, monthTrips]) => (
            <section key={month}>
              <div className="flex items-center gap-4 mb-8">
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">{month}</h2>
                <div className="h-[1px] w-full bg-gray-100"></div>
              </div>
              
              <div className="space-y-4">
                {monthTrips.map((trip) => (
                  <div 
                    key={trip.id} 
                    className="bg-white rounded-3xl p-7 shadow-sm border border-gray-100 hover:border-green-200 hover:shadow-lg transition-all duration-500"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                      
                      <div className="flex flex-col md:w-32">
                        <span className="text-2xl font-black text-gray-900 tracking-tight">
                          {new Date(trip.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                        <span className={`text-[10px] font-black uppercase tracking-widest mt-2 ${
                          trip.type === 'Business' ? 'text-green-500' : 'text-blue-500'
                        }`}>
                          {trip.type}
                        </span>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 text-lg font-bold text-gray-900 mb-2">
                          {trip.origin} 
                          <span className="text-gray-200 font-light text-2xl">→</span> 
                          {trip.destination}
                        </div>
                        <div className="flex items-center gap-3 text-xs font-bold text-gray-400">
                          <span className="bg-gray-50 px-3 py-1 rounded-full text-[9px] uppercase tracking-tighter text-gray-600 border border-gray-100">
                            {trip.modeDistances.length > 1 ? 'Multimodal' : trip.primaryMode}
                          </span>
                          <span className="opacity-60">{trip.purpose}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <div className="text-3xl font-black text-gray-900 tracking-tight">
                          {trip.distanceMiles}
                          <span className="text-xs font-bold text-gray-400 ml-1 uppercase">mi</span>
                        </div>
                        {trip.savedKg > 0 ? (
                          <div className="text-[10px] font-black text-green-600 bg-green-50/50 px-3 py-1 rounded-full border border-green-100 flex items-center gap-1 mt-1">
                            <span className="text-sm">↓</span> {trip.savedKg}kg CO2
                          </div>
                        ) : (
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-2">No savings</span>
                        )}
                      </div>
                      
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <footer className="mt-24 pt-10 border-t border-gray-100 text-center">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
            The Green Way Carbon Tracking • 2026
          </p>
        </footer>

      </div>
    </main>
  );
}