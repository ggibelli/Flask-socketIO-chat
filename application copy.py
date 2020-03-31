import os
import logging
import requests
import json
from flask import Flask, jsonify, render_template, request
from flask_socketio import SocketIO, emit, send, join_room, leave_room
from collections import defaultdict


app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

channels = []
users_online = {}
active_users = set()
active_users_channel = defaultdict(list)
messages = []
messages_channel = defaultdict(list)

@app.route("/")
def index():
    return render_template("index.html", channels = channels)

@socketio.on('connected')
def connected(data):
    username = data['username']
    user_sid = request.sid
    users_online[user_sid] = username
    emit('onlineusers', {'onlineusers': users_online}, broadcast=True)

@socketio.on('disconnect')
def test_disconnect():
    user_sid = request.sid
    if user_sid in users_online:
        user_left = users_online[user_sid]
        for channel, user in active_users:
            if user == user_left:
                channel_left = channel
                active_users.discard((channel_left, user_left))
                emit('leaveuser', {'user': user_left}, room=channel_left)
                emit('disconnected', {'user': user_left, 'usersid': user_sid}, broadcast=True)
                emit('announcement', {'message': user_left + ' has left the room.'}, room=channel_left) 

@socketio.on("create channel")
def create(data):
    channel = data["channel"]
    channels.append(channel)
    emit("new channel", {'channel': channel}, broadcast=True)

@socketio.on('join')
def on_join(data):
    username = data['username']
    room = data['channel']
    join_room(room)
    active_users.add((room, username))
    for channel, user in active_users:
        if user not in active_users_channel[channel]:
            active_users_channel[channel].append(user)
    emit('announcement', {'message': username + ' has entered the room.'}, room=room)
    emit('joinuser', {'userlist': active_users_channel[room], 'messages': messages_channel[room]}, room=room)

@socketio.on('leave')
def on_leave(data):
    username = data['username']
    room = data['channel']
    leave_room(room)
    for channel, user in active_users:
        if user in active_users_channel[channel]:
            active_users_channel[channel].remove(user)
    active_users.discard((room, username))    
    emit('leaveuser', {'user': username}, room=room)
    emit('announcement', {'message': username + ' has left the room.'}, room=room)
    
@socketio.on("send message")
def message(data):
    room = data['channel']
    username = data['JSON']['user']
    date = data['JSON']['date']
    message = data['JSON']['message']
    messages.append((room, data['JSON']))
    for channel, message in messages:
        messages_channel[channel].append(message)
    emit('broadcast message', {'message': message, 'username': username, 'date': date}, room=room)

if __name__ == "__main__":
    socketio.run(app)