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

const waitStep = (delay, startTime, onDone) => {
  let now = new Date();
  if (now >= startTime) {
    inprogress[commonKey].status = `Completed pre-deploy delay at ${now}`;
    inprogress[commonKey].completed = true;
    onDone();
    return;
  }

  inprogress[commonKey].status = `Waiting until ${startTime} at ${now}`;
  setTimeout(() => waitStep(delay, startTime, onDone), delay);
}

const scanStep = (sonarDeploy, period, count, onDone) => {
  inprogress[commonKey].status = `Scan(${sonarDeploy.configurationName}) ${count} for ${period} seconds`;
  sonarDeploy.doSonarScan((message) => {
    inprogress[commonKey].status = `Error during scan(${sonarDeploy.configurationName}): ${message}`;
  },
  (response) => {
    inprogress[commonKey].status = `Scan(${sonarDeploy.configurationName}) ${count} completed with ${response.count} steps`;
  });

  if (count > 0) {
    setTimeout(() => scanStep(sonarDeploy, period, count-1, onDone), period);
  }
  else {
    onDone();
  }
}

const downwardStep = (sonarDeploy, period, count, onDone) => {
  inprogress[commonKey].status = `Downward(${sonarDeploy.configurationName}) ${count} for ${period} seconds`;
  sonarDeploy.doSonarStep((message) => {
    inprogress[commonKey].status = `Error during downward(${sonarDeploy.configurationName}): ${message}`;
  },
  (response) => {
    inprogress[commonKey].status = `Downward(${sonarDeploy.configurationName}) ${count} completed with ${response.count} steps`;
  });

  if (count > 0) {
    setTimeout(() => downwardStep(sonarDeploy, period, count-1, onDone), period);
  }
  else {
    onDone();
  }
}

const composeStep = (downwardSamplingTime, downwardSamplePeriod, scanSamplingTime, scanSamplePeriod, sonarDeploy, onDone) => {
  let downwardCount = 0;
  if (downwardSamplingTime > 0 && downwardSamplePeriod > 0) {
    downwardCount = Math.ceil(downwardSamplingTime / downwardSamplePeriod);
  }

  let scanCount = 0;
  if (scanSamplingTime > 0 && scanSamplePeriod > 0) {
    scanCount = Math.ceil(scanSamplingTime / scanSamplePeriod);
  }

  if (scanCount > 0) {
    inprogress[commonKey].status = `"Starting scan"(${sonarDeploy.configurationName}) with ${scanCount} steps of ${scanSamplePeriod} seconds`;
    scanStep(sonarDeploy, scanSamplePeriod, scanCount, () => {
      if (downwardCount > 0) {
        inprogress[commonKey].status = `"Starting downward"(${sonarDeploy.configurationName}) with ${downwardCount} steps of ${downwardSamplePeriod} seconds`;
        downwardStep(sonarDeploy, downwardSamplePeriod, downwardCount, () => {
          setTimeout(() => composeStep(downwardSamplingTime, downwardSamplePeriod, scanSamplingTime, scanSamplePeriod, sonarDeploy, onDone), 500);
        });
      }
    });
  }
}

const doSonarDeploy = (configuration, sonarDeploy, onDone) => {
  let nowDate = new Date();
  let nowMs = nowDate.getTime();
  let delayMs = configuration.deployment.minutes * 60 * 1000;
  let startTime = new Date(nowMs + delayMs);

  const downwardSamplingTime = configuration.deployment.downnwardsamplingtime;
  const downwardSamplePeriod = configuration.downward.sampleperiod;
  const scanSamplingTime = configuration.deployment.scansamplingtime;
  const scanSamplePeriod = configuration.scan.sampleperiod;

  waitStep(1000, startTime, () => {
    composeStep(downwardSamplingTime, downwardSamplePeriod, scanSamplingTime, scanSamplePeriod, sonarDeploy, onDone);
  });
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

  setTimeout(() => doSonarDeploy(configuration, sonarDeploy, () => {
    inprogress[commonKey].status = `Deploy of sonar scan done`;
  }), 500);

  var response = {
    response: `Started sonar deploy with configuration ${configurationName}`,
    link: `${req.protocol}://${req.get('Host')}/sonar/deploy/progress`,
    status: 201
  };
  res.json(response);
}


module.exports = putSonarDeploy;

