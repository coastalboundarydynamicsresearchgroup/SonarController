const { exec } = require("child_process");
var singleton = require('./inprogress');
const inprogress = singleton.getInstance();
const commonKey = singleton.getCommonKey();

//
// Handle the web API route used to request all sonar881 configurations.
// Pass the request to a python backend script, accepting the response
// through its stdout.
//
var getDataset = function(req, res) {
  console.log(`GET zipped dataset`);

  inprogress[commonKey].status = `Archiving sonar data in zip file . . .`;
  exec(`python zipdataset.py`, (error, stdout, stderr) => {
    if (error) {
      inprogress[commonKey].status = `Error archiving sonar data: ${error.message}`;
      console.log(`error: ${error.message}`);
      if (stderr) {
        console.log(`stderr: ${stderr}`);
      }
      res.status(error.code).send(error.message)
    } else {
      const response = JSON.parse(stdout);
      inprogress[commonKey].status = `Sonar data in zipped in file ${response.filename}`;
      console.log(`Dataset zipped: ${stdout}`);
      res.set('Access-Control-Allow-Origin', '*');
      res.json(response);
    }
  });
}

module.exports = getDataset;
