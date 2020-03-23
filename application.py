import os
import logging
import requests
import json
from flask import Flask, jsonify, render_template, request
from flask_socketio import SocketIO, emit, send, join_room, leave_room
from collections import defaultdict
import time

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

messageID_list = []
users_online = {}
channels = []
active_users = {}
reload_handler = {}
disconnection_handler = {}

messages_channel = defaultdict(list)

@app.route("/")
def index():
    return render_template("index.html", channels = channels)

# Handling client connection and sending list to frontend 
@socketio.on('connected')
def connected(data):
    username = data['username']
    now = time.time()
    user_sid = request.sid
    users_online[username] = user_sid
    reload_handler[username] = now
    disconnection_handler[user_sid] = username
    emit('onlineusers', {'onlineusers': users_online}, broadcast=True)

# Handling disconnection and page reload
@socketio.on('disconnect')
def test_disconnect():
    user_sid = request.sid
    now = time.time()
    print('##########')
    print(now)
    for k, v in list(users_online.items()):
        if v == user_sid:
            del users_online[k]
            emit('disconnected', {'user': user_left, 'usersid': user_sid}, broadcast=True)
    if user_sid in disconnection_handler:
        user_left = disconnection_handler[user_sid]
        channel_left = active_users[user_left]
        times = [v for k,v in reload_handler.items() if k == user_left]
        print(times[0])
        print(reload_handler)
        if now - times[0] > 120:
            del active_users[user_left]
            emit('leaveuser', {'user': user_left}, room=channel_left)
        else:
            emit('check disconnect', {'user': user_left, 'channel': channel_left}, broadcast=True)

@socketio.on('disconnected')
def check_disconnected():
    user_left = data['user']
    channel_left  = data['channel']
    user_reconnected = data['reconnected']
    if not user_reconnected:
        emit('leaveuser', {'user': user_left}, room=channel_left)

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
    active_users[username] = room
    userlist = [k for k,v in active_users.items() if v == room]
    #emit('announcement', {'message': username + ' has entered the room.'}, room=room)
    emit('joinuser', {'userlist': userlist, 'messages': messages_channel[room]}, room=room)

@socketio.on('leave')
def on_leave(data):
    username = data['username']
    room = data['channel']
    leave_room(room)   
    emit('leaveuser', {'user': username}, room=room)
    #emit('announcement', {'message': username + ' has left the room.'}, room=room)
    
@socketio.on("send message")
def message(data):
    messages = []
    messageID_list.append(1)
    messageID = sum(messageID_list)
    room = data['channel']
    username = data['JSON']['user']
    date = data['JSON']['date']
    message = data['JSON']['message']
    messages.append((room, data['JSON']))
    for channel, message in messages:
        messages_channel[channel].append(message)
    emit('broadcast message', {'message': message, 'username': username, 'date': date, 'messageID': messageID}, room=room)

@socketio.on("delete message")
def delete(data):
    user = data['username']
    room = data['channel']
    message = data['message']
    date = data['date']

if __name__ == "__main__":
    socketio.run(app)