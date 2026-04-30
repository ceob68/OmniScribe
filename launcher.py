import sys
import threading
import time
import webbrowser
import uvicorn
from backend.main import app

def open_browser():
    time.sleep(2)
    webbrowser.open("http://localhost:8000")

def main():
    threading.Thread(target=open_browser, daemon=True).start()
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="warning")

if __name__ == "__main__":
    main()
