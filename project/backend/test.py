# test_post.py
import requests

url = "http://127.0.0.1:5000/api/simulation/step"

payload = {
    "data": {
        "nodes": [],
        "links": []
    },
    "params": {
        "beta": 0.1,
        "alpha": 0.1,
        "gamma": 0.1,
        "mu": 0.01
    }
}

headers = {
    "Content-Type": "application/json"
}

response = requests.post(url, json=payload, headers=headers)

print("Status Code:", response.status_code)
print("Response:", response.text)
