# AD Pulse 🚀

**AD Pulse**, Active Directory (AD) yönetimi için geliştirilmiş, modern, hızlı ve kullanıcı dostu bir web arayüzüdür. Sistem yöneticilerinin günlük AD operasyonlarını (kullanıcı yönetimi, bilgisayar takibi, grup üyelikleri) tek bir panelden kolayca yönetmesini sağlar.

![License](https://img.shields.io/badge/license-Custom-blue.svg)
![Python](https://img.shields.io/badge/Python-3.8+-green.svg)
![React](https://img.shields.io/badge/React-18.0+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-Latest-009688.svg)

---

## ✨ Özellikler

### 👤 Kullanıcı Yönetimi
- **Kapsamlı Listeleme:** Tüm kullanıcıları OU ve grup bazlı filtreleme.
- **Detaylı Görünüm:** Şifre değişim tarihleri, hesap durumu (Aktif/Pasif) ve üye olunan gruplar.
- **Hızlı İşlemler:** Şifre sıfırlama (ilk girişte değiştirme zorunluluğu ile), hesap kilidi açma/kapama.
- **Grup Yönetimi:** Kullanıcıları sürükle-bırak mantığında (veya seçimle) gruplara ekleme ve çıkarma.

### 💻 Bilgisayar (Computer) Yönetimi
- **Envanter Takibi:** İşletim sistemi versiyonları, DNS adları ve son giriş zamanları.
- **OU Filtreleme:** Bilgisayarları bağlı oldukları OU'lara göre görüntüleme.
- **Durum Kontrolü:** Bilgisayar hesaplarını aktif veya pasif yapabilme.

### 👥 Grup Yönetimi
- **Grup Listesi:** Tüm güvenlik ve dağıtım gruplarının yönetimi.
- **Üye Yönetimi:** Grup üyelerini (kullanıcı ve bilgisayar) anlık görme ve düzenleme.

### 📊 Raporlama ve Analitik
- **Şifre Takibi:** Şifresi dolmak üzere olan kullanıcıların dashboard üzerinde görselleştirilmesi.
- **Pasif Cihazlar:** Belirli bir süredir login olmayan bilgisayarların raporlanması.
- **Genel İstatistikler:** Toplam kullanıcı, aktif/pasif oranları ve OS dağılım grafikleri.

---

## 🛠️ Teknoloji Stack

- **Backend:** Python + FastAPI (Performanslı ve async mimari)
- **Frontend:** React + TypeScript + Vite (Modern ve tip güvenli gelişim)
- **Styling:** Tailwind CSS (Modern ve responsive tasarım)
- **AD Bağlantısı:** `ldap3` kütüphanesi ile güvenli LDAP/LDAPS iletişimi.
- **Paketleme:** PyInstaller (Taşınabilir .exe oluşturma)

---

## 🚀 Kurulum ve Çalıştırma

### 1. Hazır Executable (Hızlı Başlangıç)
> **Not:** `backend/dist` klasörü ve `.exe` dosyası ve kendi executable dosyanızı oluşturmak için aşağıdaki adımları izleyin:

1. **Frontend Build:** `frontend` klasöründe `npm install` ve `npm run build` komutlarını çalıştırın.
2. **Backend Hazırlık:** `backend` klasöründe `pip install -r requirements.txt` komutunu çalıştırın.
3. **Executable Oluşturma:** `backend` klasöründeki `python build_exe.py` dosyasını çalıştırın.
4. Bu işlem sonucunda `backend/dist/AD-Pulse.exe` dosyası oluşacaktır.

**Kullanım:**
- `AD-Pulse.exe` yanındaki `config.env.example` dosyasını `config.env` olarak kopyalayın.
- AD bağlantı bilgilerinizi girin.
- `AD-Pulse.exe` dosyasını çalıştırın.

### 2. Geliştirici Modu (Source Code)

#### Backend:
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

#### Frontend:
```bash
cd frontend
npm install
npm run dev
```

---

## ⚙️ Konfigürasyon (.env)

Uygulamanın AD ile iletişim kurabilmesi için aşağıdaki bilgilere ihtiyaç vardır:

```env
LDAP_SERVER=192.168.1.10
LDAP_DOMAIN=sirket.local
LDAP_USERNAME=admin-user@sirket.local
LDAP_PASSWORD=Sifre123!
LDAP_BASE_DN=DC=sirket,DC=local
MOCK_MODE=false
```

---

## 🛡️ Güvenlik Notları
- **Least Privilege:** Uygulamanın çalışması için kullanılan AD hesabının sadece gerekli izinlere (Read/Write/Reset Password) sahip olması önerilir.
- **Şifre Güvenliği:** Bağlantı şifreleri asla tarayıcıda (LocalStorage) tutulmaz. Sadece API seviyesinde işlenir.
- **Audit Logs:** Uygulama üzerinden yapılan tüm kritik işlemler (şifre sıfırlama, grup değişikliği vb.) yerel bir audit log sisteminde kayıt altına alınır.

---

## 📄 Lisans

Bu proje **Murat Birinci Tech Labs** tarafından geliştirilmiştir ve özel lisans şartlarına tabidir. Detaylar için `LICENSE` dosyasına bakınız.

---

**Geliştiren:** [Murat Birinci](https://www.linkedin.com/in/murat-birinci-4b4562190/)
**İletişim:** murat@muratbirinci.com.tr
