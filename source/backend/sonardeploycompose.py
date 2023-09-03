import sys
import os
import json
import time
import math
import threading
from sonarcommchannel import SonarCommChannel
from sonardeploy import SonarDeploy

configurationpath = '/sonar/configuration/'

result = { 'success': False, 'message': 'Unknown error' }

def emit_status(message):
  """ TODO - figure out a way to pass status to the web service,
             probably through an API call.
  """
  # Debug only, remove!
  print(message)
  pass

class SonarDeployCompose:
  def __init__(self, configurationName):
    self.configurationName = configurationName
    self.configuration = {}
    fullpathname = configurationpath + configurationName + ".json"
    if not os.path.isfile(fullpathname):
      result['message'] = 'Configuration file ' + fullpathname + ' does not exist'
      print(json.dumps(result))
      exit(503)

    with open(fullpathname, 'r') as configfile:
      self.configuration = json.load(configfile)


  def delay_start(self):
    delay_minutes = float(self.configuration['deployment']['minutes'])
    delay_seconds = int(delay_minutes * 60)
    for current_second in range(delay_seconds):
      emit_status('Waiting ' + str(delay_seconds) + ' seconds at second ' + int(current_second))
      time.sleep(1)

  def downwardStep(self, deployer, period, count):
    if count == 0:
      emit_status('Downward(' + self.configurationName + ') being skipped')
      return False

    deployer.makeNewDataFolder()

    for iteration in range(count): 
      emit_status('Downward(' + self.configurationName + ') ' + str(count) + ' for ' + str(period) + ' seconds')
      result = deployer.doSonarStep()
      if result['success']:
        emit_status('Downward(' + self.configurationName + ') ' + str(count) + ' completed with ' + str(result['response']['count']) + ' steps')
      else:
        emit_status('Error during downward(' + str(self.configurationName) + ': ' + result['message'])

      time.sleep(period)

  def scanStep(self, deployer, period, count):
    if count == 0:
      emit_status('Scan(' + self.configurationName + ') being skipped')
      return False

    deployer.makeNewDataFolder()

    for iteration in range(count): 
      emit_status('Scan(' + self.configurationName + ') ' + str(count) + ' for ' + str(period) + ' seconds')
      result = deployer.doSonarScan()
      if result['success']:
        emit_status('Scan(' + self.configurationName + ') ' + str(count) + ' completed with ' + str(result['response']['count']) + ' steps')
      else:
        emit_status('Error during scan(' + str(self.configurationName) + ': ' + result['message'])

      time.sleep(period)



  def compose_and_deploy(self):
    sonar = SonarCommChannel()
    with sonar:
      deployer = SonarDeploy(sonar, self.configurationName, self.configuration)

      # All times in seconds.
      downwardSamplingTime = self.configuration['deployment']['downwardsamplingtime'] * 60
      downwardSamplePeriod = self.configuration['downward']['sampleperiod']
      scanSamplingTime = self.configuration['deployment']['scansamplingtime'] * 60
      scanSamplePeriod = self.configuration['scan']['sampleperiod']

      print('Composing downward sample time ' + str(downwardSamplingTime) + ' period ' + str(downwardSamplePeriod) + ', scan sample time ' + str(scanSamplingTime) + ' period ' + str(scanSamplePeriod))
      downwardCount = 0
      if downwardSamplingTime > 0 and downwardSamplePeriod > 0:
        downwardCount = math.ceil(downwardSamplingTime / downwardSamplePeriod)

      scanCount = 0
      if scanSamplingTime > 0 and scanSamplePeriod > 0:
        scanCount = math.ceil(scanSamplingTime / scanSamplePeriod)

      print('Composing downward count ' + str(downwardCount) + ' sample period ' + str(downwardSamplePeriod) + '  scan count ' + str(scanCount) + ' sample period ' + str(scanSamplePeriod))

      while True:
        self.downwardStep(deployer, downwardSamplePeriod, downwardCount)
        self.scanStep(deployer, scanSamplePeriod, scanCount)


