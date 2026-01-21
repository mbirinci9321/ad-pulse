import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userApi, groupApi } from '../api/client';
import type { UserInfo, GroupInfo } from '../types';
import { MagnifyingGlassIcon, FunnelIcon, ExclamationTriangleIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';
import Alert from './Alert';

export default function Dashboard() {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [actionType, setActionType] = useState<'add' | 'remove'>('add');
  const [selectedGroupForAction, setSelectedGroupForAction] = useState('');

  // Sayfalama durumu
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    loadData();
  }, [selectedGroup, searchTerm, page, pageSize]);

  // Arama veya grup değişince sayfayı sıfırla
  useEffect(() => {
    setPage(1);
  }, [selectedGroup, searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [paginatedUsers, groupsData] = await Promise.all([
        userApi.getUsersPaginated({
          page,
          page_size: pageSize,
          group: selectedGroup || undefined,
          search: searchTerm || undefined
        }),
        groupApi.getGroups(),
      ]);

      setUsers(paginatedUsers.users);
      setTotalCount(paginatedUsers.total_count);
      setTotalPages(paginatedUsers.total_pages);
      setGroups(groupsData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Veriler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Belirtilmemiş';
    try {
      return new Date(dateString).toLocaleString('tr-TR');
    } catch {
      return dateString;
    }
  };

  const getPasswordExpiryStatus = (expiresDate?: string) => {
    if (!expiresDate) return { status: 'unknown', days: null, color: 'gray' };

    try {
      const expires = new Date(expiresDate);
      const now = new Date();
      const diffTime = expires.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return { status: 'expired', days: Math.abs(diffDays), color: 'red' };
      } else if (diffDays <= 7) {
        return { status: 'critical', days: diffDays, color: 'red' };
      } else if (diffDays <= 30) {
        return { status: 'warning', days: diffDays, color: 'yellow' };
      } else {
        return { status: 'ok', days: diffDays, color: 'green' };
      }
    } catch {
      return { status: 'unknown', days: null, color: 'gray' };
    }
  };

  const getPasswordExpiryBadge = (expiresDate?: string) => {
    const status = getPasswordExpiryStatus(expiresDate);

    if (status.status === 'expired') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
          <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
          Süresi Dolmuş ({status.days} gün)
        </span>
      );
    } else if (status.status === 'critical') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
          <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
          {status.days} gün kaldı
        </span>
      );
    } else if (status.status === 'warning') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
          <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
          {status.days} gün kaldı
        </span>
      );
    }
    return null;
  };

  const handleGroupAction = async () => {
    if (!selectedUser || !selectedGroupForAction) return;

    try {
      setError(null);
      if (actionType === 'add') {
        await userApi.addUserToGroup(selectedUser.sam_account_name, { group_name: selectedGroupForAction });
        setSuccess(`Kullanıcı '${selectedGroupForAction}' grubuna eklendi`);
      } else {
        await userApi.removeUserFromGroup(selectedUser.sam_account_name, { group_name: selectedGroupForAction });
        setSuccess(`Kullanıcı '${selectedGroupForAction}' grubundan çıkarıldı`);
      }
      setShowGroupModal(false);
      setSelectedUser(null);
      setSelectedGroupForAction('');
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Grup işlemi başarısız oldu');
    }
  };

  const openGroupModal = (user: UserInfo, type: 'add' | 'remove') => {
    setSelectedUser(user);
    setActionType(type);
    setShowGroupModal(true);
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
        <h1 className="text-3xl font-bold text-gray-900">Kullanıcı Yönetimi</h1>
        <p className="mt-2 text-sm text-gray-600">
          Active Directory kullanıcılarını görüntüleyin ve yönetin
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
              placeholder="İsim, kullanıcı adı veya e-posta ile ara..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label htmlFor="group" className="block text-sm font-medium text-gray-700 mb-2">
              <FunnelIcon className="w-4 h-4 inline mr-1" />
              Grup Filtresi
            </label>
            <select
              id="group"
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Tüm Gruplar</option>
              {groups.map((group) => (
                <option key={group.name} value={group.name}>
                  {group.name} ({group.member_count} üye)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Mesajlar */}
      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}
      {success && (
        <Alert
          type="success"
          message={success}
          onClose={() => setSuccess(null)}
        />
      )}

      {/* Kullanıcı Tablosu */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Yükleniyor...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            Kullanıcı bulunamadı
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kullanıcı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    E-posta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gruplar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Şifre Değişim
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
                {users.map((user) => {
                  const passwordStatus = getPasswordExpiryStatus(user.password_expires);
                  const rowClass = passwordStatus.status === 'expired' || passwordStatus.status === 'critical'
                    ? 'bg-red-50 hover:bg-red-100'
                    : passwordStatus.status === 'warning'
                      ? 'bg-yellow-50 hover:bg-yellow-100'
                      : 'hover:bg-gray-50';

                  return (
                    <tr key={user.sam_account_name} className={rowClass}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {user.display_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.sam_account_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {user.groups.slice(0, 3).map((group) => (
                            <span
                              key={group}
                              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {group}
                            </span>
                          ))}
                          {user.groups.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              +{user.groups.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="text-gray-500">Son: {formatDate(user.password_last_set)}</div>
                        <div className="mt-1">
                          {getPasswordExpiryBadge(user.password_expires)}
                          {!getPasswordExpiryBadge(user.password_expires) && (
                            <span className="text-xs text-gray-400">
                              Sonraki: {formatDate(user.password_expires)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(user.account_enabled, user.account_disabled)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openGroupModal(user, 'add')}
                            className="text-green-600 hover:text-green-900"
                            title="Gruba ekle"
                          >
                            <PlusIcon className="w-4 h-4" />
                          </button>
                          {user.groups.length > 0 && (
                            <button
                              onClick={() => openGroupModal(user, 'remove')}
                              className="text-red-600 hover:text-red-900"
                              title="Gruptan çıkar"
                            >
                              <MinusIcon className="w-4 h-4" />
                            </button>
                          )}
                          <Link
                            to={`/user/${user.sam_account_name}`}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Detaylar
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Sayfalama Kontrolleri */}
        {!loading && users.length > 0 && (
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
      {!loading && users.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600">Toplam Kullanıcı</div>
            <div className="text-2xl font-bold text-gray-900">{users.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600">Aktif Kullanıcı</div>
            <div className="text-2xl font-bold text-green-600">
              {users.filter((u) => u.account_enabled && !u.account_disabled).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500">
            <div className="text-sm text-gray-600 flex items-center">
              <ExclamationTriangleIcon className="w-4 h-4 mr-1 text-red-600" />
              Şifre Süresi Yaklaşan
            </div>
            <div className="text-2xl font-bold text-red-600">
              {users.filter((u) => {
                const status = getPasswordExpiryStatus(u.password_expires);
                return status.status === 'critical' || status.status === 'expired';
              }).length}
            </div>
            <div className="text-xs text-gray-500 mt-1">7 gün içinde</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
            <div className="text-sm text-gray-600 flex items-center">
              <ExclamationTriangleIcon className="w-4 h-4 mr-1 text-yellow-600" />
              Şifre Uyarısı
            </div>
            <div className="text-2xl font-bold text-yellow-600">
              {users.filter((u) => {
                const status = getPasswordExpiryStatus(u.password_expires);
                return status.status === 'warning';
              }).length}
            </div>
            <div className="text-xs text-gray-500 mt-1">30 gün içinde</div>
          </div>
        </div>
      )}

      {/* Grup Yönetim Modal */}
      {showGroupModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {actionType === 'add' ? 'Gruba Ekle' : 'Gruptan Çıkar'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Kullanıcı: <strong>{selectedUser.display_name}</strong>
              </p>
              <select
                value={selectedGroupForAction}
                onChange={(e) => setSelectedGroupForAction(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 mb-4"
              >
                <option value="">Grup seçin...</option>
                {actionType === 'add'
                  ? groups
                    .filter((group) => !selectedUser.groups.includes(group.name))
                    .map((group) => (
                      <option key={group.name} value={group.name}>
                        {group.name}
                      </option>
                    ))
                  : selectedUser.groups.map((groupName) => (
                    <option key={groupName} value={groupName}>
                      {groupName}
                    </option>
                  ))
                }
              </select>
              <div className="flex space-x-2">
                <button
                  onClick={handleGroupAction}
                  disabled={!selectedGroupForAction}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                >
                  {actionType === 'add' ? (
                    <>
                      <PlusIcon className="w-4 h-4 mr-1" />
                      Ekle
                    </>
                  ) : (
                    <>
                      <MinusIcon className="w-4 h-4 mr-1" />
                      Çıkar
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowGroupModal(false);
                    setSelectedUser(null);
                    setSelectedGroupForAction('');
                  }}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
