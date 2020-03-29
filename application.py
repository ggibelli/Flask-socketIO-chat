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
    user_sid = request.sid
    users_online[username] = user_sid
    #reload_handler[username] = now
    #disconnection_handler[user_sid] = username
    emit('onlineusers', {'onlineusers': users_online}, broadcast=True)

# Handling disconnection and page reload
@socketio.on('disconnect')
def test_disconnect():
    user_sid = request.sid
    for k, v in list(users_online.items()):
        if v == user_sid:
            user_left = k
            channel_left = active_users[user_left]
            del users_online[k]
            emit('disconnected', {'user': user_left, 'usersid': user_sid}, broadcast=True)            
            emit('check disconnect', {'user': user_left, 'channel': channel_left}, broadcast=True)
    

@socketio.on('reconnected')
def check_disconnected(data):
    user_left = data['user']
    channel_left  = data['channel']
    user_reconnected = data['user_reconnected']
    print(data)
    if not user_reconnected:
        emit('leaveuser', {'user': user_left}, room=channel_left)
        del active_users[user_left]
        #emit('leaveuser', {'user': user_left}, room=channel_left)

@socketio.on("create channel")
def create(data):
    channel = data["channel"]
    user = data["user"]
    channels.append(channel)
    emit("new channel", {'channel': channel, 'user': user}, broadcast=True)

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
        messages_channel[channel].append((message, messageID))
    emit('broadcast message', {'message': message, 'username': username, 'date': date, 'messageID': messageID}, room=room)

@socketio.on("delete message")
def delete(data):
    messageID = data['messageID']
    for k, v in list(messages_channel.items()):
        for messages in v:
            for message in messages:
                if message == messageID:
                    v.remove(messages)
                    room = k
                    emit('message deleted', {'messageID': messageID}, room = room)

if __name__ == "__main__":
    socketio.run(app)