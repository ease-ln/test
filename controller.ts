const MAX_ID = 1000000
const fsm = require("fs");

class Controller {

    getProjects() {
        // return all projects
        const rawdata = fsm.readFileSync('data.json');
        const projects = JSON.parse(rawdata);
        if (projects) {
            return (projects);
        } else {
            return ("Error: no project found");
        }
    }

    get(id, parameter) {
        const ids = id.split("-");
        console.log(ids, parameter);

        const rawdata = fsm.readFileSync('data.json');
        let elem = JSON.parse(rawdata);

        for (const id of ids.slice(0, -1)) {
                elem = elem.children.find((data) => data.id === Number(id))
        }

        elem = elem.children.filter(function(obj) {
            return obj.id == Number(ids[ids.length-1]);
        });
        if (elem) {
            if (parameter) {
                return (elem[parameter]);
            } else {
                fsm.writeFileSync(`${ids[0]}.json`, JSON.stringify(elem[0]))
                return (elem[0]);
            }
        } else {
            return (`Project with id ${id} not found`);
        }
    }

    addProject(name, description, children=[]) {

        const rawdata = fsm.readFileSync('data.json');
        const file = JSON.parse(rawdata);

        for (;;) {
            const id = Math.floor(Math.random() * MAX_ID);
            const project = file.children.find((data) => data.id === id);

            if (!project) {
                const project_json = {
                    "id": id,
                    "subscribers": [],
                    "type": "PROJECT",
                    "title": name,
                    "description": description,
                    "children": children
                }
                file.children.push(project_json);
                fsm.writeFileSync('data.json', JSON.stringify(file));
                return id;
            }
        }
    }

    removeProject(id) {
        const rawdata = fsm.readFileSync('data.json');
        let file = JSON.parse(rawdata);
        file = file.children.filter(function(obj) {
            return obj.id !== id;
        });
        fsm.writeFileSync('data.json', JSON.stringify({
            "children": file
        }));
    }

    editProject(id, parameter, newData) {
        const project = this.get(id, false);
        project[parameter] = newData;
        this.removeProject(Number(id));
this.updateProject(project)
        return (project);
    }

    addList(id, newState, position=-1) {
        const project = this.get(id, false);

        let stateId;
        for (;;) {
            stateId = Math.floor(Math.random() * MAX_ID);
            const task = project.children.find((data) => data.id === stateId);

            if (position == -1) {position = project.children.length;}
            console.log(position);
            if (!task) {
                project.children.splice(position, 0, {
                                                "id" : stateId, 
                                                "title" : newState,
                                                "type": "LIST", 
                                                "children": []});
                break;
            }
        }

        this.removeProject(Number(id));
this.updateProject(project)
        return stateId;
    }

    addTask(taskId, taskTitle, taskDescription, taskStatus=false, taskChildren=[], position=-1) {
        const ids = taskId.split("-");
        const project = this.get(ids[0], false);
        let task = project.children.find((data) => data.id === Number(ids[1]));

        for (const id of ids.slice(2)) {
            task = task.children.find((data) => data.id === Number(id))
        }

        let task_json = {}
        console.log(position, project.children.length);
        if (position < 0 || position > project.children.length) {position = project.children.length;}

        for (;;) {
            const newId = Math.floor(Math.random() * MAX_ID);
            const isExistTask = task.children.find((data) => data.id === Number(newId));
            if (!isExistTask) {
                console.log(`create task with id = ${newId}, title = ${taskTitle}`)
                task_json = {"id" : newId, "type": "TASK", "title" : taskTitle, "description": taskDescription, "status": taskStatus, "children": taskChildren};
                task["children"].splice(position, 0, task_json);
                break;
            }
        }

        this.removeProject(Number(ids[0]));
this.updateProject(project)
        return task_json;
    }

    update(id, param, newTitle) {
        const ids = id.split("-");

        const project = this.get(ids[0], false);
        let task = project.children.find((data) => data.id === Number(ids[1]));

        console.log(ids);

        for (const id of ids.slice(2)) {
            task = task.children.find((data) => data.id === Number(id))
        }

        if (task) {
            if (param == 'status') { task[param] = !task[param]; }
            else { task[param] = newTitle; }
            
        }

        this.removeProject(Number(ids[0]));
this.updateProject(project)
        return task;
    }

    delete(taskId) {
        console.log(taskId);
        const ids = taskId.split("-");

        const project = this.get(ids[0], false);
        let task = project; //.find((data) => data.id === Number(ids[0]));

        for (const id of ids.slice(1, -1)) {
            task = task.children.find((data) => data.id === Number(id))
        }
        console.log(task);
        task.children = task.children.filter(function(obj) {
            return obj.id !== Number(ids[ids.length-1]);
        });
        this.removeProject(Number(ids[0]));


        return (ids.length==2) ? 'deleteList' : 'deleteTask';
    }

    updateProject(project) {
        const rawdata = fsm.readFileSync('data.json');
        const file = JSON.parse(rawdata);
        file.children.push(project);
        fsm.writeFileSync('data.json', JSON.stringify(file));
    }
}
module.exports = Controller;
