import { Trophy, Medal, ArrowUpRight, User } from 'lucide-react';

// --- Hardcoded Example Data ---
const leaderboardData = [
  { name: 'Sarah Jenkins', dept: 'Marketing', saved: 124.5, trend: '+12%', rank: 1 },
  { name: 'Michael Chen', dept: 'Engineering', saved: 118.2, trend: '+8%', rank: 2 },
  { name: 'Emma Rodriguez', dept: 'Human Resources', saved: 95.7, trend: '+15%', rank: 3 },
  { name: 'David Kim', dept: 'Sales', saved: 82.1, trend: '+5%', rank: 4 },
  { name: 'Lisa Thompson', dept: 'Product', saved: 76.4, trend: '+2%', rank: 5 },
];

export function CompanyLeaderboard() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-gray-900">Top Contributors</h3>
          <p className="text-sm text-gray-500">Employee sustainability rankings</p>
        </div>
        <Trophy className="w-5 h-5 text-amber-500" />
      </div>

      <div className="space-y-4">
        {leaderboardData.map((employee, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-gray-200">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                {employee.rank <= 3 && (
                  <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white text-[10px] font-bold text-white ${
                    employee.rank === 1 ? 'bg-amber-400' : employee.rank === 2 ? 'bg-slate-400' : 'bg-amber-700'
                  }`}>
                    {employee.rank}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{employee.name}</p>
                <p className="text-xs text-gray-500">{employee.dept}</p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm font-bold text-green-600">{employee.saved} kg</p>
              <div className="flex items-center justify-end gap-1 text-[10px] font-medium text-green-600">
                <ArrowUpRight className="w-3 h-3" />
                <span>{employee.trend}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="w-full mt-6 py-2 px-4 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors">
        View Full Leaderboard
      </button>
    </div>
  );
}