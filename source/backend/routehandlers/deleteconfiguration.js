const { exec } = require("child_process");

//
// Handle the web API route used to request all sonar881 configurations.
// Pass the request to a python backend script, accepting the response
// through its stdout.
//
var deleteConfigurations = function(req, res) {
  const { configurationName } = req.params;
  console.log(`DELETE configuration ${configurationName}`);

  exec(`python configuration-deleter.py ${configurationName}`, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      if (stdout) {
        console.log(`stdout: ${stdout}`);
      }
      errorResponse = JSON.parse(stdout);
      res.status(errorResponse.status).send(errorResponse.message)
    } else {
      console.log(`Configuration ${configurationName} deletecd:\n${stdout}`);
      res.set('Access-Control-Allow-Origin', '*');
      var response = {
        response: `Configuration ${configurationName} deleted`,
        status: 201
      };
      res.json(response);
    }
  });
}

module.exports = deleteConfigurations;
