const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const cors = require("cors"); // enforce CORS, will be set to frontend URL when deployed

const fs = require('fs');

const getConfigurations = require('./routehandlers/getconfigurations');
const putconfiguration = require('./routehandlers/putconfiguration');
const getconfiguration = require('./routehandlers/getconfiguration');
const deleteconfiguration = require('./routehandlers/deleteconfiguration');
const postSonarSwitch = require('./routehandlers/postsonarswitch');
const {putSonarDeploy, putSonarUndeploy} = require('./routehandlers/putsonardeploy');
const getDeployProgress = require('./routehandlers/getdeployprogress');
const putSonarProgress = require('./routehandlers/putsonarprogress');


let rawdata = fs.readFileSync('/configuration/configuration.json');
configuration = JSON.parse(rawdata);
console.log(configuration);

const app = express();
app.use(cors());

const router = express.Router();

// Get the list of configurations that currently exist.
router.get('/configurations', [getConfigurations]);

// Put the content of the specified configuration under the specified name.
router.put('/configuration/:configurationName', [putconfiguration]);

// Get the content of the specified configuration under the specified name.
router.get('/configuration/:configurationName', [getconfiguration]);

// Delete the content of the specified configuration under the specified name.
router.delete('/configuration/:configurationName', [deleteconfiguration]);

// Put the content of the specified configuration under the specified name.
router.post('/sonar/switch', [postSonarSwitch]);

// Put the command to deploy with the specified configuration.
router.put('/sonar/deploy/:configurationName', [putSonarDeploy]);

// Put the command to undeploy any previously deployed configuration.
router.put('/sonar/undeploy', [putSonarUndeploy]);

// Get the deploy progress.
router.get('/sonar/deploy/progress', [getDeployProgress]);

// Put progress from the deployment or other backend process.
router.put('/sonar/progress/:id', [putSonarProgress]);


var server = http.createServer(app);
const PORT = 5000;
app.use(bodyParser.json());
app.use('/', router);
app.use(express.static('public'));

server.listen(PORT, () => console.log(`Server running on port http://model-packager:${PORT}`));
