import Link from 'next/link';

export default function NavBar() {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        {/* Logo / Home Link */}
        <Link href="/" className="text-xl font-bold text-green-700 hover:text-green-800">
          TakeTheGreenway
        </Link>

        {/* Navigation Links */}
        <div className="flex gap-6">
          <Link 
            href="/" 
            className="text-gray-600 hover:text-green-600 font-medium transition-colors"
          >
            Home
          </Link>
          <Link 
            href="/dashboard" 
            className="text-gray-600 hover:text-green-600 font-medium transition-colors"
          >
            Personal Overview
          </Link>
        </div>
      </div>
    </nav>
  );
}