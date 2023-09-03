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
      const parameters = this.buildSonarDownwardStepParameters();
      var sonarParameters_raw = JSON.stringify(parameters);
      const sonarParameters = sonarParameters_raw.replaceAll('"', '\\\"')
    
      exec(`python sonarswitch.py ${sonarParameters} ${this.sonarFilePath + 'sonar.dat'}`, (error, stdout, stderr) => {
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
      const parameters = this.buildSonarScanStepParameters();
      var sonarParameters_raw = JSON.stringify(parameters);
      const sonarParameters = sonarParameters_raw.replaceAll('"', '\\\"')
    
      const step_count = int(parameters.sector_width / parameters.step_size) + 1;

      exec(`python sonarswitch.py ${sonarParameters} ${this.sonarFilePath + 'sonar.dat'} ${step_count}`, (error, stdout, stderr) => {
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

    buildSonarDownwardStepParameters() {
      // As configured.
      const range = this.configuration.downward.range;
      const logf = this.configuration.downward.logf;
      const absorption = this.configuration.downward.absorption;
      const pulse_length = this.configuration.downward.pulselength;
      const train_angle = this.configuration.downward.trainangle;
      const frequency = this.configuration.downward.frequency;
      const data_points = this.configuration.deployment.pingdatapoints;

      // Always constant.
      const profile = 0;
      const calibrate = 0;
      const sector_width = 0;
      const step_size = 0;

      // TODO find or compute these values
      const gain = 30;
      
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

    buildSonarScanStepParameters() {
      // As configured.
      const range = this.configuration.scan.range;
      const logf = this.configuration.scan.logf;
      const absorption = this.configuration.scan.absorption;
      const pulse_length = his.configuration.scan.pulselength;
      const sector_width = this.configuration.scan.sectorwidth;
      const train_angle = this.configuration.scan.trainangle;
      const frequency = this.configuration.scan.frequency;
      const data_points = this.configuration.deployment.pingdatapoints;

      // Always constant.
      const profile = 0;
      const calibrate = 0;

      // TODO find or compute these values
      const gain = 30;
      const step_size = 0;
      
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
