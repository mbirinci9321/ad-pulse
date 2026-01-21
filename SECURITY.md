# Güvenlik Dokümantasyonu

## Least Privilege Prensibi

Bu proje, Active Directory yönetimi için **Least Privilege** (En Az Yetki) prensibine uygun olarak tasarlanmıştır.

### LDAP Bağlantı Güvenliği

1. **Ayrılmış Yetkiler**: LDAP bağlantısı için kullanılan hesap, sadece gerekli işlemleri yapabilecek minimum yetkilere sahip olmalıdır:
   - Kullanıcı okuma yetkisi
   - Şifre sıfırlama yetkisi
   - Hesap durumu değiştirme yetkisi
   - Grup üyelik yönetimi yetkisi

2. **Bağlantı Güvenliği**:
   - LDAP bağlantıları şifrelenmiş kanallar üzerinden yapılmalıdır (LDAPS)
   - Kimlik bilgileri `.env` dosyasında saklanmalı ve asla versiyon kontrolüne eklenmemelidir
   - Üretim ortamında güçlü şifreler kullanılmalıdır

3. **API Güvenliği**:
   - Backend API'ye erişim için authentication eklenmelidir (JWT, OAuth2, vb.)
   - Rate limiting uygulanmalıdır
   - CORS ayarları sadece güvenilir domain'ler için açık olmalıdır

### Önerilen Güvenlik İyileştirmeleri

1. **Authentication & Authorization**:
   - JWT token tabanlı kimlik doğrulama
   - Role-based access control (RBAC)
   - API key yönetimi

2. **Logging & Monitoring**:
   - Tüm AD işlemlerinin loglanması
   - Şüpheli aktivitelerin izlenmesi
   - Audit trail oluşturulması

3. **Input Validation**:
   - Tüm kullanıcı girdilerinin doğrulanması
   - LDAP injection saldırılarına karşı koruma
   - SQL injection benzeri saldırılara karşı koruma

4. **Şifre Politikaları**:
   - Şifre karmaşıklık kurallarının uygulanması
   - Şifre geçmişi kontrolü
   - Minimum şifre uzunluğu zorunluluğu

### Güvenlik Kontrol Listesi

- [ ] LDAP bağlantısı LDAPS kullanıyor mu?
- [ ] `.env` dosyası `.gitignore`'da mı?
- [ ] API authentication implementasyonu var mı?
- [ ] Rate limiting aktif mi?
- [ ] Tüm kullanıcı girdileri validate ediliyor mu?
- [ ] Logging ve monitoring sistemi kurulu mu?
- [ ] CORS ayarları sadece güvenilir domain'ler için açık mı?

### Güvenlik İhlali Durumunda

Eğer bir güvenlik açığı tespit edilirse:
1. Hemen ilgili yetkililere bildirin
2. Etkilenen sistemleri izole edin
3. Logları inceleyin
4. Gerekli düzeltmeleri yapın
5. Kullanıcıları bilgilendirin
