import configuration from './configuration/configuration.json';
const baseBackendUrl = 'http://' + configuration.services.backend.host + ':' + configuration.services.backend.port;


const DistributeSwitchResponse = (response, test) => {
  // These DOM elements will not be defined when not in test mode.
  if (!test) {
    console.log(`DistributeSwitchResponse called while not in test mode`);
    return;
  }
  
  console.log(JSON.stringify(response.response));
  document.getElementById("resp_header").value = response.response.header;
  document.getElementById("resp_headid").value = response.response.headid;

  document.getElementById("resp_serial_V5").value = response.response.serialstatus & 1 ? "V5" : "Pre-V5";
  document.getElementById("resp_serial_switches").value = response.response.serialstatus & 64 ? "True" : "False";
  document.getElementById("resp_serial_overrun").value = response.response.serialstatus & 128 ? "True" : "False";
  document.getElementById("resp_headpos").value = response.response.headpos;

  document.getElementById("resp_headrange").value = response.response.range;
  document.getElementById("resp_profilerange").value = response.response.profilerange;
  document.getElementById("resp_bytecount").value = response.response.databytes;
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

const SendSwitchCommand = (test, onDoneHandler) => {
  // These DOM elements will not be defined when not in test mode.
  if (!test) {
    console.log(`SendSwitchCommand called while not in test mode`);
    return;
  }
  
  isValidInput = true;

  var switchParameters = {};
  switchParameters.range = ValidateIntField("range", 1, 200);
  switchParameters.gain = ValidateIntField("gain", 0, 40);
  switchParameters.logf = ValidateIntField("logf", 10, 40, 10);
  switchParameters.absorption = ValidateFloatField("absorption", 0.0, 2.55, 0.01);
  switchParameters.train_angle = ValidateIntField("train_angle", -180.0, 180, 3);
  switchParameters.step_size = ValidateFloatField("step_size", 0.0, 2.4, 0.3);
  switchParameters.pulse_length = ValidateIntField("pulse_length", 10, 1000, 10);
  switchParameters.data_points = ValidateIntField("data_points", 250, 500, 250);
  switchParameters.profile = ValidateIntField("profile", 0, 1);
  switchParameters.frequency = ValidateIntField("frequency", 175, 1175, 5);

  if (isValidInput) {
    GetSwitchResponse(switchParameters, test, onDoneHandler);
  }
}

const GetSwitchResponse = (switchParameters, test, onDoneHandler) => {
    const messages = document.getElementById('messages');

    var init = {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify(switchParameters)
    };
    
    fetch(baseBackendUrl + '/sonar/switch', init)
    .then(data => data.json())
    .then(response => {
      if (response.status === 201) {
        messages.value += 'Sent switch command with status ' + response.status + '\n';
        DistributeSwitchResponse(response, test);
        onDoneHandler(response.response.data);
      }
      else {
        messages.value += 'Error sending switch command with status ' + response.status + '\n';
        onDoneHandler();
      }
    });
}


export default SendSwitchCommand;
