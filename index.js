const inquirer = require("inquirer");
const InquirerTree = require("./tree.js");
const promptsToBuildObject = require("./fromObject.js");


inquirer.promptsToBuildObject = promptsToBuildObject;


inquirer.startTree = function startTree(tree, options) {
    var controller = new InquirerTree(tree, options);
    return controller.start();
};

module.exports = inquirer;
