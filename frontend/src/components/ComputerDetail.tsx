import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { computerApi, groupApi } from '../api/client';
import type { ComputerInfo, GroupInfo, OUInfo } from '../types';
import {
  ArrowLeftIcon,
  UserGroupIcon,
  XMarkIcon,
  ComputerDesktopIcon,
  FolderIcon,
} from '@heroicons/react/24/outline';
import Alert from './Alert';

export default function ComputerDetail() {
  const { samAccountName } = useParams<{ samAccountName: string }>();
  const [computer, setComputer] = useState<ComputerInfo | null>(null);
  const [allGroups, setAllGroups] = useState<GroupInfo[]>([]);
  const [ous, setOUs] = useState<OUInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [showMoveOU, setShowMoveOU] = useState(false);
  const [selectedOU, setSelectedOU] = useState('');

  useEffect(() => {
    if (samAccountName) {
      loadData();
    }
  }, [samAccountName]);

  const loadData = async () => {
    if (!samAccountName) return;
    try {
      setLoading(true);
      setError(null);
      const [computerData, groupsData, ousData] = await Promise.all([
        computerApi.getComputer(samAccountName),
        groupApi.getGroups(),
        computerApi.getOUs(),
      ]);
      setComputer(computerData);
      setAllGroups(groupsData);
      setOUs(ousData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Veriler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountStatusChange = async (enabled: boolean) => {
    if (!samAccountName) return;
    try {
      setError(null);
      await computerApi.setComputerStatus(samAccountName, { enabled });
      setSuccess(`Bilgisayar ${enabled ? 'aktif' : 'pasif'} yapıldı`);
      const updated = await computerApi.getComputer(samAccountName);
      setComputer(updated);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Bir hata oluştu');
    }
  };

  const handleAddToGroup = async () => {
    if (!samAccountName || !selectedGroup) return;
    try {
      setError(null);
      await computerApi.addComputerToGroup(samAccountName, { group_name: selectedGroup });
      setSuccess(`Bilgisayar '${selectedGroup}' grubuna eklendi`);
      setShowAddGroup(false);
      setSelectedGroup('');
      const updated = await computerApi.getComputer(samAccountName);
      setComputer(updated);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Bir hata oluştu');
    }
  };

  const handleRemoveFromGroup = async (groupName: string) => {
    if (!samAccountName) return;
    try {
      setError(null);
      await computerApi.removeComputerFromGroup(samAccountName, { group_name: groupName });
      setSuccess(`Bilgisayar '${groupName}' grubundan çıkarıldı`);
      const updated = await computerApi.getComputer(samAccountName);
      setComputer(updated);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Bir hata oluştu');
    }
  };

  const handleMoveOU = async () => {
    if (!samAccountName || !selectedOU) return;
    try {
      setError(null);
      await computerApi.moveComputer(samAccountName, { target_ou_dn: selectedOU });
      setSuccess(`Bilgisayar yeni OU'ya taşındı`);
      setShowMoveOU(false);
      setSelectedOU('');
      const updated = await computerApi.getComputer(samAccountName);
      setComputer(updated);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Bir hata oluştu');
    }
  };

  const availableGroups = allGroups.filter(
    (group) => !computer?.groups.includes(group.name)
  );

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-600">Yükleniyor...</p>
      </div>
    );
  }

  if (!computer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Bilgisayar bulunamadı</p>
        <Link to="/computers" className="mt-4 text-primary-600 hover:text-primary-900">
          Geri dön
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/computers" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeftIcon className="w-4 h-4 mr-1" /> Geri
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <ComputerDesktopIcon className="w-8 h-8 mr-3" /> {computer.name}
        </h1>
        <p className="mt-1 text-sm text-gray-600">{computer.sam_account_name}</p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Temel Bilgiler</h2>
            <dl className="grid grid-cols-1 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Bilgisayar Adı</dt>
                <dd className="mt-1 text-sm text-gray-900">{computer.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">DNS Host Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{computer.dns_host_name || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Organizational Unit</dt>
                <dd className="mt-1 text-sm text-gray-900">{computer.organizational_unit || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Açıklama</dt>
                <dd className="mt-1 text-sm text-gray-900">{computer.description || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Hesap Durumu</dt>
                <dd className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${computer.account_disabled || !computer.account_enabled ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                    {computer.account_disabled || !computer.account_enabled ? 'Pasif' : 'Aktif'}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Grup Üyelikleri</h2>
            <div className="flex justify-end mb-4">
              <button onClick={() => setShowAddGroup(true)} className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-primary-600 hover:bg-primary-700">
                <UserGroupIcon className="w-4 h-4 mr-1" /> Grup Ekle
              </button>
            </div>
            {computer.groups.length === 0 ? (
              <p className="text-sm text-gray-500">Grup üyeliği yok</p>
            ) : (
              <div className="space-y-2">
                {computer.groups.map((group) => (
                  <div key={group} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-900">{group}</span>
                    <button onClick={() => handleRemoveFromGroup(group)} className="text-red-600 hover:text-red-900">
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Hesap Yönetimi</h2>
            <div className="space-y-2">
              <button
                onClick={() => handleAccountStatusChange(true)}
                disabled={computer.account_enabled && !computer.account_disabled}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                Aktif Yap
              </button>
              <button
                onClick={() => handleAccountStatusChange(false)}
                disabled={computer.account_disabled || !computer.account_enabled}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                Pasif Yap
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FolderIcon className="w-5 h-5 mr-2 text-primary-600" /> OU Yönetimi
            </h2>
            <button
              onClick={() => {
                const dnParts = computer.distinguished_name.split(',');
                dnParts.shift(); // Remove computer name
                setSelectedOU(dnParts.join(','));
                setShowMoveOU(true);
              }}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              OU'ya Taşı
            </button>
          </div>
        </div>
      </div>

      {showAddGroup && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">Gruba Ekle</h3>
              <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm mb-4">
                <option value="">Grup seçin...</option>
                {availableGroups.map((g) => <option key={g.name} value={g.name}>{g.name}</option>)}
              </select>
              <div className="flex space-x-2">
                <button onClick={handleAddToGroup} disabled={!selectedGroup} className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50">Ekle</button>
                <button onClick={() => setShowAddGroup(false)} className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300">İptal</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showMoveOU && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">Bilgisayarı Taşı</h3>
              <div className="max-h-96 overflow-y-auto mb-4 border rounded">
                {ous.map((ou) => (
                  <label key={ou.distinguished_name} className={`flex items-center p-3 border-b hover:bg-gray-50 cursor-pointer ${selectedOU === ou.distinguished_name ? 'bg-primary-50' : ''}`}>
                    <input type="radio" value={ou.distinguished_name} checked={selectedOU === ou.distinguished_name} onChange={(e) => setSelectedOU(e.target.value)} className="mr-3" />
                    <div>
                      <div className="text-sm font-medium">{ou.name}</div>
                      <div className="text-xs text-gray-500 truncate w-96">{ou.distinguished_name}</div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex space-x-2">
                <button onClick={handleMoveOU} disabled={!selectedOU} className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50">Taşı</button>
                <button onClick={() => setShowMoveOU(false)} className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300">İptal</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
