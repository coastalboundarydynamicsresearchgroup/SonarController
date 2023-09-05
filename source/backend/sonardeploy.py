import os
import time
import json

dataPathRoot = '/sonar/data/'

class SonarDeploy:
    def __init__(self, sonar, configurationName, configuration, onStatus):
        self.sonar = sonar
        self.configurationName = configurationName
        self.configuration = configuration
        self.onStatus = onStatus

        if not os.path.exists(dataPathRoot):
            os.makedirs(dataPathRoot)

    def makeNewDataFolder(self):
        utcDateTime = time.gmtime()
        data_folder = "{year:04d}-{month:02d}-{day:02d}_{hour:02d}:{minute:02d}:{second:02d}".format(year=utcDateTime.tm_year, month=utcDateTime.tm_mon, day=utcDateTime.tm_mday, hour=utcDateTime.tm_hour, minute=utcDateTime.tm_min, second=utcDateTime.tm_sec)
        self.sonarFilePath = dataPathRoot + data_folder + '/'
        self.onStatus('Making new sonar data path ' + self.sonarFilePath)
        if not os.path.exists(self.sonarFilePath):
            os.makedirs(self.sonarFilePath)

        self.configuration['name'] = self.configurationName
        config = json.dumps(self.configuration, indent=4)
 
        with open(self.sonarFilePath + "configuration.json", "w") as outfile:
            outfile.write(config)


    def doSonarStep(self):
        sonarParameters = self.buildSonarDownwardStepParameters()
        response = self.sonar.execute(sonarParameters, self.sonarFilePath + 'sonar.dat', self.onStatus)

        result = {}
        result['success'] = True
        result['message'] = ''
        result['response'] = response
        return result

    def doSonarScan(self):
        sonarParameters = self.buildSonarScanStepParameters()
        step_count = int(sonarParameters['sector_width'] / sonarParameters['step_size'] * 2) + 1
        response = self.sonar.execute(sonarParameters, self.sonarFilePath + 'sonar.dat', self.onStatus, step_count)

        result = {}
        result['success'] = True
        result['message'] = ''
        result['response'] = response
        return result

    def buildSonarDownwardStepParameters(self):
        # As configured
        range = int(self.configuration['downward']['range'])
        logf = int(self.configuration['downward']['logf'])
        absorption = float(self.configuration['downward']['absorption'])
        train_angle = int(self.configuration['downward']['trainangle'])
        pulse_length = int(self.configuration['downward']['pulselength'])
        data_points = int(self.configuration['deployment']['pingdatapoints'])
        frequency = int(self.configuration['downward']['frequency'])

        # Always constant.
        sector_width = 0
        step_size = 0
        profile = 0
        calibrate = 0

        # TODO find or compute these values
        gain = 30
      
        parameters = {
            'range': range,
            'gain': gain,
            'logf': logf,
            'absorption': absorption,
            'sector_width': sector_width,
            'train_angle': train_angle,
            'step_size': step_size,
            'pulse_length': pulse_length,
            'data_points': data_points,
            'profile': profile,
            'calibrate': calibrate,
            'frequency': frequency
        }

        return parameters

    def buildSonarScanStepParameters(self):
        # As configured.
        range = int(self.configuration['scan']['range'])
        logf = int(self.configuration['scan']['logf'])
        absorption = float(self.configuration['scan']['absorption'])
        sector_width = int(self.configuration['scan']['sectorwidth'])
        train_angle = int(self.configuration['scan']['trainangle'])
        pulse_length = int(self.configuration['scan']['pulselength'])
        data_points = int(self.configuration['deployment']['pingdatapoints'])
        frequency = int(self.configuration['scan']['frequency'])
        step_size = float(self.configuration['scan']['step_size'])

        # Always constant.
        profile = 0
        calibrate = 0

        # TODO find or compute these values
        gain = 30
      
        parameters = {
            'range': range,
            'gain': gain,
            'logf': logf,
            'absorption': absorption,
            'sector_width': sector_width,
            'train_angle': train_angle,
            'step_size': step_size,
            'pulse_length': pulse_length,
            'data_points': data_points,
            'profile': profile,
            'calibrate': calibrate,
            'frequency': frequency
        }

        return parameters
    
