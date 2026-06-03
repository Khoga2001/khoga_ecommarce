"""
Authentication routes: register, login, profile management
"""
from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime

from models import (
    RegisterRequest, LoginRequest, AuthResponse,
    UserPublic, UserDB, UpdateProfileRequest,
    ChangePasswordRequest, AddressSchema, MessageResponse,
    SetDefaultAddressRequest
)
from utils.security import hash_password, verify_password, create_access_token, get_current_user
from utils.db import get_db

router = APIRouter(prefix="/auth", tags=["auth"])


async def _get_user_by_email(db, email: str):
    return await db.users.find_one({"email": email.lower()})


async def _get_user_by_id(db, user_id: str):
    return await db.users.find_one({"id": user_id})


@router.post("/register", response_model=AuthResponse)
async def register(data: RegisterRequest):
    db = get_db()
    existing = await _get_user_by_email(db, data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    if len(data.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    user = UserDB(
        email=data.email.lower(),
        password_hash=hash_password(data.password),
        name=data.name.strip(),
        phone=data.phone,
    )
    await db.users.insert_one(user.dict())
    token = create_access_token(user.id, user.role.value)
    return AuthResponse(access_token=token, user=UserPublic(**user.dict()))


@router.post("/login", response_model=AuthResponse)
async def login(data: LoginRequest):
    db = get_db()
    user_doc = await _get_user_by_email(db, data.email)
    if not user_doc or not verify_password(data.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user_doc.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account is deactivated")
    token = create_access_token(user_doc["id"], user_doc.get("role", "customer"))
    return AuthResponse(access_token=token, user=UserPublic(**user_doc))


@router.get("/me", response_model=UserPublic)
async def get_me(current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_doc = await _get_user_by_id(db, current_user["user_id"])
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    return UserPublic(**user_doc)


@router.put("/me", response_model=UserPublic)
async def update_profile(data: UpdateProfileRequest, current_user: dict = Depends(get_current_user)):
    db = get_db()
    update = {"updated_at": datetime.utcnow()}
    if data.name:
        update["name"] = data.name.strip()
    if data.phone is not None:
        update["phone"] = data.phone
    if data.address:
        user_doc = await _get_user_by_id(db, current_user["user_id"])
        addresses = user_doc.get("addresses", [])
        if addresses:
            addresses[user_doc.get("default_address_idx", 0)] = data.address.dict()
        else:
            addresses.append(data.address.dict())
        update["addresses"] = addresses

    await db.users.update_one({"id": current_user["user_id"]}, {"$set": update})
    user_doc = await _get_user_by_id(db, current_user["user_id"])
    return UserPublic(**user_doc)


@router.post("/change-password", response_model=MessageResponse)
async def change_password(data: ChangePasswordRequest, current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_doc = await _get_user_by_id(db, current_user["user_id"])
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(data.current_password, user_doc["password_hash"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(data.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")
    await db.users.update_one(
        {"id": current_user["user_id"]},
        {"$set": {"password_hash": hash_password(data.new_password), "updated_at": datetime.utcnow()}}
    )
    return MessageResponse(message="Password changed successfully")


@router.post("/me/addresses", response_model=UserPublic)
async def add_address(address: AddressSchema, current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_doc = await _get_user_by_id(db, current_user["user_id"])
    addresses = user_doc.get("addresses", [])
    addresses.append(address.dict())
    await db.users.update_one(
        {"id": current_user["user_id"]},
        {"$set": {"addresses": addresses, "updated_at": datetime.utcnow()}}
    )
    user_doc = await _get_user_by_id(db, current_user["user_id"])
    return UserPublic(**user_doc)


@router.post("/me/addresses/default", response_model=UserPublic)
async def set_default_address(data: SetDefaultAddressRequest, current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_doc = await _get_user_by_id(db, current_user["user_id"])
    addresses = user_doc.get("addresses", [])
    if data.index < 0 or data.index >= len(addresses):
        raise HTTPException(status_code=400, detail="Invalid address index")
    
    await db.users.update_one(
        {"id": current_user["user_id"]},
        {"$set": {"default_address_idx": data.index, "updated_at": datetime.utcnow()}}
    )
    user_doc = await _get_user_by_id(db, current_user["user_id"])
    return UserPublic(**user_doc)
