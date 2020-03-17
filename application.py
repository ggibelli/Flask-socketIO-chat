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
active_users = set()
active_users_channel = defaultdict(list)
messages = []
messages_channel = defaultdict(list)

@app.route("/")
def index():
    return render_template("index.html", channels = channels)

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
    emit('joinuser', {'userlist': active_users_channel[room]}, room=room)

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
    print(data['JSON']['message'])
    room = data['channel']
    username = data['JSON']['user']
    date = data['JSON']['date']
    message = data['JSON']['message']
    messages.append((room, data['JSON']))
    for channel, message in messages:
        messages_channel[channel].append(message)
    print(messages_channel)
    emit('broadcast message', {'message': message, 'username': username, 'date': date}, room=room)

if __name__ == "__main__":
    socketio.run(app)