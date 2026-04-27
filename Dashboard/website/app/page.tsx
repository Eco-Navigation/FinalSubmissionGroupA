import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Travel Smarter. <br />
          <span className="text-green-600">Track Greener.</span>
        </h1>
        
        <p className="text-lg text-gray-600 mb-8">
          Welcome to the employee travel portal. Track your business trips, 
          manage expenses, and monitor your carbon footprint in one place.
        </p>

        <div className="flex justify-center gap-4">
          <Link 
            href="/dashboard" 
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-all"
          >
            See Individual Overview
          </Link>
          
          <Link 
            href="/company" 
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-all"
          >
            See Company Overview
          </Link>

          <Link 
            href="/navigation" 
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-all"
          >
            See Navigation
          </Link>
        </div>
      </div>
    </main>
  );
}