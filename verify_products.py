import requests
import json

try:
    response = requests.get("http://127.0.0.1:8000/products")
    print(f"Status Code: {response.status_code}")
    try:
        print("Response JSON:")
        print(json.dumps(response.json(), indent=2))
    except:
        print("Response Text:")
        print(response.text)
except Exception as e:
    print(f"Error: {e}")
