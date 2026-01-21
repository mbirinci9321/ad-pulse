from ldap3 import Server, Connection, ALL, SUBTREE, ALL_ATTRIBUTES, MODIFY_REPLACE, MODIFY_ADD, MODIFY_DELETE
import ldap3
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pydantic modelleri (models.py'den ayrı olarak burada da tanımlıyoruz)
class UserAttribute(BaseModel):
    name: str
    value: str

class UserInfo(BaseModel):
    sam_account_name: str
    display_name: str
    email: Optional[str] = None
    first_name: Optional[str] = None  # givenName
    last_name: Optional[str] = None   # sn (surname)
    title: Optional[str] = None       # Job title
    department: Optional[str] = None  # Department
    groups: List[str] = []
    password_last_set: Optional[str] = None
    password_expires: Optional[str] = None
    last_logon: Optional[str] = None           # Son oturum açma
    last_logon_timestamp: Optional[str] = None # Son oturum açma (replicated)
    when_created: Optional[str] = None         # Hesap oluşturulma tarihi
    when_changed: Optional[str] = None         # Son değişiklik tarihi
    account_enabled: bool
    account_disabled: bool
    attributes: List[UserAttribute] = []

class GroupInfo(BaseModel):
    name: str
    distinguished_name: str
    member_count: int

class GroupMemberInfo(BaseModel):
    sam_account_name: str
    display_name: str
    email: Optional[str] = None
    distinguished_name: str

class ComputerInfo(BaseModel):
    sam_account_name: str
    name: str
    dns_host_name: Optional[str] = None
    operating_system: Optional[str] = None
    operating_system_version: Optional[str] = None
    operating_system_service_pack: Optional[str] = None
    last_logon: Optional[str] = None
    last_logon_timestamp: Optional[str] = None
    # Son giriş yapan kullanıcı bilgisi (WMI/Remote registry üzerinden)
    last_logged_on_user: Optional[str] = None
    distinguished_name: str
    organizational_unit: Optional[str] = None
    location: Optional[str] = None           # Fiziksel konum
    when_created: Optional[str] = None       # Hesap oluşturulma tarihi
    when_changed: Optional[str] = None       # Son değişiklik tarihi
    groups: List[str] = []
    account_enabled: bool
    account_disabled: bool
    description: Optional[str] = None
    managed_by: Optional[str] = None
    # Ek envanter bilgileri
    ip_address: Optional[str] = None
    mac_address: Optional[str] = None
    attributes: List[UserAttribute] = []

class ADConnection:
    def __init__(self, server: str, domain: str, username: str, password: str, base_dn: str):
        self.server = server
        self.domain = domain
        self.username = username
        self.password = password
        self.base_dn = base_dn
        self.conn = None
        
    def connect(self):
        """LDAP sunucusuna bağlan"""
        try:
            ldap_server = Server(self.server, get_info=ALL)
            self.conn = Connection(
                ldap_server,
                user=f"{self.username}@{self.domain}",
                password=self.password,
                auto_bind=True
            )
            logger.info("LDAP bağlantısı başarılı")
            return True
        except Exception as e:
            logger.error(f"LDAP bağlantı hatası: {str(e)}")
            raise
    
    def disconnect(self):
        """LDAP bağlantısını kapat"""
        if self.conn:
            self.conn.unbind()
            self.conn = None
    
    def _ensure_connection(self):
        """Bağlantının aktif olduğundan emin ol"""
        if not self.conn:
            self.connect()
        elif not self.conn.bound:
            self.connect()
    
    def _convert_ad_timestamp(self, timestamp: Optional[int]) -> Optional[str]:
        """AD timestamp'ini datetime'a çevir"""
        if not timestamp:
            return None
        try:
            # AD timestamp: 1601-01-01'den itibaren 100-nanosecond intervals
            epoch = datetime(1601, 1, 1)
            dt = epoch + timedelta(microseconds=timestamp / 10)
            return dt.isoformat()
        except Exception as e:
            logger.error(f"Timestamp dönüştürme hatası: {str(e)}")
            return None
    
    def _get_user_groups(self, user_dn: str) -> List[str]:
        """Kullanıcının üye olduğu grupları getir"""
        try:
            self._ensure_connection()
            search_filter = f"(&(objectClass=group)(member={user_dn}))"
            self.conn.search(
                self.base_dn,
                search_filter,
                attributes=['cn', 'distinguishedName']
            )
            groups = []
            for entry in self.conn.entries:
                if 'cn' in entry:
                    groups.append(str(entry['cn']))
            return groups
        except Exception as e:
            logger.error(f"Grup getirme hatası: {str(e)}")
            return []
    
    def get_users(self, group_filter: Optional[str] = None, search_filter: Optional[str] = None) -> List[UserInfo]:
        """Kullanıcıları getir"""
        try:
            self._ensure_connection()
            
            # Base search filter
            search_base = f"(&(objectClass=user)(objectCategory=person)"
            
            # Grup filtresi ekle
            if group_filter:
                # Önce grubu bul
                group_dn = self._get_group_dn(group_filter)
                if group_dn:
                    search_base += f"(memberOf={group_dn})"
            
            # Arama filtresi ekle
            if search_filter:
                search_base += f"(|(cn=*{search_filter}*)(sAMAccountName=*{search_filter}*)(mail=*{search_filter}*))"
            
            search_base += ")"
            
            # Kullanıcıları ara
            self.conn.search(
                self.base_dn,
                search_base,
                attributes=[
                    'sAMAccountName',
                    'displayName',
                    'mail',
                    'memberOf',
                    'pwdLastSet',
                    'userAccountControl',
                    'whenCreated',
                    'whenChanged',
                    'distinguishedName'
                ]
            )
            
            users = []
            for entry in self.conn.entries:
                try:
                    sam_account = str(entry.get('sAMAccountName', [''])[0]) if entry.get('sAMAccountName') else ''
                    display_name = str(entry.get('displayName', [''])[0]) if entry.get('displayName') else sam_account
                    email = str(entry.get('mail', [''])[0]) if entry.get('mail') else None
                    user_dn = str(entry.get('distinguishedName', [''])[0]) if entry.get('distinguishedName') else ''
                    
                    # Grupları getir
                    groups = self._get_user_groups(user_dn)
                    
                    # Şifre bilgileri
                    pwd_last_set = None
                    if entry.get('pwdLastSet'):
                        pwd_timestamp = int(str(entry.get('pwdLastSet')[0]))
                        if pwd_timestamp > 0:
                            pwd_last_set = self._convert_ad_timestamp(pwd_timestamp)
                    
                    # Şifre son kullanma (90 gün varsayılan)
                    password_expires = None
                    if pwd_last_set:
                        try:
                            last_set_dt = datetime.fromisoformat(pwd_last_set.replace('Z', '+00:00'))
                            expires_dt = last_set_dt + timedelta(days=90)
                            password_expires = expires_dt.isoformat()
                        except:
                            pass
                    
                    # Hesap durumu
                    uac = int(str(entry.get('userAccountControl', ['512'])[0]))
                    account_enabled = not bool(uac & 0x0002)  # ACCOUNTDISABLE flag
                    account_disabled = bool(uac & 0x0002)
                    
                    # Attributes
                    attributes = []
                    for attr_name in ['sAMAccountName', 'displayName', 'mail', 'distinguishedName', 'whenCreated', 'whenChanged']:
                        if entry.get(attr_name):
                            attr_value = str(entry.get(attr_name)[0])
                            attributes.append(UserAttribute(name=attr_name, value=attr_value))
                    
                    user_info = UserInfo(
                        sam_account_name=sam_account,
                        display_name=display_name,
                        email=email,
                        groups=groups,
                        password_last_set=pwd_last_set,
                        password_expires=password_expires,
                        account_enabled=account_enabled,
                        account_disabled=account_disabled,
                        attributes=attributes
                    )
                    users.append(user_info)
                except Exception as e:
                    logger.error(f"Kullanıcı işleme hatası: {str(e)}")
                    continue
            
            return users
        except Exception as e:
            logger.error(f"Kullanıcı getirme hatası: {str(e)}")
            raise
    
    def get_user(self, sam_account_name: str) -> Optional[UserInfo]:
        """Belirli bir kullanıcıyı getir"""
        try:
            self._ensure_connection()
            search_filter = f"(&(objectClass=user)(sAMAccountName={sam_account_name}))"
            
            self.conn.search(
                self.base_dn,
                search_filter,
                attributes=ALL_ATTRIBUTES
            )
            
            if not self.conn.entries:
                return None
            
            entry = self.conn.entries[0]
            sam_account = str(entry.get('sAMAccountName', [''])[0]) if entry.get('sAMAccountName') else ''
            display_name = str(entry.get('displayName', [''])[0]) if entry.get('displayName') else sam_account
            email = str(entry.get('mail', [''])[0]) if entry.get('mail') else None
            user_dn = str(entry.get('distinguishedName', [''])[0]) if entry.get('distinguishedName') else ''
            
            groups = self._get_user_groups(user_dn)
            
            pwd_last_set = None
            if entry.get('pwdLastSet'):
                pwd_timestamp = int(str(entry.get('pwdLastSet')[0]))
                if pwd_timestamp > 0:
                    pwd_last_set = self._convert_ad_timestamp(pwd_timestamp)
            
            password_expires = None
            if pwd_last_set:
                try:
                    last_set_dt = datetime.fromisoformat(pwd_last_set.replace('Z', '+00:00'))
                    expires_dt = last_set_dt + timedelta(days=90)
                    password_expires = expires_dt.isoformat()
                except:
                    pass
            
            uac = int(str(entry.get('userAccountControl', ['512'])[0]))
            account_enabled = not bool(uac & 0x0002)
            account_disabled = bool(uac & 0x0002)
            
            attributes = []
            for attr_name, attr_value in entry.entry_attributes.items():
                if attr_value:
                    value = str(attr_value[0]) if isinstance(attr_value, list) and attr_value else str(attr_value)
                    attributes.append(UserAttribute(name=attr_name, value=value))
            
            return UserInfo(
                sam_account_name=sam_account,
                display_name=display_name,
                email=email,
                groups=groups,
                password_last_set=pwd_last_set,
                password_expires=password_expires,
                account_enabled=account_enabled,
                account_disabled=account_disabled,
                attributes=attributes
            )
        except Exception as e:
            logger.error(f"Kullanıcı getirme hatası: {str(e)}")
            raise
    
    def _get_group_dn(self, group_name: str) -> Optional[str]:
        """Grup adından DN'yi getir"""
        try:
            self._ensure_connection()
            search_filter = f"(&(objectClass=group)(cn={group_name}))"
            self.conn.search(
                self.base_dn,
                search_filter,
                attributes=['distinguishedName']
            )
            if self.conn.entries:
                return str(self.conn.entries[0].get('distinguishedName')[0])
            return None
        except Exception as e:
            logger.error(f"Grup DN getirme hatası: {str(e)}")
            return None
    
    def get_groups(self) -> List[GroupInfo]:
        """Tüm grupları getir"""
        try:
            self._ensure_connection()
            search_filter = "(objectClass=group)"
            self.conn.search(
                self.base_dn,
                search_filter,
                attributes=['cn', 'distinguishedName', 'member']
            )
            
            groups = []
            for entry in self.conn.entries:
                try:
                    name = str(entry.get('cn', [''])[0]) if entry.get('cn') else ''
                    dn = str(entry.get('distinguishedName', [''])[0]) if entry.get('distinguishedName') else ''
                    members = entry.get('member', [])
                    member_count = len(members) if members else 0
                    
                    groups.append(GroupInfo(
                        name=name,
                        distinguished_name=dn,
                        member_count=member_count
                    ))
                except Exception as e:
                    logger.error(f"Grup işleme hatası: {str(e)}")
                    continue
            
            return sorted(groups, key=lambda x: x.name)
        except Exception as e:
            logger.error(f"Grup getirme hatası: {str(e)}")
            raise
    
    def get_group(self, group_name: str) -> Optional[GroupInfo]:
        """Belirli bir grubu getir"""
        try:
            self._ensure_connection()
            search_filter = f"(&(objectClass=group)(cn={group_name}))"
            self.conn.search(
                self.base_dn,
                search_filter,
                attributes=['cn', 'distinguishedName', 'member']
            )
            
            if not self.conn.entries:
                return None
            
            entry = self.conn.entries[0]
            name = str(entry.get('cn', [''])[0]) if entry.get('cn') else ''
            dn = str(entry.get('distinguishedName', [''])[0]) if entry.get('distinguishedName') else ''
            members = entry.get('member', [])
            member_count = len(members) if members else 0
            
            return GroupInfo(
                name=name,
                distinguished_name=dn,
                member_count=member_count
            )
        except Exception as e:
            logger.error(f"Grup getirme hatası: {str(e)}")
            raise
    
    def get_group_members(self, group_name: str) -> List[GroupMemberInfo]:
        """Grup üyelerini getir"""
        try:
            self._ensure_connection()
            group_dn = self._get_group_dn(group_name)
            if not group_dn:
                raise ValueError(f"Grup bulunamadı: {group_name}")
            
            # Grubun member attribute'unu al
            self.conn.search(
                group_dn,
                '(objectClass=group)',
                attributes=['member']
            )
            
            if not self.conn.entries:
                return []
            
            members_dn = self.conn.entries[0].get('member', [])
            if not members_dn:
                return []
            
            # Her üye için detaylı bilgi al
            members = []
            for member_dn in members_dn:
                try:
                    # Üyenin user olup olmadığını kontrol et
                    self.conn.search(
                        str(member_dn),
                        '(objectClass=user)',
                        attributes=['sAMAccountName', 'displayName', 'mail', 'distinguishedName']
                    )
                    
                    if self.conn.entries:
                        entry = self.conn.entries[0]
                        sam_account = str(entry.get('sAMAccountName', [''])[0]) if entry.get('sAMAccountName') else ''
                        display_name = str(entry.get('displayName', [''])[0]) if entry.get('displayName') else sam_account
                        email = str(entry.get('mail', [''])[0]) if entry.get('mail') else None
                        dn = str(entry.get('distinguishedName', [''])[0]) if entry.get('distinguishedName') else ''
                        
                        if sam_account:  # Sadece kullanıcıları ekle (computer account'ları değil)
                            members.append(GroupMemberInfo(
                                sam_account_name=sam_account,
                                display_name=display_name,
                                email=email,
                                distinguished_name=dn
                            ))
                except Exception as e:
                    logger.warning(f"Üye bilgisi alınamadı {member_dn}: {str(e)}")
                    continue
            
            return sorted(members, key=lambda x: x.display_name)
        except Exception as e:
            logger.error(f"Grup üyeleri getirme hatası: {str(e)}")
            raise
    
    def _get_user_dn(self, sam_account_name: str) -> Optional[str]:
        """Kullanıcı adından DN'yi getir"""
        try:
            self._ensure_connection()
            search_filter = f"(&(objectClass=user)(sAMAccountName={sam_account_name}))"
            self.conn.search(
                self.base_dn,
                search_filter,
                attributes=['distinguishedName']
            )
            if self.conn.entries:
                return str(self.conn.entries[0].get('distinguishedName')[0])
            return None
        except Exception as e:
            logger.error(f"Kullanıcı DN getirme hatası: {str(e)}")
            return None
    
    def _get_computer_dn(self, sam_account_name: str) -> Optional[str]:
        """Bilgisayar adından DN'yi getir"""
        try:
            self._ensure_connection()
            # Computer account'ları genellikle $ ile biter
            search_name = sam_account_name if sam_account_name.endswith('$') else sam_account_name + '$'
            search_filter = f"(&(objectClass=computer)(sAMAccountName={search_name}))"
            self.conn.search(
                self.base_dn,
                search_filter,
                attributes=['distinguishedName']
            )
            if self.conn.entries:
                return str(self.conn.entries[0].get('distinguishedName')[0])
            # $ olmadan da dene
            search_filter = f"(&(objectClass=computer)(sAMAccountName={sam_account_name}))"
            self.conn.search(
                self.base_dn,
                search_filter,
                attributes=['distinguishedName']
            )
            if self.conn.entries:
                return str(self.conn.entries[0].get('distinguishedName')[0])
            return None
        except Exception as e:
            logger.error(f"Bilgisayar DN getirme hatası: {str(e)}")
            return None
    
    def create_group(self, group_name: str, description: str = None, ou_path: str = None) -> bool:
        """Yeni bir grup oluştur"""
        try:
            self._ensure_connection()
            
            # OU path belirleme
            if ou_path:
                group_dn = f"CN={group_name},{ou_path}"
            else:
                # Varsayılan olarak Users container'ını kullan
                group_dn = f"CN={group_name},CN=Users,{self.base_dn}"
            
            # Grup oluşturma attribute'ları
            attributes = {
                'objectClass': ['top', 'group'],
                'cn': group_name,
                'sAMAccountName': group_name,
                'groupType': -2147483646  # Global Security Group
            }
            
            if description:
                attributes['description'] = description
            
            # Grubu oluştur
            success = self.conn.add(group_dn, attributes=attributes)
            
            if success:
                logger.info(f"Grup oluşturuldu: {group_name}")
                return True
            else:
                error_msg = self.conn.result.get('description', 'Bilinmeyen hata')
                logger.error(f"Grup oluşturma hatası: {error_msg}")
                raise Exception(f"Grup oluşturulamadı: {error_msg}")
        except Exception as e:
            logger.error(f"Grup oluşturma hatası: {str(e)}")
            raise
    
    def delete_group(self, group_name: str) -> bool:
        """Bir grubu sil"""
        try:
            self._ensure_connection()
            
            # Önce grubun DN'ini bul
            group_dn = self._get_group_dn(group_name)
            if not group_dn:
                raise ValueError(f"Grup bulunamadı: {group_name}")
            
            # Grubu sil
            success = self.conn.delete(group_dn)
            
            if success:
                logger.info(f"Grup silindi: {group_name}")
                return True
            else:
                error_msg = self.conn.result.get('description', 'Bilinmeyen hata')
                logger.error(f"Grup silme hatası: {error_msg}")
                raise Exception(f"Grup silinemedi: {error_msg}")
        except Exception as e:
            logger.error(f"Grup silme hatası: {str(e)}")
            raise
    
    def get_organizational_units(self) -> List[dict]:
        """Tüm OU'ları getir"""
        try:
            self._ensure_connection()
            
            self.conn.search(
                self.base_dn,
                "(objectClass=organizationalUnit)",
                attributes=['ou', 'distinguishedName', 'description']
            )
            
            ous = []
            for entry in self.conn.entries:
                ou_name = str(entry.get('ou', [''])[0]) if entry.get('ou') else ''
                dn = str(entry.get('distinguishedName', [''])[0]) if entry.get('distinguishedName') else ''
                desc = str(entry.get('description', [''])[0]) if entry.get('description') else None
                
                if ou_name:
                    ous.append({
                        'name': ou_name,
                        'distinguished_name': dn,
                        'description': desc,
                        'path': dn
                    })
            
            return sorted(ous, key=lambda x: x['name'])
        except Exception as e:
            logger.error(f"OU getirme hatası: {str(e)}")
            raise
    
    def move_computer_to_ou(self, sam_account_name: str, target_ou_dn: str) -> bool:
        """Bilgisayarı farklı bir OU'ya taşı"""
        try:
            self._ensure_connection()
            
            # Bilgisayarın mevcut DN'ini bul
            computer_dn = self._get_computer_dn(sam_account_name)
            if not computer_dn:
                raise ValueError(f"Bilgisayar bulunamadı: {sam_account_name}")
            
            # Bilgisayar adını DN'den çıkar
            computer_cn = computer_dn.split(',')[0]  # "CN=COMPUTER-NAME"
            
            # Yeni DN oluştur
            new_dn = f"{computer_cn},{target_ou_dn}"
            
            # Taşıma işlemi (modify_dn kullan)
            success = self.conn.modify_dn(
                computer_dn,
                computer_cn,
                new_superior=target_ou_dn
            )
            
            if success:
                logger.info(f"Bilgisayar taşındı: {sam_account_name} -> {target_ou_dn}")
                return True
            else:
                error_msg = self.conn.result.get('description', 'Bilinmeyen hata')
                logger.error(f"Bilgisayar taşıma hatası: {error_msg}")
                raise Exception(f"Bilgisayar taşınamadı: {error_msg}")
        except Exception as e:
            logger.error(f"Bilgisayar taşıma hatası: {str(e)}")
            raise
    
    def get_users_paginated(self, page: int = 1, page_size: int = 50, 
                           group_filter: Optional[str] = None, 
                           search_filter: Optional[str] = None) -> dict:
        """Sayfalanmış kullanıcı listesi getir"""
        try:
            self._ensure_connection()
            
            # Tüm kullanıcıları getir (önce filtreleme yapmak için)
            all_users = self.get_users(group_filter=group_filter, search_filter=search_filter)
            
            # Sayfalama hesapla
            total_count = len(all_users)
            total_pages = (total_count + page_size - 1) // page_size
            start_idx = (page - 1) * page_size
            end_idx = start_idx + page_size
            
            # Sayfa dışı kontrolü
            if page < 1:
                page = 1
            if page > total_pages and total_pages > 0:
                page = total_pages
                start_idx = (page - 1) * page_size
                end_idx = start_idx + page_size
            
            paginated_users = all_users[start_idx:end_idx]
            
            return {
                "users": paginated_users,
                "page": page,
                "page_size": page_size,
                "total_count": total_count,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1
            }
        except Exception as e:
            logger.error(f"Sayfalanmış kullanıcı getirme hatası: {str(e)}")
            raise
    
    def get_computers_paginated(self, page: int = 1, page_size: int = 50,
                               search_filter: Optional[str] = None,
                               ou_filter: Optional[str] = None) -> dict:
        """Sayfalanmış bilgisayar listesi getir"""
        try:
            self._ensure_connection()
            
            # Tüm bilgisayarları getir
            all_computers = self.get_computers(search_filter=search_filter, ou_filter=ou_filter)
            
            # Sayfalama hesapla
            total_count = len(all_computers)
            total_pages = (total_count + page_size - 1) // page_size
            start_idx = (page - 1) * page_size
            end_idx = start_idx + page_size
            
            # Sayfa dışı kontrolü
            if page < 1:
                page = 1
            if page > total_pages and total_pages > 0:
                page = total_pages
                start_idx = (page - 1) * page_size
                end_idx = start_idx + page_size
            
            paginated_computers = all_computers[start_idx:end_idx]
            
            return {
                "computers": paginated_computers,
                "page": page,
                "page_size": page_size,
                "total_count": total_count,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1
            }
        except Exception as e:
            logger.error(f"Sayfalanmış bilgisayar getirme hatası: {str(e)}")
            raise
    
    def reset_password(self, sam_account_name: str, new_password: str, must_change: bool = True) -> bool:
        """Kullanıcı şifresini sıfırla (Least Privilege: Sadece şifre değiştirme yetkisi)"""
        try:
            self._ensure_connection()
            user_dn = self._get_user_dn(sam_account_name)
            if not user_dn:
                raise ValueError(f"Kullanıcı bulunamadı: {sam_account_name}")
            
            # UnicodePwd attribute'unu set et (LDAP unicode password format)
            # Şifreyi UTF-16LE formatında encode et ve çift tırnak içine al
            unicode_password = f'"{new_password}"'.encode('utf-16-le')
            
            # Şifreyi değiştir
            success = self.conn.modify(
                user_dn,
                {'unicodePwd': [(MODIFY_REPLACE, [unicode_password])]}
            )
            
            if success:
                # Şifre değişimini zorunlu kıl (isteğe bağlı)
                if must_change:
                    # pwdLastSet = 0 yaparak ilk girişte şifre değiştirmeyi zorunlu kıl
                    self.conn.modify(
                        user_dn,
                        {'pwdLastSet': [(MODIFY_REPLACE, [0])]}
                    )
                logger.info(f"Şifre başarıyla sıfırlandı: {sam_account_name}")
                return True
            else:
                error_msg = self.conn.result.get('description', 'Bilinmeyen hata')
                logger.error(f"Şifre sıfırlama hatası: {error_msg}")
                raise Exception(f"Şifre sıfırlanamadı: {error_msg}")
        except Exception as e:
            logger.error(f"Şifre sıfırlama hatası: {str(e)}")
            raise
    
    def set_account_status(self, sam_account_name: str, enabled: bool) -> bool:
        """Hesap durumunu aktif/pasif yap"""
        try:
            self._ensure_connection()
            user_dn = self._get_user_dn(sam_account_name)
            if not user_dn:
                raise ValueError(f"Kullanıcı bulunamadı: {sam_account_name}")
            
            # Önce mevcut userAccountControl değerini al
            self.conn.search(
                user_dn,
                '(objectClass=user)',
                attributes=['userAccountControl']
            )
            
            if not self.conn.entries:
                raise ValueError(f"Kullanıcı bilgileri alınamadı: {sam_account_name}")
            
            current_uac = int(str(self.conn.entries[0].get('userAccountControl', ['512'])[0]))
            
            # ACCOUNTDISABLE flag'i (0x0002)
            if enabled:
                # Hesabı aktif yap: ACCOUNTDISABLE flag'ini kaldır
                new_uac = current_uac & ~0x0002
            else:
                # Hesabı pasif yap: ACCOUNTDISABLE flag'ini ekle
                new_uac = current_uac | 0x0002
            
            # Değişikliği uygula
            success = self.conn.modify(
                user_dn,
                {'userAccountControl': [(MODIFY_REPLACE, [new_uac])]}
            )
            
            if success:
                status = "aktif" if enabled else "pasif"
                logger.info(f"Hesap {status} yapıldı: {sam_account_name}")
                return True
            else:
                error_msg = self.conn.result.get('description', 'Bilinmeyen hata')
                logger.error(f"Hesap durumu değiştirme hatası: {error_msg}")
                raise Exception(f"Hesap durumu değiştirilemedi: {error_msg}")
        except Exception as e:
            logger.error(f"Hesap durumu değiştirme hatası: {str(e)}")
            raise
    
    def add_user_to_group(self, sam_account_name: str, group_name: str) -> bool:
        """Kullanıcıyı gruba ekle"""
        try:
            self._ensure_connection()
            user_dn = self._get_user_dn(sam_account_name)
            if not user_dn:
                raise ValueError(f"Kullanıcı bulunamadı: {sam_account_name}")
            
            group_dn = self._get_group_dn(group_name)
            if not group_dn:
                raise ValueError(f"Grup bulunamadı: {group_name}")
            
            # Gruba üye ekle
            success = self.conn.modify(
                group_dn,
                {'member': [(MODIFY_ADD, [user_dn])]}
            )
            
            if success:
                logger.info(f"Kullanıcı gruba eklendi: {sam_account_name} -> {group_name}")
                return True
            else:
                error_msg = self.conn.result.get('description', 'Bilinmeyen hata')
                logger.error(f"Grup üyeliği ekleme hatası: {error_msg}")
                raise Exception(f"Kullanıcı gruba eklenemedi: {error_msg}")
        except Exception as e:
            logger.error(f"Grup üyeliği ekleme hatası: {str(e)}")
            raise
    
    def remove_user_from_group(self, sam_account_name: str, group_name: str) -> bool:
        """Kullanıcıyı gruptan çıkar"""
        try:
            self._ensure_connection()
            user_dn = self._get_user_dn(sam_account_name)
            if not user_dn:
                raise ValueError(f"Kullanıcı bulunamadı: {sam_account_name}")
            
            group_dn = self._get_group_dn(group_name)
            if not group_dn:
                raise ValueError(f"Grup bulunamadı: {group_name}")
            
            # Gruptan üye çıkar
            success = self.conn.modify(
                group_dn,
                {'member': [(MODIFY_DELETE, [user_dn])]}
            )
            
            if success:
                logger.info(f"Kullanıcı gruptan çıkarıldı: {sam_account_name} <- {group_name}")
                return True
            else:
                error_msg = self.conn.result.get('description', 'Bilinmeyen hata')
                logger.error(f"Grup üyeliği çıkarma hatası: {error_msg}")
                raise Exception(f"Kullanıcı gruptan çıkarılamadı: {error_msg}")
        except Exception as e:
            logger.error(f"Grup üyeliği çıkarma hatası: {str(e)}")
            raise
    
    def get_computers(self, search_filter: Optional[str] = None, ou_filter: Optional[str] = None) -> List[ComputerInfo]:
        """Bilgisayarları getir"""
        try:
            self._ensure_connection()
            
            # Base search filter
            search_base = "(&(objectClass=computer)"
            
            # Arama filtresi ekle
            if search_filter:
                search_base += f"(|(cn=*{search_filter}*)(dNSHostName=*{search_filter}*)(description=*{search_filter}*))"
            
            search_base += ")"
            
            # Bilgisayarları ara
            self.conn.search(
                self.base_dn,
                search_base,
                attributes=[
                    'sAMAccountName',
                    'cn',
                    'dNSHostName',
                    'operatingSystem',
                    'operatingSystemVersion',
                    'operatingSystemServicePack',
                    'lastLogon',
                    'lastLogonTimestamp',
                    'distinguishedName',
                    'whenCreated',
                    'whenChanged',
                    'userAccountControl',
                    'description',
                    'managedBy',
                    'location',
                    'memberOf'
                ]
            )
            
            computers = []
            for entry in self.conn.entries:
                try:
                    sam_account = str(entry.get('sAMAccountName', [''])[0]) if entry.get('sAMAccountName') else ''
                    name = str(entry.get('cn', [''])[0]) if entry.get('cn') else sam_account.rstrip('$')
                    dns_host_name = str(entry.get('dNSHostName', [''])[0]) if entry.get('dNSHostName') else None
                    os_name = str(entry.get('operatingSystem', [''])[0]) if entry.get('operatingSystem') else None
                    os_version = str(entry.get('operatingSystemVersion', [''])[0]) if entry.get('operatingSystemVersion') else None
                    os_sp = str(entry.get('operatingSystemServicePack', [''])[0]) if entry.get('operatingSystemServicePack') else None
                    dn = str(entry.get('distinguishedName', [''])[0]) if entry.get('distinguishedName') else ''
                    description = str(entry.get('description', [''])[0]) if entry.get('description') else None
                    managed_by = str(entry.get('managedBy', [''])[0]) if entry.get('managedBy') else None
                    location = str(entry.get('location', [''])[0]) if entry.get('location') else None
                    
                    # OU bilgisini çıkar
                    ou = None
                    if dn:
                        ou_parts = [p.split('=')[1] for p in dn.split(',') if p.startswith('OU=')]
                        ou = '/'.join(reversed(ou_parts)) if ou_parts else None
                    
                    # OU filtresi kontrolü
                    if ou_filter and ou and ou_filter.lower() not in ou.lower():
                        continue
                    
                    # Last logon bilgileri
                    last_logon = None
                    if entry.get('lastLogon'):
                        logon_timestamp = int(str(entry.get('lastLogon')[0]))
                        if logon_timestamp > 0:
                            last_logon = self._convert_ad_timestamp(logon_timestamp)
                    
                    last_logon_ts = None
                    if entry.get('lastLogonTimestamp'):
                        logon_ts = int(str(entry.get('lastLogonTimestamp')[0]))
                        if logon_ts > 0:
                            last_logon_ts = self._convert_ad_timestamp(logon_ts)
                    
                    # When created/changed
                    when_created = str(entry.get('whenCreated', [''])[0]) if entry.get('whenCreated') else None
                    when_changed = str(entry.get('whenChanged', [''])[0]) if entry.get('whenChanged') else None
                    
                    # Hesap durumu
                    uac = int(str(entry.get('userAccountControl', ['4096'])[0]))
                    account_enabled = not bool(uac & 0x0002)
                    account_disabled = bool(uac & 0x0002)
                    
                    # Grupları getir
                    groups = []
                    if entry.get('memberOf'):
                        for group_dn in entry.get('memberOf'):
                            group_cn = str(group_dn).split(',')[0].replace('CN=', '')
                            groups.append(group_cn)
                    
                    computer_info = ComputerInfo(
                        sam_account_name=sam_account,
                        name=name,
                        dns_host_name=dns_host_name,
                        operating_system=os_name,
                        operating_system_version=os_version,
                        operating_system_service_pack=os_sp,
                        last_logon=last_logon,
                        last_logon_timestamp=last_logon_ts,
                        last_logged_on_user=None,  # WMI ile doldurulacak
                        distinguished_name=dn,
                        organizational_unit=ou,
                        location=location,
                        when_created=when_created,
                        when_changed=when_changed,
                        groups=groups,
                        account_enabled=account_enabled,
                        account_disabled=account_disabled,
                        description=description,
                        managed_by=managed_by,
                        ip_address=None,
                        mac_address=None,
                        attributes=[]
                    )
                    computers.append(computer_info)
                except Exception as e:
                    logger.error(f"Bilgisayar işleme hatası: {str(e)}")
                    continue
            
            return computers
        except Exception as e:
            logger.error(f"Bilgisayar getirme hatası: {str(e)}")
            raise
    
    def get_recent_changes(self, hours: int = 24, object_type: str = "all") -> List[dict]:
        """
        Son X saat içinde değişen objeler (RSAT veya diğer araçlardan yapılan değişiklikler dahil)
        AD'nin whenChanged attribute'unu kullanır
        """
        try:
            self._ensure_connection()
            
            # Zaman hesapla
            from datetime import timezone
            cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)
            # AD generalized time format: YYYYMMDDHHmmss.0Z
            cutoff_str = cutoff_time.strftime("%Y%m%d%H%M%S.0Z")
            
            changes = []
            
            # Kullanıcı değişiklikleri
            if object_type in ["all", "user"]:
                user_filter = f"(&(objectClass=user)(objectCategory=person)(whenChanged>={cutoff_str}))"
                self.conn.search(
                    self.base_dn,
                    user_filter,
                    attributes=['sAMAccountName', 'displayName', 'whenChanged', 'whenCreated', 'modifyTimeStamp']
                )
                
                for entry in self.conn.entries:
                    sam = str(entry.get('sAMAccountName', [''])[0]) if entry.get('sAMAccountName') else ''
                    display = str(entry.get('displayName', [''])[0]) if entry.get('displayName') else sam
                    when_changed = str(entry.get('whenChanged', [''])[0]) if entry.get('whenChanged') else ''
                    when_created = str(entry.get('whenCreated', [''])[0]) if entry.get('whenCreated') else ''
                    
                    changes.append({
                        "object_type": "user",
                        "sam_account_name": sam,
                        "display_name": display,
                        "when_changed": when_changed,
                        "when_created": when_created,
                        "change_type": "created" if when_changed == when_created else "modified"
                    })
            
            # Bilgisayar değişiklikleri
            if object_type in ["all", "computer"]:
                computer_filter = f"(&(objectClass=computer)(whenChanged>={cutoff_str}))"
                self.conn.search(
                    self.base_dn,
                    computer_filter,
                    attributes=['sAMAccountName', 'cn', 'whenChanged', 'whenCreated']
                )
                
                for entry in self.conn.entries:
                    sam = str(entry.get('sAMAccountName', [''])[0]) if entry.get('sAMAccountName') else ''
                    name = str(entry.get('cn', [''])[0]) if entry.get('cn') else sam
                    when_changed = str(entry.get('whenChanged', [''])[0]) if entry.get('whenChanged') else ''
                    when_created = str(entry.get('whenCreated', [''])[0]) if entry.get('whenCreated') else ''
                    
                    changes.append({
                        "object_type": "computer",
                        "sam_account_name": sam,
                        "display_name": name,
                        "when_changed": when_changed,
                        "when_created": when_created,
                        "change_type": "created" if when_changed == when_created else "modified"
                    })
            
            # Grup değişiklikleri
            if object_type in ["all", "group"]:
                group_filter = f"(&(objectClass=group)(whenChanged>={cutoff_str}))"
                self.conn.search(
                    self.base_dn,
                    group_filter,
                    attributes=['cn', 'whenChanged', 'whenCreated', 'member']
                )
                
                for entry in self.conn.entries:
                    name = str(entry.get('cn', [''])[0]) if entry.get('cn') else ''
                    when_changed = str(entry.get('whenChanged', [''])[0]) if entry.get('whenChanged') else ''
                    when_created = str(entry.get('whenCreated', [''])[0]) if entry.get('whenCreated') else ''
                    
                    changes.append({
                        "object_type": "group",
                        "sam_account_name": name,
                        "display_name": name,
                        "when_changed": when_changed,
                        "when_created": when_created,
                        "change_type": "created" if when_changed == when_created else "modified"
                    })
            
            # Tarihe göre sırala
            changes.sort(key=lambda x: x.get('when_changed', ''), reverse=True)
            return changes
            
        except Exception as e:
            logger.error(f"Son değişiklikleri getirme hatası: {str(e)}")
            raise
    
    def get_dashboard_stats(self) -> dict:
        """Dashboard için istatistikler"""
        try:
            self._ensure_connection()
            
            stats = {
                "total_users": 0,
                "active_users": 0,
                "disabled_users": 0,
                "total_computers": 0,
                "active_computers": 0,
                "disabled_computers": 0,
                "total_groups": 0,
                "users_by_department": {},
                "computers_by_os": {},
                "recent_logins": [],
                "expiring_passwords": []
            }
            
            # Kullanıcı istatistikleri
            self.conn.search(
                self.base_dn,
                "(&(objectClass=user)(objectCategory=person))",
                attributes=['sAMAccountName', 'displayName', 'department', 'userAccountControl', 'pwdLastSet', 'lastLogon']
            )
            
            for entry in self.conn.entries:
                stats["total_users"] += 1
                
                uac = int(str(entry.get('userAccountControl', ['512'])[0]))
                if bool(uac & 0x0002):
                    stats["disabled_users"] += 1
                else:
                    stats["active_users"] += 1
                
                # Departman
                dept = str(entry.get('department', ['Belirtilmemiş'])[0]) if entry.get('department') else 'Belirtilmemiş'
                stats["users_by_department"][dept] = stats["users_by_department"].get(dept, 0) + 1
                
                # Şifre süresi dolacak kullanıcılar (7 gün içinde)
                if entry.get('pwdLastSet'):
                    pwd_ts = int(str(entry.get('pwdLastSet')[0]))
                    if pwd_ts > 0:
                        pwd_date = self._convert_ad_timestamp(pwd_ts)
                        if pwd_date:
                            try:
                                pwd_dt = datetime.fromisoformat(pwd_date.replace('Z', '+00:00'))
                                expires_dt = pwd_dt + timedelta(days=90)
                                days_left = (expires_dt - datetime.now()).days
                                if 0 <= days_left <= 7:
                                    stats["expiring_passwords"].append({
                                        "sam_account_name": str(entry.get('sAMAccountName', [''])[0]),
                                        "display_name": str(entry.get('displayName', [''])[0]),
                                        "days_left": days_left
                                    })
                            except:
                                pass
            
            # Bilgisayar istatistikleri
            self.conn.search(
                self.base_dn,
                "(objectClass=computer)",
                attributes=['sAMAccountName', 'cn', 'operatingSystem', 'userAccountControl', 'lastLogonTimestamp']
            )
            
            for entry in self.conn.entries:
                stats["total_computers"] += 1
                
                uac = int(str(entry.get('userAccountControl', ['4096'])[0]))
                if bool(uac & 0x0002):
                    stats["disabled_computers"] += 1
                else:
                    stats["active_computers"] += 1
                
                # İşletim sistemi
                os_name = str(entry.get('operatingSystem', ['Bilinmiyor'])[0]) if entry.get('operatingSystem') else 'Bilinmiyor'
                stats["computers_by_os"][os_name] = stats["computers_by_os"].get(os_name, 0) + 1
            
            # Grup sayısı
            self.conn.search(
                self.base_dn,
                "(objectClass=group)",
                attributes=['cn']
            )
            stats["total_groups"] = len(self.conn.entries)
            
            # Şifre süresi dolacakları sırala
            stats["expiring_passwords"].sort(key=lambda x: x.get('days_left', 99))
            stats["expiring_passwords"] = stats["expiring_passwords"][:10]
            
            return stats
            
        except Exception as e:
            logger.error(f"Dashboard istatistikleri hatası: {str(e)}")
            raise
    
    def __enter__(self):
        self.connect()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.disconnect()

