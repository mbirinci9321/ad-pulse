"""
Audit Logger Module
İki katmanlı audit sistemi:
1. Uygulama içi işlemler için JSON loglama
2. AD değişiklik takibi için whenChanged/modifyTimeStamp okuma
"""

import json
import os
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from enum import Enum

# Audit log dosyası yolu
AUDIT_LOG_FILE = os.path.join(os.path.dirname(__file__), "audit_logs.json")


class AuditActionType(str, Enum):
    """İşlem türleri"""
    # Kullanıcı işlemleri
    PASSWORD_RESET = "password_reset"
    ACCOUNT_ENABLE = "account_enable"
    ACCOUNT_DISABLE = "account_disable"
    GROUP_ADD = "group_add"
    GROUP_REMOVE = "group_remove"
    
    # Bilgisayar işlemleri
    COMPUTER_ENABLE = "computer_enable"
    COMPUTER_DISABLE = "computer_disable"
    COMPUTER_GROUP_ADD = "computer_group_add"
    COMPUTER_GROUP_REMOVE = "computer_group_remove"
    
    # Grup işlemleri
    MEMBER_ADD = "member_add"
    MEMBER_REMOVE = "member_remove"
    GROUP_CREATE = "group_create"
    GROUP_DELETE = "group_delete"
    
    # Bilgisayar işlemleri
    COMPUTER_MOVE = "computer_move"
    
    # AD'den okunan değişiklikler
    AD_CHANGE_DETECTED = "ad_change_detected"


class AuditSource(str, Enum):
    """İşlem kaynağı"""
    WEB_APP = "web_app"  # Bu uygulamadan
    AD_DETECTED = "ad_detected"  # AD'den tespit edilen (RSAT, PowerShell vs.)


class AuditLogEntry(BaseModel):
    """Audit log kaydı"""
    id: str  # Unique ID
    timestamp: str  # ISO format
    action_type: AuditActionType
    source: AuditSource
    performed_by: str  # İşlemi yapan kullanıcı
    target_object: str  # Hedef obje (kullanıcı, bilgisayar, grup)
    target_type: str  # "user", "computer", "group"
    details: Dict[str, Any]  # Ek detaylar
    success: bool
    error_message: Optional[str] = None


class AuditLogger:
    """Audit Logger sınıfı"""
    
    def __init__(self, log_file: str = AUDIT_LOG_FILE):
        self.log_file = log_file
        self._ensure_log_file()
    
    def _ensure_log_file(self):
        """Log dosyasının varlığını kontrol et, yoksa oluştur"""
        if not os.path.exists(self.log_file):
            with open(self.log_file, 'w', encoding='utf-8') as f:
                json.dump([], f)
    
    def _read_logs(self) -> List[Dict]:
        """Tüm logları oku"""
        try:
            with open(self.log_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return []
    
    def _write_logs(self, logs: List[Dict]):
        """Logları dosyaya yaz"""
        with open(self.log_file, 'w', encoding='utf-8') as f:
            json.dump(logs, f, ensure_ascii=False, indent=2)
    
    def _generate_id(self) -> str:
        """Unique ID oluştur"""
        return datetime.now().strftime("%Y%m%d%H%M%S%f")
    
    def log(
        self,
        action_type: AuditActionType,
        performed_by: str,
        target_object: str,
        target_type: str,
        details: Dict[str, Any] = None,
        success: bool = True,
        error_message: str = None,
        source: AuditSource = AuditSource.WEB_APP
    ) -> AuditLogEntry:
        """Yeni bir audit log kaydı oluştur"""
        
        entry = AuditLogEntry(
            id=self._generate_id(),
            timestamp=datetime.now().isoformat(),
            action_type=action_type,
            source=source,
            performed_by=performed_by,
            target_object=target_object,
            target_type=target_type,
            details=details or {},
            success=success,
            error_message=error_message
        )
        
        # Mevcut logları oku ve yeni kaydı ekle
        logs = self._read_logs()
        logs.append(entry.model_dump())
        self._write_logs(logs)
        
        return entry
    
    def get_logs(
        self,
        limit: int = 100,
        offset: int = 0,
        action_type: Optional[AuditActionType] = None,
        target_object: Optional[str] = None,
        target_type: Optional[str] = None,
        performed_by: Optional[str] = None,
        source: Optional[AuditSource] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        search: Optional[str] = None
    ) -> Dict[str, Any]:
        """Filtrelenmiş audit loglarını getir"""
        
        logs = self._read_logs()
        
        # En yeniden en eskiye sırala
        logs = sorted(logs, key=lambda x: x.get('timestamp', ''), reverse=True)
        
        # Filtreleme
        filtered_logs = []
        for log in logs:
            # Action type filtresi
            if action_type and log.get('action_type') != action_type:
                continue
            
            # Target object filtresi
            if target_object and target_object.lower() not in log.get('target_object', '').lower():
                continue
            
            # Target type filtresi
            if target_type and log.get('target_type') != target_type:
                continue
            
            # Performed by filtresi
            if performed_by and performed_by.lower() not in log.get('performed_by', '').lower():
                continue
            
            # Source filtresi
            if source and log.get('source') != source:
                continue
            
            # Tarih filtresi
            log_date = log.get('timestamp', '')[:10]  # YYYY-MM-DD
            if start_date and log_date < start_date:
                continue
            if end_date and log_date > end_date:
                continue
            
            # Genel arama
            if search:
                search_lower = search.lower()
                searchable = f"{log.get('target_object', '')} {log.get('performed_by', '')} {log.get('action_type', '')}".lower()
                if search_lower not in searchable:
                    continue
            
            filtered_logs.append(log)
        
        total_count = len(filtered_logs)
        
        # Pagination
        paginated_logs = filtered_logs[offset:offset + limit]
        
        return {
            "logs": paginated_logs,
            "total_count": total_count,
            "limit": limit,
            "offset": offset
        }
    
    def get_statistics(self) -> Dict[str, Any]:
        """Audit log istatistiklerini getir"""
        logs = self._read_logs()
        
        if not logs:
            return {
                "total_actions": 0,
                "actions_by_type": {},
                "actions_by_source": {},
                "actions_by_user": {},
                "success_rate": 0,
                "recent_activity": []
            }
        
        # İşlem türlerine göre sayım
        actions_by_type = {}
        actions_by_source = {}
        actions_by_user = {}
        success_count = 0
        
        for log in logs:
            # Action type
            action = log.get('action_type', 'unknown')
            actions_by_type[action] = actions_by_type.get(action, 0) + 1
            
            # Source
            source = log.get('source', 'unknown')
            actions_by_source[source] = actions_by_source.get(source, 0) + 1
            
            # User
            user = log.get('performed_by', 'unknown')
            actions_by_user[user] = actions_by_user.get(user, 0) + 1
            
            # Success
            if log.get('success', False):
                success_count += 1
        
        # Son 24 saatlik aktivite
        recent_logs = sorted(logs, key=lambda x: x.get('timestamp', ''), reverse=True)[:10]
        
        return {
            "total_actions": len(logs),
            "actions_by_type": actions_by_type,
            "actions_by_source": actions_by_source,
            "actions_by_user": actions_by_user,
            "success_rate": round((success_count / len(logs)) * 100, 2) if logs else 0,
            "recent_activity": recent_logs
        }


# Global instance
audit_logger = AuditLogger()


# Helper fonksiyonlar - kolay kullanım için
def log_password_reset(performed_by: str, target_user: str, success: bool = True, error: str = None):
    """Şifre sıfırlama logla"""
    return audit_logger.log(
        action_type=AuditActionType.PASSWORD_RESET,
        performed_by=performed_by,
        target_object=target_user,
        target_type="user",
        details={"action": "Şifre sıfırlandı"},
        success=success,
        error_message=error
    )


def log_account_status_change(performed_by: str, target: str, target_type: str, enabled: bool, success: bool = True, error: str = None):
    """Hesap durumu değişikliği logla"""
    action_type = AuditActionType.ACCOUNT_ENABLE if enabled else AuditActionType.ACCOUNT_DISABLE
    if target_type == "computer":
        action_type = AuditActionType.COMPUTER_ENABLE if enabled else AuditActionType.COMPUTER_DISABLE
    
    return audit_logger.log(
        action_type=action_type,
        performed_by=performed_by,
        target_object=target,
        target_type=target_type,
        details={"enabled": enabled, "action": "Hesap aktif edildi" if enabled else "Hesap devre dışı bırakıldı"},
        success=success,
        error_message=error
    )


def log_group_membership_change(performed_by: str, target: str, target_type: str, group_name: str, added: bool, success: bool = True, error: str = None):
    """Grup üyeliği değişikliği logla"""
    if target_type == "computer":
        action_type = AuditActionType.COMPUTER_GROUP_ADD if added else AuditActionType.COMPUTER_GROUP_REMOVE
    else:
        action_type = AuditActionType.GROUP_ADD if added else AuditActionType.GROUP_REMOVE
    
    return audit_logger.log(
        action_type=action_type,
        performed_by=performed_by,
        target_object=target,
        target_type=target_type,
        details={
            "group_name": group_name,
            "action": f"'{group_name}' grubuna eklendi" if added else f"'{group_name}' grubundan çıkarıldı"
        },
        success=success,
        error_message=error
    )


def log_ad_change_detected(target: str, target_type: str, change_type: str, detected_by: str = "system"):
    """AD'den tespit edilen değişikliği logla"""
    return audit_logger.log(
        action_type=AuditActionType.AD_CHANGE_DETECTED,
        performed_by=detected_by,
        target_object=target,
        target_type=target_type,
        details={"change_type": change_type},
        success=True,
        source=AuditSource.AD_DETECTED
    )


def log_group_management(performed_by: str, group_name: str, created: bool, success: bool = True, error: str = None):
    """Grup oluşturma/silme logla"""
    action_type = AuditActionType.GROUP_CREATE if created else AuditActionType.GROUP_DELETE
    return audit_logger.log(
        action_type=action_type,
        performed_by=performed_by,
        target_object=group_name,
        target_type="group",
        details={"action": f"Grup oluşturuldu" if created else "Grup silindi"},
        success=success,
        error_message=error
    )


def log_computer_move(performed_by: str, computer_name: str, target_ou: str, success: bool = True, error: str = None):
    """Bilgisayar OU taşıma logla"""
    return audit_logger.log(
        action_type=AuditActionType.COMPUTER_MOVE,
        performed_by=performed_by,
        target_object=computer_name,
        target_type="computer",
        details={
            "target_ou": target_ou,
            "action": f"Bilgisayar {target_ou} OU'suna taşındı"
        },
        success=success,
        error_message=error
    )
