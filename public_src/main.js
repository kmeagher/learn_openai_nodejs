
function saveUser() {
    localStorage["usr"] = JSON.stringify(user);
}

function saveStatus() {
    localStorage["lastStatus"] = statusCode;
}

function loadUser() {
    if (statusCode!==200) {
        return {};
    }
    const str = localStorage['usr'];
    if (typeof str === 'string' && str.trim().length>0) {
        try {
            return JSON.parse(str);
        } catch (e) {
            console.log(e);
        }
    }
    return {};
}

function loadStatus() {
    const str = localStorage["lastStatus"];
    if (isNaN(str)) {
        return 200;
    }
    return parseInt(str);
}

const host = "localhost:8080";
            
let socket = null;

let statusCode = loadStatus();

let user = loadUser();
saveUser();

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
        connectSocket();
        return;
    } else {
        authResponse =  await postRequest('auth/create');
    }
    if (authResponse && authResponse.errored) {
        console.log("Error attempting to connect");
    } else if (authResponse.data && authResponse.data.length>0) {
        user = authResponse.data[0];
        saveUser();
        statusCode = 200;
        saveStatus();
        connectSocket();
    } else {
        console.log("Authorization Response Error");
        addResponse(JSON.stringify(authResponse, null, 2));
    }
}

function connectSocket() {
    if (activeUser()) {
        document.getElementById('welcome').classList.add('hidden');
        document.getElementById('chatWindow').classList.add('hidden');
        startLoader();
        setTimeout(() => {
            socket = new WebSocket(`ws://${host}/ws/connect/${user.token}`);
            socket.onopen = () => {
                document.getElementById('responses').innerHTML = '';
                addResponse('Connection Open!');
                addResponse("Hello! Let's get started!", true);
                addResponse("Ask a math question in the area below!", true);
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
                    if (message.data.includes && message.data.includes('"errored":true')) {
                        let data = {};
                        try { data = JSON.parse(message.data); } catch(e) { data = {
                            errored: true,
                            message: "Unexpected Error"
                        }; }
                        statusCode = data.statusCode || 400;
                        saveStatus();
                        disconnected(data);
                        return;
                    } 
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
    }
}

function sendMessage() {
    if (socket && socket.readyState === socket.OPEN) {
        const message = document.getElementById('txtPrompt').value;
        if (message.trim().length>0) {
            addResponse("<br /><br />You > " + message + "<br />");
            socket.send(message);
            document.getElementById('txtPrompt').value = '';
        }
    } else {
        disconnected({message: "The connection was closed"}, false);
    }
}

function disconnected(data, sessionExpired = true) {
    data = data || {};
    document.getElementById('responses').innerHTML = "Cannot Connect.<br />message > " 
        + (data.message || 'Unexpected Result.');
    if (sessionExpired) {
        user = {};
        saveUser();
        addResponse("Your session may have expired. Please reload and try again.", true);
    }
    document.getElementById('promptArea').classList.add('hidden');
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
