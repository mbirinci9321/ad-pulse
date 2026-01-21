# AD User Management - Geliştirme Yol Haritası

## Faz 1: Temel Altyapı ✅
- [x] Proje yapısının oluşturulması
- [x] README ve roadmap dosyalarının hazırlanması
- [x] Backend API yapısının kurulması
- [x] Frontend proje yapısının kurulması

## Faz 2: AD Entegrasyonu ✅
- [x] LDAP bağlantı modülünün oluşturulması
- [x] Kullanıcı listesi API endpoint'i
- [x] Kullanıcı detay API endpoint'i
- [x] Grup bazlı filtreleme API endpoint'i

## Faz 3: Frontend Geliştirme ✅
- [x] Kullanıcı listesi görünümü
- [x] Filtreleme ve arama özellikleri
- [x] Kullanıcı detay sayfası
- [x] Grup seçici bileşeni
- [x] Tailwind CSS entegrasyonu

## Faz 4: Yönetim Özellikleri ✅
- [x] Şifre değiştirme zamanı gösterimi
- [x] Şifre sonraki değişim zamanı gösterimi
- [x] Hesap durumu göstergeleri (aktif/pasif/disable)
- [x] Şifre sıfırlama API ve UI
- [x] Hesap aktif/pasif yapma API ve UI
- [x] Grup üyelik yönetimi API ve UI
- [x] Attribute görüntüleme

## Faz 5: Bilgisayar (Computer) Yönetimi ✅
- [x] Computer model ve API endpoint'leri
- [x] Computer listeleme ve arama
- [x] Computer detay ve yönetim fonksiyonları
- [x] Computer frontend bileşenleri
- [x] Computer dashboard ve detay sayfası
- [x] Computer grup üyelik yönetimi
- [x] Computer hesap durumu yönetimi

## Faz 6: Grup Yönetimi ✅
- [x] Grup detay sayfası
- [x] Grup üyelerini görüntüleme
- [x] Grup üyelerini düzenleme (ekleme/çıkarma)
- [x] Kullanıcı ve bilgisayar grup üyelik yönetimi

## Faz 7: Ayarlar ve Konfigürasyon ✅
- [x] Ayarlar sayfası oluşturuldu
- [x] LDAP bağlantı bilgileri yapılandırma
- [x] Connection test özelliği
- [x] Ayarları localStorage'da saklama
- [x] Güvenlik uyarıları ve bilgilendirme

## Faz 8: Güvenlik ve İyileştirmeler 🔄
- [x] Least Privilege prensibine uygun LDAP bağlantı yapısı
- [x] Güvenlik dokümantasyonu
- [ ] Authentication ve Authorization (JWT/OAuth2)
- [ ] Rate limiting
- [ ] Logging ve monitoring
- [ ] Hata yönetimi iyileştirmeleri
- [ ] Performans optimizasyonları
- [ ] Responsive tasarım iyileştirmeleri

## Faz 9: Gelecek Geliştirmeler 💡

### Kullanıcı Yönetimi İyileştirmeleri
- [ ] Toplu kullanıcı işlemleri (bulk operations)
- [ ] Kullanıcı şablonları oluşturma
- [ ] Kullanıcı import/export (CSV, Excel)
- [ ] Kullanıcı geçmişi ve audit log
- [ ] Kullanıcı fotoğrafları görüntüleme
- [ ] Kullanıcı telefon numarası ve diğer iletişim bilgileri

### Grup Yönetimi İyileştirmeleri
- [ ] Grup oluşturma ve silme
- [ ] Grup izinleri yönetimi
- [ ] Grup şablonları
- [ ] Toplu grup üyelik işlemleri
- [ ] Grup hiyerarşisi görselleştirme

### Computer Yönetimi İyileştirmeleri
- [ ] Computer oluşturma
- [ ] Computer OU taşıma
- [ ] Computer inventory bilgileri (RAM, CPU, Disk)
- [ ] Computer yazılım envanteri
- [ ] Computer patch durumu
- [ ] Computer remote desktop bağlantısı

### Raporlama ve Analitik
- [x] Kullanıcı son oturum açma tarihi (lastLogon)
- [x] Dashboard istatistikleri ve grafikleri
- [x] Şifre politikası uyumluluk raporu
- [x] Computer envanter raporları
- [x] Audit logging (uygulama içi + AD değişiklikleri)
- [ ] Grup üyelik raporları
- [ ] Export to PDF/Excel

### Bildirimler ve Otomasyon
- [ ] E-posta bildirimleri (şifre süresi yaklaşan kullanıcılar)
- [ ] Otomatik şifre sıfırlama hatırlatmaları
- [ ] Scheduled tasks (zamanlanmış görevler)
- [ ] Webhook entegrasyonları

### UI/UX İyileştirmeleri
- [ ] Dark mode (karanlık tema)
- [ ] Çoklu dil desteği (i18n)
- [ ] Klavye kısayolları
- [ ] Gelişmiş filtreleme ve sıralama
- [ ] Toplu seçim ve işlemler
- [ ] Drag & drop grup yönetimi
- [ ] Gelişmiş arama (fuzzy search)

### Teknik İyileştirmeler
- [ ] Redis cache entegrasyonu
- [ ] WebSocket ile real-time güncellemeler
- [ ] Pagination ve lazy loading
- [ ] API rate limiting
- [ ] Request/Response logging
- [ ] Unit ve integration testleri
- [ ] Docker containerization
- [ ] CI/CD pipeline

### Entegrasyonlar
- [ ] Microsoft Graph API entegrasyonu
- [ ] Azure AD entegrasyonu
- [ ] Exchange Server yönetimi
- [ ] SharePoint entegrasyonu
- [ ] Ticketing sistem entegrasyonu (Jira, ServiceNow)

## Notlar

- Proje geliştikçe bu roadmap güncellenecektir
- Yeni özellikler ve iyileştirmeler eklendikçe buraya eklenecektir

