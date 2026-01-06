from flask import jsonify

def handler(request):
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "message": "API is running"
    })
