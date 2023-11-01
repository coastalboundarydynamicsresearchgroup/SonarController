var singleton = require('./inprogress');

const inprogress = singleton.getInstance();
const commonKey = singleton.getCommonKey();

var getDeployProgress = function(req, res) {
  var response = {
  };

  const progress = inprogress[commonKey];
  if (progress) {
    response = progress;
  } else {
    response.status = "No deploy in progress";
    response.completed = true;
  }
  response.link = `${req.protocol}://${req.get('Host')}/sonar/deploy/progress`

  res.set('Access-Control-Allow-Origin', '*');
  res.json(response);
}

module.exports = getDeployProgress;
