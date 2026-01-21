import { ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import LicenseModal from './LicenseModal';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [showLicense, setShowLicense] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link
                to="/"
                className="flex items-center px-2 py-2 text-xl font-semibold text-gray-900 hover:text-primary-600"
              >
                <svg
                  className="w-8 h-8 mr-2 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                AD Pulse
              </Link>
              <nav className="flex space-x-4">
                <Link
                  to="/"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100"
                >
                  Kullanıcılar
                </Link>
                <Link
                  to="/computers"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100"
                >
                  Bilgisayarlar
                </Link>
                <Link
                  to="/groups"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100"
                >
                  Gruplar
                </Link>
                <Link
                  to="/audit"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100"
                >
                  Audit Logları
                </Link>
                <Link
                  to="/reports"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100"
                >
                  Raporlar
                </Link>
                <Link
                  to="/settings"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100"
                >
                  Ayarlar
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-8 flex-grow w-full">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center text-xs text-gray-500">
          <div>
            &copy; {new Date().getFullYear()} Murat Birinci Tech Labs. Tüm hakları saklıdır.
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => setShowLicense(true)}
              className="hover:text-primary-600 underline"
            >
              Lisans ve Sözleşme
            </button>
            <span>v1.0.0</span>
          </div>
        </div>
      </footer>

      <LicenseModal isOpen={showLicense} onClose={() => setShowLicense(false)} />
    </div>
  );
}
