import { useState, useEffect } from 'react';
import { groupApi, computerApi } from '../api/client';
import type { GroupInfo, OUInfo } from '../types';
import {
    UserGroupIcon,
    PlusIcon,
    TrashIcon,
    MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import Alert from './Alert';

export default function Groups() {
    const [groups, setGroups] = useState<GroupInfo[]>([]);
    const [ous, setOUs] = useState<OUInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // New Group Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDescription, setNewGroupDescription] = useState('');
    const [selectedOU, setSelectedOU] = useState('');

    // Delete Confirmation
    const [groupToDelete, setGroupToDelete] = useState<string | null>(null);

    useEffect(() => {
        loadData();
        loadOUs();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await groupApi.getGroups();
            setGroups(data);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Gruplar yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const loadOUs = async () => {
        try {
            const data = await computerApi.getOUs();
            setOUs(data);
        } catch (err) {
            console.error('OUlar yüklenirken hata:', err);
        }
    };

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGroupName) return;

        try {
            setError(null);
            await groupApi.createGroup({
                name: newGroupName,
                description: newGroupDescription,
                ou_path: selectedOU || undefined,
            });
            setSuccess(`'${newGroupName}' grubu başarıyla oluşturuldu`);
            setShowCreateModal(false);
            setNewGroupName('');
            setNewGroupDescription('');
            setSelectedOU('');
            loadData();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Grup oluşturulurken hata oluştu');
        }
    };

    const handleDeleteGroup = async () => {
        if (!groupToDelete) return;

        try {
            setError(null);
            await groupApi.deleteGroup(groupToDelete);
            setSuccess(`'${groupToDelete}' grubu silindi`);
            setGroupToDelete(null);
            loadData();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Grup silinirken hata oluştu');
        }
    };

    const filteredGroups = groups.filter((g) =>
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.distinguished_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                        <UserGroupIcon className="w-8 h-8 mr-3 text-primary-600" />
                        Grup Yönetimi
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Active Directory gruplarını görüntüleyin, oluşturun veya silin
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 shadow-sm"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Yeni Grup
                </button>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
            {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

            <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Grup ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-500">Yükleniyor...</div>
                ) : filteredGroups.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">Grup bulunamadı</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grup Adı</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Üye Sayısı</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DN</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredGroups.map((group) => (
                                    <tr key={group.distinguished_name} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{group.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {group.member_count}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400 truncate max-w-xs">
                                            {group.distinguished_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => setGroupToDelete(group.name)}
                                                className="text-red-600 hover:text-red-900"
                                                title="Grubu Sil"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Group Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-1/2 shadow-lg rounded-md bg-white">
                        <form onSubmit={handleCreateGroup}>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Yeni Grup Oluştur</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Grup Adı</label>
                                    <input
                                        type="text"
                                        required
                                        value={newGroupName}
                                        onChange={(e) => setNewGroupName(e.target.value)}
                                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Açıklama</label>
                                    <textarea
                                        value={newGroupDescription}
                                        onChange={(e) => setNewGroupDescription(e.target.value)}
                                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                        rows={3}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Organizational Unit (Opsiyonel)</label>
                                    <select
                                        value={selectedOU}
                                        onChange={(e) => setSelectedOU(e.target.value)}
                                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                    >
                                        <option value="">Varsayılan (Users)</option>
                                        {ous.map((ou) => (
                                            <option key={ou.distinguished_name} value={ou.distinguished_name}>
                                                {ou.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="mt-6 flex space-x-3">
                                <button
                                    type="submit"
                                    className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 shadow-sm transition-colors"
                                >
                                    Oluştur
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 shadow-sm transition-colors"
                                >
                                    İptal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {groupToDelete && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-40 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Grubu Sil?</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            '<strong>{groupToDelete}</strong>' grubunu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                        </p>
                        <div className="flex space-x-3">
                            <button
                                onClick={handleDeleteGroup}
                                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                            >
                                Sil
                            </button>
                            <button
                                onClick={() => setGroupToDelete(null)}
                                className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50"
                            >
                                İptal
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
