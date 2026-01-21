import { useState, useEffect } from 'react';
import { settingsApi } from '../api/client';
import type { ConnectionSettings, ConnectionTestResult } from '../types';
import Alert from './Alert';
import {
  Cog6ToothIcon,
  ServerIcon,
  KeyIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

const STORAGE_KEY = 'ad_connection_settings';

export default function Settings() {
  const [settings, setSettings] = useState<ConnectionSettings>({
    server: '',
    domain: '',
    username: '',
    password: '',
    base_dn: '',
  });
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // LocalStorage'dan ayarları yükle
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({
          ...settings,
          ...parsed,
          password: '', // Güvenlik için şifreyi saklama
        });
      } catch (e) {
        console.error('Ayarlar yüklenirken hata:', e);
      }
    }
  }, []);

  const handleChange = (field: keyof ConnectionSettings, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTestConnection = async () => {
    if (!settings.server || !settings.domain || !settings.username || !settings.password || !settings.base_dn) {
      setError('Lütfen tüm alanları doldurun');
      return;
    }

    setTesting(true);
    setTestResult(null);
    setError(null);

    try {
      const result = await settingsApi.testConnection(settings);
      setTestResult(result);
      if (result.success) {
        setSuccess('Bağlantı testi başarılı!');
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Bağlantı testi sırasında bir hata oluştu');
      setTestResult({
        success: false,
        message: err.response?.data?.detail || 'Bağlantı testi sırasında bir hata oluştu',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    if (!settings.server || !settings.domain || !settings.username || !settings.base_dn) {
      setError('Lütfen zorunlu alanları doldurun (şifre hariç)');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Şifreyi hariç tutarak sakla (güvenlik)
      const settingsToSave = {
        server: settings.server,
        domain: settings.domain,
        username: settings.username,
        base_dn: settings.base_dn,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsToSave));
      setSuccess('Ayarlar kaydedildi! Not: Şifre güvenlik nedeniyle kaydedilmedi.');

      // Backend'e gönder (isteğe bağlı - şifre gönderilmemeli)
      // Burada sadece frontend'de saklıyoruz
    } catch (err: any) {
      setError('Ayarlar kaydedilirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    if (confirm('Tüm ayarları temizlemek istediğinizden emin misiniz?')) {
      localStorage.removeItem(STORAGE_KEY);
      setSettings({
        server: '',
        domain: '',
        username: '',
        password: '',
        base_dn: '',
      });
      setTestResult(null);
      setSuccess('Ayarlar temizlendi');
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Cog6ToothIcon className="w-8 h-8 mr-3" />
          Ayarlar
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Active Directory bağlantı bilgilerinizi yapılandırın ve test edin
        </p>
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
        {/* Sol Kolon - Ayarlar Formu */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <ServerIcon className="w-5 h-5 mr-2" />
              LDAP Bağlantı Ayarları
            </h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="server" className="block text-sm font-medium text-gray-700 mb-1">
                  LDAP Sunucu Adresi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="server"
                  value={settings.server}
                  onChange={(e) => handleChange('server', e.target.value)}
                  placeholder="ldap.example.com veya 192.168.1.1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  LDAP sunucunuzun IP adresi veya domain adı
                </p>
              </div>

              <div>
                <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-1">
                  Domain Adı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="domain"
                  value={settings.domain}
                  onChange={(e) => handleChange('domain', e.target.value)}
                  placeholder="example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Active Directory domain adınız (örn: example.com)
                </p>
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Kullanıcı Adı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="username"
                  value={settings.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  placeholder="admin veya admin@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  AD yönetim yetkisine sahip kullanıcı adı
                </p>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Şifre <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="password"
                  value={settings.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Güvenlik nedeniyle şifre kaydedilmez
                </p>
              </div>

              <div>
                <label htmlFor="base_dn" className="block text-sm font-medium text-gray-700 mb-1">
                  Base DN <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="base_dn"
                  value={settings.base_dn}
                  onChange={(e) => handleChange('base_dn', e.target.value)}
                  placeholder="DC=example,DC=com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  LDAP base distinguished name (örn: DC=example,DC=com)
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleTestConnection}
                  disabled={testing || !settings.server || !settings.domain || !settings.username || !settings.password || !settings.base_dn}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {testing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Test Ediliyor...
                    </>
                  ) : (
                    <>
                      <KeyIcon className="w-4 h-4 mr-2" />
                      Bağlantıyı Test Et
                    </>
                  )}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !settings.server || !settings.domain || !settings.username || !settings.base_dn}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
                </button>
                <button
                  onClick={handleClear}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Temizle
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sağ Kolon - Test Sonuçları ve Bilgiler */}
        <div className="space-y-6">
          {/* Test Sonuçları */}
          {testResult && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Sonucu</h3>
              {testResult.success ? (
                <div className="space-y-3">
                  <div className="flex items-center text-green-600">
                    <CheckCircleIcon className="w-6 h-6 mr-2" />
                    <span className="font-semibold">Bağlantı Başarılı</span>
                  </div>
                  <p className="text-sm text-gray-600">{testResult.message}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(testResult.timestamp).toLocaleString('tr-TR')}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center text-red-600">
                    <XCircleIcon className="w-6 h-6 mr-2" />
                    <span className="font-semibold">Bağlantı Başarısız</span>
                  </div>
                  <p className="text-sm text-gray-600">{testResult.message}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(testResult.timestamp).toLocaleString('tr-TR')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Bilgi Kutusu */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">💡 Bilgi</h3>
            <ul className="text-xs text-blue-800 space-y-2">
              <li>• Ayarlar tarayıcınızın localStorage'ında saklanır</li>
              <li>• Şifre güvenlik nedeniyle kaydedilmez</li>
              <li>• Her kullanımda şifreyi tekrar girmeniz gerekir</li>
              <li>• Bağlantı testi gerçek LDAP sunucusuna bağlanır</li>
              <li>• Mock mode aktifken test yapılamaz</li>
            </ul>
          </div>

          {/* Güvenlik Uyarısı */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-yellow-900 mb-3">⚠️ Güvenlik</h3>
            <ul className="text-xs text-yellow-800 space-y-2">
              <li>• En az yetki prensibine uygun hesap kullanın</li>
              <li>• Şifreler asla kaydedilmez</li>
              <li>• Üretim ortamında HTTPS kullanın</li>
              <li>• LDAPS (LDAP over SSL) önerilir</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
