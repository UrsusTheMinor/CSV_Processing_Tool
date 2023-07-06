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
        fs.readFile('stock.csv', 'utf8', (err, data) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    // File doesn't exist, create a new one
                    fs.writeFile('stock.csv', '', (err) => {
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

async function parseAndUpdateCSV(data) {
    const rows = data.trim().split('\n');
    const transformedRows = [];
    const stockData = new Map();

    const old_data = await fetchCSVData("stock.csv");
    // Add header row
    transformedRows.push('id,old_id,title,stock');



    // Process existing rows and update stock values
    if(old_data == '') {

        let id = 0;

        for (let i = 1; i < rows.length; i++) {
            const columns = rows[i].split(',');

            id = i - 1;
            const oldId = columns[0];
            const title = columns[11];
            const stock = columns[8];

            columns[8] = stockData.get(oldId) || stock;
            transformedRows.push(`${id},${oldId},${title}, ${stock}`);

            stockData.set(oldId, id);
        }

    } else {

        let ids = [];
        const old_rows = old_data.trim().split('\n');

        let id = 0;

        //hier lassen wir des alte csv durchlaufen, damit wir dann gleich das neue durchlaufen lassen können um die zugehörigen zeilen zu finden; wenn gefunden einfach stock replace, wenn nicht gefunden, stock 0; alle id's egal ob nicht gefunden oder gefunden in array schreiben, dann können wir überprüfen ob es neue zeilen gibt
        for (let i = 1; i < old_rows.length; i++) {

            //ok also hier lassen wir die neuen rows durchlaufen, von 0 bis row = "" oder die row die wir brauchen, falls das eintritt dann is halt stock 0, falls ned haben wir die row
            const columns = old_rows[i].split(',');
            id = i - 1;
            const oldId = columns[1];
            ids.push(oldId);
            const title = columns[2];

            let stock = 0;

            for(let j = 1; j < rows.length; j++) {

                const new_columns = rows[j].split(',');
                if(new_columns[0] == columns[1]) {
                    stock = new_columns[8];
                    break;
                }
            }


            transformedRows.push(`${id},${oldId},${title}, ${stock}`);
            stockData.set(oldId, id);
        }

        while(ids.length < (rows.length - 1)) {
            for(let i = 1; i < rows.length; i++) {
                const columns = rows[i].split(',');

                if(!ids.includes(columns[0])) {

                    id = id + 1;
                    const oldId = columns[0];
                    ids.push(oldId);
                    const title = columns[11];
                    const stock = columns[8];

                    transformedRows.push(`${id},${oldId},${title}, ${stock}`);
                    stockData.set(oldId, id);
                }
            }
        }
    }


    //     // Find new rows and add them
    //     let newRowsAdded = false;
    //     for (let i = 1; i < rows.length; i++) {
    //         const columns = rows[i].split(',');
    //         const oldId = columns[0];
    //
    //         if (!stockData.has(oldId)) {
    //             const id = transformedRows.length - 1;
    //             const title = columns[11];
    //             const stock = '0'; // Set stock to 0 for new rows
    //
    //             transformedRows.push(`${id},${oldId},${title},${stock}`);
    //             stockData.set(oldId, id);
    //
    //             newRowsAdded = true;
    //         }
    //     }
    //
    // }

    const transformedCSV = transformedRows.join('\n');

    fs.writeFile('stock.csv', transformedCSV, (err) => {
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

// Function to add key-value pair to a JSON file
function addToJsonFile(key, value) {
    let data = {};

    // Check if the JSON file exists
    if (fs.existsSync('config.json')) {
        // If it exists, read the file and parse its contents
        const fileData = fs.readFileSync('config.json');
        data = JSON.parse(fileData);
    }

    // Add the key-value pair to the data object
    data[key] = value;

    // Write the updated data object to the JSON file
    fs.writeFileSync('config.json', JSON.stringify(data));

    console.log(`Added key '${key}' with value '${value}' to config.json.`);
}

// Function to retrieve all key-value pairs from the JSON file
function getAllKeyValuePairs() {
    if (!fs.existsSync('config.json')) {
        console.log("config.json doesn't exist or has no value, please add value using: script.js <supplier> <link_to_file> ");
        return -1;
    }

    const fileData = fs.readFileSync('config.json');
    const data = JSON.parse(fileData);

    return new Map(Object.entries(data));
}

// Function to execute the script every hour
function executeScript() {

    displayformat();
    // Call the function to display the current date and time
    displayDateTime();
    const [command, key, value] = process.argv.slice(2);

    if(typeof command === "undefined") {

        console.log('Reading or creating the CSV file...');

        dict = getAllKeyValuePairs();

        if(dict === -1) {
            return -1;
        }

        for (const [key, value] of dict.entries()) {

            readOrCreateCSVFile()
                .then((data) => {
                    console.log('Fetching CSV data...');
                    // Check if a console parameter is provided
                    return fetchCSVData(value);
                })
                .then((data) => {
                    console.log('Parsing and updating CSV data...');
                    parseAndUpdateCSV(data);
                })
                .catch((err) => {
                    console.error('Error:', err);
                });

        }
    } else if (command === 'add') {
        if (key && value) {
            addToJsonFile(key, value);
            process.exit(0);
        } else {
            console.log('Invalid command. Usage: add <supplier> <link_to_file>');
            process.exit(-1);
        }
    } else if (command === 'retrieve') {
        console.log(getAllKeyValuePairs());
        process.exit(0);
    } else {
        readOrCreateCSVFile()
            .then((data) => {
                console.log('Fetching CSV data...');
                // Check if a console parameter is provided
                const consoleParam = process.argv[2];
                if (consoleParam) {
                    return fetchCSVData(consoleParam);
                } else {
                    console.log('Invalid command. Available commands: add, retrieve or file name');
                    process.exit(-1);
                }
            })
            .then((data) => {
                console.log('Parsing and updating CSV data...');
                parseAndUpdateCSV(data);
            })
            .catch((err) => {
                console.error('Error:', err);
            });

    }


}

// Initial script execution
executeScript();

// Execute the script every hour
const main = setInterval(executeScript, 60 * 60 * 1000);

process.on('SIGINT', onProgramExit);
process.on('SIGTERM', onProgramExit);


