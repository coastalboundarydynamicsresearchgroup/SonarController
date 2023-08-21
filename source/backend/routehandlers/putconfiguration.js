const { exec } = require("child_process");

//
// Handle the web API route used to put the content of a sonar881 configuration
// to backing store.
// Pass the request to a python backend script, accepting the response
// through its stdout.
//
var putConfiguration = function(req, res) {
  const { configurationName } = req.params;
  var configuration_raw = JSON.stringify(req.body);
  if (!configuration_raw) {
    configuration_raw = '{"deployment":{},"downwrd":{},"THREED":{}}'
  }
  const configuration = configuration_raw.replaceAll('"', '\\\"')
  console.log(`PUT configuration ${configurationName}, ${configuration}`);

  exec(`python configuration-putter.py ${configurationName} ${configuration}`, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      if (stdout) {
        console.log(`stdout: ${stdout}`);
      }
      errorResponse = JSON.parse(stdout);
      res.status(errorResponse.status).send(errorResponse.message)
    } else {
      console.log(`Configuration ${configurationName} saved:\n${stdout}`);
      res.set('Access-Control-Allow-Origin', '*');
      var response = {
        response: `Configuration ${configurationName} saved`,
        status: 201
      };
      res.json(response);
    }
  });
}

module.exports = putConfiguration;

