
import pytest
from fastapi.testclient import TestClient
from main import app
import uuid

client = TestClient(app)

def test_webhook_create_product():
    # Test creating a new product via webhook
    product_id = str(uuid.uuid4())
    payload = {
        "id": product_id,
        "sku": f"WH-TEST-{product_id[:8]}",
        "name": "Webhook Test Product",
        "description": "Created via Webhook",
        "price": 1500.0,
        "image_url": "https://example.com/img.jpg",
        "category": "Tests",
        "variants": [
            {"sku": f"WH-VAR-1-{product_id[:8]}", "size": "M", "color": "Blue", "stock": 10},
            {"sku": f"WH-VAR-2-{product_id[:8]}", "size": "L", "color": "Red", "stock": 5}
        ]
    }
    
    response = client.post("/webhooks/products", json=payload)
    assert response.status_code == 200
    assert response.json()["message"] == "Product updated successfully"
    
    # Verify DB state (via GET endpoint)
    get_res = client.get(f"/products/{product_id}")
    assert get_res.status_code == 200
    data = get_res.json()
    assert data["name"] == "Webhook Test Product"
    assert data["stock"] == 15 # Sum of variants
    assert len(data["variants"]) == 2

def test_webhook_update_product():
    # Setup: Create product first
    product_id = str(uuid.uuid4())
    payload = {
        "id": product_id,
        "sku": f"WH-UPD-{product_id[:8]}",
        "name": "Original Name",
        "price": 1000.0,
        "stock": 0,
        "variants": []
    }
    client.post("/webhooks/products", json=payload)
    
    # Test Update
    update_payload = {
        "id": product_id,
        "sku": f"WH-UPD-{product_id[:8]}",
        "name": "Updated Name",
        "price": 2000.0,
        "category": "Updated Cat",
        "variants": [
            {"sku": f"WH-VAR-NEW-{product_id[:8]}", "size": "XL", "stock": 50}
        ]
    }
    
    response = client.post("/webhooks/products", json=update_payload)
    assert response.status_code == 200
    
    # Verify Update
    get_res = client.get(f"/products/{product_id}")
    data = get_res.json()
    assert data["name"] == "Updated Name"
    assert data["price"] == 2000.0
    assert data["category"] == "Updated Cat"
    assert data["stock"] == 50
    assert len(data["variants"]) == 1
