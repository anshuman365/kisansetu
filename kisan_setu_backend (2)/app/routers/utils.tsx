from fastapi import APIRouter
from ..services import geocoding

router = APIRouter()

@router.get("/utils/reverse-geocode")
async def reverse_geocode(lat: float, lng: float):
    # Mock logic
    if lat > 28:
        return {"city": "Karnal", "district": "Karnal", "state": "Haryana", "pincode": "132001"}
    elif lat > 20:
        return {"city": "Indore", "district": "Indore", "state": "Madhya Pradesh", "pincode": "452001"}
    else:
        return {"city": "Bengaluru", "district": "Bengaluru", "state": "Karnataka", "pincode": "560001"}

@router.get("/utils/varieties")
async def get_varieties(crop: str):
    db = {"Dhan (Paddy)": ["Basmati 1121", "PR-14"], "Wheat": ["Sharbati", "Lokwan"]}
    return db.get(crop, ["Common", "Hybrid"])

@router.get("/utils/price")
async def get_price(crop: str, variety: str):
    return {"min": 2000, "max": 2500}

@router.get("/utils/geo/{pincode}")
async def get_geo(pincode: str):
    return "Sample City"

@router.get("/utils/transport-rate")
async def get_rate(dist: float, weight: float):
    return {"rate": 40 * dist}
