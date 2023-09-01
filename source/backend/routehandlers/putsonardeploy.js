const fs = require('fs');
const { exec } = require("child_process");
var singleton = require('./inprogress');
const SonarDeploy = require("./sonardeploy");
const inprogress = singleton.getInstance();
const commonKey = singleton.getCommonKey();

const configurationPath = '/sonar/configuration/';

const onSonarError = (error) => {
    
}

const onSonarDone = (results) => {

}

//
// Handle the web API route used to trigger deployment with a sonar881 configuration.
// Pass the request to a python backend script, accepting the response
// through its stdout.
//
var putSonarDeploy = async function(req, res) {
  const { configurationName } = req.params;
  console.log(`PUT deploy ${configurationName}`);

  let configuration = {};
  const configurationFile = configurationPath + configurationName + '.json';
  console.log(`Loading configuration ${configurationFile}`);
  if (fs.existsSync(configurationFile)) {
      let rawConfiguration = fs.readFileSync(configurationFile);
      configuration = JSON.parse(rawConfiguration);
      console.log(`Loaded configuration file ${configurationFile}`);
  }
  console.log(`Configuration: ${JSON.stringify(configuration)}`);

  const controller = new AbortController();
  const { signal } = controller;
  inprogress[commonKey] = { controller, completed: false, progress: 0, status: "Sonar scan in progress", results: [] };

  let sonarDeploy = new SonarDeploy(configurationName, configuration);

  let nowDate = new Date();
  let nowMs = nowDate.getTime();
  let delayMs = configuration.deployment.minutes * 60 * 1000;
  let startTime = new Date(nowMs + delayMs);

  let now = new Date();
  while (now < startTime) {
    await new Promise(r => setTimeout(r, 5000));
    inprogress[commonKey].status = `Waiting until ${startTime} at ${now}`;
    now = new Date();
}

  /*
  exec(`python configuration-putter.py ${configurationName} ${configuration}`, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      inprogress[commonKey].status = `Sonar scan error for configuration '${configuration}'` + error.message;
      if (stdout) {
        console.log(`stdout: ${stdout}`);
      }
      errorResponse = JSON.parse(stdout);
      res.status(errorResponse.status).send(errorResponse.message)
    } else {
        inprogress[commonKey].status = stdout;
        console.log(`Configuration ${configurationName} saved:\n${stdout}`);
      res.set('Access-Control-Allow-Origin', '*');
      var response = {
        response: `Configuration ${configurationName} saved`,
        status: 201
      };
      res.json(response);
    }
    inprogress[commonKey].completed = true;
  });
  */

  var response = {
    response: `Started sonar deploy with configuration ${configuration}`,
    link: `${req.protocol}://${req.get('Host')}/deploy/progress`
  };
  res.json(response);
}


module.exports = putSonarDeploy;

