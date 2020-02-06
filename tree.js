const inquirer = require("inquirer");
const mustache = require("mustache");

function InquirerTree(treeData, options) {
    if(!options) {
        options = {};
    }
    this.questionTree   = treeData;
    this.answers        = options.answers || {};
    this.branchName     = null;
    this.path           = {
        branch: null,
        question: null
    };
    this.setBranch(treeData);
}
InquirerTree.prototype.setBranch = function(branch) {
    this.branch         = branch;
    this.index          = -1;
    this.resolveAnswerRoot();
    this.field          = this.branch.field || null;
};
InquirerTree.prototype.resolveAnswerRoot = function() {
    if(!this.path || !this.path.branch) {
        this.answerRoot = this.answers;
    } else {
        var parts = this.path.branch.split("/");
        var treeBranch = this.questionTree;
        this.answerRoot = this.answers;
        for(let idx = 0; idx < parts.length; idx++) {
            let part = parts[idx];
            var answerBranch = this.answerRoot[part];
            treeBranch = treeBranch.branches[part];
            if(!answerBranch) {
                answerBranch = {};
                this.answerRoot[part] = answerBranch;
            }
            if(!treeBranch.mergeAnswers) {
                this.answerRoot = answerBranch;
            }
        }
    } 
};
InquirerTree.prototype.start = function() {
    this.promise = new Promise((resolve, reject) => {
        this.promiseResolve = resolve;
        this.promiseReject = reject;
    });    
    this.next();
    return this.promise;
};
InquirerTree.prototype.resolvePrompt = function(promptData) {
    var prompt = {};
    if(typeof promptData === "object") {
        var keys = Object.keys(promptData);

        if(keys.length === 1) {
            if(keys[0] === "fromObject") {
                console.log(promptData);
                throw new Error("You still have to provide a name/message shorthand value when using fromObject");
            }            
            prompt.name     = keys[0];
            prompt.message  = promptData[ keys[0] ];
            prompt.type     = "input";
        } else if(keys.length < 3) {
            for(let idx = 0; idx < keys.length; idx++) {
                let key = keys[idx];
                if(key === "name" || key === "message") {
                    console.log(promptData);
                    throw new Error("When defining a prompt with less than 3 fields, the name should be a field name and the message should be its value");
                }
                if(key === "fromObject" || (key === "type" && promptData.type === "fromObject")) {
                    prompt.type = "fromObject";
                    
                    if(promptData.fromObject) {
                        prompt.source = promptData.fromObject;
                    } else {
                        prompt.source = promptData.source;
                    }
                    if(promptData.options) {
                        prompt.options = options;
                    }
                } else if(key === "type" || key === "choices" || key === "default" || key === "filter" || key === "validate" || key === "transformer") {
                    prompt[key] = promptData[key];
                } else if(!prompt.name) {
                    prompt.name = key;
                    prompt.message = promptData[key];
                } else {
                    console.log(promptData);
                    throw new Error("You cannot include more than 1 custom field on a prompt with less than 4 fields");
                }
            }
        } else {
            if(!promptData.name) {
                console.log(promptData);
                throw new Error("When providing 3 or more fields, on a prompt, you must speciy the name");
            }
            if(!promptData.message) {
                console.log(promptData);
                throw new Error("When providing 3 or more fields, on a prompt, you must speciy the name");
            }
            prompt = promptData;
        }
    }
    if(!prompt.name) {
        console.log(promptData);
        throw new Error("Prompt was unable to resolve a name");
    }
    if(promptRequiresChoices(prompt) && !prompt.choices) {
        console.log(promptData);
        throw new Error("When creating a prompt that requires choices, choices must be provided");
    }
    if(prompt.choices && !prompt.type) {
        // Default to a list when choices are present but type is not
        prompt.type = "list";
    }
    if(!prompt.type) {
        prompt.type = "input";
    }

    // Finally, parse the message for any templates
    var templateVariables = { answers: this.answers };
    prompt.message = mustache.render(prompt.message, templateVariables);

    if(prompt.choices && typeof prompt.choices === "string") {
        var choiceStr = mustache.render(prompt.choices, templateVariables);
        if(choiceStr.indexOf(",") >= 0) {
            prompt.choices = choiceStr.split(",");
        } else {
            prompt.choices = choiceStr.split(" ");
        }
    }

    return prompt;
};
InquirerTree.prototype.runFunctionStep = function(fn) {
    var next = (redirect) => this.next(redirect);
    return fn(this.answers, next);
};
InquirerTree.prototype.navigateTree = function(path) {
    if(typeof path === "string" || path.path) {
        path = this.resolvePath(path);
    }

    var branch;
    if(path.relative) {
        branch = this.branch;
    } else {
        branch = this.questionTree;
    }

    var parts = path.branch.split("/");
    for(var i = 0; i < parts.length; i++) {
        var branchName = parts[i];
        if(!branch.branches) {
            throw new Error(`branch has no branches:`, branch);
        }
        if(!branch.branches[branchName]) {
            throw new Error(`No such branch ${branchName}`);
        }
        branch = branch.branches[branchName];
    }

    if(path.question) {
        this.setIndexToNamedQuestion(path.question);
    }

    this.setBranch(branch);
    this.path = path;
    return path;
};
InquirerTree.prototype.setIndexToNamedQuestion = function(name) {
    var found = false;
    for(var idx = 0; idx < this.branch.prompts.length; idx++) {
        let promptData = this.branchName.prompts[idx];

        if(typeof promptData !== "function") {
            var prompt = this.resolvePrompt(promptData);

            if(prompt.name === name) {
                this.index = idx;
                found = true;
                break;
            }
        }
    }

    if(!found) {
        throw new Error(`No question found named: ${name}`);
    }
};
InquirerTree.prototype.resolvePath = function(pathSrc) {
    var path;
    var pathObj = {
        relative:   true,
        branch:     "",
        question:   null
    };

    if(pathSrc && typeof pathSrc === "object") {
        path = pathSrc.path;
    } else if(pathSrc && typeof pathSrc === "string") {
        path = pathSrc;
    }

    if(path.indexOf("/") === 0) {
        pathObj.relative = false;
        path.shift();
    }
    if(path.indexOf("#") >= 0) {
        var parts = path.split("#");
        pathObj.branch = parts[0];
        pathObj.question = parts[1];
    } else {
        pathObj.branch = path;
    }

    return pathObj;
};
InquirerTree.prototype.handleRedirect = function(redirect) {
    if(redirect) {
        return this.navigateTree(redirect);
    } else {
        return null;
    }
};
InquirerTree.prototype.next = function(redirect) {
    var promptData;
    
    var done = false;
    var path = this.handleRedirect(redirect);

    if(path && path.question) {
        promptData = this.branch.prompts[this.index];

    } else if(this.index < this.branch.prompts.length) {
        this.index++;
        promptData = this.branch.prompts[this.index];        
    } else {
        done = true;
    }


    // Run the prompt or function
    if(promptData && typeof promptData === "function") {
        // Potential branch
        this.runFunctionStep(promptData);
    } else if(!done && promptData) {
        var prompt = this.resolvePrompt(promptData);

        this.path.question = prompt.name;

        // Resolve prompt
        var promise;
        if(prompt.type === "fromObject") {
            promise = inquirer.promptsToBuildObject(prompt.source, prompt.options);
        } else {
            promise = inquirer.prompt([prompt]);
        }
        return promise
            .then(answers => {
                var root;
                this.resolveAnswerRoot();

                // Resolve the root
                if(this.field) {
                    root = this.answerRoot[this.field];
                    if(!root) {
                        root = {};
                        this.answerRoot[this.field] = root;
                    }
                } else {
                    root = this.answerRoot;
                }

                // Apply the answers
                if(answers && answers[prompt.name]) {
                    root[prompt.name] = answers[prompt.name];

                } else if(this.branch.mergeAnswers) {
                    Object.assign(root, answers);
                } else {
                    root[prompt.name] = answers;
                }
                this.next();
            });
    } else {
        this.promiseResolve(this.answers);
    }
};

function promptRequiresChoices(prompt) {
    return (prompt.type === "expand" || prompt.type === "checkbox" || prompt.type === "list" || prompt.type === "rawList")
}

module.exports = InquirerTree;