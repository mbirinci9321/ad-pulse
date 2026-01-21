# AD Pulse - Management Tool

FastAPI tabanlı Active Directory yönetim API'si.

## Kurulum

```bash
# Virtual environment oluştur
python -m venv venv

# Virtual environment'ı aktif et
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Bağımlılıkları yükle
pip install -r requirements.txt
```

## Konfigürasyon

`.env` dosyası oluşturun:

```env
LDAP_SERVER=your-ad-server.com
LDAP_DOMAIN=yourdomain.com
LDAP_USERNAME=admin@yourdomain.com
LDAP_PASSWORD=yourpassword
LDAP_BASE_DN=DC=yourdomain,DC=com
```

## Çalıştırma

```bash
python main.py
```

API `http://localhost:8000` adresinde çalışacaktır.

API dokümantasyonu: `http://localhost:8000/docs`

## API Endpoints

- `GET /` - API bilgisi
- `GET /api/users` - Kullanıcıları listele
- `GET /api/users/{sam_account_name}` - Kullanıcı detayı
- `POST /api/users/{sam_account_name}/reset-password` - Şifre sıfırla
- `POST /api/users/{sam_account_name}/account-status` - Hesap durumunu değiştir
- `GET /api/groups` - Grupları listele
- `POST /api/users/{sam_account_name}/groups/add` - Gruba ekle
- `POST /api/users/{sam_account_name}/groups/remove` - Gruptan çıkar
- `GET /api/health` - Sağlık kontrolü
