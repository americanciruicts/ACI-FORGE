"""
Vercel WSGI entry point for the FastAPI application.
This file handles the serverless deployment on Vercel.
"""
from api.index import app

# Vercel requires a WSGI-compatible app
# FastAPI ASGI app is wrapped for WSGI compatibility
def handler(request, context):
    """Vercel serverless function handler"""
    from vercel_wsgi import make_vercel_app
    vercel_app = make_vercel_app(app)
    return vercel_app(request, context)

# Alternative: Direct ASGI handler for Vercel
# This is the preferred method for FastAPI on Vercel
app_asgi = app

