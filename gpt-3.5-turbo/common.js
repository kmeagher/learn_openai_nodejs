
/**
 * https://platform.openai.com/docs/assistants/overview?lang=node.js
 */

const OpenAI = require('openai');
const client = new OpenAI();

async function createAssistant(name, instructions, options) {
    options = options || {};
    if (typeof name === 'string' && name.trim().length>0
        && typeof instructions === 'string' && instructions.trim().length>0) {
            console.log("--- create assistant ---");
            const assistant = await client.beta.assistants.create({
                name: name,
                instructions: instructions,
                model: "gpt-3.5-turbo"
            });
            return assistant;
    }
    return null;
}

exports.createAssistant = createAssistant;

async function createThread() {
    return await client.beta.threads.create();
}

exports.createThread = createThread;

async function delThread(thread) {
    return await client.beta.threads.del(thread.id);
}

exports.delThread = delThread;

async function createMessage(thread, message) {
    return await client.beta.threads.messages.create(thread.id, {
        role: "user",
        content: message // string
    });
}

exports.createMessage = createMessage;

function stream(assistant, thread, callbackFn) {
    console.log(JSON.stringify({
        assistant: assistant.id,
        thread: thread.id
    }));
    const run = client.beta.threads.runs.stream(thread.id, {
        assistant_id: assistant.id
    })
    .on('textCreated', (text) => {
        const output = '\nassistant > ';
        process.stdout.write(output);
        callbackFn(output);
    })
    .on('textDelta', (textDelta, snapshot) => {
        process.stdout.write(textDelta.value);
        callbackFn(textDelta.value)
    })
    .on('toolCallCreated', (toolCall) => { 
        const output = `\nassistant > ${toolCall.type}\n\n`;
        process.stdout.write(output);
        callbackFn(output);
    })
    .on('toolCallDelta', (toolCallDelta, snapshot) => {
        if (toolCallDelta.type === 'code_interpreter' && toolCallDelta.code_interpreter && toolCallDelta.code_interpreter.input) {
            process.stdout.write(toolCallDelta.code_interpreter.input);
            callbackFn(toolCallDelta.code_interpreter.input);
        }
        if (toolCallDelta.code_interpreter.outputs) {
            const output1 = '\noutput > \n';
            callbackFn(output1);
            toolCallDelta.code_interpreter.outputs.forEach(output => {
                if (output.type === 'logs') {
                    const output2 = `\n${output.logs}\n`;
                    process.stdout.write(output2);
                    callbackFn(output2);
                }
            });
        }
    }); 
}

exports.stream = stream;

async function exec(assistant, thread) {
    const run = client.beta.threads.runs.stream(thread.id, {
        assistant_id: assistant.id
    })
    .on('textCreated', (text) => process.stdout.write('\nassistant > '))
    .on('textDelta', (textDelta, snapshot) => process.stdout.write(textDelta.value))
    .on('toolCallCreated', (toolCall) => process.stdout.write(`\nassistant > ${toolCall.type}\n\n`))
    .on('toolCallDelta', (toolCallDelta, snapshot) => {
        if (toolCallDelta.type === 'code_interpreter' && toolCallDelta.code_interpreter && toolCallDelta.code_interpreter.input) {
            process.stdout.write(toolCallDelta.code_interpreter.input);
        }
        if (toolCallDelta.code_interpreter.outputs) {
            process.stdout.write('\noutput > \n');
            toolCallDelta.code_interpreter.outputs.forEach(output => {
                if (output.type === 'logs') {
                    process.stdout.write(`\n${output.logs}\n`);
                }
            });
        }
    });
}

exports.exec = exec;