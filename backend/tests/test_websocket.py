# backend/tests/test_websocket.py

import pytest
from flask_socketio import SocketIOTestClient
from app import create_app, socketio

class TestWebSocket:
    
    @pytest.fixture
    def client(self):
        app = create_app('testing')
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