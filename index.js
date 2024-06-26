
const express = require('express');
const cors = require('cors');
const app = express();
const expressWs = require('express-ws')(app);
const router = express.Router();
const port = 8080;
const auth = require('./auth');
const mathTutor = require('./gpt-3.5-turbo/math-tutor');
const jobs = require('./jobs');

app.set('trust proxy', true); // allows for getting IP Address, even across a proxy req.ip
app.use(cors());
app.use(express.static(__dirname + '/public'));

router.ws('/connect/:token?', async (ws, req) => {
    const authResponse = auth.validate(req);
    if (authResponse.errored) {
        ws.send(JSON.stringify(authResponse));
        setTimeout(() => {
            ws.terminate();
            console.log("Socket Connection Terminated");
        }, 1000);
    } else {
        ws.on('open', async () => {
            try {
                const tutor = await mathTutor.create(req);
                ws.send(`Connection Open! Assistant Id: ${tutor.assistant.id}`);
            } catch (e) {
                console.error(e);
                ws.send("Failure to connect");
            }
        });
        ws.on('error', console.error);
        ws.on('message', async (data) => {
            console.log(`Received: ${data}`);
            await mathTutor.createMessage(req, data);
            await mathTutor.exec(req, (output) => {
                ws.send(`${output}`);
            });
        });
    }
});

app.use('/ws', router);

app.get('/', (req, res) => {
    res.sendFile('math_tutor_min.html', {
        root: __dirname + '/public'
    });
});

app.get('*', (req, res, next) => {
    res.send("Requested File: " + req.url);
});

app.post('/auth/create', (req, res) => {
    res.json({
        errored: false,
        message: "Authorized User Created",
        data: [auth.create(req)]
    });
});

app.post('/auth/validate', (req, res) => {
    const response = auth.validate(req);
    res.status(response.statusCode || 200).json(response);
});

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});

jobs.start();
