import os
import time
import math
import json
import requests
from sonarcommchannel import SonarCommChannel
from sonardeploy import SonarDeploy

configurationpath = '/sonar/configuration/'
logPathRoot = '/sonar/log/'
logFilePath = logPathRoot + 'default/'
logFile = logFilePath + 'default.log'
debug_mode = True

result = { 'success': False, 'message': 'Unknown error' }

configuration = {}
with open('/configuration/configuration.json') as f:
  configuration = json.load(f)
baseBackendUrl = 'http://' + configuration['services']['backend']['host'] + ':' + configuration['services']['backend']['port']


def emit_status(message):
  global logFile
  global debug_mode

  status = message.replace('"', '\\\"')
  payload = {'status': status}
  requests.put(baseBackendUrl + '/sonar/progress/deploy', json=payload)

  utcDateTime = time.gmtime()
  timestamp = "{year:04d}-{month:02d}-{day:02d} {hour:02d}:{minute:02d}:{second:02d}".format(year=utcDateTime.tm_year, month=utcDateTime.tm_mon, day=utcDateTime.tm_mday, hour=utcDateTime.tm_hour, minute=utcDateTime.tm_min, second=utcDateTime.tm_sec)

  if debug_mode:
    print(timestamp + ': ' + message)

  with open(logFile, "a") as outfile:
    outfile.write(timestamp + ': ' + message + '\n')



def makeNewLogFolder():
  global logFilePath
  global logFile

  utcDateTime = time.gmtime()
  log_folder = "{year:04d}-{month:02d}-{day:02d}_{hour:02d}:{minute:02d}:{second:02d}".format(year=utcDateTime.tm_year, month=utcDateTime.tm_mon, day=utcDateTime.tm_mday, hour=utcDateTime.tm_hour, minute=utcDateTime.tm_min, second=utcDateTime.tm_sec)
  logFilePath = logPathRoot + log_folder + '/'
  if not os.path.exists(logFilePath):
      os.makedirs(logFilePath)

  logFile = logFilePath + "sonar.log"
  with open(logFile, "w") as outfile:
    outfile.write('Start of log file ' + log_folder + '\n')



class SonarDeployCompose:
  def __init__(self, runstate, debug=False):
    global debug_mode

    self.runstate = runstate
    debug_mode = debug

    makeNewLogFolder()


  def delay_start(self):
    delay_minutes = float(self.runstate.configuration['deployment']['minutes'])
    delay_seconds = int(delay_minutes * 60)

    emit_status('Waiting for ' + str(delay_seconds) + ' seconds')
    for _ in range(delay_seconds):
      time.sleep(1)
    emit_status('Done waiting ' + str(delay_seconds) + ' seconds')


  def downwardStep(self, deployer, period, count):
    if count == 0:
      emit_status('')
      emit_status('Downward(' + self.runstate.configurationName + ') being skipped')
      return False

    for iteration in range(count): 
      start_timestamp = time.time()

      emit_status('')
      emit_status('Downward(' + self.runstate.configurationName + ') ' + str(iteration + 1) + ' of '  + str(count) + ' for ' + str(period) + ' seconds')
      result = deployer.doSonarStep()
      if result['success']:
        emit_status('Downward(' + self.runstate.configurationName + ') ' + str(iteration + 1) + ' of ' + str(count) + ' completed with ' + str(result['response']['count']) + ' steps')
      else:
        emit_status('Error during downward(' + str(self.runstate.configurationName) + ': ' + result['message'])

      if self.runstate.is_runchange() or not self.runstate.is_running():
        print('Downward loop terminated because we are not running or run state changed')
        break

      end_timestamp = time.time()
      duration = end_timestamp - start_timestamp
      if duration < period:
        time.sleep(period - duration)


  def scanStep(self, deployer, period, count):
    if count == 0:
      emit_status('')
      emit_status('Scan(' + self.runstate.configurationName + ') being skipped')
      return False

    for iteration in range(count):
      start_timestamp = time.time()

      emit_status('')
      emit_status('Scan(' + self.runstate.configurationName + ') '  + str(iteration + 1) + ' of ' + str(count) + ' for ' + str(period) + ' seconds')
      result = deployer.doSonarScan()
      if result['success']:
        emit_status('Scan(' + self.runstate.configurationName + ') ' + str(iteration + 1) + ' of ' + str(count) + ' completed with ' + str(result['response']['count']) + ' steps')
      else:
        emit_status('Error during scan(' + str(self.runstate.configurationName) + ': ' + result['message'])

      if self.runstate.is_runchange() or not self.runstate.is_running():
        emit_status('Scan loop terminated because we are not running or run state changed')
        break

      end_timestamp = time.time()
      duration = end_timestamp - start_timestamp
      if duration < period:
        time.sleep(period - duration)



  def compose_and_deploy(self, sonar):
    deployer = SonarDeploy(sonar, self.runstate.get_configurationName(), self.runstate.get_configuration(), emit_status)
    deployer.makeNewDataFolder()

    # All times in seconds.
    downwardSamplingTime = self.runstate.configuration['deployment']['downwardsamplingtime'] * 60
    downwardSamplePeriod = self.runstate.configuration['downward']['sampleperiod']
    scanSamplingTime = self.runstate.configuration['deployment']['scansamplingtime'] * 60
    scanSamplePeriod = self.runstate.configuration['scan']['sampleperiod']

    emit_status('Composing downward sample time ' + str(downwardSamplingTime) + ' period ' + str(downwardSamplePeriod) + ', scan sample time ' + str(scanSamplingTime) + ' period ' + str(scanSamplePeriod))
    downwardCount = 0
    if downwardSamplingTime > 0 and downwardSamplePeriod > 0:
      downwardCount = math.ceil(downwardSamplingTime / downwardSamplePeriod)

    scanCount = 0
    if scanSamplingTime > 0 and scanSamplePeriod > 0:
      scanCount = math.ceil(scanSamplingTime / scanSamplePeriod)

    emit_status('Composing downward count ' + str(downwardCount) + ' sample period ' + str(downwardSamplePeriod) + '  scan count ' + str(scanCount) + ' sample period ' + str(scanSamplePeriod))

    self.delay_start()

    while self.runstate.is_running():
      self.downwardStep(deployer, downwardSamplePeriod, downwardCount)
      self.scanStep(deployer, scanSamplePeriod, scanCount)

    emit_status('Compose and deploy' + str(self.runstate.configurationName) + ' complete')


