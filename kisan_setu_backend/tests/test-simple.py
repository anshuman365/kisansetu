# test_api_simple.py
import requests
import json

BASE_URL = "http://localhost:8000"

def print_response(response):
    print(f"Status: {response.status_code}")
    try:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except:
        print(f"Response: {response.text}")

def test_api():
    print("=" * 50)
    print("Testing KisanSetu API")
    print("=" * 50)
    
    # Test 1: Root endpoint
    print("\n1. Testing root endpoint...")
    response = requests.get(f"{BASE_URL}/")
    print_response(response)
    
    # Test 2: Health check
    print("\n2. Testing health endpoint...")
    response = requests.get(f"{BASE_URL}/health")
    print_response(response)
    
    # Test 3: Register a farmer (SIMPLIFIED DATA)
    print("\n3. Registering a farmer...")
    farmer_data = {
        "phone": "9876543210",
        "password": "123456",  # Shorter password
        "name": "Rajesh",
        "role": "FARMER",
        "location": "Karnal"
    }
    response = requests.post(f"{BASE_URL}/register", json=farmer_data)
    print_response(response)
    
    if response.status_code == 200:
        farmer_token = response.json()["access_token"]
        print(f"Farmer token: {farmer_token[:30]}...")
    else:
        print("Failed to register farmer")
        print("Error details:", response.json() if response.content else "No details")
        return
    
    # Test 4: Register a buyer
    print("\n4. Registering a buyer...")
    buyer_data = {
        "phone": "9876543211",
        "password": "123456",
        "name": "Amit",
        "role": "BUYER",
        "location": "Delhi"
    }
    response = requests.post(f"{BASE_URL}/register", json=buyer_data)
    print_response(response)
    
    if response.status_code == 200:
        buyer_token = response.json()["access_token"]
        print(f"Buyer token: {buyer_token[:30]}...")
    else:
        print("Failed to register buyer")
        print("Error details:", response.json() if response.content else "No details")
        return
    
    # Test 5: Login with farmer
    print("\n5. Logging in as farmer...")
    login_data = {
        "phone": "9876543210",
        "password": "123456"
    }
    response = requests.post(f"{BASE_URL}/login", json=login_data)
    print_response(response)
    
    # Test 6: Create an order (as farmer)
    print("\n6. Creating an order...")
    order_data = {
        "crop": "Rice",
        "variety": "Basmati",
        "quantity": 50,
        "quantity_unit": "quintal",
        "moisture": 12.5,
        "min_price": 3500,
        "location": "Karnal",
        "pincode": "132001"
    }
    headers = {"Authorization": f"Bearer {farmer_token}"}
    response = requests.post(f"{BASE_URL}/orders", json=order_data, headers=headers)
    print_response(response)
    
    if response.status_code == 201:
        order_id = response.json()["id"]
        print(f"Created order ID: {order_id}")
    else:
        print("Failed to create order")
        return
    
    # Test 7: Get all orders
    print("\n7. Getting all orders...")
    headers = {"Authorization": f"Bearer {farmer_token}"}
    response = requests.get(f"{BASE_URL}/orders", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        orders = response.json()
        print(f"Number of orders: {len(orders)}")
    
    # Test 8: Place a bid (as buyer)
    print("\n8. Placing a bid...")
    bid_data = {"amount": 3600}
    headers = {"Authorization": f"Bearer {buyer_token}"}
    response = requests.post(f"{BASE_URL}/orders/{order_id}/bids", json=bid_data, headers=headers)
    print_response(response)
    
    print("\n" + "=" * 50)
    print("API Testing Complete!")
    print("=" * 50)

if __name__ == "__main__":
    test_api()