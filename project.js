let projectId = window.location.search.substring(1);
let oldVal = ""; 
projectLoad(projectId);
subscribeProject();

function subscribeProject() {
    var xhr = new XMLHttpRequest();

    xhr.open("GET", "/subscribeProject?"+projectId, true);
    xhr.send(projectId.toString());

    xhr.onreadystatechange = function() {
        if (this.readyState != 4) return;

        if (this.status != 200) {
        setTimeout(subscribeProject, 5000);
        return;
        }
        
        let resp = JSON.parse(this.responseText);
        console.log(resp.action);
        switch (resp.action) {
            case 'edit':
                const projectTitle = document.getElementById('project-title');
                projectTitle.value = resp.data.title;
                document.title = resp.data.title +' | CATastrophe!';
                break;
            case 'addList':
                const listAdd = document.getElementById('listAdd')
                let list = buildList({ listId: resp.data.id , listTitle: resp.data.title, content: "" });
                var temp = document.createElement('div');
                temp.innerHTML = list;
                makedragable(temp.children[0]);
                const parentElement = document.getElementById('lists');
                parentElement.insertBefore(temp.children[0],  listAdd)
                break;
            case 'addTask':
                const task = getChild(resp.data, resp.data.parendId);
                document.getElementById("add-subtask-here-"+resp.data.parendId).insertAdjacentHTML("beforeBegin", task);
                break;
            case 'editTask-status':
                document.getElementById(resp.data.taskId).querySelector('.checkbox').checked = resp.data.status;
                break;
            case 'editTask-title':
                document.getElementById(resp.data.taskId).querySelector('#title').value = resp.data.title;
                break;
            case 'delete':
                document.getElementById(`${resp.data.id}`).outerHTML = "";
                break;
            case 'move':
                if (resp.data.from.projectId == projectId) { document.getElementById(`${resp.data.from.id}`).outerHTML = ""; }
                if (resp.data.to.projectId == projectId) {
                    const task = getChild(resp.data.to, resp.data.to.parendId);
                    var temp = document.createElement('div');
                    temp.innerHTML = task;
                    const parentElement = document.getElementById(resp.data.to.parendId).querySelector('.tasks');
                    parentElement.insertBefore(temp.children[0],  parentElement.children[Number(resp.data.to.position)])
                }
        }
        subscribeProject();
    };
}

function projectLoad(projectId) {
  // open connection
var xhr = new XMLHttpRequest();
  // form request
xhr.open("POST", "/get", true);
xhr.send(JSON.stringify({"id": projectId}));
xhr.onreadystatechange = function() {
  if (this.readyState != 4) return;
    // convert respond to json 
    let project = JSON.parse(this.responseText);
    parseJSON(project);
    drapAndDropEffect();
}
return false;
};
// Create components
const buildBlock = ({ type, content, value, id, className, func}) => {
return `<${type} id="${id}" class="${className}" onclick="${func}" value="${value}">${content}</${type}>`;
};

const buildTask = ({ taskId, taskTitle, taskState, content }) => {
return `
<div id="${taskId}" class="${taskId.split('-').length == 3 ? 'task':'subtask'}" draggable="${taskId.split('-').length == 3 ? true:'auto'}">

    <div class="task-container" > 
            <p>${"&nbsp".repeat(taskId.split("-").length*3)}</p><label id="${taskId}" class="container">
            <input class="checkbox" type="checkbox" onclick="update('${taskId}', 'status', '')" ${ taskState ? 'checked' : "" }>
            <span class="checkmark"></span>
            <p style="display:inline-block">&nbsp&nbsp&nbsp</p>
            <input id="title" class="task-elem" onfocus="{oldVal='${taskTitle}';}" onkeypress="{pressHandler(event, '${taskId}', 'title', update, 'title')}" value="${taskTitle}">
            </label>
            <p class="delete-task" onclick="deleteElem('${taskId}')">-</p>
            <p id="delete-task" class="delete-task" onclick="document.getElementById('sub-task-add-input-${taskId}').style.display = 'block'; document.getElementById('sub-task-add-input-${taskId}').focus();">+</p>
            ${ taskId.split("-").length == 3 ? `<p id="delete-task" class="delete-task" onclick="document.getElementById('move-${taskId}').style.display = 'block'; getProjects('${taskId}');  focusElemId='move-${taskId}'">=</p>` : ''}
            

    </div>
    <input id="sub-task-add-input-${taskId}" class="task-elem sub-task-add-input" onkeypress="{pressHandler(event, '${taskId}', 'sub-task-add-input-${taskId}', addTaskToList, '');}"
    onfocusout="let elem = document.getElementById('sub-task-add-input-${taskId}'); elem.style.display = 'none'; elem.value='';">
    ${ taskId.split("-").length == 3 ?
    `
    <div id="move-${taskId}" style="display: none; padding: 10px; background: #b69efe;">
        <label class="move-elem" for="projects">Choose a project:</label>
        <select id="move-projects-${taskId}" class="move-elem" name="projects"  onclick="if (typeof(this.selectedIndex) != 'undefined') getLists(this.selectedIndex, '${taskId}');">
            <option value="volvo">Volvo</option>
        </select>
        <br>

        <label class="move-elem" for="lists">Choose a list:</label>
        <select id="move-lists-${taskId}" class="move-elem" name="lists">
            <option value="N/A">N/A</option>
        </select>
        <br>

        <label class="move-elem" for="position">Position:</label>
        <input id="move-position-${taskId}" class="move-elem" name="position"></input>
        <button onclick="replace('${taskId}'); ">send</button>
    </div>
    `: ''}
    ${content}
    <input id="add-subtask-here-${taskId}" class="task-elem" style="display:none">


    </div>`;
};

const buildList = ({ listId, listTitle, content}) => {
return `
<div id="${listId}" class="list"> 
    <div class="header-container">
    <input id="title" class="list-elem" onfocus="{oldVal='${listTitle}';}" onkeypress="{pressHandler(event, '${listId}', 'title', update, 'title')}" value="${listTitle}">
    <input type="button" id="title" class="list-elem edit-elem" onclick="{deleteElem('${listId}')}" value="-">
    </div>

    <div class="tasks task">
        ${content}
        <input id="add-subtask-here-${listId}" class="task-elem" style="display:none">
    </div>

    <input id="task-add" class="list-elem" onkeypress="{pressHandler(event, '${listId}', 'task-add', addTaskToList, '');}" placeholder="Add task" value="">
</div>`;
};

let focusElemId = '';
document.addEventListener('mouseup', function(e) {
    if (focusElemId) {
        var container = document.getElementById(focusElemId);
        if (!container.contains(e.target)) {
            container.style.display = 'none';
        }
    }
});

const buildProject = ({projectId, projectTitle, content}) => {
document.title = projectTitle + ' | CATastrophe!';
return `
<div id="projectTitle">
    <input type="text" id="project-title" value="${projectTitle}" onkeypress="{pressHandler(event,'projectTitle', 'project-title', editProjectTitle, 'title')}"></input>
    <input type="text" id="search" placeholder="Search" class="list-elem search" onclick="search()"></input>

</div>

<div id="lists">
    ${content}
    <div id="listAdd" class="list">
        <input type="text" id="list-header" class="list-elem" onkeypress="{pressHandler(event,'listAdd', 'list-header', createNewList, '')}" placeholder="Add list"
        onfocusout="document.getElementById('listAdd').querySelector('#list-header').value=''" ></input>
    </div>
</div>
`
};

const getChild = (child, parendId="") => {
return PRIMITIVES[child.type](child, parendId);
}

const getContent = (children, parendId="") => {
children = children.map(child => getChild(child, parendId));
return children.join("")
}

const PRIMITIVES = {
PROJECT: (node) => {
    return buildProject({
        projectId: projectId,
        projectTitle: node.title,
        content: getContent(node.children, projectId),
    });
},
LIST: (node, parentId) => {
    return buildList({
        listId: `${parentId}-${node.id}`, 
        listTitle : node.title, 
        content: getContent(node.children, `${parentId}-${node.id}`),
    });
},
TASK: (node, parentId) => {
    return buildTask({
        taskId: `${parentId}-${node.id}`, 
        taskTitle : node.title, 
        taskState : node.status,
        content: getContent(node.children, `${parentId}-${node.id}`),
    });
},
};

function parseJSON(data) {
console.log(data);
document.getElementById("TheProject").innerHTML = PRIMITIVES[data.type](data);
}

function pressHandler(event, parentElemID, originalElemId, functionToDo, param='') {
if (event.key === "Enter") {
    const parentElem = document.getElementById(parentElemID);
    const pId = parentElem.querySelector('#'+originalElemId);
        // Cancel the default action, if needed
        event.preventDefault();
        // Trigger the button element with a click
                if (pId.value != '') {
                    functionToDo(parentElemID, param, pId.value);
                }
    pId.blur();
            }
};

// Send to server

function editProjectTitle(projectTitle, param, value) {
  console.log('edit project?');
  var xhr = new XMLHttpRequest();
    xhr.open("POST", "/editProject?"+projectId, true);
    xhr.setRequestHeader("Content-Type", "application/json;");
    xhr.send(JSON.stringify({"id": projectId, "value": value, "param": param}));
    return false;
}

function createNewList(parentElemID, param, listTitle){
console.log('add list', parentElemID, param, listTitle);
  var xhr = new XMLHttpRequest();
    xhr.open("POST", "/addList?"+projectId, true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify({"value": listTitle}));
    return false;
}

function addTaskToList(taskId, param, taskTitle) {
if (document.getElementById(taskId).querySelector('#task-add')) {document.getElementById(taskId).querySelector('#task-add').value='';}
console.log(`Add task=${taskTitle} to list with id=${taskId}`);
var xhr = new XMLHttpRequest();
xhr.open("POST", "/addTask", true);
xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
xhr.send(JSON.stringify({"taskId": taskId, "title": taskTitle, "description": ""})); //TO DO
return false;
}

function update(taskId, param, NewValue){
console.log(`update task`);
var xhr = new XMLHttpRequest();
xhr.open("POST", "/update", true);
xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
xhr.send(JSON.stringify({"id": taskId, "param": param, value: NewValue}));
return false;
}

function deleteElem(taskId) {
console.log(`delete task with id=${taskId}`);
var xhr = new XMLHttpRequest();
xhr.open("POST", "/delete", true);
xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
xhr.send(JSON.stringify({"id": taskId}));
return false;
}

let projects;
function getProjects(taskId){
var xhr = new XMLHttpRequest();
xhr.open("GET", "/projects");
xhr.send(null);
options = '';
xhr.onreadystatechange = function() {
  if (this.readyState != 4) return;
  projects = JSON.parse(this.responseText).children;
  let i = 0;
    for (project of projects) {
        // console.log(projects);
        options = `<option value="${project.title}" id="${project.id}"> ${project.title}</option>` + options;
        i++;

    }
    document.getElementById(`move-projects-${taskId}`).innerHTML = options;
}
return false;
}

function getLists(projectId, taskId) {
document.getElementById(`move-lists-${taskId}`).innerHTML = '';
options = '';
lists = projects[projectId].children;
let i = 0;
    for (list of lists) {
        options = `<option value="${list.title}" id="${list.id}"> ${list.title}</option>` + options; 
        i++;
    }
    document.getElementById(`move-lists-${taskId}`).innerHTML = options;  }

function move(from, to, task, position) {
console.log(`Add task=${task.title} to list with id=${to}`);
var xhr = new XMLHttpRequest();
xhr.open("POST", "/move", true);
xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
xhr.send(JSON.stringify({"to": to, "task": task, "from": from,"position": position})); //TO DO
return false;
}

function replaceElem(from, to, position) {
// console.log(`replace task with id=${from}`);

var xhr = new XMLHttpRequest();
xhr.open("POST", "/get", true);
xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
xhr.send(JSON.stringify({"id": from}));
xhr.onreadystatechange = function() {
  if (this.readyState != 4) return;
  let task = JSON.parse(this.responseText);
  move(from, to, task, position);
  return false
}
return false;
}

function replace(taskId) {
let elem = document.getElementById(`move-projects-${taskId}`);
let elemId = elem.options.selectedIndex;
let projectID = elem.children[elemId].id;

elem = document.getElementById(`move-lists-${taskId}`);
elemId = elem.options.selectedIndex;
let listID = elem.children[elemId].id;

let position = document.getElementById(`move-position-${taskId}`).value;

replaceElem(`${taskId}`, `${projectID}-${listID}`, position)
}

function search(){
console.log(document.getElementById("search").value);
}

function makedragable(node) {
node.addEventListener(`dragstart`, drag);
node.addEventListener(`dragover`, over);
node.addEventListener(`dragend`, drop);

node.addEventListener(`touchmove`, touchMove);
}


// drag and drop
let activeElement;
let currentElement;
let tasksListsElement;
let tasksListElement
function  drapAndDropEffect() {
tasksListsElement = document.querySelectorAll('.tasks');

for (tasksListElement of tasksListsElement) {
    makedragable(tasksListElement);
    }
}

for (checkbox of document.querySelectorAll('.checkmark')) {
checkbox.addEventListener('touchstart', touchClick);
}

function drag(evt) {
    evt.target.classList.add('selected');
    activeElement = evt.target.closest('.task');
    // console.log(activeElement);
}

function drop(evt) {            
    var parent = activeElement.parentNode;
    if (activeElement && parent.parentNode.id){
        var index = Array.prototype.indexOf.call(parent.children, activeElement);
        // console.log(activeElement.id);
        // console.log(parent.parentNode.id);
        // console.log(index+1);
        replaceElem(`${activeElement.id}`, `${parent.parentNode.id}`, index+1)
    }
    evt.target.classList.remove('selected');
}
function over(evt) {
evt.preventDefault();

currentElement = evt.target.closest('.task');
const isMoveable = activeElement !== currentElement; //&& currentElement.classList.contains(`task`);

if (!isMoveable) {
return;
}

//   console.log("over", activeElement)
const nextElement = (currentElement === activeElement.nextElementSibling) ?
    currentElement.nextElementSibling :
    currentElement;

if (
nextElement && 
activeElement === nextElement.previousElementSibling ||
activeElement === nextElement
) {
return;
}
tasksListElement= currentElement.closest('.tasks');
if (evt.target.classList.contains('task')) { tasksListElement.appendChild(activeElement); } 
else {tasksListElement.insertBefore(activeElement, nextElement);}
}    


function touchMove(event) {
event.preventDefault();
activeElement = event.target.closest('.task');
activeElement.style.position = 'fixed';
activeElement.style.zIndex = 10;
activeElement.addEventListener('touchend', touchEnd);

let touch = event.targetTouches[0];

activeElement.style.top = `${touch.pageY - (activeElement.offsetHeight/2)}px`;
activeElement.style.left = `${touch.pageX - (activeElement.offsetWidth/2)}px`;

tasks = document.querySelectorAll('.task');
tasks.forEach(task => {
    if (
        activeElement.getBoundingClientRect().top + activeElement.offsetHeight / 2 < task.getBoundingClientRect().bottom &&
        activeElement.getBoundingClientRect().right - activeElement.offsetWidth / 2 > task.getBoundingClientRect().left &&
        activeElement.getBoundingClientRect().bottom - activeElement.offsetHeight / 2 > task.getBoundingClientRect().top &&
        activeElement.getBoundingClientRect().left + activeElement.offsetWidth / 2 < task.getBoundingClientRect().right &&
        activeElement != task
        ) {
            tasksListElement= task.closest('.tasks');
            if (task.classList.contains('tasks') ) {
                currentElement = task;
                currentElement.appendChild(activeElement);
            } else {tasksListElement.insertBefore(activeElement, task.nextElementSibling);}
        }

})

}
function touchEnd(event) {
activeElement.style.position = 'static';
var parent = activeElement.parentNode;

console.log(parent);
    if (activeElement && parent.parentNode.id){
        var index = Array.prototype.indexOf.call(parent.children, activeElement);
        console.log(activeElement.id);
        console.log(parent.parentNode.id);
        console.log(index+1);
        replaceElem(`${activeElement.id}`, `${parent.parentNode.id}`, index+1)
    }
}

function touchClick(event){
console.log('click');
}
