import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { userApi, groupApi } from '../api/client';
import type { UserInfo, GroupInfo } from '../types';
import {
  ArrowLeftIcon,
  KeyIcon,
  LockClosedIcon,
  LockOpenIcon,
  UserGroupIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import Alert from './Alert';

export default function UserDetail() {
  const { samAccountName } = useParams<{ samAccountName: string }>();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [allGroups, setAllGroups] = useState<GroupInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [mustChangePassword, setMustChangePassword] = useState(true);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState('');

  useEffect(() => {
    if (samAccountName) {
      loadUserData();
      loadGroups();
    }
  }, [samAccountName]);

  const loadUserData = async () => {
    if (!samAccountName) return;
    try {
      setLoading(true);
      setError(null);
      const userData = await userApi.getUser(samAccountName);
      setUser(userData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Kullanıcı bilgileri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      const groupsData = await groupApi.getGroups();
      setAllGroups(groupsData);
    } catch (err) {
      console.error('Gruplar yüklenirken hata:', err);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!samAccountName || !newPassword) return;

    try {
      setError(null);
      await userApi.resetPassword(samAccountName, {
        new_password: newPassword,
        must_change: mustChangePassword,
      });
      setSuccess('Şifre başarıyla sıfırlandı');
      setShowPasswordReset(false);
      setNewPassword('');
      await loadUserData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Şifre sıfırlanırken bir hata oluştu');
    }
  };

  const handleAccountStatusChange = async (enabled: boolean) => {
    if (!samAccountName) return;

    try {
      setError(null);
      await userApi.setAccountStatus(samAccountName, { enabled });
      setSuccess(`Hesap ${enabled ? 'aktif' : 'pasif'} yapıldı`);
      await loadUserData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Hesap durumu değiştirilirken bir hata oluştu');
    }
  };

  const handleAddToGroup = async () => {
    if (!samAccountName || !selectedGroup) return;

    try {
      setError(null);
      await userApi.addUserToGroup(samAccountName, { group_name: selectedGroup });
      setSuccess(`Kullanıcı '${selectedGroup}' grubuna eklendi`);
      setShowAddGroup(false);
      setSelectedGroup('');
      await loadUserData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Grup üyeliği eklenirken bir hata oluştu');
    }
  };

  const handleRemoveFromGroup = async (groupName: string) => {
    if (!samAccountName) return;

    try {
      setError(null);
      await userApi.removeUserFromGroup(samAccountName, { group_name: groupName });
      setSuccess(`Kullanıcı '${groupName}' grubundan çıkarıldı`);
      await loadUserData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Grup üyeliği kaldırılırken bir hata oluştu');
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

  const availableGroups = allGroups.filter(
    (group) => !user?.groups.includes(group.name)
  );

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-600">Yükleniyor...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Kullanıcı bulunamadı</p>
        <Link to="/" className="mt-4 text-primary-600 hover:text-primary-900">
          Geri dön
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1" />
          Geri
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{user.display_name}</h1>
        <p className="mt-1 text-sm text-gray-600">{user.sam_account_name}</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol Kolon - Kullanıcı Bilgileri */}
        <div className="lg:col-span-2 space-y-6">
          {/* Temel Bilgiler */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Temel Bilgiler</h2>
            <dl className="grid grid-cols-1 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Görünen Ad</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.display_name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Kullanıcı Adı</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.sam_account_name}</dd>
              </div>
              {user.email && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">E-posta</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Hesap Durumu</dt>
                <dd className="mt-1">
                  {user.account_disabled || !user.account_enabled ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Pasif
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Aktif
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          {/* Şifre Bilgileri */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Şifre Bilgileri</h2>
            <dl className="grid grid-cols-1 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Son Şifre Değişimi</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(user.password_last_set)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Şifre Son Kullanma</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(user.password_expires)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Grup Üyelikleri */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Grup Üyelikleri</h2>
              <button
                onClick={() => setShowAddGroup(true)}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-primary-600 hover:bg-primary-700"
              >
                <UserGroupIcon className="w-4 h-4 mr-1" />
                Grup Ekle
              </button>
            </div>
            {user.groups.length === 0 ? (
              <p className="text-sm text-gray-500">Kullanıcı hiçbir gruba üye değil</p>
            ) : (
              <div className="space-y-2">
                {user.groups.map((group) => (
                  <div
                    key={group}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <span className="text-sm text-gray-900">{group}</span>
                    <button
                      onClick={() => handleRemoveFromGroup(group)}
                      className="text-red-600 hover:text-red-900"
                      title="Gruptan çıkar"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sağ Kolon - Yönetim İşlemleri */}
        <div className="space-y-6">
          {/* Şifre Sıfırlama */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <KeyIcon className="w-5 h-5 mr-2" />
              Şifre İşlemleri
            </h2>
            {!showPasswordReset ? (
              <button
                onClick={() => setShowPasswordReset(true)}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                Şifre Sıfırla
              </button>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yeni Şifre
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="mustChange"
                    checked={mustChangePassword}
                    onChange={(e) => setMustChangePassword(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="mustChange" className="ml-2 block text-sm text-gray-700">
                    İlk girişte şifre değiştirmeyi zorunlu kıl
                  </label>
                </div>
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <CheckIcon className="w-4 h-4 mr-1" />
                    Onayla
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordReset(false);
                      setNewPassword('');
                    }}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    İptal
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Hesap Durumu */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              {user.account_enabled && !user.account_disabled ? (
                <LockOpenIcon className="w-5 h-5 mr-2 text-green-600" />
              ) : (
                <LockClosedIcon className="w-5 h-5 mr-2 text-red-600" />
              )}
              Hesap Durumu
            </h2>
            <div className="space-y-2">
              <button
                onClick={() => handleAccountStatusChange(true)}
                disabled={user.account_enabled && !user.account_disabled}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hesabı Aktif Yap
              </button>
              <button
                onClick={() => handleAccountStatusChange(false)}
                disabled={user.account_disabled || !user.account_enabled}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hesabı Pasif Yap
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grup Ekleme Modal */}
      {showAddGroup && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Grup Ekle</h3>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 mb-4"
              >
                <option value="">Grup seçin...</option>
                {availableGroups.map((group) => (
                  <option key={group.name} value={group.name}>
                    {group.name}
                  </option>
                ))}
              </select>
              <div className="flex space-x-2">
                <button
                  onClick={handleAddToGroup}
                  disabled={!selectedGroup}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                >
                  Ekle
                </button>
                <button
                  onClick={() => {
                    setShowAddGroup(false);
                    setSelectedGroup('');
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
