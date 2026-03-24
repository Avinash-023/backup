import requests

data = [
    {
        "rollNo": "TEST_ROLL_1",
        "name": "Test Student 1",
        "email": "test1@example.com",
        "department": "Computer Science"
    }
]

try:
    res = requests.post("http://127.0.0.1:5000/api/students/bulk", json=data)
    print("Status:", res.status_code)
    print("Response:", res.text)
except Exception as e:
    print("Error:", e)
