import razorpay
from ..config import RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET

# Initialize Client
client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

def create_order(amount_in_rupees: float, receipt_id: str):
    data = {
        "amount": int(amount_in_rupees * 100), # Paise
        "currency": "INR",
        "receipt": receipt_id,
        "payment_capture": 1
    }
    return client.order.create(data=data)

def verify_signature(params: dict):
    try:
        client.utility.verify_payment_signature(params)
        return True
    except:
        return False
