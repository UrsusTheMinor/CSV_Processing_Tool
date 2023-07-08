const fs = require('fs');
const https = require('https');

function displayDateTime() {
    var currentDateTime = new Date();
    var currentDate = currentDateTime.toDateString();
    var currentTime = currentDateTime.toLocaleTimeString();

    console.log("Executed at: " + currentDate + ", " + currentTime);
}

function displayformat() {
    console.log("\n\n");
}

// Function to fetch the CSV data
function fetchCSVData(source) {
    return new Promise((resolve, reject) => {
        if (source.startsWith('http://') || source.startsWith('https://')) {
            // Fetch data from the link
            https.get(source, (response) => {
                let data = '';

                response.on('data', (chunk) => {
                    data += chunk;
                });

                response.on('end', () => {
                    resolve(data);
                });
            }).on('error', (error) => {
                reject(error);
            });
        } else {
            // Read data from the file
            fs.readFile(source, 'utf8', (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        }
    });
}

// Function to read existing CSV data or create a new file if it doesn't exist
function readOrCreateCSVFile() {
    return new Promise((resolve, reject) => {
        fs.readFile(getJson("config.json").get("output_file_name"), 'utf8', (err, data) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    // File doesn't exist, create a new one
                    fs.writeFile(getJson("config.json").get("output_file_name"), '', (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve('');
                        }
                    });
                } else {
                    reject(err);
                }
            } else {
                resolve(data);
            }
        });
    });
}

// Function to parse CSV data and update the stock values

async function parseAndUpdateCSV(data, name) {
    const rows = data.trim().split('\n');
    const transformedRows = [];
    const stockData = new Map();

    const config = getJson("config.json");
    const valuedata = getJson("data.json");

    const old_data = await fetchCSVData(getJson("config.json").get("output_file_name"));
    const oldrowstemp = old_data.trim().split('\n');



    titles = config.get("titles");

    // Add header row
    transformedRows.push(titles.join(','));



    // Process existing rows and update stock values
    if(old_data == '') {

        let id = 0;

        for (let i = 1; i < rows.length; i++) {
            const columns = rows[i].split(',');

            id = i - 1;

            let values = [];
            for(let j = 1; j < valuedata.get(name).length; j++) {

                values.push(columns[valuedata.get(name)[j]]);
            }

            values[0] = name + "_" + values[0];


            stockData.set(values[0], id);

            values = values.join(",");


            transformedRows.push(`${id},${values}`);



        }

    } else {



        let t = 1;

        while (oldrowstemp.length > t && !(oldrowstemp[t].split(',')[1].startsWith(name)))  {
            transformedRows.push(oldrowstemp[t]);
            t = t + 1;
        }

        let ids = [];
        const old_rows = old_data.trim().split('\n');

        let id = 0;

        //hier lassen wir des alte csv durchlaufen, damit wir dann gleich das neue durchlaufen lassen können um die zugehörigen zeilen zu finden; wenn gefunden einfach stock replace, wenn nicht gefunden, stock 0; alle id's egal ob nicht gefunden oder gefunden in array schreiben, dann können wir überprüfen ob es neue zeilen gibt
        for (let i = 1; i < old_rows.length; i++) {

            //ok also hier lassen wir die neuen rows durchlaufen, von 0 bis row = "" oder die row die wir brauchen, falls das eintritt dann is halt stock 0, falls ned haben wir die row
            const columns = old_rows[i].split(',');
            id = i - 1;
            const primary = columns[1];
            ids.push(primary);

            if(columns[1].startsWith(name)) {

                let always_update = 0;


                //hier ändern weil er nicht lang genug sucht
                for (let j = 1; j < (old_rows.length - 1); j++) {


                    const new_columns = rows[j % rows.length].split(',');


                    if (( /* primary old -> */ columns[1].endsWith(new_columns[valuedata.get(name)[1]])) /* <- primary new */ && columns[1].startsWith(name)) {
                        always_update = new_columns[valuedata.get(name)[2]];
                        break;
                    }
                }

                let values = [];


                if (valuedata.get(name).length > 3) {
                    for (let j = 3; j <= (valuedata.get(name).length - 1); j++) {
                        values.push(columns[j]);

                    }
                }

                values = values.join(",");


                transformedRows.push(`${id},${primary},${always_update},${values}`);
                stockData.set(primary, id);
            }
        }

            let new_elements = 0;

            for(let i = 1; i < rows.length; i++) {
                const columns = rows[i].split(',');

                if(!ids.includes(name + "_" + columns[valuedata.get(name)[1]])) {

                    id = id + 1;
                    const primary = name + "_" + columns[valuedata.get(name)[1]];
                    ids.push(primary);
                    const always_update = columns[valuedata.get(name)[2]];

                    let values = [];

                    if(valuedata.get(name).length > 3) {
                        for(let j = 3; j <= valuedata.get(name).length; j++) {
                            values.push(columns[valuedata.get(name)[j]]);
                        }
                    }

                    values = values.join(",");

                    transformedRows.push(`${id},${primary},${always_update},${values}`);
                    stockData.set(primary, id);
                }
            }

            t++;
            if(oldrowstemp >= t) {
                while ((oldrowstemp.length) >= t && !(oldrowstemp[t].split(',')[1].startsWith(name))) {
                    transformedRows.push(oldrowstemp[t]);
                    t = t + 1;
                }
            }
    }



    const transformedCSV = transformedRows.join('\n');

    fs.writeFile(getJson("config.json").get("output_file_name"), transformedCSV, (err) => {
        if (err) {
            console.error('Error writing CSV file:', err);
        } else {
            console.log('CSV file successfully updated!');
        }
    });
}

function onProgramExit() {
    displayformat();
    displayDateTime();
    console.log("This process is terminating... goodbye");
    clearInterval(main);
    process.exit(0);
}

// Function to add key-value pairs to a JSON file
function addToJsonFile(key, values) {
    let data = {};

    // Check if the JSON file exists
    if (fs.existsSync('data.json')) {
        // If it exists, read the file and parse its contents
        const fileData = fs.readFileSync('data.json');
        data = JSON.parse(fileData);
    }

    // Check if the key already exists in the data object
    if (data.hasOwnProperty(key)) {
        // If it exists, append the new values to the existing array
        data[key] = data[key].concat(values);
    } else {
        // If it doesn't exist, create a new array with the values
        data[key] = values;
    }

    // Write the updated data object to the JSON file
    fs.writeFileSync('data.json', JSON.stringify(data));

    console.log(`Added values '${values.join(", ")}' to the key '${key}' in data.json.`);
}

// Function to add key-value pairs to a JSON file
function editconfig(key, values) {
    let data = {};

    // Check if the JSON file exists
    if (fs.existsSync('config.json')) {
        // If it exists, read the file and parse its contents
        const fileData = fs.readFileSync('config.json');
        data = JSON.parse(fileData);
    } else {

    }

    data[key] = values;

    // Write the updated data object to the JSON file
    fs.writeFileSync('config.json', JSON.stringify(data));


    console.log(`Updated '${key}'...`);
    return 0;
}



// Function to retrieve all key-value pairs from the JSON file
function getJson(path) {
    if (!fs.existsSync(path)) {
        console.log(`${path} doesn't exist or has no value`);
        return -1;
    }

    const fileData = fs.readFileSync(path);
    const data = JSON.parse(fileData);

    return new Map(Object.entries(data));
}

function deleteKeyFromJSON(filename, key) {
    try {
        const jsonString = fs.readFileSync(filename, 'utf8');
        const json = JSON.parse(jsonString);

        if (json.hasOwnProperty(key)) {
            delete json[key];
            const updatedJsonString = JSON.stringify(json, null, 2);
            fs.writeFileSync(filename, updatedJsonString, 'utf8');
            console.log(`Key "${key}" deleted from JSON file`);
            process.exit(0);
        } else {
            console.log(`Key "${key}" not found in JSON`);
            process.exit(-1);
        }
    } catch (error) {
        console.log("Not found");
    }
}


// Function to execute the script every hour
function executeScript() {
    displayformat();
    // Call the function to display the current date and time
    displayDateTime();

    if (!fs.existsSync('config.json')) {
        editconfig("titles", ["id", "primary", "updating", "else"]);
        editconfig("output_file_name", "output.csv");
    }



    const [command, ...args] = process.argv.slice(2);

    if (typeof command === "undefined") {
        if (!fs.existsSync('data.json')) {
            console.log("Setup required: https://github.com/UrsusTheMinor/CSV_Processing_Tool");
            process.exit(-1);
        }

        console.log("Reading or creating the CSV file...");

        const dict = getJson("data.json");

        if (dict === -1) {
            return -1;
        }


        for (const [key, values] of dict.entries()) {
            readOrCreateCSVFile()
                .then((data) => {
                    console.log("Fetching CSV data...");
                    // Check if a console parameter is provided
                    return fetchCSVData(values[0]);
                })
                .then((data) => {
                    console.log("Parsing and updating CSV data...");
                    parseAndUpdateCSV(data, key);
                })
                .catch((err) => {
                    console.error("Error:", err);
                });
        }
    } else if (command === "add") {
        if (args.length >= 3) {
            const key = args[0];
            const values = args.slice(1);
            addToJsonFile(key, values);
            process.exit(0);
        } else {
            console.log("Invalid command. Usage: add <key> <value1> <value2> ...");
            process.exit(-1);
        }
    } else if (command === "retrieve") {
        console.log(getJson("data.json"));
        process.exit(0);
    } else if (command === "remove" || command === "delete") {

        const key = args[0];

        deleteKeyFromJSON("data.json", key);

    } else if (command === "config") {
        const cmd = new Map();

        //-2 = muss weniger -1 = kann weniger oder gleich 0 = muss so viele args haben 1 = kann gleich viel oder mehr 2 = muss mehr
        cmd.set("titles", 2);
        cmd.set("output_file_name", 1);



        if(!cmd.has(args[0])) {
            console.log("Invalid config command!")
            process.exit(-1);
        }

        if (args.length > 2) {
            if(!(cmd.get(args[0]) >= 2)) {
                console.log("To few arguments!")
                process.exit(-1);
            }
            const key = args[0];
            const values = args.slice(1);
            editconfig(key, values);
            process.exit(0);
        } else if(args.length == 2) {
            if(!(cmd.get(args[0]) == 1)) {
                console.log("Invalid arguments!")
                process.exit(-1);
            }
            const key = args[0];
            const value = args[1];
            editconfig(key, value)
            process.exit(-1);
        }else {
            console.log("Invalid command. Usage: config <setting> <value1> <value2> ...");
            process.exit(-1);
        }
    }else {

        console.log(Error);
        process.exit(-1);

    }
}


// Initial script execution
executeScript();

// Execute the script every hour
const main = setInterval(executeScript, 60 * 60 * 1000);

process.on('SIGINT', onProgramExit);
process.on('SIGTERM', onProgramExit);


