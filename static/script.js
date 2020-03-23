const formchannel = document.querySelector('#CreateChannel');
let username; 
let channels = [];
let users_channel = [];
let users_online = {};

document.addEventListener('DOMContentLoaded', () => {

  // Connect to websocket
  var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

  // Retrieve username from localstorage
  if (!localStorage.getItem('nickname')) {
    username = window.prompt("Enter you nickname","username" + (Math.ceil(Math.random() * 100)));
    localStorage.setItem('nickname', username)
  }
  username = localStorage.getItem('nickname')

  // Retrieve last channel and username
  document.querySelectorAll('#Channels li a').forEach(function(channel){
    channels.push((channel.innerHTML));
  })
  if (!localStorage.getItem('lastchannel') || !channels.includes(localStorage.getItem('lastchannel'))) {
    lastchannel = "general";
    localStorage.setItem('lastchannel', lastchannel);
  }

  // Send connection notice to server
  socket.emit('connected', {'username': username});

  // Join last channel
  joinChannel(localStorage.getItem('lastchannel'));

  // Create list of online users
  socket.on('onlineusers', data => {
    const item = document.querySelector('#onlineUsers')
    while (item.firstChild) {
      item.removeChild(item.firstChild)
    }
    let entries = Object.entries(data.onlineusers)
    for (let [user, sid] of entries) {
      users_online[user] = sid; 
      const li = document.createElement('li');
      li.setAttribute('id', sid)
      li.setAttribute('class', 'list-group-item')
      const a = li.appendChild(document.createElement('a'));        
      a.innerHTML = user;
      a.href = "#";
      document.querySelector('#onlineUsers').append(li);
    }
    console.log(users_online)
  })

  // Update the user online list
  socket.on('disconnected', data => {
    console.log(data)
    console.log(users_online)
    delete users_online[data.user];
    document.querySelector(`#${CSS.escape(data.usersid)}`).remove();
    //document.querySelector('#'+data.usersid).remove()
  })

  socket.on('check disconnect', data => {
    let user_left = data.user;
    let user_reconnected = false;
    if (user_left === username) {
      user_reconnected = true;
    }
    socket.emit('reconnected', {'user_reconnected': user_reconnected, 'user': data.user, 'channel': data.channel});
    
  })


  // Logic form channel creation
  // By default, submit button is disabled
  document.querySelector('#submit').disabled = true;

  // Enable button only if there is text in the input field
  document.querySelector('#Channel').onkeyup = () => {
    if (document.querySelector('#Channel').value.length > 0) {
      document.querySelector('#submit').disabled = false;
    }
    else {
      document.querySelector('#submit').disabled = true;
    }
  }

  // When an user leaves update the user channel list
  socket.on('leaveuser', data => {
    users_channel.splice(users_channel.indexOf(data.user))
    let li = document.getElementById(data.user);
    if (li) {
      li.remove(); 
    }
  })

  // When an user joins update the user channel list
  socket.on('joinuser', data => {
    //console.log(data.messages[0].message)
    const item = document.querySelector('#SingleMessage')
    while (item.firstChild) {
      item.removeChild(item.firstChild)
    }
    let messagelength = data.messages.length;
    if (messagelength > 100){
      messagelength = 99;
    }
    for (let i = 0; i < messagelength; i++) {
      appendMessage(data.messages[i].message, data.messages[i].user, data.messages[i].date)
    }
    let userlength = data.userlist.length;
    let userlist = document.querySelectorAll('#userList li');
    for(let i=0; li=userlist[i]; i++) {
      li.parentNode.removeChild(li);
    }
    for (let i = 0; i < userlength; i++){
      if (!users_channel.includes(data.userlist[i])){
        users_channel.push(data.userlist[i]);
      }
    }
    for (user of users_channel){
      const li = document.createElement('li');
      li.setAttribute('id', user)
      const a = li.appendChild(document.createElement('a'));        
      a.innerHTML = user;
      a.href = "#";
      document.querySelector('#userList').append(li); 
    }
  })

  // When connected, configure buttons
  socket.on('connect', () => {

    formchannel.addEventListener('submit', event => {

      // Create new item for list
      const channel = document.querySelector('#Channel').value;
      if (!channels.includes(channel)) {
        socket.emit('create channel', {'channel': channel});
        actualchannel = localStorage.getItem('lastchannel');
        channels.push(channel);
        if (checkChannel(channel, actualchannel)){
          leaveChannel(actualchannel);
          joinChannel(channel);
        }
      }
      else {
        window.alert("The channel already exists");
        return false;
      }
      // Clear input field and disable button again
      document.querySelector('#Channel').value = '';
      document.querySelector('#submit').disabled = true;

      // Stop form from submitting
      event.preventDefault();  
    })
  })

  socket.on('new channel', data => {
    channel = data.channel;
    channels.push(channel);
    const li = document.createElement('li');
    li.setAttribute('class', 'list-group-item active')
    const a = li.appendChild(document.createElement('a'));        
    a.innerHTML = channel;
    a.href = "#";
    a.addEventListener("click", () => { 
      actualchannel = localStorage.getItem('lastchannel');
      newchannel = a.innerHTML;
      if (checkChannel(actualchannel, newchannel)){
        leaveChannel(actualchannel);
        /*socket.on('leaveuser', data => {
          let li = document.getElementById(data.user);
          if (li) {
            li.remove(); 
          }
        })*/
        joinChannel(newchannel);
                  
        return false;
      }    
    })
    document.querySelector('#Channels').append(li);
  });

  /*socket.on('announcement', data =>{
    window.alert(data.message);
  }) */

  // When a channel is clicked, connect to that channel
  document.querySelectorAll('#Channels li a').forEach(function(channel){
    channels.push(channel.innerHTML);
    channel.onclick = () =>{
      //document.querySelector('.list-group-item.active').classList.remove('active');
      let chanlist = channel.classList;
      chanlist.add('active');
      actualchannel = localStorage.getItem('lastchannel');
      newchannel = channel.innerHTML;
      console.log(newchannel);
      if (checkChannel(newchannel, actualchannel)){
        leaveChannel(actualchannel);
        joinChannel(newchannel);
        return false;
      }
    }
  });

  // When a message is sent, call 'send message' function from server
  document.querySelector('#sendMessage').onsubmit = () => {
    const message = document.querySelector('#Message').value;
    const user = localStorage.getItem('nickname');
    const date = new Date();
    const messageJSON = {
      message: message,
      user: user,
      date: date
    }
    const lastchannel = localStorage.getItem('lastchannel');
    socket.emit('send message', {'JSON': messageJSON, 'channel': lastchannel});
    // Clear message form
    document.querySelector('#Message').value = "";
    return false;
  };

  // Callback from server for sending messages
  socket.on('broadcast message', data =>{
    console.log(data)
    appendMessage(data.message.message, data.username, data.date, data.messageID)
  });

  function appendMessage(message, user, date, messageID) {
      const a = document.createElement('a');
      a.classList.add('list-group-item', 'list-group-item-action', 'message');
      document.querySelector('#SingleMessage').append(a);
      const div = document.createElement('div');
      div.classList.add('d-flex', 'w-100' ,'justify-content-between');
      const alist = document.querySelectorAll('#SingleMessage a');
      const last = alist[alist.length - 1];
      last.append(div)
      const h5 = document.createElement('h5');
      h5.classList.add('mb-1');
      console.log(message.username)
      if (user === localStorage.getItem('nickname')) {
        h5.innerHTML = 'You wrote:'
        const button = document.createElement('button');
        button.classList.add('btn', 'btn-secondary', 'btn-sm');
        button.innerHTML = 'delete';
        button.onclick = () => {
          socket.emit('delete message',{'messageID': messageID});
          console.log(button.parentElement.parentElement)
          button.parentNode.parentNode.style.animationPlayState = 'running';
          button.parentNode.parentNode.addEventListener('animationend', () =>  {
            button.parentElement.parentElement.remove();
          });
        }
        last.firstChild.append(h5);
        last.firstChild.append(button);
      }
      else {
        h5.innerHTML = `${user} wrote:`
        last.firstChild.append(h5);
      }
      const p = document.createElement('p');
      p.classList.add('mb-1');
      p.innerHTML= `${message}`
      last.append(p);
      const small = document.createElement('small');
      small.classList.add('text-muted');
      small.innerHTML = `${date}`;
      last.append(small);
  }

  function checkChannel(newchannel, oldchannel) {
    if (newchannel === oldchannel){
      return false;
    }
    return true;
  }

  function joinChannel(channel) {
    socket.emit('join',{"channel":channel, "username":username});
    localStorage.setItem('lastchannel', channel);
    document.querySelector('#channelName').innerHTML = channel;    
    users_channel = []
  }

  function leaveChannel(channel) {
    socket.emit('leave',{"channel":channel, "username":username});   
  }
}) 