# test_backend.py
import requests
import json

BASE_URL = "http://localhost:8000"

def test_backend():
    print("Testing backend endpoints...")
    
    # Test 1: Health check
    print("\n1. Testing health endpoint...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    # Test 2: Register a farmer
    print("\n2. Registering a farmer...")
    farmer_data = {
        "phone": "9876543210",
        "password": "123456",
        "name": "Test Farmer",
        "role": "FARMER",
        "location": "Test Location"
    }
    response = requests.post(f"{BASE_URL}/register", json=farmer_data)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Token: {data['access_token'][:30]}...")
        farmer_token = data['access_token']
    else:
        print(f"Error: {response.text}")
        return
    
    # Test 3: Login with farmer
    print("\n3. Logging in as farmer...")
    login_data = {
        "phone": "9876543210",
        "password": "123456"
    }
    response = requests.post(f"{BASE_URL}/login", json=login_data)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"User: {data['user']['name']}")
        farmer_token = data['access_token']  # Get fresh token
    else:
        print(f"Error: {response.text}")
    
    # Test 4: Create order (with auth header)
    print("\n4. Creating an order...")
    order_data = {
        "crop": "Rice",
        "variety": "Basmati",
        "quantity": 50,
        "quantity_unit": "quintal",
        "moisture": 12.5,
        "min_price": 3500,
        "location": "Test Farm",
        "pincode": "123456"
    }
    headers = {"Authorization": f"Bearer {farmer_token}"}
    response = requests.post(f"{BASE_URL}/orders", json=order_data, headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        order = response.json()
        print(f"Order created: ID {order['id']}")
        order_id = order['id']
    else:
        print(f"Error: {response.text}")
    
    # Test 5: Get all orders (with auth header)
    print("\n5. Getting all orders...")
    response = requests.get(f"{BASE_URL}/orders", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        orders = response.json()
        print(f"Number of orders: {len(orders)}")
    else:
        print(f"Error: {response.text}")
    
    # Test 6: Get my orders
    print("\n6. Getting my orders...")
    response = requests.get(f"{BASE_URL}/orders/my", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        my_orders = response.json()
        print(f"Number of my orders: {len(my_orders)}")
    else:
        print(f"Error: {response.text}")
    
    print("\n" + "="*50)
    print("Backend test completed!")
    print("="*50)

if __name__ == "__main__":
    test_backend()