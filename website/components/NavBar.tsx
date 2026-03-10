import Link from 'next/link';

export default function NavBar() {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        {/* Logo / Home Link */}
        <a href="/" className="flex items-center gap-2">
            <img src="/Dino.png" alt="Dino" className="h-10 w-auto object-contain"/>
            <span className="text-xl font-bold text-green-700">The Green Way</span>
          </a>

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
            Individual Dashboard
          </Link>
          <Link 
            href="/company" 
            className="text-gray-600 hover:text-green-600 font-medium transition-colors"
          >
            Company Dashboard
          </Link>
        </div>
      </div>
    </nav>
  );
}