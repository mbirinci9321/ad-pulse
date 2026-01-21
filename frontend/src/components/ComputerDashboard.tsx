import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { computerApi } from '../api/client';
import type { ComputerInfo } from '../types';
import { MagnifyingGlassIcon, ComputerDesktopIcon, FunnelIcon } from '@heroicons/react/24/outline';
import Alert from './Alert';
import type { OUInfo } from '../types';

export default function ComputerDashboard() {
  const [computers, setComputers] = useState<ComputerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOU, setSelectedOU] = useState<string>('');
  const [ous, setOUs] = useState<OUInfo[]>([]);

  // Sayfalama durumu
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    loadData();
  }, [searchTerm, selectedOU, page, pageSize]);

  // Arama veya OU değişince sayfayı sıfırla
  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedOU]);

  useEffect(() => {
    loadOUs();
  }, []);

  const loadOUs = async () => {
    try {
      const ousData = await computerApi.getOUs();
      setOUs(ousData);
    } catch (err) {
      console.error('OU yükleme hatası:', err);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const paginatedData = await computerApi.getComputersPaginated({
        page,
        page_size: pageSize,
        search: searchTerm || undefined,
        ou: selectedOU || undefined
      });
      setComputers(paginatedData.computers);
      setTotalCount(paginatedData.total_count);
      setTotalPages(paginatedData.total_pages);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Veriler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Hiç giriş yapmamış';
    try {
      return new Date(dateString).toLocaleString('tr-TR');
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (enabled: boolean, disabled: boolean) => {
    if (disabled || !enabled) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Pasif
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Aktif
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <ComputerDesktopIcon className="w-8 h-8 mr-3" />
          Bilgisayar Yönetimi
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Active Directory bilgisayarlarını görüntüleyin ve yönetin
        </p>
      </div>

      {/* Filtreler */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              <MagnifyingGlassIcon className="w-4 h-4 inline mr-1" />
              Arama
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Bilgisayar adı, DNS adı veya IP ile ara..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label htmlFor="ou" className="block text-sm font-medium text-gray-700 mb-2">
              <FunnelIcon className="w-4 h-4 inline mr-1" />
              OU Filtresi
            </label>
            <select
              id="ou"
              value={selectedOU}
              onChange={(e) => setSelectedOU(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Tüm OU'lar</option>
              {ous.map((ou) => (
                <option key={ou.distinguished_name} value={ou.distinguished_name}>
                  {ou.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Hata Mesajı */}
      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* Computer Tablosu */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Yükleniyor...</p>
          </div>
        ) : computers.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            Bilgisayar bulunamadı
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bilgisayar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    DNS Adı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşletim Sistemi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Son Giriş
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    OU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {computers.map((computer) => (
                  <tr key={computer.sam_account_name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {computer.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {computer.sam_account_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {computer.dns_host_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{computer.operating_system || '-'}</div>
                      {computer.operating_system_version && (
                        <div className="text-xs text-gray-400">
                          {computer.operating_system_version}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{formatDate(computer.last_logon_timestamp || computer.last_logon)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {computer.organizational_unit || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(computer.account_enabled, computer.account_disabled)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/computer/${computer.sam_account_name}`}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        Detaylar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Sayfalama Kontrolleri */}
        {!loading && computers.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Önceki
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Sonraki
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Toplam <span className="font-medium">{totalCount}</span> sonuçtan{' '}
                  <span className="font-medium">{(page - 1) * pageSize + 1}</span> ile{' '}
                  <span className="font-medium">{Math.min(page * pageSize, totalCount)}</span> arası gösteriliyor
                </p>
              </div>
              <div className="flex items-center gap-4">
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value={10}>10 satır</option>
                  <option value={25}>25 satır</option>
                  <option value={50}>50 satır</option>
                  <option value={100}>100 satır</option>
                </select>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    İlk
                  </button>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Geri
                  </button>
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    Sayfa {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    İleri
                  </button>
                  <button
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Son
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* İstatistikler */}
      {!loading && computers.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600">Toplam Bilgisayar</div>
            <div className="text-2xl font-bold text-gray-900">{computers.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600">Aktif Bilgisayar</div>
            <div className="text-2xl font-bold text-green-600">
              {computers.filter((c) => c.account_enabled && !c.account_disabled).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600">Pasif Bilgisayar</div>
            <div className="text-2xl font-bold text-red-600">
              {computers.filter((c) => c.account_disabled || !c.account_enabled).length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
