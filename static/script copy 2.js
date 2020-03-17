const formchannel = document.querySelector('#CreateChannel');
let username; 
let channels = [];
function addChannel(channels, channel) {
    const li = document.createElement('li');
    channels.push(channel);
    li.innerHTML = '<a class="listchannel" href="#">' + channel + '</a>';
     // Add new item to channel list
    document.querySelector('#Channels').append(li);
}

document.addEventListener('DOMContentLoaded', () => {

    // Retrieve username from localstorage
    if (!localStorage.getItem('nickname')) {
        username = window.prompt("Enter you nickname","username" + (Math.ceil(Math.random() * 100)));
        localStorage.setItem('nickname', username)

    }
    username = localStorage.getItem('nickname')

    // Retrieve list of channels from server
    // Initialize new request
    const request = new XMLHttpRequest();
    request.open('GET', '/savechannel');

    // Callback function for when request completes
    request.onload = () => {

        // Extract JSON data from request
        const data = JSON.parse(request.responseText);
        let length = data.length;
        for (let i = 0; i < length; i++) {
            //const li = document.createElement('li');
            channel = data[i];
            addChannel(channels, channel);
            /*channels.push(channel);
            li.innerHTML = '<a href="#">' + data[i] + '</a>';
             // Add new item to channel list
            document.querySelector('#Channels').append(li);*/
        }

    }
    request.send()

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

    formchannel.addEventListener('submit', event => {

        // Create new item for list
        let channel = document.querySelector('#Channel').value;
        if (!channels.includes(channel)) {
            addChannel(channels, channel);
            /*channels.push(channel)
            const li = document.createElement('li');
            li.innerHTML = channel;

             // Add new item to channel list
            document.querySelector('#Channels').append(li);*/
        
            // Initialize new request
            const request = new XMLHttpRequest();
            request.onreadystatechange = console.log(request)
            request.open('POST', '/savechannel');
    
            // Callback function for when request completes
            request.onload = () => {

                // Extract JSON data from request
                const data = JSON.parse(request.responseText);
            }

            const data = new FormData();
            data.append('channel', channel);
            request.send(data)
        }

        else {         
            window.alert("The channel already exists");
            return;
        }
        
        // Clear input field and disable button again
        document.querySelector('#Channel').value = '';
        document.querySelector('#submit').disabled = true;

        // Stop form from submitting
        event.preventDefault();     
    })   

    // Creating the single channel div
    let elements = document.querySelectorAll(".listchannel");
    for (let i= 0; i < elements.length; i++) {
        elements[i].addEventListener('click', event => {
            console.log('a')
        })
}


})


