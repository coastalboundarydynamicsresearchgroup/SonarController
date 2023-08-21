const { exec } = require("child_process");

//
// Handle the web API route used to request all sonar881 configurations.
// Pass the request to a python backend script, accepting the response
// through its stdout.
//
var getConfiguration = function(req, res) {
  const { configurationName } = req.params;
  console.log(`GET configuration ${configurationName}`);

  exec(`python configuration-getter.py ${configurationName}`, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      if (stderr) {
        console.log(`stderr: ${stderr}`);
      }
      res.status(error.code).send(error.message)
    } else {
      console.log(`Read configuration: ${stdout}`);
      res.set('Access-Control-Allow-Origin', '*');
      res.json(JSON.parse(stdout));
    }
  });
}

module.exports = getConfiguration;
