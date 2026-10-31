import os, hashlib, hmac, secrets
from datetime import datetime, timedelta, timezone
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from .database import get_db
from .models import Farmer

SECRET = os.getenv("SECRET_KEY", "dev-secret-change-me-dev-secret-change-me")
bearer = HTTPBearer(auto_error=False)


def _hash(password, salt):
    return hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100_000).hex()


def hash_pw(password):
    salt = secrets.token_hex(8)
    return f"{salt}${_hash(password, salt)}"


def check_pw(password, stored):
    salt, h = stored.split("$")
    return hmac.compare_digest(_hash(password, salt), h)


def make_token(farmer_id):
    exp = datetime.now(timezone.utc) + timedelta(days=7)
    return jwt.encode({"sub": str(farmer_id), "exp": exp}, SECRET, algorithm="HS256")


def current_farmer(cred: HTTPAuthorizationCredentials = Depends(bearer), db: Session = Depends(get_db)):
    if not cred:
        raise HTTPException(401, "Please login first")
    try:
        data = jwt.decode(cred.credentials, SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(401, "Session expired, please login again")
    farmer = db.get(Farmer, int(data["sub"]))
    if not farmer:
        raise HTTPException(401, "Account not found")
    return farmer
