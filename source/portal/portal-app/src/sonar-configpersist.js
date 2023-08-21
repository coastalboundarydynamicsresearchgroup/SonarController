import configuration from './configuration/configuration.json';
const baseBackendUrl = 'http://' + configuration.services.backend.host + ':' + configuration.services.backend.port;


const DistributeConfiguration = (configuration) => {
  document.getElementById("minutes").value = configuration.deployment.minutes;
  document.getElementById("pencilbeamcount").value = configuration.deployment.pencilbeamcount;
  document.getElementById("sampleperiod").value = configuration.deployment.sampleperiod;
  document.getElementById("beamdatapoints").value = configuration.deployment.beamdatapoints;
  document.getElementById("serialsendchoice").value = configuration.deployment.serialsendchoice;
  document.getElementById("azimuthincrement").value = configuration.deployment.azimuthincrement;
  document.getElementById("downwardsamplingtime").value = configuration.deployment.downwardsamplingtime;

  document.getElementById("downwardpencilbeamrange").value = configuration.downward.pencilbeamrange;
  document.getElementById("downwardfrequency").value = configuration.downward.frequency;
  document.getElementById("downwardpencilbeamlogf").value = configuration.downward.pencilbeamlogf;
  document.getElementById("downwardpencilbeamstartgain").value = configuration.downward.pencilbeamstartgain;
  document.getElementById("downwardpencilbeamabsorption").value = configuration.downward.pencilbeamabsorption;
  document.getElementById("downwardpencilbeampulselength").value = configuration.downward.pencilbeampulselength;

  document.getElementById("THREEDpencilbeamrange").value = configuration.THREED.pencilbeamrange;
  document.getElementById("THREEDfrequency").value = configuration.THREED.frequency;
  document.getElementById("THREEDpencilbeamlogf").value = configuration.THREED.pencilbeamlogf;
  document.getElementById("THREEDpencilbeamstartgain").value = configuration.THREED.pencilbeamstartgain;
  document.getElementById("THREEDpencilbeamabsorption").value = configuration.THREED.pencilbeamabsorption;
  document.getElementById("THREEDpencilbeampulselength").value = configuration.THREED.pencilbeampulselength;
  document.getElementById("THREEDmodechoice").value = configuration.THREED.modechoice;
}

var isValidInput = true;
const ValidateIntField = (fieldName, minValue, maxValue) => {
  const messages = document.getElementById('messages');

  const fieldValue = document.getElementById(fieldName).value;
  if (isNaN(fieldValue)) {
    messages.value += `Invalid value ${fieldValue} in field ${fieldName}, not a number\n`;
    isValidInput = false;
    return minValue;
  }

  const parsedInt = parseInt(fieldValue);
  if (parsedInt < minValue) {
    messages.value += `Invalid value ${parsedInt} in field ${fieldName}, must be >= ${minValue}\n`;
    isValidInput = false;
    return minValue;
  }

  if (parsedInt > maxValue) {
    messages.value += `Invalid value ${parsedInt} in field ${fieldName}, must be <= ${maxValue}\n`;
    isValidInput = false;
    return maxValue;
  }

  return parsedInt;
}

const ValidateFloatField = (fieldName, minValue, maxValue) => {
  const messages = document.getElementById('messages');

  const fieldValue = document.getElementById(fieldName).value;
  if (isNaN(fieldValue)) {
    messages.value += `Invalid value ${fieldValue} in field ${fieldName}, not a number\n`;
    isValidInput = false;
    return minValue;
  }
  const parsedFloat = parseFloat(fieldValue);

  if (parsedFloat < minValue) {
    messages.value += `Invalid value ${parsedFloat} in field ${fieldName}, must be >= ${minValue}\n`;
    isValidInput = false;
    return minValue;
  }

  if (parsedFloat > maxValue) {
    messages.value += `Invalid value ${parsedFloat} in field ${fieldName}, must be <= ${maxValue}\n`;
    isValidInput = false;
    return maxValue;
  }

  return parsedFloat;
}

const WriteConfiguration = () => {
  isValidInput = true;

  var deployment = {};
  deployment.minutes = ValidateIntField("minutes", 0, 59);
  deployment.pencilbeamcount = ValidateIntField("pencilbeamcount", 1, 10);
  deployment.sampleperiod = ValidateIntField("sampleperiod", 1, 10000);
  deployment.beamdatapoints = ValidateIntField("beamdatapoints", 1, 360);
  deployment.serialsendchoice = ValidateIntField("serialsendchoice", 0, 1);
  deployment.azimuthincrement = ValidateFloatField("azimuthincrement", 0.0, 180.0);
  deployment.downwardsamplingtime = ValidateIntField("downwardsamplingtime", 0, 5000);

  var downward = {};
  downward.pencilbeamrange = ValidateIntField("downwardpencilbeamrange", 1, 6);
  downward.frequency = ValidateIntField("downwardfrequency", 0, 255);
  downward.pencilbeamlogf = ValidateIntField("downwardpencilbeamlogf", 0, 255);
  downward.pencilbeamstartgain = ValidateIntField("downwardpencilbeamstartgain", 0, 255);
  downward.pencilbeamabsorption = ValidateIntField("downwardpencilbeamabsorption", 0, 255);
  downward.pencilbeampulselength = ValidateIntField("downwardpencilbeampulselength", 0, 255);

  var THREED = {};
  THREED.pencilbeamrange = ValidateIntField("THREEDpencilbeamrange", 1, 6);
  THREED.frequency = ValidateIntField("THREEDfrequency", 0, 255);
  THREED.pencilbeamlogf = ValidateIntField("THREEDpencilbeamlogf", 0, 255);
  THREED.pencilbeamstartgain = ValidateIntField("THREEDpencilbeamstartgain", 0, 255);
  THREED.pencilbeamabsorption = ValidateIntField("THREEDpencilbeamabsorption", 0, 255);
  THREED.pencilbeampulselength = ValidateIntField("THREEDpencilbeampulselength", 0, 255);
  THREED.modechoice = ValidateIntField("THREEDmodechoice", 0, 5);

  const configuration = {"deployment": deployment, "downward": downward, "THREED": THREED};

  if (isValidInput) {
    PutConfiguration(configuration);
  }
}

const PutConfiguration = (configuration) => {
    const messages = document.getElementById('messages');

    var init = {
      method: 'PUT',
      mode: 'cors',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify(configuration)
    };
    
    const configName = document.getElementById("newconfiguration").value;
    fetch(baseBackendUrl + '/configuration/' + configName, init)
    .then(data => data.json())
    .then(response => {
      if (response.status === 201) {
        messages.value += 'Wrote configuration with status ' + response.status + '\n';
      }
      else {
        messages.value += 'Error writing configuration with status ' + response.status + '\n';
      }
    });
}

const DeleteConfiguration = () => {
  const messages = document.getElementById('messages');

  var init = {
    method: 'DELETE',
    mode: 'cors',
    headers: {
      'Content-type': 'application/json'
    }
  };
  
  const configName = document.getElementById("newconfiguration").value;
  fetch(baseBackendUrl + '/configuration/' + configName, init)
  .then(data => data.json())
  .then(response => {
    if (response.status === 201) {
      messages.value += 'Deleted configuration with status ' + response.status + '\n';
    }
    else {
      messages.value += 'Error deleting configuration with status ' + response.status + '\n';
    }
  });
}


export  { DistributeConfiguration, WriteConfiguration, DeleteConfiguration };
