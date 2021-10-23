const conf = new (require('conf'))()
const chalk = require('chalk')

function removeDone() {
    let todosList = conf.get('todo-list')

    if (todosList) {
        todosList = todosList.filter((task) => {
            if (task?.done !== true) {
                return task
            }
        });

        //set the new todo-list
        conf.set('todo-list', todosList)
    }

    //show the user a message
    console.log(chalk.green.bold('Tasks marked as done have been removed successfully'))
}

module.exports = removeDone