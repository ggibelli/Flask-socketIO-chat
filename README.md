# Project 2

Web Programming with Python and JavaScript

In this project 2, named Flack, I built an instant message webapp, following the guidelines provided by the cs50W course.

At the first visit to the page the user is prompted for an username, that is stored in the local storage of the browser, then at the first access the "general" channel is automatically joined.

On the top right corner the user can see the name of the current channel and is also marked in green on the sidebar

In the 'general' channel the user can see the list of the existing channels on the left sidebar, and the users online at the moment in the whole chat. At the bottom of the sidebar there is an input form where the user can add a channel if the name is not taken, creating a channel automatically make the user join the channel created.

When the user switches channel is able to see the current users in the channel, the list changes when an user leaves the channel or disconnect, there is also a page refresh handler that prevent the user who refresh the page to be removed from the user list, but only if the user really loses the connection.

The webapp is responsive and the sidebar hides manually clicking the button on the top left corner or hides automatically in smaller screens.

When an user refreshes the page or comes back, the webapp remembers the username and the last channel the user joined, showing the last 100 messages in that channel. 

At every change channel and new logins the autoscroll in gonna bring the user to the bottom, and also for any new message, but if the user is scrolling up to read previous messages the autoscroll is disabled.

My personal touch it's that the user can delete their own messages, without any time limit, in the next release I'll add the private messages feature.

The project is online hosted to heroku at this address: https://flack-giovanni-project2-cs50.herokuapp.com/

The project contains the following files:
application.py: The backend of the chat application.
requirements.txt: The list of modules the application needs to run.
templates/index.html: The html page of the application.
static/styles.css: The style sheet of the application.
static/script.js: The frontend of the application.
