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