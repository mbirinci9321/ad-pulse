from fastapi import FastAPI, HTTPException, Depends, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
from ad_connection import ADConnection, UserInfo, GroupInfo, GroupMemberInfo, ComputerInfo, UserAttribute
from audit_logger import (
    audit_logger, 
    log_password_reset, 
    log_account_status_change, 
    log_group_membership_change,
    log_group_management,
    log_computer_move,
    AuditActionType,
    AuditSource
)
from datetime import datetime

load_dotenv()

# Mock mode kontrolü
MOCK_MODE = os.getenv("MOCK_MODE", "false").lower() == "true"

app = FastAPI(title="AD Pulse API", version="1.0.0")

# CORS ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# AD bağlantısı bağımlılığı
def get_ad_connection():
    if MOCK_MODE:
        return None
    return ADConnection(
        server=os.getenv("LDAP_SERVER"),
        domain=os.getenv("LDAP_DOMAIN"),
        username=os.getenv("LDAP_USERNAME"),
        password=os.getenv("LDAP_PASSWORD"),
        base_dn=os.getenv("LDAP_BASE_DN")
    )

# Modeller ad_connection.py'den import ediliyor

# Request modelleri
class PasswordResetRequest(BaseModel):
    new_password: str
    must_change: bool = True

class AccountStatusRequest(BaseModel):
    enabled: bool

class GroupMembershipRequest(BaseModel):
    group_name: str

class GroupMemberRequest(BaseModel):
    sam_account_name: str

class ComputerStatusRequest(BaseModel):
    enabled: bool

class GroupCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    ou_path: Optional[str] = None

class ComputerMoveRequest(BaseModel):
    target_ou_dn: str

# Mock veriler
MOCK_USERS = [
    UserInfo(
        sam_account_name="john.doe",
        display_name="John Doe",
        email="john.doe@example.com",
        groups=["Domain Users", "IT Department"],
        password_last_set="2024-01-15T10:30:00",
        password_expires="2024-04-15T10:30:00",
        account_enabled=True,
        account_disabled=False,
        attributes=[]
    ),
    UserInfo(
        sam_account_name="jane.smith",
        display_name="Jane Smith",
        email="jane.smith@example.com",
        groups=["Domain Users", "HR Department"],
        password_last_set="2024-02-20T14:20:00",
        password_expires="2024-05-20T14:20:00",
        account_enabled=True,
        account_disabled=False,
        attributes=[]
    ),
    UserInfo(
        sam_account_name="admin.user",
        display_name="Admin User",
        email="admin@example.com",
        groups=["Domain Admins", "IT Department"],
        password_last_set="2024-03-01T08:00:00",
        password_expires="2024-06-01T08:00:00",
        account_enabled=True,
        account_disabled=False,
        attributes=[]
    ),
]

MOCK_COMPUTERS = [
    ComputerInfo(
        sam_account_name="PC-001$",
        name="PC-001",
        dns_host_name="pc-001.example.com",
        operating_system="Windows 11 Enterprise",
        operating_system_version="10.0 (22621)",
        operating_system_service_pack=None,
        last_logon="2024-12-20T09:15:00",
        last_logon_timestamp="2024-12-20T09:15:00",
        distinguished_name="CN=PC-001,OU=Computers,DC=example,DC=com",
        organizational_unit="Computers",
        groups=["Domain Computers"],
        account_enabled=True,
        account_disabled=False,
        description="IT Department Computer",
        managed_by=None,
        attributes=[]
    ),
    ComputerInfo(
        sam_account_name="LAPTOP-002$",
        name="LAPTOP-002",
        dns_host_name="laptop-002.example.com",
        operating_system="Windows 10 Pro",
        operating_system_version="10.0 (19045)",
        operating_system_service_pack=None,
        last_logon="2024-12-19T16:30:00",
        last_logon_timestamp="2024-12-19T16:30:00",
        distinguished_name="CN=LAPTOP-002,OU=Laptops,DC=example,DC=com",
        organizational_unit="Laptops",
        groups=["Domain Computers"],
        account_enabled=True,
        account_disabled=False,
        description="HR Department Laptop",
        managed_by=None,
        attributes=[]
    ),
]

MOCK_GROUPS = [
    GroupInfo(name="Domain Users", distinguished_name="CN=Domain Users,DC=example,DC=com", member_count=150),
    GroupInfo(name="Domain Admins", distinguished_name="CN=Domain Admins,DC=example,DC=com", member_count=5),
    GroupInfo(name="IT Department", distinguished_name="CN=IT Department,DC=example,DC=com", member_count=25),
    GroupInfo(name="HR Department", distinguished_name="CN=HR Department,DC=example,DC=com", member_count=15),
    GroupInfo(name="Domain Computers", distinguished_name="CN=Domain Computers,DC=example,DC=com", member_count=200),
]

# Mock mode için fonksiyonlar
async def get_users_mock(group: Optional[str] = None, search: Optional[str] = None):
    """Mock: Tüm kullanıcıları listele"""
    users = MOCK_USERS.copy()
    if search:
        search_lower = search.lower()
        users = [u for u in users if search_lower in u.display_name.lower() or search_lower in u.sam_account_name.lower() or (u.email and search_lower in u.email.lower())]
    if group:
        users = [u for u in users if group in u.groups]
    return users

async def get_user_mock(sam_account_name: str):
    """Mock: Belirli bir kullanıcıyı getir"""
    for user in MOCK_USERS:
        if user.sam_account_name == sam_account_name:
            return user
    raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")

async def get_computers_mock(search: Optional[str] = None, ou: Optional[str] = None):
    """Mock: Tüm computer'ları listele"""
    computers = MOCK_COMPUTERS.copy()
    if ou:
        # Mock OU filtreleme: distinguishedName içinde OU kısmına bak (basit bir yaklaşım)
        computers = [c for c in computers if ou in (c.distinguished_name or '')]
    if search:
        search_lower = search.lower()
        computers = [c for c in computers if search_lower in c.name.lower() or search_lower in c.sam_account_name.lower() or (c.dns_host_name and search_lower in c.dns_host_name.lower())]
    return computers

async def get_computer_mock(sam_account_name: str):
    """Mock: Belirli bir computer'ı getir"""
    for computer in MOCK_COMPUTERS:
        if computer.sam_account_name == sam_account_name:
            return computer
    raise HTTPException(status_code=404, detail="Computer bulunamadı")

async def get_groups_mock():
    """Mock: Tüm grupları listele"""
    return MOCK_GROUPS

@app.get("/api/status")
async def status():
    return {"message": "AD User Management API", "version": "1.0.0", "mock_mode": MOCK_MODE}

@app.get("/api/users", response_model=List[UserInfo])
async def get_users(
    group: Optional[str] = None,
    search: Optional[str] = None,
    ad_conn: Optional[ADConnection] = Depends(get_ad_connection)
):
    """Tüm kullanıcıları listele veya grup/filtreye göre filtrele"""
    if MOCK_MODE:
        return await get_users_mock(group=group, search=search)
    try:
        users = ad_conn.get_users(group_filter=group, search_filter=search)
        return users
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/users/paginated")
async def get_users_paginated(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    group: Optional[str] = None,
    search: Optional[str] = None,
    ad_conn: ADConnection = Depends(get_ad_connection)
):
    """Sayfalanmış kullanıcı listesi"""
    if MOCK_MODE:
        users = await get_users_mock(group, search)
        total_count = len(users)
        total_pages = (total_count + page_size - 1) // page_size
        start_idx = (page - 1) * page_size
        return {
            "users": users[start_idx:start_idx + page_size],
            "page": page,
            "page_size": page_size,
            "total_count": total_count,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1
        }
    try:
        return ad_conn.get_users_paginated(page, page_size, group, search)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/users/{sam_account_name}", response_model=UserInfo)
async def get_user(
    sam_account_name: str,
    ad_conn: Optional[ADConnection] = Depends(get_ad_connection)
):
    """Belirli bir kullanıcının detaylarını getir"""
    if MOCK_MODE:
        return await get_user_mock(sam_account_name)
    try:
        user = ad_conn.get_user(sam_account_name)
        if not user:
            raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/groups", response_model=List[GroupInfo])
async def get_groups(ad_conn: Optional[ADConnection] = Depends(get_ad_connection)):
    """Tüm grupları listele"""
    if MOCK_MODE:
        return await get_groups_mock()
    try:
        groups = ad_conn.get_groups()
        return groups
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/groups/{group_name}", response_model=GroupInfo)
async def get_group(
    group_name: str,
    ad_conn: Optional[ADConnection] = Depends(get_ad_connection)
):
    """Belirli bir grubun detaylarını getir"""
    if MOCK_MODE:
        for group in MOCK_GROUPS:
            if group.name == group_name:
                return group
        raise HTTPException(status_code=404, detail="Grup bulunamadı")
    try:
        group = ad_conn.get_group(group_name)
        if not group:
            raise HTTPException(status_code=404, detail="Grup bulunamadı")
        return group
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/groups/{group_name}/members", response_model=List[GroupMemberInfo])
async def get_group_members(
    group_name: str,
    ad_conn: Optional[ADConnection] = Depends(get_ad_connection)
):
    """Grup üyelerini listele"""
    if MOCK_MODE:
        # Mock mode'da grup üyelerini döndür
        members = []
        for user in MOCK_USERS:
            if group_name in user.groups:
                members.append(GroupMemberInfo(
                    sam_account_name=user.sam_account_name,
                    display_name=user.display_name,
                    email=user.email,
                    distinguished_name=f"CN={user.sam_account_name},DC=example,DC=com"
                ))
        return members
    try:
        members = ad_conn.get_group_members(group_name)
        return members
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/users/{sam_account_name}/reset-password")
async def reset_password(
    sam_account_name: str,
    request: PasswordResetRequest,
    ad_conn: Optional[ADConnection] = Depends(get_ad_connection)
):
    """Kullanıcı şifresini sıfırla"""
    performed_by = "web_app_user"  # TODO: JWT'den alınacak
    if MOCK_MODE:
        log_password_reset(performed_by, sam_account_name, success=True)
        return {"message": f"Mock: {sam_account_name} kullanıcısının şifresi sıfırlandı", "success": True}
    try:
        success = ad_conn.reset_password(
            sam_account_name=sam_account_name,
            new_password=request.new_password,
            must_change=request.must_change
        )
        if success:
            log_password_reset(performed_by, sam_account_name, success=True)
            return {"message": "Şifre başarıyla sıfırlandı", "success": True}
        else:
            log_password_reset(performed_by, sam_account_name, success=False, error="Şifre sıfırlanamadı")
            raise HTTPException(status_code=400, detail="Şifre sıfırlanamadı")
    except ValueError as e:
        log_password_reset(performed_by, sam_account_name, success=False, error=str(e))
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        log_password_reset(performed_by, sam_account_name, success=False, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/users/{sam_account_name}/account-status")
async def set_account_status(
    sam_account_name: str,
    request: AccountStatusRequest,
    ad_conn: Optional[ADConnection] = Depends(get_ad_connection)
):
    """Hesap durumunu aktif/pasif yap"""
    performed_by = "web_app_user"  # TODO: JWT'den alınacak
    if MOCK_MODE:
        status = "aktif" if request.enabled else "pasif"
        log_account_status_change(performed_by, sam_account_name, "user", request.enabled, success=True)
        return {"message": f"Mock: Hesap {status} yapıldı", "success": True, "enabled": request.enabled}
    try:
        success = ad_conn.set_account_status(
            sam_account_name=sam_account_name,
            enabled=request.enabled
        )
        if success:
            status = "aktif" if request.enabled else "pasif"
            log_account_status_change(performed_by, sam_account_name, "user", request.enabled, success=True)
            return {"message": f"Hesap {status} yapıldı", "success": True, "enabled": request.enabled}
        else:
            log_account_status_change(performed_by, sam_account_name, "user", request.enabled, success=False, error="Hesap durumu değiştirilemedi")
            raise HTTPException(status_code=400, detail="Hesap durumu değiştirilemedi")
    except ValueError as e:
        log_account_status_change(performed_by, sam_account_name, "user", request.enabled, success=False, error=str(e))
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        log_account_status_change(performed_by, sam_account_name, "user", request.enabled, success=False, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/users/{sam_account_name}/groups/add")
async def add_user_to_group(
    sam_account_name: str,
    request: GroupMembershipRequest,
    ad_conn: Optional[ADConnection] = Depends(get_ad_connection)
):
    """Kullanıcıyı gruba ekle"""
    if MOCK_MODE:
        return {
            "message": f"Mock: Kullanıcı '{request.group_name}' grubuna eklendi",
            "success": True
        }
    try:
        success = ad_conn.add_user_to_group(
            sam_account_name=sam_account_name,
            group_name=request.group_name
        )
        if success:
            return {
                "message": f"Kullanıcı '{request.group_name}' grubuna eklendi",
                "success": True
            }
        else:
            raise HTTPException(status_code=400, detail="Kullanıcı gruba eklenemedi")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/users/{sam_account_name}/groups/remove")
async def remove_user_from_group(
    sam_account_name: str,
    request: GroupMembershipRequest,
    ad_conn: Optional[ADConnection] = Depends(get_ad_connection)
):
    """Kullanıcıyı gruptan çıkar"""
    if MOCK_MODE:
        return {
            "message": f"Mock: Kullanıcı '{request.group_name}' grubundan çıkarıldı",
            "success": True
        }
    try:
        success = ad_conn.remove_user_from_group(
            sam_account_name=sam_account_name,
            group_name=request.group_name
        )
        if success:
            return {
                "message": f"Kullanıcı '{request.group_name}' grubundan çıkarıldı",
                "success": True
            }
        else:
            raise HTTPException(status_code=400, detail="Kullanıcı gruptan çıkarılamadı")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/groups/{group_name}/members/add")
async def add_member_to_group(
    group_name: str,
    request: GroupMemberRequest,
    ad_conn: Optional[ADConnection] = Depends(get_ad_connection)
):
    """Gruba kullanıcı ekle"""
    if MOCK_MODE:
        return {
            "message": f"Mock: Kullanıcı '{request.sam_account_name}' gruba eklendi",
            "success": True
        }
    try:
        success = ad_conn.add_user_to_group(
            sam_account_name=request.sam_account_name,
            group_name=group_name
        )
        if success:
            return {
                "message": f"Kullanıcı '{request.sam_account_name}' gruba eklendi",
                "success": True
            }
        else:
            raise HTTPException(status_code=400, detail="Kullanıcı gruba eklenemedi")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/groups/{group_name}/members/remove")
async def remove_member_from_group(
    group_name: str,
    request: GroupMemberRequest,
    ad_conn: Optional[ADConnection] = Depends(get_ad_connection)
):
    """Gruptan kullanıcı çıkar"""
    if MOCK_MODE:
        return {
            "message": f"Mock: Kullanıcı '{request.sam_account_name}' gruptan çıkarıldı",
            "success": True
        }
    try:
        success = ad_conn.remove_user_from_group(
            sam_account_name=request.sam_account_name,
            group_name=group_name
        )
        if success:
            return {
                "message": f"Kullanıcı '{request.sam_account_name}' gruptan çıkarıldı",
                "success": True
            }
        else:
            raise HTTPException(status_code=400, detail="Kullanıcı gruptan çıkarılamadı")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/computers", response_model=List[ComputerInfo])
async def get_computers(
    search: Optional[str] = None,
    ou: Optional[str] = None,
    ad_conn: Optional[ADConnection] = Depends(get_ad_connection)
):
    """Tüm computer'ları listele veya filtreye göre filtrele"""
    if MOCK_MODE:
        return await get_computers_mock(search=search)
    try:
        computers = ad_conn.get_computers(search_filter=search, ou_filter=ou)
        return computers
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/computers/paginated")
async def get_computers_paginated(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    ou: Optional[str] = None,
    ad_conn: ADConnection = Depends(get_ad_connection)
):
    """Sayfalanmış bilgisayar listesi"""
    if MOCK_MODE:
        computers = await get_computers_mock(search, ou)
        total_count = len(computers)
        total_pages = (total_count + page_size - 1) // page_size
        start_idx = (page - 1) * page_size
        return {
            "computers": computers[start_idx:start_idx + page_size],
            "page": page,
            "page_size": page_size,
            "total_count": total_count,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1
        }
    try:
        return ad_conn.get_computers_paginated(page, page_size, search, ou)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/computers/{sam_account_name}", response_model=ComputerInfo)
async def get_computer(
    sam_account_name: str,
    ad_conn: Optional[ADConnection] = Depends(get_ad_connection)
):
    """Belirli bir computer'ın detaylarını getir"""
    if MOCK_MODE:
        return await get_computer_mock(sam_account_name)
    try:
        computer = ad_conn.get_computer(sam_account_name)
        if not computer:
            raise HTTPException(status_code=404, detail="Computer bulunamadı")
        return computer
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/computers/{sam_account_name}/account-status")
async def set_computer_status(
    sam_account_name: str,
    request: ComputerStatusRequest,
    ad_conn: Optional[ADConnection] = Depends(get_ad_connection)
):
    """Computer hesap durumunu aktif/pasif yap"""
    if MOCK_MODE:
        status = "aktif" if request.enabled else "pasif"
        return {"message": f"Mock: Computer {status} yapıldı", "success": True, "enabled": request.enabled}
    try:
        success = ad_conn.set_computer_status(
            sam_account_name=sam_account_name,
            enabled=request.enabled
        )
        if success:
            status = "aktif" if request.enabled else "pasif"
            return {"message": f"Computer {status} yapıldı", "success": True, "enabled": request.enabled}
        else:
            raise HTTPException(status_code=400, detail="Computer durumu değiştirilemedi")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/computers/{sam_account_name}/groups/add")
async def add_computer_to_group(
    sam_account_name: str,
    request: GroupMembershipRequest,
    ad_conn: Optional[ADConnection] = Depends(get_ad_connection)
):
    """Computer'ı gruba ekle"""
    if MOCK_MODE:
        return {
            "message": f"Mock: Computer '{request.group_name}' grubuna eklendi",
            "success": True
        }
    try:
        success = ad_conn.add_computer_to_group(
            sam_account_name=sam_account_name,
            group_name=request.group_name
        )
        if success:
            return {
                "message": f"Computer '{request.group_name}' grubuna eklendi",
                "success": True
            }
        else:
            raise HTTPException(status_code=400, detail="Computer gruba eklenemedi")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/computers/{sam_account_name}/groups/remove")
async def remove_computer_from_group(
    sam_account_name: str,
    request: GroupMembershipRequest,
    ad_conn: Optional[ADConnection] = Depends(get_ad_connection)
):
    """Computer'ı gruptan çıkar"""
    if MOCK_MODE:
        return {
            "message": f"Mock: Computer '{request.group_name}' grubundan çıkarıldı",
            "success": True
        }
    try:
        success = ad_conn.remove_computer_from_group(
            sam_account_name=sam_account_name,
            group_name=request.group_name
        )
        if success:
            return {
                "message": f"Computer '{request.group_name}' grubundan çıkarıldı",
                "success": True
            }
        else:
            raise HTTPException(status_code=400, detail="Computer gruptan çıkarılamadı")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ous")
async def get_ous(ad_conn: ADConnection = Depends(get_ad_connection)):
    """Organizational Unit'leri listele"""
    if MOCK_MODE:
        return [
            {"name": "Computers", "distinguished_name": "CN=Computers,DC=example,DC=com", "path": "CN=Computers,DC=example,DC=com"},
            {"name": "Laptops", "distinguished_name": "OU=Laptops,DC=example,DC=com", "path": "OU=Laptops,DC=example,DC=com"},
            {"name": "Servers", "distinguished_name": "OU=Servers,DC=example,DC=com", "path": "OU=Servers,DC=example,DC=com"},
            {"name": "Users", "distinguished_name": "CN=Users,DC=example,DC=com", "path": "CN=Users,DC=example,DC=com"},
        ]
    try:
        return ad_conn.get_organizational_units()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/groups")
async def create_group(
    request: GroupCreateRequest,
    ad_conn: ADConnection = Depends(get_ad_connection)
):
    """Yeni grup oluştur"""
    username = "admin" # TODO: Auth
    if MOCK_MODE:
        log_group_management(username, request.name, True)
        return {"message": f"Mock: '{request.name}' grubu oluşturuldu", "success": True}
    try:
        success = ad_conn.create_group(request.name, request.description, request.ou_path)
        if success:
            log_group_management(username, request.name, True)
            return {"message": f"'{request.name}' grubu oluşturuldu", "success": True}
        else:
            log_group_management(username, request.name, True, success=False, error="Oluşturulamadı")
            raise HTTPException(status_code=400, detail="Grup oluşturulamadı")
    except Exception as e:
        log_group_management(username, request.name, True, success=False, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/groups/{group_name}")
async def delete_group(
    group_name: str,
    ad_conn: ADConnection = Depends(get_ad_connection)
):
    """Grubu sil"""
    username = "admin" # TODO: Auth
    if MOCK_MODE:
        log_group_management(username, group_name, False)
        return {"message": f"Mock: '{group_name}' grubu silindi", "success": True}
    try:
        success = ad_conn.delete_group(group_name)
        if success:
            log_group_management(username, group_name, False)
            return {"message": f"'{group_name}' grubu silindi", "success": True}
        else:
            log_group_management(username, group_name, False, success=False, error="Silinemedi")
            raise HTTPException(status_code=400, detail="Grup silinemedi")
    except Exception as e:
        log_group_management(username, group_name, False, success=False, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/computers/{sam_account_name}/move")
async def move_computer(
    sam_account_name: str,
    request: ComputerMoveRequest,
    ad_conn: ADConnection = Depends(get_ad_connection)
):
    """Bilgisayarı farklı OU'ya taşı"""
    username = "admin" # TODO: Auth
    if MOCK_MODE:
        log_computer_move(username, sam_account_name, request.target_ou_dn)
        return {"message": f"Mock: '{sam_account_name}' bilgisayarı taşındı", "success": True}
    try:
        success = ad_conn.move_computer_to_ou(sam_account_name, request.target_ou_dn)
        if success:
            log_computer_move(username, sam_account_name, request.target_ou_dn)
            return {"message": f"'{sam_account_name}' bilgisayarı taşındı", "success": True}
        else:
            log_computer_move(username, sam_account_name, request.target_ou_dn, success=False, error="Taşınamadı")
            raise HTTPException(status_code=400, detail="Bilgisayar taşınamadı")
    except Exception as e:
        log_computer_move(username, sam_account_name, request.target_ou_dn, success=False, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))
async def health_check():
    """API sağlık kontrolü"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat(), "mock_mode": MOCK_MODE}

class ConnectionTestRequest(BaseModel):
    server: str
    domain: str
    username: str
    password: str
    base_dn: str

@app.post("/api/test-connection")
async def test_connection(request: ConnectionTestRequest):
    """LDAP bağlantısını test et"""
    try:
        test_conn = ADConnection(
            server=request.server,
            domain=request.domain,
            username=request.username,
            password=request.password,
            base_dn=request.base_dn
        )
        test_conn.connect()
        # Bağlantı başarılı, bir test sorgusu yapalım
        try:
            test_conn.get_groups()
            test_conn.disconnect()
            return {
                "success": True,
                "message": "Bağlantı başarılı! LDAP sunucusuna erişim sağlandı.",
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            test_conn.disconnect()
            return {
                "success": False,
                "message": f"Bağlantı kuruldu ancak sorgu yapılamadı: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
    except Exception as e:
        return {
            "success": False,
            "message": f"Bağlantı hatası: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }

# ==================== DASHBOARD & STATISTICS ====================

@app.get("/api/dashboard/stats")
async def get_dashboard_stats(ad_conn: Optional[ADConnection] = Depends(get_ad_connection)):
    """Dashboard için istatistikler"""
    if MOCK_MODE:
        return {
            "total_users": 3,
            "active_users": 3,
            "disabled_users": 0,
            "total_computers": 2,
            "active_computers": 2,
            "disabled_computers": 0,
            "total_groups": 5,
            "users_by_department": {"IT": 2, "HR": 1},
            "computers_by_os": {"Windows 11 Enterprise": 1, "Windows 10 Pro": 1},
            "recent_logins": [],
            "expiring_passwords": []
        }
    try:
        stats = ad_conn.get_dashboard_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== AUDIT LOGGING ====================

@app.get("/api/audit/logs")
async def get_audit_logs(
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    action_type: Optional[str] = None,
    target_object: Optional[str] = None,
    target_type: Optional[str] = None,
    performed_by: Optional[str] = None,
    source: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    search: Optional[str] = None
):
    """
    Audit loglarını getir.
    Uygulama içi işlemler ve AD'den tespit edilen değişiklikler dahil.
    """
    try:
        action_type_enum = AuditActionType(action_type) if action_type else None
        source_enum = AuditSource(source) if source else None
        
        result = audit_logger.get_logs(
            limit=limit,
            offset=offset,
            action_type=action_type_enum,
            target_object=target_object,
            target_type=target_type,
            performed_by=performed_by,
            source=source_enum,
            start_date=start_date,
            end_date=end_date,
            search=search
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Geçersiz parametre: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/audit/statistics")
async def get_audit_statistics():
    """Audit log istatistikleri"""
    try:
        stats = audit_logger.get_statistics()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== AD CHANGES (RSAT / Other tools) ====================

@app.get("/api/changes/recent")
async def get_recent_ad_changes(
    hours: int = Query(default=24, ge=1, le=720),
    object_type: str = Query(default="all", pattern="^(all|user|computer|group)$"),
    ad_conn: Optional[ADConnection] = Depends(get_ad_connection)
):
    """
    Son X saat içinde AD'de yapılan değişiklikleri getir.
    RSAT, PowerShell veya diğer araçlardan yapılan değişiklikler dahil.
    whenChanged attribute'unu kullanır.
    """
    if MOCK_MODE:
        return {
            "changes": [
                {
                    "object_type": "user",
                    "sam_account_name": "john.doe",
                    "display_name": "John Doe",
                    "when_changed": datetime.now().isoformat(),
                    "when_created": "2024-01-01T10:00:00",
                    "change_type": "modified"
                }
            ],
            "total_count": 1,
            "hours": hours
        }
    try:
        changes = ad_conn.get_recent_changes(hours=hours, object_type=object_type)
        return {
            "changes": changes,
            "total_count": len(changes),
            "hours": hours
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== REPORTING ====================

@app.get("/api/reports/password-expiry")
async def get_password_expiry_report(
    days: int = Query(default=7, ge=1, le=90),
    ad_conn: Optional[ADConnection] = Depends(get_ad_connection)
):
    """Şifre süresi dolacak kullanıcıların raporu"""
    if MOCK_MODE:
        return {
            "users": [],
            "total_count": 0,
            "days_threshold": days
        }
    try:
        stats = ad_conn.get_dashboard_stats()
        expiring = [u for u in stats.get("expiring_passwords", []) if u.get("days_left", 99) <= days]
        return {
            "users": expiring,
            "total_count": len(expiring),
            "days_threshold": days
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/reports/inactive-computers")
async def get_inactive_computers_report(
    days: int = Query(default=30, ge=1, le=365),
    ad_conn: Optional[ADConnection] = Depends(get_ad_connection)
):
    """Belirli bir süredir aktif olmayan bilgisayarların raporu"""
    if MOCK_MODE:
        return {
            "computers": [],
            "total_count": 0,
            "days_threshold": days
        }
    try:
        from datetime import timedelta
        cutoff_date = datetime.now() - timedelta(days=days)
        
        computers = ad_conn.get_computers()
        inactive = []
        
        for comp in computers:
            if comp.last_logon_timestamp:
                try:
                    last_logon = datetime.fromisoformat(comp.last_logon_timestamp.replace('Z', '+00:00'))
                    if last_logon < cutoff_date:
                        inactive.append({
                            "name": comp.name,
                            "sam_account_name": comp.sam_account_name,
                            "last_logon": comp.last_logon_timestamp,
                            "operating_system": comp.operating_system,
                            "organizational_unit": comp.organizational_unit
                        })
                except:
                    pass
        
        return {
            "computers": inactive,
            "total_count": len(inactive),
            "days_threshold": days
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/reports/computer-inventory")
async def get_computer_inventory(
    ad_conn: Optional[ADConnection] = Depends(get_ad_connection)
):
    """Bilgisayar envanteri raporu - İşletim sistemine göre gruplandırılmış"""
    if MOCK_MODE:
        return {
            "inventory": {
                "Windows 11 Enterprise": {"count": 1, "computers": ["PC-001"]},
                "Windows 10 Pro": {"count": 1, "computers": ["LAPTOP-002"]}
            },
            "total_count": 2
        }
    try:
        computers = ad_conn.get_computers()
        inventory = {}
        
        for comp in computers:
            os_name = comp.operating_system or "Bilinmiyor"
            if os_name not in inventory:
                inventory[os_name] = {"count": 0, "computers": []}
            inventory[os_name]["count"] += 1
            inventory[os_name]["computers"].append(comp.name)
        
        return {
            "inventory": inventory,
            "total_count": len(computers)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Statik dosyaların yolu (PyInstaller desteği ile)
import sys

def get_frontend_dir():
    if getattr(sys, 'frozen', False):
        # PyInstaller ile paketlenmişse
        base_path = sys._MEIPASS
    else:
        # Normal çalışıyorsa
        base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    return os.path.join(base_path, "frontend", "dist")

FRONTEND_DIR = get_frontend_dir()

if os.path.exists(FRONTEND_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIR, "assets")), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # API ve Swagger/Redoc rotalarını atla
        if full_path.startswith("api/") or full_path in ["docs", "redoc", "openapi.json"]:
            return None # FastAPI'nin kendi rotasına düşmesine izin ver
        
        file_path = os.path.join(FRONTEND_DIR, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        
        # SPA için index.html döndür
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))
else:
    print(f"Uyarı: Frontend klasörü bulunamadı: {FRONTEND_DIR}")

if __name__ == "__main__":
    import uvicorn
    import webbrowser
    from threading import Timer

    def open_browser():
        webbrowser.open("http://localhost:8000")

    # Tarayıcıyı 2 saniye sonra aç (serverın başlaması için zaman tanı)
    Timer(2, open_browser).start()
    
    uvicorn.run(app, host="0.0.0.0", port=8000)

