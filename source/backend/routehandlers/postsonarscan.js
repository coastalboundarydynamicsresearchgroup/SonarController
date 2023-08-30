const { exec } = require("child_process");

var singleton = require('./inprogress');
const inprogress = singleton.getInstance();
const commonKey = singleton.getCommonKey();

var postSonarScan = function(req, res) {
  const { configuration } = req.params;
  if (!configuration) {
    res.status(400).send({ error: 'Required configuration parameter not supplied'});
    return;
  }
  console.log(`POST sonar scan, configuration ${configuration}`);

  var expansion_raw = JSON.stringify(req.body);
  if (!expansion_raw) {
    expansion_raw = '{"neuroncount":0,"synapses":[]}'
  }
  expansion = expansion_raw.replaceAll('"', '\\\"');
  console.log(`Expansion: '${expansion_raw}'`);

  const controller = new AbortController();
  const { signal } = controller;
  inprogress[commonKey] = { controller, completed: false, progress: 0, status: "Sonar scan in progress", results: [] };

  exec(`python sonar-scan-poster.py ${configuration}`, { signal }, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      inprogress[commonKey].status = `Sonar scan error for configuration '${configuration}'` + error.message;
      if (stderr) {
        console.log(`stderr: ${stderr}`);
      }
      console.log(stdout);
    } else {
      inprogress[commonKey].status = stdout;
      console.log(stdout);
    }
    inprogress[commonKey].completed = true;
  });


  //const progressPerPolicy = Math.round(100 / req.body.length);
  //setTimeout(package, 100, expansionId, modelName, progressPerPolicy, req.body);
  
  var response = {
    response: `Started sonar scan with configuration ${configuration}`,
    link: `${req.protocol}://${req.get('Host')}/expansion/progress/${expansionId}`
  };
  res.json(response);
}

module.exports = postSonarScan;
