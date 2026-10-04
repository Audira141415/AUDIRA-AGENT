"""
test_agent_client.py - Example Python script sending live events to Audira Office Visualizer.

Usage:
1. Start the visualizer: npm run dev
2. (Optional) Start the server: npm run server
3. Run this script: python test_agent_client.py
"""

import json
import time
import urllib.request

SERVER_URL = "http://localhost:8080/api/agent-event"

def send_agent_event(role, action, task, speech=None, tool=None, tokens=0, log=None):
    payload = {
        "role": role,         # "PM", "DEV", "QA", "DEVOPS"
        "action": action,     # "idle", "coding", "thinking", "testing", "deploying", "coffee"
        "task": task,
        "speech": speech,
        "tool": tool,
        "tokens": tokens,
        "log": log or speech or f"Executed {action}"
    }
    
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        SERVER_URL,
        data=data,
        headers={"Content-Type": "application/json"}
    )
    
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"[{role}] Event Sent: {action} -> {resp.status}")
    except Exception as e:
        print(f"Failed to send event (is 'npm run server' running?): {e}")

if __name__ == "__main__":
    print("Sending live agent workflow sequence from Python...")
    
    # 1. PM analyzes prompt
    send_agent_event(
        role="PM",
        action="thinking",
        task="Decomposing user prompt into technical tickets",
        speech="Analyzing user requirement: Create OAuth2 Google Sign-In...",
        tokens=310
    )
    time.sleep(3)
    
    # 2. Coder starts coding
    send_agent_event(
        role="DEV",
        action="coding",
        task="Writing passport-google-oauth20 strategy",
        speech="Generating OAuth callback handler and JWT cookie session.",
        tool="write_file('auth.ts')",
        tokens=840
    )
    time.sleep(4)
    
    # 3. QA tests code
    send_agent_event(
        role="QA",
        action="testing",
        task="Executing security penetration & OAuth callback test",
        speech="Simulating CSRF state attack and token refresh...",
        tool="pytest test_auth.py",
        tokens=420
    )
    time.sleep(3)
    
    # 4. DevOps deploys
    send_agent_event(
        role="DEVOPS",
        action="deploying",
        task="Deploying auth microservice canary",
        speech="Canary rollout 10% traffic to production cluster.",
        tool="terraform apply -auto-approve",
        tokens=200
    )
    time.sleep(3)
    
    # 5. Success
    send_agent_event(
        role="DEVOPS",
        action="idle",
        task="Monitoring live metrics",
        speech="Google OAuth2 feature live in production!",
        log="Deployment finished with 0 error rate."
    )
    print("Workflow completed successfully!")
