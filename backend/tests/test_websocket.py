# backend/tests/test_websocket.py

import pytest
try:
    from flask_socketio import SocketIOTestClient
except ImportError:
    SocketIOTestClient = None

from app import create_app, socketio

@pytest.mark.skipif(socketio is None or SocketIOTestClient is None, reason="WebSocket not configured")
class TestWebSocket:
    
    @pytest.fixture
    def client(self):
        app = create_app('app.config.TestingConfig')
        return SocketIOTestClient(app, socketio)
    
    def test_connect(self, client):
        """Test WebSocket connection"""
        client.connect()
        assert client.is_connected()
        client.disconnect()
    
    def test_join_room(self, client):
        """Test joining a room"""
        client.connect()
        client.emit('join_room', {'room': 'test_room'})
        received = client.get_received()
        assert len(received) > 0
        client.disconnect()