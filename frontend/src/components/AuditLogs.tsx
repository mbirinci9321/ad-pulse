import { useState, useEffect } from 'react';
import { auditApi, changesApi } from '../api/client';
import type { AuditLogEntry, AuditLogsResponse, ADChange, ADChangesResponse } from '../types';
import {
    ClockIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
    CheckCircleIcon,
    XCircleIcon,
    ArrowPathIcon,
    DocumentTextIcon,
    ComputerDesktopIcon,
    UserIcon,
    UserGroupIcon
} from '@heroicons/react/24/outline';

const AuditLogs = () => {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [search, setSearch] = useState('');
    const [actionType, setActionType] = useState('');
    const [targetType, setTargetType] = useState('');
    const [source, setSource] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // AD Changes
    const [adChanges, setAdChanges] = useState<ADChange[]>([]);
    const [adChangesLoading, setAdChangesLoading] = useState(false);
    const [adChangesHours, setAdChangesHours] = useState(24);

    // Tab
    const [activeTab, setActiveTab] = useState<'app_logs' | 'ad_changes'>('app_logs');

    // Pagination
    const [offset, setOffset] = useState(0);
    const limit = 50;

    const loadLogs = async () => {
        setLoading(true);
        setError(null);
        try {
            const response: AuditLogsResponse = await auditApi.getLogs({
                limit,
                offset,
                action_type: actionType || undefined,
                target_type: targetType || undefined,
                source: source || undefined,
                start_date: startDate || undefined,
                end_date: endDate || undefined,
                search: search || undefined
            });
            setLogs(response.logs);
            setTotalCount(response.total_count);
        } catch (err) {
            setError('Audit logları yüklenirken hata oluştu');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadAdChanges = async () => {
        setAdChangesLoading(true);
        try {
            const response: ADChangesResponse = await changesApi.getRecentChanges(adChangesHours, 'all');
            setAdChanges(response.changes);
        } catch (err) {
            console.error('AD değişiklikleri yüklenemedi:', err);
        } finally {
            setAdChangesLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'app_logs') {
            loadLogs();
        } else {
            loadAdChanges();
        }
    }, [activeTab, offset, actionType, targetType, source, startDate, endDate, adChangesHours]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setOffset(0);
        loadLogs();
    };

    const getActionTypeLabel = (action: string): string => {
        const labels: Record<string, string> = {
            'password_reset': 'Şifre Sıfırlama',
            'account_enable': 'Hesap Aktif',
            'account_disable': 'Hesap Devre Dışı',
            'group_add': 'Gruba Ekleme',
            'group_remove': 'Gruptan Çıkarma',
            'computer_enable': 'Bilgisayar Aktif',
            'computer_disable': 'Bilgisayar Devre Dışı',
            'computer_group_add': 'Bilgisayar Gruba Ekleme',
            'computer_group_remove': 'Bilgisayar Gruptan Çıkarma',
            'member_add': 'Üye Ekleme',
            'member_remove': 'Üye Çıkarma',
            'ad_change_detected': 'AD Değişiklik Tespit'
        };
        return labels[action] || action;
    };

    const getActionTypeBadgeColor = (action: string): string => {
        const colors: Record<string, string> = {
            'password_reset': 'bg-yellow-100 text-yellow-800',
            'account_enable': 'bg-green-100 text-green-800',
            'account_disable': 'bg-red-100 text-red-800',
            'group_add': 'bg-blue-100 text-blue-800',
            'group_remove': 'bg-orange-100 text-orange-800',
            'computer_enable': 'bg-green-100 text-green-800',
            'computer_disable': 'bg-red-100 text-red-800',
            'ad_change_detected': 'bg-purple-100 text-purple-800'
        };
        return colors[action] || 'bg-gray-100 text-gray-800';
    };

    const getTargetTypeIcon = (type: string) => {
        switch (type) {
            case 'user': return <UserIcon className="w-4 h-4" />;
            case 'computer': return <ComputerDesktopIcon className="w-4 h-4" />;
            case 'group': return <UserGroupIcon className="w-4 h-4" />;
            default: return <DocumentTextIcon className="w-4 h-4" />;
        }
    };

    const formatDate = (dateString: string): string => {
        try {
            const date = new Date(dateString);
            return date.toLocaleString('tr-TR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch {
            return dateString;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="mb-8 items-center justify-between flex">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Audit Logları</h1>
                    <p className="text-gray-600 mt-2 text-sm">
                        Uygulama işlemleri ve AD değişiklikleri takibi
                    </p>
                </div>
                <button
                    onClick={() => activeTab === 'app_logs' ? loadLogs() : loadAdChanges()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <ArrowPathIcon className="w-4 h-4" />
                    Yenile
                </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('app_logs')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'app_logs'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <DocumentTextIcon className="w-5 h-5 inline mr-2" />
                        Uygulama İşlemleri
                    </button>
                    <button
                        onClick={() => setActiveTab('ad_changes')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'ad_changes'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <ClockIcon className="w-5 h-5 inline mr-2" />
                        AD Değişiklikleri (RSAT/Diğer)
                    </button>
                </nav>
            </div>

            {activeTab === 'app_logs' ? (
                <>
                    {/* Filters */}
                    <div className="bg-white rounded-lg shadow p-4">
                        <form onSubmit={handleSearch} className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <div className="relative">
                                        <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="Ara... (hedef obje, işlemi yapan)"
                                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Ara
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <FunnelIcon className="w-4 h-4 inline mr-1" />
                                        İşlem Türü
                                    </label>
                                    <select
                                        value={actionType}
                                        onChange={(e) => { setActionType(e.target.value); setOffset(0); }}
                                        className="w-full border rounded-lg px-3 py-2"
                                    >
                                        <option value="">Tümü</option>
                                        <option value="password_reset">Şifre Sıfırlama</option>
                                        <option value="account_enable">Hesap Aktif</option>
                                        <option value="account_disable">Hesap Devre Dışı</option>
                                        <option value="group_add">Gruba Ekleme</option>
                                        <option value="group_remove">Gruptan Çıkarma</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Hedef Türü
                                    </label>
                                    <select
                                        value={targetType}
                                        onChange={(e) => { setTargetType(e.target.value); setOffset(0); }}
                                        className="w-full border rounded-lg px-3 py-2"
                                    >
                                        <option value="">Tümü</option>
                                        <option value="user">Kullanıcı</option>
                                        <option value="computer">Bilgisayar</option>
                                        <option value="group">Grup</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Kaynak
                                    </label>
                                    <select
                                        value={source}
                                        onChange={(e) => { setSource(e.target.value); setOffset(0); }}
                                        className="w-full border rounded-lg px-3 py-2"
                                    >
                                        <option value="">Tümü</option>
                                        <option value="web_app">Web Uygulaması</option>
                                        <option value="ad_detected">AD Tespit</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Başlangıç Tarihi
                                    </label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => { setStartDate(e.target.value); setOffset(0); }}
                                        className="w-full border rounded-lg px-3 py-2"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Bitiş Tarihi
                                    </label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => { setEndDate(e.target.value); setOffset(0); }}
                                        className="w-full border rounded-lg px-3 py-2"
                                    />
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Logs Table */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <span className="ml-3 text-gray-600">Yükleniyor...</span>
                            </div>
                        ) : error ? (
                            <div className="p-6 text-center text-red-600">{error}</div>
                        ) : logs.length === 0 ? (
                            <div className="p-6 text-center text-gray-500">
                                Kayıt bulunamadı
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Tarih
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    İşlem
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Hedef
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    İşlemi Yapan
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Durum
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Detay
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {logs.map((log) => (
                                                <tr key={log.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {formatDate(log.timestamp)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionTypeBadgeColor(log.action_type)}`}>
                                                            {getActionTypeLabel(log.action_type)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            {getTargetTypeIcon(log.target_type)}
                                                            <span className="text-sm font-medium text-gray-900">{log.target_object}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {log.performed_by}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {log.success ? (
                                                            <span className="inline-flex items-center gap-1 text-green-600">
                                                                <CheckCircleIcon className="w-4 h-4" />
                                                                Başarılı
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-red-600">
                                                                <XCircleIcon className="w-4 h-4" />
                                                                Başarısız
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                                        {(log.details as Record<string, string>)?.action || log.error_message || '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t">
                                    <div className="text-sm text-gray-500">
                                        Toplam {totalCount} kayıt, {offset + 1}-{Math.min(offset + limit, totalCount)} arası gösteriliyor
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setOffset(Math.max(0, offset - limit))}
                                            disabled={offset === 0}
                                            className="px-3 py-1 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Önceki
                                        </button>
                                        <button
                                            onClick={() => setOffset(offset + limit)}
                                            disabled={offset + limit >= totalCount}
                                            className="px-3 py-1 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Sonraki
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </>
            ) : (
                <>
                    {/* AD Changes */}
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-medium text-gray-700">
                                Son kaç saat:
                            </label>
                            <select
                                value={adChangesHours}
                                onChange={(e) => setAdChangesHours(Number(e.target.value))}
                                className="border rounded-lg px-3 py-2"
                            >
                                <option value={1}>1 saat</option>
                                <option value={6}>6 saat</option>
                                <option value={12}>12 saat</option>
                                <option value={24}>24 saat</option>
                                <option value={48}>48 saat</option>
                                <option value={168}>1 hafta</option>
                            </select>
                            <span className="text-sm text-gray-500">
                                (RSAT, PowerShell veya diğer araçlardan yapılan değişiklikler)
                            </span>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        {adChangesLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <span className="ml-3 text-gray-600">Yükleniyor...</span>
                            </div>
                        ) : adChanges.length === 0 ? (
                            <div className="p-6 text-center text-gray-500">
                                Son {adChangesHours} saat içinde değişiklik bulunamadı
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Değişiklik Tarihi
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Tür
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Obje
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                İşlem
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Oluşturulma Tarihi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {adChanges.map((change, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDate(change.when_changed)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        {getTargetTypeIcon(change.object_type)}
                                                        <span className="text-sm capitalize">{change.object_type}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{change.display_name}</div>
                                                        <div className="text-sm text-gray-500">{change.sam_account_name}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${change.change_type === 'created'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-blue-100 text-blue-800'
                                                        }`}>
                                                        {change.change_type === 'created' ? 'Yeni Oluşturuldu' : 'Güncellendi'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDate(change.when_created)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default AuditLogs;
