import urllib.request
import json

try:
    req = urllib.request.Request('http://127.0.0.1:5000/api/schedules')
    with urllib.request.urlopen(req) as f:
        schedules = json.loads(f.read().decode('utf-8'))
        
    if schedules:
        sched_id = schedules[-1]['id']
        data = json.dumps({'examScheduleId': sched_id}).encode('utf-8')
        req2 = urllib.request.Request('http://127.0.0.1:5000/api/allocations/generate', data=data, headers={'Content-Type': 'application/json'})
        try:
            with urllib.request.urlopen(req2) as f2:
                print(f"Response: {f2.read().decode('utf-8')}")
        except urllib.error.HTTPError as e:
            print(f"Error {e.code}: {e.read().decode('utf-8')}")
    else:
        print("No schedules found.")
except Exception as e:
    print(f"Exception: {e}")
