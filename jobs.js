
const auth = require('./auth');

let run = null;

const timeToCheck = 60 * 60 * 1000; // 1 hour

exports.start = async () => {
    stop();
    run = setInterval(async () => {
        await cleanupUserSessions();
    }, timeToCheck);
}

function cleanupUserSessions() {
    return new Promise(resolve => {
        auth.cleanup();
        resolve(true);
    });
}

function stop() {
    if (run) clearInterval(run);
}

exports.stop = stop;
