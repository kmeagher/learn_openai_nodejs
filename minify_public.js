
const https = require('follow-redirects').https;
const qs = require('querystring');
const fs = require('fs'), path = require('path');
const srcPath = path.join(__dirname, "/public_src");

async function minify() {
    fs.readdir(srcPath, async (err, files) => {
        for(let i = 0; i < files.length; i++) {
            let fileName = files[i];
            const extension = fileName.substring(fileName.indexOf('.')+1, fileName.length);
            switch(extension) {
                case 'html':
                    await minifyHTML(fileName);
                    break;
                case 'css': 
                    await minifyCSS(fileName);
                    break;
                case 'js':
                    await minifyJavaScript(fileName);
                    break;
                default:
                    break;
            }
        }
    });
}

function minFileInfo(fileName) {
    const output = {
        minFileName: fileName.replace(/\./, '_min.')
    };
    output.minFilePath = path.join(__dirname, `/public/${output.minFileName}`);
    return output;
}

function writeFile(fileInfo, data) {
    return new Promise(resolve => {
        fs.writeFile(fileInfo.minFilePath, data, (err) => {
            if (err) {
                console.error(err);
                resolve(false);
            } else {
                console.log(`File ${fileInfo.minFileName} Created`);
                resolve(true);
            }
        });
    });
}

function readFile(fileName) {
    return new Promise(resolve => {
        const filePath = path.join(srcPath, `/${fileName}`);
        fs.readFile(filePath,  {encoding: 'utf-8'}, (err, data) => {
            if (err) {
                resolve('');
            } else {
                resolve(data);
            }
        });
    });
}

async function minifyJavaScript(fileName) {
    const jsCode = await readFile(fileName);
    const fileInfo = minFileInfo(fileName);
    const success = await writeFile(fileInfo, jsCode);
    if (success) {
        
    }
}

async function minifyJavaScript(fileName) {
    let code = await readFile(fileName); 
    let minCode = await requestMinJs(code);
    const fileInfo = minFileInfo(fileName);
    await writeFile(fileInfo, minCode);
}

async function minifyCSS(fileName) {
    let cssCode = await readFile(fileName);
    cssCode = cssCode
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
        .replace(/\s+/g, ' ') // Remove whitespace, newlines, and tabs;
        .replace(/;+/g, ';')  // Remove unnecessary semicolons
        .replace(/\s*{\s*/g, '{').replace(/\s*}\s*/g, '}') // Remove whitespace around curly braces
        .replace(/\s*:\s*/g, ':') // Remove whitespace around colons
        .replace(/\s*,\s*/g, ',') // Remove whitespace around commas
        .trim();
    const fileInfo = minFileInfo(fileName);
    await writeFile(fileInfo, cssCode);
}

async function minifyHTML(fileName) {
    let htmlCode = await readFile(fileName);
    htmlCode = htmlCode.replace(/<!--.*?-->/gs, '') // Remove HTML comments
        .replace(/\s{2,}/g, ' ')     // Collapse multiple spaces to one
        .replace(/\s+/g, ' ')         // Replace sequence of whitespace characters with a single space
        .replace(/> \s+</g, '><')     // Remove whitespace between tags
        .trim();                      // Trim the start and end of the string
    const fileInfo = minFileInfo(fileName);
    await writeFile(fileInfo, htmlCode);
}

async function requestMinJs(jsCode) {
    return new Promise(resolve => {
        
        const options = {
            'method': 'POST',
            'hostname': 'www.toptal.com',
            'path': '/developers/javascript-minifier/api/raw',
            'headers': {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            'maxRedirects': 20
        };

        const req = https.request(options, function (res) {
            let chunks = [];

            res.on("data", function (chunk) {
                chunks.push(chunk);
            });

            res.on("end", function (chunk) {
                const body = Buffer.concat(chunks);
                resolve(body);
            });

            res.on("error", function (error) {
                console.error(error);
            });
        });

        const postData = qs.stringify({
            'input': jsCode
        });

        req.write(postData);

        req.end();
    });
}
  

minify();

