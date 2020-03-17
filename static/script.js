const formchannel = document.querySelector('#CreateChannel');
let username; 
let channels = [];
let users = [];

document.addEventListener('DOMContentLoaded', () => {

    // Connect to websocket
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

    // Retrieve username from localstorage
    if (!localStorage.getItem('nickname')) {
        username = window.prompt("Enter you nickname","username" + (Math.ceil(Math.random() * 100)));
        localStorage.setItem('nickname', username)
    }
    username = localStorage.getItem('nickname')

    // Retrieve last channel
    document.querySelectorAll('#Channels li a').forEach(function(channel){
        channels.push((channel.innerHTML));
    })

    if (!localStorage.getItem('lastchannel') || !channels.includes(localStorage.getItem('lastchannel'))) {
        lastchannel = "general";
        localStorage.setItem('lastchannel', lastchannel);
    }

    username = localStorage.getItem('nickname')
    joinChannel(localStorage.getItem('lastchannel'));

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

    socket.on('leaveuser', data => {
        console.log(data.user)
        users.splice(users.indexOf(data.user))
        let li = document.getElementById(data.user);
        li.remove(); 
    })

    socket.on('joinuser', data => {
        let length = data.userlist.length;
        console.log(data.userlist)
        let userlist = document.querySelectorAll('#userList li');
        for(let i=0; li=userlist[i]; i++) {
            li.parentNode.removeChild(li);
        }
        for (let i = 0; i < length; i++){
            if (!users.includes(data.userlist[i])){
                users.push(data.userlist[i]);
            }
        }
        console.log(users)
        for (user of users){
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
                socket.on('leaveuser', data => {
                    console.log(data.user)
                    let li = document.getElementById(data.user);
                    if (li) {
                        li.remove(); 
                    }
                })
                joinChannel(newchannel);
                
                return false;
            }   
        })
        document.querySelector('#Channels').append(li);
    });

    socket.on('announcement', data =>{
        window.alert(data.message);
    })

    // When a channel is clicked, connect to that channel
    document.querySelectorAll('#Channels li').forEach(function(channel){
        channels.push(channel.innerHTML);
        channel.onclick = () =>{
            document.querySelector('.list-group-item.active').classList.remove('active');
            let chanlist = channel.classList;
            chanlist.add('active');
            actualchannel = localStorage.getItem('lastchannel');
            newchannel = channel.innerHTML;
            if (checkChannel(newchannel, actualchannel)){
                leaveChannel(actualchannel);
                joinChannel(newchannel);
                return false;
            }
        }
    });

    // When a message is sent, call 'send message' function from server
    document.querySelector('#sendMessage').onsubmit = () => {
        const message = document.querySelector('#Message').value
        const lastchannel = localStorage.getItem('lastchannel');
        const username = localStorage.getItem('nickname');
        const date = new Date();

        socket.emit('send message', {'message': message, 'username': username, 'date': date, 'channel': lastchannel});
        console.log(lastchannel)
        // Clear message form
        document.querySelector('#Message').value = "";
        return false;
    };

    // Callback from server for sending messages
    socket.on('broadcast message', data =>{
        console.log(data);

        // Append message to list of messages
        const li = document.createElement('li');
        li.innerHTML = `${data}`;
        document.querySelector('#Messages').append(li);

    });

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
        users = []
    }

    function leaveChannel(channel) {
        console.log('leave')
        socket.emit('leave',{"channel":channel, "username":username});   
    }
   }) 