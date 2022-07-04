// import {Controller} from './controller.ts';
const ProjectManager = require('./controller.ts');
const controller = new ProjectManager();

let clients = [];
const projectsClients = {}

exports.subscribe = function(req, res) {
    console.log("subscribe new client");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    clients.push(res);

    res.on('close', function() {
        clients.splice(clients.indexOf(res), 1);
    });
};

exports.publish = function(project) {
    const id = controller.addProject(project.title, project.description, project.children);
    clients.forEach(function(res) {
        res.end(JSON.stringify({
            action: "add",
            data: controller.get(`${id}`, false)
        }));
    });

    clients = [];
};

exports.projects = function(req, res) {
    res.end(JSON.stringify(controller.getProjects()));
};

exports.get = function(body, res) {
    res.end(JSON.stringify(controller.get(body.id, false)));
};

exports.subscribeProject = function(id, res) {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

    if (Object.keys(projectsClients).includes(id.toString())) {
        projectsClients[id].push(res);
    } else {
        projectsClients[id] = [res];
    }

    res.on('close', function() {
        projectsClients[id].splice(projectsClients[id].indexOf(res), 1);
    });
};

exports.editProject = function(body) {
    controller.editProject(body.id, body.param, body.value);
    clients.forEach(function(res) {
        res.end(JSON.stringify({
            "action": "editProject",
            "data": {
                "id": body.id,
                "title": body.value
            }
        }));
    });
    projectsClients[body.id].forEach(function(res) {
        res.end(JSON.stringify({
            "action": "edit",
            "data": {
                "id": body.id,
                "title": body.value
            }
        }));
    });
};

exports.addList = function(id, body) {
  const listId = controller.addList(id, body.value);
projectsClients[id].forEach(function(res) {
    res.end(JSON.stringify({
        "action": "addList",
        "data": {
            "id": `${id}-${listId}`,
            "title": body.value
        }
    }));
});
};

exports.addTask = function(body) {
    const task = controller.addTask(body.taskId, body.title, body.description);
    projectsClients[body.taskId.split("-")[0]].forEach(function(res) {
        res.end(JSON.stringify({
            "action": "addTask",
            "data": {
                "parendId": body.taskId,
                ...task,
            }
        }));
    });
}

exports.update = function(body) {
    const task = controller.update(body.id, body.param, body.value);
    projectsClients[body.id.split("-")[0]].forEach(function(res) {
        res.end(JSON.stringify({
            "action": "editTask-"+body.param,
            "data": {
                "taskId": body.id,
                ...task,
            }
        }));
    });
}

exports.delete = function(body) {
    controller.delete(body.id);
    const projectID = body.id.split("-")[0];
    projectsClients[projectID].forEach(function(res) {
        res.end(JSON.stringify({
            "action": 'delete',
            "data": {
                "id": body.id
            }
        }));
    });
}

exports.move = function(body) {
    controller.delete(body.from);
    let array;
    const task = controller.addTask(body.to, body.task.title, body.task.description, body.task.status, body.task.children, Number(body.position)-1);
    if (body.to.split("-").slice(0, 1)[0] == body.from.split("-").slice(0, 1)[0]) array = projectsClients[body.from.split("-").slice(0, 1)]
    else array = projectsClients[body.to.split("-")[0]].concat(projectsClients[body.from.split("-")[0]]);
    array.forEach(function(res) {
        res.end(JSON.stringify({
            "action": "move",
            "data": {
                "to": {
                    "projectId": body.to.split("-").slice(0, 1),
                    "parendId": body.to,
                    "position": Number(body.position)-1,
                    ...task,
                },
                "from": {
                    "projectId": body.from.split("-").slice(0, 1),
                    "id": body.from,
                }
            }
        }));
    });
}

setInterval(function() {
    console.log(clients.length);
}, 5000);
