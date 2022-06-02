const http = require("http");
const Projects = require("./controller");
// const { getReqData } = require("./utils");

const server = http.createServer(async (req, res) => {

    if (req.url == '/projects' && req.method === "GET") { //check the URL of the current request
        
        // get projects
        const projects = await new Projects().getProjects();
        // set response header
        res.writeHead(200, { "Content-Type": "application/json" });
        // send the data
        res.end(JSON.stringify(projects));
    }
    else if (req.url.match(/\/project\/([0-9]+)/) && req.method === "GET") {
        try {
            const id = req.url.split("/")[2];
            const project = await new Projects().getProject(id);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(project));
        } catch (error) {
            // set the status code and content-type
            res.writeHead(404, { "Content-Type": "application/json" });
            // send the error
            res.end(JSON.stringify({ message: error }));
        }
    }
    else if (req.url.match(/\/project\/([0-9]+)/states) && req.method === "PATCH") {
        
    }
    else
        res.end('Invalid Request!');

});
server.listen(process.env.PORT || 5000);

console.log('Node.js web server at port 5000 is running..')