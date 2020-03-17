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
    // Connect to websocket
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

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
            // Clear input field and disable button again
            document.querySelector('#Channel').value = '';
            document.querySelector('#submit').disabled = true;

            // Stop form from submitting
            event.preventDefault();  
        })
    })

    // When a channel is clicked, connect to that channel
    document.querySelectorAll('a').forEach(function(channel){
        channel.onclick = () =>{
            //console.log(channel.innerHTML)
            lastchannel = channel.innerHTML;
            localStorage.setItem('lastchannel', lastchannel);
            console.log(lastchannel);
            socket.emit('join',{"channel":channel.innerHTML, "username":username});
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

        // Clear message form
        document.querySelector('#Message').value = "";

        return false;
    };

    socket.on('new channel', data => {
        channel = data.channel;
        const li = document.createElement('li');
        const a = li.appendChild(document.createElement('a'));        
        a.innerHTML = channel;
        a.href = "#"+channel;

        //a.addEventListener("click", joinChannel() , false);
        //li.innerHTML = '<a class="listchannel" href="#">' + channel + '</a>';
        document.querySelector('#Channels').append(li);
        console.log(channel);

        



    });

    // Callback from server for sending messages
    socket.on('broadcast message', data =>{
        console.log(data);

        // Append message to list of messages
        const li = document.createElement('li');
        li.innerHTML = `${data}`;
        document.querySelector('#messages').append(li);

    });

    
          
   }) 