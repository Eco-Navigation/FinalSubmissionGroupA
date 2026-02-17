import React from 'react';

// --- Types ---
type TripType = 'Business' | 'Personal';

interface Trip {
  id: string;
  date: string; // ISO format YYYY-MM-DD
  origin: string;
  destination: string;
  distanceMiles: number;
  purpose: string;
  type: TripType;
}

// --- Mock Data: 8 Trips ---
const trips: Trip[] = [
  // January 2026
  {
    id: 't1',
    date: '2026-01-10',
    origin: 'Home',
    destination: 'Client Site (Alpha Corp)',
    distanceMiles: 12.5,
    purpose: 'On-site Project Work',
    type: 'Business',
  },
  {
    id: 't2',
    date: '2026-01-12',
    origin: 'Client Site (Alpha Corp)',
    destination: 'HQ Office',
    distanceMiles: 8.0,
    purpose: 'Weekly Team Sync',
    type: 'Business',
  },
  {
    id: 't3',
    date: '2026-01-15',
    origin: 'HQ Office',
    destination: 'Client Site (Beta Ltd)',
    distanceMiles: 22.0,
    purpose: 'Client Workshop',
    type: 'Business',
  },
  {
    id: 't4',
    date: '2026-01-20',
    origin: 'Home',
    destination: 'Supermarket',
    distanceMiles: 3.2,
    purpose: 'Weekly Groceries',
    type: 'Personal',
  },
  
  // February 2026
  {
    id: 't5',
    date: '2026-02-02',
    origin: 'Home',
    destination: 'Client Site (Alpha Corp)',
    distanceMiles: 12.5,
    purpose: 'On-site Project Work',
    type: 'Business',
  },
  {
    id: 't6',
    date: '2026-02-05',
    origin: 'Client Site (Alpha Corp)',
    destination: 'Airport',
    distanceMiles: 45.0,
    purpose: 'Tech Conference Travel',
    type: 'Business',
  },
  {
    id: 't7',
    date: '2026-02-14',
    origin: 'Home',
    destination: 'Restaurant',
    distanceMiles: 5.5,
    purpose: 'Valentine\'s Dinner',
    type: 'Personal',
  },
  {
    id: 't8',
    date: '2026-02-20',
    origin: 'HQ Office',
    destination: 'Client Site (Alpha Corp)',
    distanceMiles: 8.0,
    purpose: 'Project Review',
    type: 'Business',
  },
];

// --- Helper: Group Trips by Month ---
const groupTripsByMonth = (trips: Trip[]) => {
  const groups: Record<string, Trip[]> = {};
  
  // Sort trips by date descending (newest first)
  const sortedTrips = [...trips].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
  const groupedTrips = groupTripsByMonth(trips);

  // Calculate totals
  const totalBusinessMiles = trips
    .filter(t => t.type === 'Business')
    .reduce((acc, curr) => acc + curr.distanceMiles, 0);

  const totalPersonalMiles = trips
    .filter(t => t.type === 'Personal')
    .reduce((acc, curr) => acc + curr.distanceMiles, 0);

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        
        {/* Page Header */}
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Personal Travel Log</h1>
          <p className="text-gray-600 mt-2">Manage your trip history and categorize expenses.</p>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Business Travel</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">{totalBusinessMiles} <span className="text-lg text-gray-400 font-normal">miles</span></p>
            <p className="text-xs text-gray-400 mt-1">Reimbursable</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Personal Travel</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{totalPersonalMiles} <span className="text-lg text-gray-400 font-normal">miles</span></p>
            <p className="text-xs text-gray-400 mt-1">Non-reimbursable</p>
          </div>
        </div>

        {/* Trips List */}
        <div className="space-y-8">
          {Object.entries(groupedTrips).map(([month, monthTrips]) => (
            <section key={month}>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                {month}
              </h2>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {monthTrips.map((trip) => (
                    <div key={trip.id} className="p-5 hover:bg-gray-50 transition-colors group">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        
                        {/* Left: Date & Type */}
                        <div className="flex flex-col sm:w-32 shrink-0">
                          <span className="font-bold text-gray-700">
                            {new Date(trip.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                          </span>
                          <span className={`inline-flex items-center w-fit px-2 py-0.5 rounded text-xs font-medium mt-1 ${
                            trip.type === 'Business' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {trip.type}
                          </span>
                        </div>

                        {/* Middle: Route & Purpose */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-gray-900 font-medium">
                            {trip.origin} 
                            <span className="text-gray-400">→</span> 
                            {trip.destination}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {trip.purpose}
                          </div>
                        </div>

                        {/* Right: Distance */}
                        <div className="text-right shrink-0">
                          <div className="text-lg font-bold text-gray-900">{trip.distanceMiles} mi</div>
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