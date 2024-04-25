

/**
 * Things TODO
 * - Save User to Localhost to enable re-use of token
 * - Figure out re-try or just handle exceptions/errors/socket close gracefully
 */

const host = "localhost:8080";
            
let socket = null;

let user = {};

function startChat() {
    connect();
}

function addResponse(message, breakBefore = false) {
    if (breakBefore) addResponse('<br />');
    message = message.replace(/(?:\r\n|\r|\n)/g, '<br />');
    const div = document.getElementById('responses');
    div.innerHTML += message;
    div.scrollTop = div.scrollHeight;
}

async function postRequest(path, data = {}) {
    return new Promise(resolve => {
        const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
        const xhr = new XMLHttpRequest();
        xhr.withCredentials = true;
        xhr.addEventListener("readystatechange", function() {
            if(this.readyState === 4) {
                try {
                    const parse = JSON.parse(this.responseText);
                    resolve(parse);
                } catch(e) {
                    resolve({
                        errored: true,
                        message: "Response Parsing Error"
                    });
                }
            }
        });
        xhr.open("POST", `http://${host}/${path}`);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(dataStr);
    });
}

async function getRequest(path) {
    return new Promise(resolve => {
        const xhr = new XMLHttpRequest();
        xhr.withCredentials = true;
        xhr.addEventListener("readystatechange", function() {
            if(this.readyState === 4) {
                try {
                    const parse = JSON.parse(this.responseText);
                    resolve(parse);
                } catch(e) {
                    resolve({
                        errored: true,
                        message: "Response Parsing Error"
                    });
                }
            }
        });
        xhr.open("GET", `http://${host}/${path}`);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send();
    });
}

function activeUser() {
    return user && typeof user.token === 'string' && user.token.length>0;
}

async function connect() {
    let authResponse = {
        errored: true,
        message: "No Connection Available"
    };
    if (activeUser()) {
        console.log("active user");
        connectSocket();
        return;
    } else {
        authResponse =  await postRequest('auth/create');
    }
    if (authResponse && authResponse.errored) {
        console.log("Error attempting to connect");
        // TODO: try to connect again
    } else if (authResponse.data && authResponse.data.length>0) {
        user = authResponse.data[0];
        console.log("--- user auth created ---");
        connectSocket();
    } else {
        console.log("Authorization Response Error");
        addResponse(JSON.stringify(authResponse, null, 2));
        // TODO: try to connect again
    }
}

function connectSocket() {
    console.log("connect socket");
    if (activeUser()) {
        document.getElementById('welcome').classList.add('hidden');
        document.getElementById('chatWindow').classList.add('hidden');
        startLoader();
        setTimeout(() => {
            socket = new WebSocket(`ws://${host}/ws/connect/${user.token}`);
            socket.onopen = () => {
                console.log("Connection Open");
                document.getElementById('responses').innerHTML = '';
                addResponse('Connection Open!');
                addResponse("Hello! Let's get started!", true)
                addResponse("Ask A Math question in the area below!", true);
                document.getElementById('welcome').classList.add('hidden');
                document.getElementById('chatWindow').classList.remove('hidden');
                document.getElementById('btnSend').removeEventListener('click', sendMessage);
                document.getElementById('btnSend').addEventListener('click', sendMessage);
                document.getElementById('btnNewChat').removeEventListener('click', newChat);
                document.getElementById('btnNewChat').addEventListener('click', newChat);
                stopLoader();
            }
            socket.onmessage = (message) => {
                if (message.data) {
                    addResponse(message.data);
                } else {
                    console.log(message, " => message no data");
                }
            }
            socket.onClose = () => {
                document.getElementById('welcome').classList.remove('hidden');
                document.getElementById('chatWindow').classList.add('hidden');
                console.log("Chat Session Has Ended");
            }
            socket.onerror = (e) => {
                console.log(e);
                document.getElementById('welcome').classList.remove('hidden');
                document.getElementById('chatWindow').classList.add('hidden');
                alert("Chat Session has ended due to an unexpected error");
            }
        }, 2000);
    } else {
        console.log("Authorization Error");
        // TODO: try to connect again
    }
}

function sendMessage() {
    const message = document.getElementById('txtPrompt').value;
    if (message.trim().length>0) {
        addResponse("<br /><br />You > " + message + "<br /><br />")
        socket.send(message);
        document.getElementById('txtPrompt').value = '';
    }
}

function newChat() {
    socket.close();
    connect(); 
}

let loading = null;

function startLoader() {
    const l = document.getElementById('loader');
    l.classList.remove('hidden');
    l.innerHTML = 'One Moment';
    let dots = [];
    loading = setInterval(() => {
        if (dots.length>=4) dots = [];
        dots.push('.');
        l.innerHTML = "One Moment" + dots.join('');
    }, 300);
}

function stopLoader() {
    clearInterval(loading);
    document.getElementById('loader').classList.add('hidden');
}

window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btnStartChat').addEventListener('click', startChat);
});
