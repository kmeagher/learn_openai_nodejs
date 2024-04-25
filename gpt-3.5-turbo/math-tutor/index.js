
const mathTutor = require('./math_tutor');
const auth = require('../../auth');

const tutors = [];

let assistant = null;

async function createAssistant() {
    assistant = await mathTutor.createAssistant();
}

createAssistant();

async function Tutor(req) {
    console.log("Tutor Req Headers => ", req.headers);
    const user = auth.getUser(req);
    if (typeof user === 'undefined' || user === null) return null;
    const thread = await mathTutor.createThread();
    return {
        created: new Date(),
        updated: new Date(),
        thread: thread,
        user: user
    };
}

function findIndex(req) {
    const user = auth.getUser(req);
    return tutors.findIndex(t => t.user && t.user.token === user.token);
}

async function addTutor(req) {
    const index = findIndex(req);
    let tutor = await Tutor(req);
    if (index>-1) {
        tutor = tutors[index];
        tutor.updated = new Date();
        tutors[index] = tutor;
    } else {
        tutors.push(tutor);
    }
    console.log(JSON.stringify(tutors));
    return tutor;
}

exports.create = addTutor;

async function createThread(req) {
    const index = findIndex(req);
    if (index===-1) {
        return await addTutor(req);    
    } else {
        const tutor = tutors[index];
        await mathTutor.delThread(tutor.thread);
        tutor.thread = await mathTutor.createThread();
    }
    return tutor;
}

exports.createThread = createThread;

async function createMessage(req, message) {
    const tutor = await addTutor(req);
    await mathTutor.createMessage(tutor.thread, message);
    return tutor;
}

exports.createMessage = createMessage;

async function exec(req, callbackFn) {
    const tutor = await addTutor(req);
    mathTutor.stream(assistant, tutor.thread, callbackFn);
}

exports.exec = exec;

// async function main() {
//     const assistant = await mathTutor.createAssistant();
//     const thread = await mathTutor.createThread();
//     await mathTutor.createMessage(thread, "How many years, months and days is there in age between someone born on August 3, 1945 and someone born on November 5, 2011?");
//     await mathTutor.createMessage(thread, "Give me the answer using JavaScript");
//     await mathTutor.exec(assistant, thread);
// }

// main();

