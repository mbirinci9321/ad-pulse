import { useState, useEffect } from 'react';
import { reportsApi, dashboardApi } from '../api/client';
import type {
    PasswordExpiryReport,
    InactiveComputersReport,
    ComputerInventoryReport,
    DashboardStats
} from '../types';
import {
    DocumentChartBarIcon,
    ComputerDesktopIcon,
    KeyIcon,
    ClockIcon,
    ChartPieIcon,
    ExclamationTriangleIcon,
    UserIcon
} from '@heroicons/react/24/outline';

const Reports = () => {
    const [activeReport, setActiveReport] = useState<'password' | 'inactive' | 'inventory' | 'stats'>('stats');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Report data
    const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
    const [passwordReport, setPasswordReport] = useState<PasswordExpiryReport | null>(null);
    const [inactiveReport, setInactiveReport] = useState<InactiveComputersReport | null>(null);
    const [inventoryReport, setInventoryReport] = useState<ComputerInventoryReport | null>(null);

    // Filters
    const [passwordDays, setPasswordDays] = useState(7);
    const [inactiveDays, setInactiveDays] = useState(30);

    const loadDashboardStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const stats = await dashboardApi.getStats();
            setDashboardStats(stats);
        } catch (err) {
            setError('Dashboard istatistikleri yüklenemedi');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadPasswordReport = async () => {
        setLoading(true);
        setError(null);
        try {
            const report = await reportsApi.getPasswordExpiryReport(passwordDays);
            setPasswordReport(report);
        } catch (err) {
            setError('Şifre süresi raporu yüklenemedi');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadInactiveReport = async () => {
        setLoading(true);
        setError(null);
        try {
            const report = await reportsApi.getInactiveComputersReport(inactiveDays);
            setInactiveReport(report);
        } catch (err) {
            setError('Pasif bilgisayar raporu yüklenemedi');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadInventoryReport = async () => {
        setLoading(true);
        setError(null);
        try {
            const report = await reportsApi.getComputerInventory();
            setInventoryReport(report);
        } catch (err) {
            setError('Envanter raporu yüklenemedi');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        switch (activeReport) {
            case 'stats':
                loadDashboardStats();
                break;
            case 'password':
                loadPasswordReport();
                break;
            case 'inactive':
                loadInactiveReport();
                break;
            case 'inventory':
                loadInventoryReport();
                break;
        }
    }, [activeReport, passwordDays, inactiveDays]);

    const reportButtons = [
        { id: 'stats', label: 'Genel İstatistikler', icon: ChartPieIcon },
        { id: 'password', label: 'Şifre Süresi', icon: KeyIcon },
        { id: 'inactive', label: 'Pasif Bilgisayarlar', icon: ClockIcon },
        { id: 'inventory', label: 'Bilgisayar Envanteri', icon: ComputerDesktopIcon },
    ] as const;

    const formatDate = (dateString: string): string => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
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
                    <h1 className="text-3xl font-bold text-gray-900">Raporlar & Analitik</h1>
                    <p className="text-gray-600 mt-2 text-sm">
                        Detaylı raporlar ve istatistikler
                    </p>
                </div>
            </div>

            {/* Report Type Selection */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {reportButtons.map((report) => (
                    <button
                        key={report.id}
                        onClick={() => setActiveReport(report.id)}
                        className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${activeReport === report.id
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white hover:border-gray-300 text-gray-600'
                            }`}
                    >
                        <report.icon className="w-8 h-8" />
                        <span className="font-medium text-sm">{report.label}</span>
                    </button>
                ))}
            </div>

            {/* Report Content */}
            <div className="bg-white rounded-lg shadow">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-gray-600">Rapor yükleniyor...</span>
                    </div>
                ) : error ? (
                    <div className="p-6 text-center text-red-600">{error}</div>
                ) : (
                    <>
                        {/* Dashboard Stats */}
                        {activeReport === 'stats' && dashboardStats && (
                            <div className="p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-6">Genel İstatistikler</h2>

                                {/* Summary Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-blue-100 text-sm">Toplam Kullanıcı</p>
                                                <p className="text-3xl font-bold">{dashboardStats.total_users}</p>
                                            </div>
                                            <UserIcon className="w-12 h-12 text-blue-200" />
                                        </div>
                                        <div className="mt-2 text-sm">
                                            <span className="text-green-200">{dashboardStats.active_users} aktif</span>
                                            <span className="mx-2">•</span>
                                            <span className="text-red-200">{dashboardStats.disabled_users} pasif</span>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-green-100 text-sm">Toplam Bilgisayar</p>
                                                <p className="text-3xl font-bold">{dashboardStats.total_computers}</p>
                                            </div>
                                            <ComputerDesktopIcon className="w-12 h-12 text-green-200" />
                                        </div>
                                        <div className="mt-2 text-sm">
                                            <span className="text-green-200">{dashboardStats.active_computers} aktif</span>
                                            <span className="mx-2">•</span>
                                            <span className="text-red-200">{dashboardStats.disabled_computers} pasif</span>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-purple-100 text-sm">Toplam Grup</p>
                                                <p className="text-3xl font-bold">{dashboardStats.total_groups}</p>
                                            </div>
                                            <DocumentChartBarIcon className="w-12 h-12 text-purple-200" />
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 text-white">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-orange-100 text-sm">Şifre Süresi Dolacak</p>
                                                <p className="text-3xl font-bold">{dashboardStats.expiring_passwords.length}</p>
                                            </div>
                                            <ExclamationTriangleIcon className="w-12 h-12 text-orange-200" />
                                        </div>
                                        <p className="mt-2 text-sm text-orange-100">7 gün içinde</p>
                                    </div>
                                </div>

                                {/* Charts */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Users by Department */}
                                    <div className="border rounded-lg p-4">
                                        <h3 className="font-semibold text-gray-900 mb-4">Departmana Göre Kullanıcılar</h3>
                                        <div className="space-y-2">
                                            {Object.entries(dashboardStats.users_by_department).map(([dept, count]) => (
                                                <div key={dept} className="flex items-center gap-2">
                                                    <div className="w-32 truncate text-sm text-gray-600">{dept}</div>
                                                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-blue-500 rounded-full"
                                                            style={{
                                                                width: `${Math.min(100, (count / dashboardStats.total_users) * 100)}%`
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="w-12 text-sm font-medium text-gray-900 text-right">{count}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Computers by OS */}
                                    <div className="border rounded-lg p-4">
                                        <h3 className="font-semibold text-gray-900 mb-4">İşletim Sistemine Göre Bilgisayarlar</h3>
                                        <div className="space-y-2">
                                            {Object.entries(dashboardStats.computers_by_os).map(([os, count]) => (
                                                <div key={os} className="flex items-center gap-2">
                                                    <div className="w-40 truncate text-sm text-gray-600" title={os}>{os}</div>
                                                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-green-500 rounded-full"
                                                            style={{
                                                                width: `${Math.min(100, (count / dashboardStats.total_computers) * 100)}%`
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="w-12 text-sm font-medium text-gray-900 text-right">{count}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Expiring Passwords */}
                                {dashboardStats.expiring_passwords.length > 0 && (
                                    <div className="mt-6 border rounded-lg p-4">
                                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <ExclamationTriangleIcon className="w-5 h-5 text-orange-500" />
                                            Şifre Süresi Dolacak Kullanıcılar (7 Gün İçinde)
                                        </h3>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead>
                                                    <tr>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Kullanıcı</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Kalan Gün</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {dashboardStats.expiring_passwords.map((user, i) => (
                                                        <tr key={i}>
                                                            <td className="px-4 py-2 text-sm">
                                                                <div className="font-medium text-gray-900">{user.display_name}</div>
                                                                <div className="text-gray-500">{user.sam_account_name}</div>
                                                            </td>
                                                            <td className="px-4 py-2">
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.days_left <= 1
                                                                    ? 'bg-red-100 text-red-800'
                                                                    : user.days_left <= 3
                                                                        ? 'bg-orange-100 text-orange-800'
                                                                        : 'bg-yellow-100 text-yellow-800'
                                                                    }`}>
                                                                    {user.days_left} gün
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Password Expiry Report */}
                        {activeReport === 'password' && (
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-semibold text-gray-900">Şifre Süresi Dolacak Kullanıcılar</h2>
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm text-gray-600">Eşik:</label>
                                        <select
                                            value={passwordDays}
                                            onChange={(e) => setPasswordDays(Number(e.target.value))}
                                            className="border rounded-lg px-3 py-1"
                                        >
                                            <option value={3}>3 gün</option>
                                            <option value={7}>7 gün</option>
                                            <option value={14}>14 gün</option>
                                            <option value={30}>30 gün</option>
                                        </select>
                                    </div>
                                </div>

                                {passwordReport && (
                                    <>
                                        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                            <p className="text-sm text-yellow-800">
                                                <strong>{passwordReport.total_count}</strong> kullanıcının şifresi{' '}
                                                <strong>{passwordReport.days_threshold}</strong> gün içinde dolacak
                                            </p>
                                        </div>

                                        {passwordReport.users.length === 0 ? (
                                            <p className="text-center text-gray-500 py-8">
                                                Belirtilen sürede şifresi dolacak kullanıcı bulunamadı
                                            </p>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kullanıcı</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hesap Adı</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kalan Gün</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {passwordReport.users.map((user, i) => (
                                                            <tr key={i} className="hover:bg-gray-50">
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <span className="font-medium text-gray-900">{user.display_name}</span>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                    {user.sam_account_name}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.days_left <= 1
                                                                        ? 'bg-red-100 text-red-800'
                                                                        : user.days_left <= 3
                                                                            ? 'bg-orange-100 text-orange-800'
                                                                            : 'bg-yellow-100 text-yellow-800'
                                                                        }`}>
                                                                        {user.days_left} gün
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* Inactive Computers Report */}
                        {activeReport === 'inactive' && (
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-semibold text-gray-900">Pasif Bilgisayarlar</h2>
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm text-gray-600">Son giriş:</label>
                                        <select
                                            value={inactiveDays}
                                            onChange={(e) => setInactiveDays(Number(e.target.value))}
                                            className="border rounded-lg px-3 py-1"
                                        >
                                            <option value={7}>7 gün</option>
                                            <option value={30}>30 gün</option>
                                            <option value={60}>60 gün</option>
                                            <option value={90}>90 gün</option>
                                            <option value={180}>180 gün</option>
                                        </select>
                                        <span className="text-sm text-gray-500">önce</span>
                                    </div>
                                </div>

                                {inactiveReport && (
                                    <>
                                        <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                            <p className="text-sm text-gray-800">
                                                <strong>{inactiveReport.total_count}</strong> bilgisayar son{' '}
                                                <strong>{inactiveReport.days_threshold}</strong> gündür aktif değil
                                            </p>
                                        </div>

                                        {inactiveReport.computers.length === 0 ? (
                                            <p className="text-center text-gray-500 py-8">
                                                Belirtilen sürede pasif bilgisayar bulunamadı
                                            </p>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bilgisayar</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşletim Sistemi</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">OU</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Son Giriş</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {inactiveReport.computers.map((comp, i) => (
                                                            <tr key={i} className="hover:bg-gray-50">
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="font-medium text-gray-900">{comp.name}</div>
                                                                    <div className="text-sm text-gray-500">{comp.sam_account_name}</div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                    {comp.operating_system || '-'}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                    {comp.organizational_unit || '-'}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                    {formatDate(comp.last_logon)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* Computer Inventory Report */}
                        {activeReport === 'inventory' && (
                            <div className="p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-6">Bilgisayar Envanteri</h2>

                                {inventoryReport && (
                                    <>
                                        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                            <p className="text-sm text-blue-800">
                                                Toplam <strong>{inventoryReport.total_count}</strong> bilgisayar,{' '}
                                                <strong>{Object.keys(inventoryReport.inventory).length}</strong> farklı işletim sistemi
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {Object.entries(inventoryReport.inventory).map(([os, data]) => (
                                                <div key={os} className="border rounded-lg p-4">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h3 className="font-medium text-gray-900 truncate" title={os}>{os}</h3>
                                                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                                            {data.count}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-1 max-h-40 overflow-y-auto">
                                                        {data.computers.slice(0, 10).map((comp, i) => (
                                                            <div key={i} className="text-sm text-gray-600 truncate">
                                                                {comp}
                                                            </div>
                                                        ))}
                                                        {data.computers.length > 10 && (
                                                            <div className="text-sm text-gray-400 italic">
                                                                +{data.computers.length - 10} daha...
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Reports;
