const { exec } = require("child_process");

//
// Handle the web API route used to put the content of a sonar881 configuration
// to backing store.
// Pass the request to a python backend script, accepting the response
// through its stdout.
//
var postSonarSwitch = function(req, res) {
  var sonarParameters_raw = JSON.stringify(req.body);
  if (!sonarParameters_raw) {
    sonarParameters_raw = '{"deployment":{},"downwrd":{},"THREED":{}}'
  }
  const sonarParameters = sonarParameters_raw.replaceAll('"', '\\\"')
  console.log(`POST sonar switch ${sonarParameters}`);

  exec(`python sonar-switch.py ${sonarParameters}`, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      if (stdout) {
        console.log(`stdout: ${stdout}`);
      }
      errorResponse = JSON.parse(stdout);
      res.status(errorResponse.status).send(errorResponse.message)
    } else {
      console.log(`Sonar switch transacted:\n${stdout}`);
      res.set('Access-Control-Allow-Origin', '*');
      var response = {
        response: `Sonar switch command transacted`,
        status: 201
      };
      res.json(response);
    }
  });
}

module.exports = postSonarSwitch;

