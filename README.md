# rapid-inquirer
Streamline extension for inquirer to have less overhead

# promptsToBuildObject

# startTree


## Question tree example

    var tree = {
        prompts: [
            { make: "What is the make of your vehicle?" },
            { age: "How old are you?", type: "number" },
            { household: "List the first names of people in your household (space-separated)" },
            { vehicleType: "What type of vehicle do you have?", choices: ["truck", "sedan", "van"] },
            { driver: "Who normally drives this car?", choices: "{{answers.firstName}} {{answers.household}}"},
            (answers, next) => {
                if(answers.vehicleType === "truck") {
                    next({ path: "truck" });
                } else if(answers.vehicleType === "van") {
                    next("other");
                } else {
                    next("other#shift");
                }
            }
        ],
        branches: {
            truck: {
                prompts: [
                    { towing: "Can your {{answers.make}} tow?", type: "confirm" }
                ]
            },
            other: {
                prompts: [
                    { seats: "How many seats does your {{answers.make}} have?", type: "number" },
                    { shift: "Manual or automatic?", choices: ["manual", "automatic"] }
                ]
            }
        }
    };

module.exports = tree;

## branch.mergeAnswers

Merge the answers for this branch onto the parent answer branch. This will cause the branch name not to be applied to the answers for this branch, but if you have a field name it will still apply.

Merge answers it recursive, so if you have the following pattern of branches nested:

    A > B > C

And C and B both specify mergeAnswers, then their answers will be applied directly to A.

This can be useful in cases where you might have complex branching in your questions, but you want to create a more flat answer tree output.

Let's say you had branches for customizing the color of leather in a branch of "Interior" > "Upholstery" > "Leather Options" for your car. If you don't use mergeAnswers you would end up with something like this:

    {
        interior: {
            upholsteryType: "leather",
            upholstery: {
                leatherOptions: {
                    upholsteryColor: "black"
                }
            }
        }
    }

In some cases that might be the desired result. In other cases you may wish to flatten it into something more like this:

    {
        upholsteryType: "leather",
        upholsteryColor: "black"
    }


## options.answers

Build on previous answers by setting them as the base-level answers in the tree

## Backreferences & Message Variables

Prompt messages and options can refer to previously entered answers. If you provide a comma-separated or space-separated list as a string, it can be used as the "choices" option for a prompt.
