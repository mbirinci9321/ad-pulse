from pydantic import BaseModel
from typing import List, Optional

class UserAttribute(BaseModel):
    name: str
    value: str

class UserInfo(BaseModel):
    sam_account_name: str
    display_name: str
    email: Optional[str] = None
    groups: List[str] = []
    password_last_set: Optional[str] = None
    password_expires: Optional[str] = None
    account_enabled: bool
    account_disabled: bool
    attributes: List[UserAttribute] = []

class GroupInfo(BaseModel):
    name: str
    distinguished_name: str
    member_count: int

