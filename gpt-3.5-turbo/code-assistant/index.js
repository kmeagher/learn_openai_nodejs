
const OpenAI = require('openai');
const client = new OpenAI();

const assistant = client.beta.assistants.create({
    name: "Code Assistant",
    instructions: "You are a"
})