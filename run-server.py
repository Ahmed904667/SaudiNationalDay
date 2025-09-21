#!/usr/bin/env python3
"""
Simple HTTP Server for Saudi Nation Day Project
Run this to serve the project locally and avoid CORS issues
"""

import http.server
import socketserver
import os
import sys
from pathlib import Path

# Configuration
PORT = 8000
DIRECTORY = Path(__file__).parent

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        # Add CORS headers to allow cross-origin requests
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        # Add cache control for images
        if self.path.endswith(('.png', '.jpg', '.jpeg', '.gif', '.svg')):
            self.send_header('Cache-Control', 'public, max-age=3600')
        super().end_headers()

def run_server():
    """Start the HTTP server"""
    try:
        with socketserver.TCPServer(("", PORT), CustomHTTPRequestHandler) as httpd:
            print(f"🇸🇦 Saudi Nation Day Server")
            print(f"📁 Serving directory: {DIRECTORY}")
            print(f"🌐 Server running at: http://localhost:{PORT}")
            print(f"📱 Access your app at: http://localhost:{PORT}/index.html")
            print(f"⏹️  Press Ctrl+C to stop the server")
            print("-" * 50)
            httpd.serve_forever()
    except KeyboardInterrupt:
        print(f"\n🛑 Server stopped by user")
        sys.exit(0)
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Port {PORT} is already in use. Try a different port or stop the existing server.")
            sys.exit(1)
        else:
            print(f"❌ Error starting server: {e}")
            sys.exit(1)

if __name__ == "__main__":
    run_server()