var singleton = require('./inprogress');

const inprogress = singleton.getInstance();
const commonKey = singleton.getCommonKey();

var getDeployProgress = function(req, res) {
  var response = {
    link: `${req.protocol}://${req.get('Host')}/sonar/deploy/progress`
  };
  const progress = inprogress[commonKey];
  if (progress) {
    response.status = progress.status;
    response.completed = progress.completed;
  } else {
    response.status = "No deploy in progress";
    response.completed = true;
  }

  res.set('Access-Control-Allow-Origin', '*');
  res.json(response);
}

module.exports = getDeployProgress;
