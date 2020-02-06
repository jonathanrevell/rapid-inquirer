
function promptsToBuildObject(obj, options) {
    var answers;
    if(!options) {
        options = {};
    }
    var prompts = [];
    var keys = Object.keys(obj);
    var subObjects = [];

    var buildFieldPrompt = function(target, key, layerOptions) {
        var type, promptType;
        var skipKey = false;
        var val = target[key];
        if(val === undefined || val === null) {
            type = "string";    // No value defaults to string
            promptType = "input";

        } else if(val === String || typeof val === "string") {
            type = "string";
            promptType = "input";

        } else if(val === Number || typeof val === "number") {
            type = "number";
            promptType = "number";

        } else if(val === Boolean || val === true || val === false) {
            type = "boolean";
            promptType = "confirm";

        } else if(typeof val === "object" || val instanceof Object) {
            skipKey = true;
            subObjects.push({ key: key, obj: val });
        } else {
            type = "string";
            promptType = "input";
        }


        if(!skipKey && (!layerOptions.onlyEmptyFields || type === "boolean" || val === undefined || val === null || val === '')) {
            var p = {
                type: promptType,
                name: key,
                message: layerOptions.fieldPrefix ? `${layerOptions.fieldPrefix}.${key}: ` : `${key}: `
            };
            if(val !== undefined && val !== null && val !== "") {
                p.default = val;
            }
            prompts.push(p);
        }
    };


    keys.forEach(key => {
        buildFieldPrompt(obj, key, options);
    });
 
    return this.prompt(prompts)
        .then(results => {
            answers = results;
            return Promise.all(subObjects.map(sub => {
                return buildNestedObject.call(this, answers, sub.key, sub.obj, options);
            }));
        })
        .then(() => {
            return answers;
        });
}

function buildNestedObject(answers, key, nestedObj, options) {
    var fieldPrefix = options.fieldPrefix ? `${options.fieldPrefix} ${key}` : `${key} `;
    var nestedOptions = Object.assign({}, options, { fieldPrefix: fieldPrefix });
    return this.promptsToBuildObject(nestedObj, nestedOptions)
        .then(results => {
            answers[key] = results;
            return answers;
        });
}

module.exports = promptsToBuildObject;