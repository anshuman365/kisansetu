import httpx

async def get_coordinates(address: str):
    # Mocking for reliability in demo
    # In production, use Google Maps API
    return 28.6139, 77.2090

async def calculate_distance(origin: str, destination: str):
    # Mocking distance calculation
    # In production use Google Matrix API
    return 250.0 # km
