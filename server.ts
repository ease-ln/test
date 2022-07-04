const http = require('http');
const url = require('url');
const fs = require("fs");
const ProjectManager_ = require('./controller.ts')
const contr = new ProjectManager_();

const chat = require('./chat.ts');
let id = null;
http.createServer(function(req, res) {
    const urlParsed = url.parse(req.url);
    console.log(urlParsed.pathname)
    let body = '';

    switch (urlParsed.pathname) {
        case '/':
            sendFile("index.html", res);
            break;
        case '/project':
            sendFile("project.html", res);
            break;
        case '/logo.png':
            console.log("logo send");
            res.writeHead(200, {'Content-Type': 'image/png'});
            fs.createReadStream('logo.png').pipe(res)
            break;
        case '/export.png':
            console.log("export send");
            res.writeHead(200, {'Content-Type': 'image/png'});
            fs.createReadStream('export.png').pipe(res)
            break;
        case '/index.css':
            console.log("index css send");
            res.writeHead(200, {'Content-Type': 'text/css'});
            fs.createReadStream('index.css').pipe(res)
            break;
        case '/project.css':
            console.log("project css send");
            res.writeHead(200, {'Content-Type': 'text/css'});
            fs.createReadStream('project.css').pipe(res)
            break;
        case '/project.js':
            console.log("project js send");
            res.writeHead(200, {'Content-Type': 'text/javascript'});
            fs.createReadStream('project.js').pipe(res)
            break;      
        case '/projects':
            chat.projects(req, res);
            break;
        case '/subscribe':
            chat.subscribe(req, res);
            break;
        case '/get':
            req
                .on('readable', receiveData)
                .on('end', function() {
                    body = JSON.parse(body.slice(0, -4));
                    chat.get(body, res);
                });
            break;
        case '/addProject':
            req
                .on('readable', receiveData)
                .on('end', function() {
                    body = JSON.parse(body.slice(0, -4));
                    chat.publish(body);
                    res.end("ok");
                });

            break;
        case '/subscribeProject':
            id = getParameter(req.url);
            chat.subscribeProject(id, res);
            break;
        case '/editProject':
            id = getParameter(req.url);
            body = '';

            req
                .on('readable', receiveData)
                .on('end', function() {
                    body = JSON.parse(body.slice(0, -4));
                    chat.editProject(body);
                    res.end("ok");
                });
            break;
        case "/addList":
          id = getParameter(req.url);
          body = '';
          req
          .on('readable', receiveData)
          .on('end', function() {
              body = JSON.parse(body.slice(0, -4));
              chat.addList(id, body);
              res.end("ok");
          });
          break;
        case "/addTask":
            body = '';
            req
            .on('readable', receiveData)
            .on('end', function() {
                body = JSON.parse(body.slice(0, -4));
                chat.addTask(body);
                res.end("ok");
            }); 
            break;
        case "/update":
            body = '';
            req
            .on('readable', receiveData)
            .on('end', function() {
                body = JSON.parse(body.slice(0, -4));
                chat.update(body);
                res.end("ok");
            }); 
            break;
        case "/delete":
            body = '';
            req
            .on('readable', receiveData)
            .on('end', function() {
                body = JSON.parse(body.slice(0, -4));
                chat.delete(body);
                res.end("ok");
            }); 
            break;
        case "/move":
            body = '';
            req
            .on('readable', receiveData)
            .on('end', function() {
                body = JSON.parse(body.slice(0, -4));
                chat.move(body);
                res.end("ok");
            }); 
            break;          
        default:
                if (urlParsed.pathname.split(".").slice(-1)[0] == 'json') {
                    const projectId = urlParsed.pathname.split("/")[1].split(".")[0];
                    contr.get(projectId, '');
                    sendFile(`${projectId}.json`, res);
                    break;
                }
            urlParsed.pathname = '';
            res.statusCode = 404;
            res.end("Not found");
    }

    function receiveData() {
        body;
        body += req.read();

        if (body.length > 1e4) {
            res.statusCode = 413;
            res.end("Your data is too big for my little app");
        }
    }
}).listen(3000);


function sendFile(fileName, res) {
    const fileStream = fs.createReadStream(fileName);
    fileStream
        .on('error', function() {
            res.statusCode = 500;
            res.end("Server error");
        })
        .pipe(res)
        .on('close', function() {
            fileStream.destroy();
            if (fileName.split(".").slice(-1)[0] == 'json') { fs.unlinkSync(fileName); }
        });
}

function getParameter(str) {
    return str.split('?')[1];
}