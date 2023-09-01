import configuration from './configuration/configuration.json';
const baseBackendUrl = 'http://' + configuration.services.backend.host + ':' + configuration.services.backend.port;


const DistributeConfiguration = (configuration) => {
  document.getElementById("minutes").value = configuration.deployment.minutes;
  document.getElementById("pingdatapoints").value = configuration.deployment.pingdatapoints;
  document.getElementById("downwardsamplingtime").value = configuration.deployment.downwardsamplingtime;
  document.getElementById("scansamplingtime").value = configuration.deployment.scansamplingtime;

  document.getElementById("downwardrange").value = configuration.downward.range;
  document.getElementById("downwardfrequency").value = configuration.downward.frequency;
  document.getElementById("downwardlogf").value = configuration.downward.logf;
  document.getElementById("downwardstartgain").value = configuration.downward.startgain;
  document.getElementById("downwardtrainangle").value = configuration.downward.trainangle;
  document.getElementById("downwardsampleperiod").value = configuration.downward.sampleperiod;
  document.getElementById("downwardabsorption").value = configuration.downward.absorption;
  document.getElementById("downwardpulselength").value = configuration.downward.pulselength;

  document.getElementById("scanrange").value = configuration.scan.range;
  document.getElementById("scanfrequency").value = configuration.scan.frequency;
  document.getElementById("scanlogf").value = configuration.scan.logf;
  document.getElementById("scanstartgain").value = configuration.scan.startgain;
  document.getElementById("scansectorwidth").value = configuration.scan.sectorwidth;
  document.getElementById("scantrainangle").value = configuration.scan.trainangle;
  document.getElementById("scansampleperiod").value = configuration.scan.sampleperiod;
  document.getElementById("scanabsorption").value = configuration.scan.absorption;
  document.getElementById("scanpulselength").value = configuration.scan.pulselength;
}

var isValidInput = true;
const ValidateIntField = (fieldName, minValue, maxValue, increment=1) => {
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

  if (parsedInt % increment !== 0) {
    messages.value += `Invalid value ${parsedInt} in field ${fieldName}, must be a multiple of ${increment}\n`;
    isValidInput = false;
    return minValue;
  }

  return parsedInt;
}

const ValidateFloatField = (fieldName, minValue, maxValue, increment) => {
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

  const remainder = parsedFloat % increment;
  if (remainder > increment) {
    messages.value += `Invalid value ${parsedFloat} in field ${fieldName}, has remainder of ${remainder}, must be a multiple of ${increment}\n`;
    isValidInput = false;
    return minValue;
  }

  return parsedFloat;
}


const WriteConfiguration = (onDoneHandler) => {
  isValidInput = true;

  var deployment = {};
  deployment.minutes = ValidateIntField("minutes", 0, 59);
  deployment.pingdatapoints = ValidateIntField("pingdatapoints", 250, 500, 250);
  deployment.downwardsamplingtime = ValidateIntField("downwardsamplingtime", 0, 5000);
  deployment.scansamplingtime = ValidateIntField("scansamplingtime", 0, 5000);

  var downward = {};
  downward.range = ValidateIntField("downwardrange", 1, 6);
  downward.frequency = ValidateIntField("downwardfrequency", 0, 255);
  downward.logf = ValidateIntField("downwardlogf", 0, 255);
  downward.startgain = ValidateIntField("downwardstartgain", 0, 255);
  downward.trainangle = ValidateIntField("downwardtrainangle", -180.0, 180, 3);
  downward.sampleperiod = ValidateIntField("downwardsampleperiod", 1, 600);
  downward.absorption = ValidateIntField("downwardabsorption", 0, 255);
  downward.pulselength = ValidateIntField("downwardpulselength", 0, 255);

  var scan = {};
  scan.range = ValidateIntField("scanrange", 1, 6);
  scan.frequency = ValidateIntField("scanfrequency", 0, 255);
  scan.logf = ValidateIntField("scanlogf", 0, 255);
  scan.startgain = ValidateIntField("scanstartgain", 0, 255);
  scan.sectorwidth = ValidateIntField("scansectorwidth", 0, 360, 3);
  scan.trainangle = ValidateIntField("scantrainangle", -180.0, 180, 3);
  scan.sampleperiod = ValidateIntField("scansampleperiod", 1, 600);
  scan.absorption = ValidateIntField("scanabsorption", 0, 255);
  scan.pulselength = ValidateIntField("scanpulselength", 0, 255);

  const configuration = {"deployment": deployment, "downward": downward, "scan": scan};

  if (isValidInput) {
    PutConfiguration(configuration, onDoneHandler);
  }
}

const PutConfiguration = (configuration, onDoneHandler) => {
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
      onDoneHandler();
    });
}

const DeleteConfiguration = (onDoneHandler) => {
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
    onDoneHandler();
  });
}


export  { DistributeConfiguration, WriteConfiguration, DeleteConfiguration };
