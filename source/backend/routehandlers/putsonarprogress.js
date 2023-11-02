var singleton = require('./inprogress');

const inprogress = singleton.getInstance();
const commonKey = singleton.getCommonKey();

//
// Handle the web API route used to put the content of a sonar881 configuration
// to backing store.
// Pass the request to a python backend script, accepting the response
// through its stdout.
//
var putSonarProgress = function(req, res) {
  const { id } = req.params;
  console.log(`PUT progress for id '${id}'`);

  var progress = req.body;
  if (!progress) {
    progress = {"status":"bad update"};
  }
  console.log(`Progress object being merged: ${JSON.stringify(progress)}`);

  var key = id;
  if (id === 'deploy') {
    key = commonKey;
  }
  
  inprogress[key] = { ...inprogress[key], ...progress };

  res.set('Access-Control-Allow-Origin', '*');
  var response = {
    response: `Progress for '${id}' saved`,
    status: 201
  };
  res.json(response);
}

module.exports = putSonarProgress;

