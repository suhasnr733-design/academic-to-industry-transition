# backend/app/services/websocket.py

from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_jwt_extended import decode_token
import jwt
from app.extensions import jwt
from app.models import User

socketio = SocketIO(cors_allowed_origins="*")

@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    print(f"Client connected: {request.sid}")
    
    # Authenticate via token
    token = request.args.get('token')
    if token:
        try:
            decoded = decode_token(token)
            user_id = decoded['sub']
            user = User.query.get(user_id)
            if user:
                join_room(f"user_{user_id}")
                print(f"User {user_id} authenticated")
                emit('connected', {'user_id': user_id})
        except:
            print("Invalid token")

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    print(f"Client disconnected: {request.sid}")

@socketio.on('join_room')
def handle_join_room(data):
    """Join a room"""
    room = data.get('room')
    join_room(room)
    emit('joined', {'room': room})

@socketio.on('leave_room')
def handle_leave_room(data):
    """Leave a room"""
    room = data.get('room')
    leave_room(room)
    emit('left', {'room': room})

@socketio.on('resume_processing')
def handle_resume_processing(data):
    """Send resume processing status"""
    resume_id = data.get('resume_id')
    user_id = data.get('user_id')
    # Simulate processing
    for progress in range(0, 101, 10):
        socketio.emit('resume_progress', {
            'resume_id': resume_id,
            'progress': progress
        }, room=f"user_{user_id}")
        time.sleep(0.5)

# Functions to send real-time updates
def send_resume_update(user_id, resume_id, status):
    """Send resume status update"""
    socketio.emit('resume_update', {
        'resume_id': resume_id,
        'status': status
    }, room=f"user_{user_id}")

def send_job_match(user_id, job_id, match_score):
    """Send job match notification"""
    socketio.emit('job_match', {
        'job_id': job_id,
        'match_score': match_score
    }, room=f"user_{user_id}")

def send_notification(user_id, notification):
    """Send notification in real-time"""
    socketio.emit('notification', notification, room=f"user_{user_id}")