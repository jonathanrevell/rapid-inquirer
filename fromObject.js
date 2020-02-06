
function promptsToBuildObject(obj, options) {
    if(!options) {
        options = {};
    }
    var prompts = [];
    var keys = Object.keys(obj);

    keys.forEach(key => {
        var type, promptType;
        var val = obj[key];
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

        } else {
            type = "string";
            promptType = "input";
        }


        if(!options.onlyEmptyFields || type === "boolean" || val === undefined || val === null || val === '') {
            var p = {
                type: promptType,
                name: key,
                message: options.fieldPrefix ? `${options.fieldPrefix}.${key}: ` : `${key}: `
            };
            if(val !== undefined && val !== null && val !== "") {
                p.default = val;
            }
            prompts.push(p);
        }
    });
 
    return this.prompt(prompts)
        .then(answers => {
            return answers;
        });
}

module.exports = promptsToBuildObject;