const inquirer = require("inquirer");
require("./index.js");
const treeSample = require("./tree-sample.js");

var person = {
    firstName: "John",
    lastName: "Doe",
    active: false
};

var car = {
    color: "green",
    mileage: 100000
};

inquirer.promptsToBuildObject(person)
    .then(answers => {
        return inquirer.startTree(treeSample, { answers: answers });
    })
    .then(answers => {
        console.log("Anwers:", answers);
        return inquirer.startTree({
            mergeAnswers: true,
            prompts: [
                { fromObject: car, customizations: "What customizations do you want?" }
            ]
        }, { answers: answers });
    })
    .then(answers => {
        console.log("3rd Answers:", answers);
    });