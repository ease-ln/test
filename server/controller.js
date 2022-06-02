let data = require("./data.js");

class Controller {

    async getProjects() {
        // return all projects
        return new Promise((resolve, _) => resolve(data));
    }

    async getProject(id) {
        return new Promise((resolve, reject) => {
            let project = data.find((data) => data.id === parseInt(id));
            if (project) {
                // return the todo
                resolve(project);
            } else {
                // return an error
                reject(`Project with id ${id} not found `);
            }
        });
    }
}

module.exports = Controller;