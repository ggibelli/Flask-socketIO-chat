const formchannel = document.querySelector('#CreateChannel');
let username; 
let channels = [];

/*function joinChannel(channel) {

    console.log("#" + this.textContent);

    username = localStorage.getItem('nickname')
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
    socket.on('connect', () => {
        socket.emit('join', {'channel': channel, 'username': username});
    //socket.on('join', data => {
    })

}*/

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
    if (!localStorage.getItem('lastchannel')) {
        lastchannel = "general";
        localStorage.setItem('lastchannel', lastchannel);
    }
    username = localStorage.getItem('nickname')
    console.log('1')
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

    //let channel = document.querySelector('#Channel').value;


    // When connected, configure buttons
    socket.on('connect', () => {
        formchannel.addEventListener('submit', event => {

            // Create new item for list
            const channel = document.querySelector('#Channel').value;
            if (!channels.includes(channel)) {
                    //addChannel(channels, channel);
                    //const channel = channel;
                socket.emit('create channel', {'channel': channel});
            }
            actualchannel = localStorage.getItem('lastchannel');

            //console.log(channel.innerHTML)
            newchannel = channel;
            if (newchannel === actualchannel){
                return false;
            }

            leaveChannel(actualchannel);
            joinChannel(newchannel);
            console.log('3')
            localStorage.setItem('lastchannel', newchannel);
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
        const a = li.appendChild(document.createElement('a'));        
        a.innerHTML = channel;
        a.href = "#";
        
        //a.onclick =  switchChannel(channel, oldchannel);
        a.addEventListener("click", () => { 
            console.log('diocan')
            oldchannel = localStorage.getItem('lastchannel');
            newchannel = a.innerHTML;
            console.log(newchannel, oldchannel)
            if (oldchannel === newchannel){
                return false;
            }
    
            leaveChannel(oldchannel);
            joinChannel(newchannel);
            localStorage.setItem('lastchannel', newchannel);
            return false;
        })
        //li.innerHTML = '<a class="listchannel" href="#">' + channel + '</a>';
        document.querySelector('#Channels').append(li);
    });

    socket.on('announcement', data =>{
        window.alert(data.message);
    })


    socket.on('userlist', data => {
        console.log(data.userlist);
    })
    // When a channel is clicked, connect to that channel
    document.querySelectorAll('a').forEach(function(channel){
        channel.onclick = () =>{
            actualchannel = localStorage.getItem('lastchannel');

            //console.log(channel.innerHTML)
            newchannel = channel.innerHTML;
            if (newchannel === actualchannel){
                return false;
            }

            leaveChannel(actualchannel);
            joinChannel(newchannel);
            console.log('3')
            localStorage.setItem('lastchannel', newchannel);
            console.log(newchannel);
            
            return false;
        }
    });
        //li.innerHTML = `Vote recorded: ${data.selection}`;
        //document.querySelector('#votes').append(li);

        
    // When a message is sent, call 'send message' function from server
    document.querySelector('#sendMessage').onsubmit = () => {
        const message = document.querySelector('#Message').value
        lastchannel = localStorage.getItem('lastchannel');
        socket.emit('send message', {'message': message, 'channel': lastchannel});
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
        document.querySelector('#messages').append(li);

    });

    

    
    function joinChannel(channel) {
        socket.emit('join',{"channel":channel, "username":username});
        //console.log(data.msg)
        //socket.on('announcement', data =>{
        //    window.alert(data.msg);
        //    console.log(data.msg)
        //})
    }

    function leaveChannel(channel) {
        socket.emit('leave',{"channel":channel, "username":username});
    }

    
   }) 