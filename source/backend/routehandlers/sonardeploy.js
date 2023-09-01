const fs = require('fs');
const { exec } = require("child_process");

const dataPathRoot = '/sonar/data/';

class SonarDeploy {
    constructor(configurationName, configuration) {
        this.configurationName = configurationName;
        this.configuration = configuration;

        if (!fs.existsSync(dataPathRoot)) {
            fs.mkdirSync(dataPathRoot);
        }

        const date = new Date().toJSON();
        this.sonarFilePath = dataPathRoot + date + '/';
        fs.mkdirSync(this.sonarFilePath);

        this.configuration.name = this.configurationName;
        let jsonConfiguration = JSON.stringify(this.configuration);
        fs.writeFileSync(this.sonarFilePath + 'configuration.json', jsonConfiguration);
    }

    doSonarStep(onError, onDone) {
        const parameters = buildSonarStepParameters();
        var sonarParameters_raw = JSON.stringify(parameters);
        const sonarParameters = sonarParameters_raw.replaceAll('"', '\\\"')
      
        exec(`python sonar-switch.py ${sonarParameters} ${this.sonarFilePath + 'sonar.dat'}`, (error, stdout, stderr) => {
          if (error) {
            console.log(`error: ${error.message}`);
            if (stdout) {
              console.log(`stdout: ${stdout}`);
            }
            onError(error.message);
          } else {
            console.log(`Sonar switch transacted:\n${stdout}`);
            var response = {
                response: JSON.parse(stdout),
                configuration: this.configurationName,
                count: 1
            };
            onDone(response);
          }
        });
    }

    doSonarScan(onError, onDone) {
        const parameters = buildSonarStepParameters();
        var sonarParameters_raw = JSON.stringify(parameters);
        const sonarParameters = sonarParameters_raw.replaceAll('"', '\\\"')
      
        const step_count = int(parameters.sector_width / parameters.step_size) + 1;

        exec(`python sonar-switch.py ${sonarParameters} ${this.sonarFilePath + 'sonar.dat'} ${step_count}`, (error, stdout, stderr) => {
          if (error) {
            console.log(`error: ${error.message}`);
            if (stdout) {
              console.log(`stdout: ${stdout}`);
            }
            onError(error.message);
          } else {
            console.log(`Sonar switch ${step_count} times`);
            var response = {
                configuration: this.configurationName,
                count: step_count
            };
            onDone(response);
          }
        });
    }

    buildSonarStepParameters() {
        // TODO find or compute these values
        const range = 1;
        const gain = 30;
        const logf = 20;
        const absorption = 0.6;
        const sector_width = 90;
        const train_angle = 0;
        const step_size = 1.2;
        const pulse_length = 200;
        const data_points = 500;
        const profile = 0;
        const calibrate = 0;
        const frequency = 1000;
        
        let parameters = {
            range: range,
            gain: gain,
            logf: logf,
            absorption: absorption,
            sector_width: sector_width,
            train_angle: train_angle,
            step_size: step_size,
            pulse_length: pulse_length,
            data_points: data_points,
            profile: profile,
            calibrate: calibrate,
            frequency: frequency
        };

        return parameters;
    }
}

module.exports = SonarDeploy;
