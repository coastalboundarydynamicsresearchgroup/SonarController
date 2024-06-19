import os
import time
import math
import json
import requests
from sonarcommchannel import SonarCommChannel
from sonardeploy import SonarDeploy

configurationpath = '/sonar/configuration/'
dataPathRoot = '/sonar/data/'
sonarFilePath = dataPathRoot + '/default'

logFile = sonarFilePath + 'default.log'
debug_mode = True

result = { 'success': False, 'message': 'Unknown error' }

configuration = {}
with open('/configuration/configuration.json') as f:
  configuration = json.load(f)
baseBackendUrl = 'http://' + configuration['services']['backend']['host'] + ':' + configuration['services']['backend']['port']


def emit_status(message, logToFile=True, logToProgress=False, options=None):
  global logFile
  global debug_mode

  if logToProgress:
    payload = {}
    if options:
      payload = options

    if message and len(message) > 0:
      status = message.replace('"', '\\\"')
      payload['status'] = status

    requests.put(baseBackendUrl + '/sonar/progress/deploy', json=payload)

  if message and len(message) > 0:
    utcDateTime = time.gmtime()
    timestamp = "{year:04d}-{month:02d}-{day:02d} {hour:02d}:{minute:02d}:{second:02d}".format(year=utcDateTime.tm_year, month=utcDateTime.tm_mon, day=utcDateTime.tm_mday, hour=utcDateTime.tm_hour, minute=utcDateTime.tm_min, second=utcDateTime.tm_sec)

    if logToFile:
      if debug_mode:
        print(timestamp + ': ' + message)

      with open(logFile, "a") as outfile:
        outfile.write(timestamp + ': ' + message + '\n')



def makeNewDataFolder():
  global sonarFilePath
  global logFile

  utcDateTime = time.gmtime()
  data_folder = "{year:04d}-{month:02d}-{day:02d}_{hour:02d}.{minute:02d}.{second:02d}".format(year=utcDateTime.tm_year, month=utcDateTime.tm_mon, day=utcDateTime.tm_mday, hour=utcDateTime.tm_hour, minute=utcDateTime.tm_min, second=utcDateTime.tm_sec)
  sonarFilePath = dataPathRoot + data_folder + '/'

  if not os.path.exists(sonarFilePath):
      os.makedirs(sonarFilePath)

  logFile = sonarFilePath + "sonar.log"
  with open(logFile, "w") as outfile:
    outfile.write('Start of log file ' + logFile + '\n')


class SonarDeployCompose:
  def __init__(self, runstate, debug=False):
    global debug_mode
    global sonarFilePath

    self.runstate = runstate
    debug_mode = debug

    makeNewDataFolder()

    self.runstate.get_configuration()['name'] = self.runstate.get_configurationName()
    config = json.dumps(self.runstate.get_configuration(), indent=4)

    with open(sonarFilePath + "configuration.json", "w") as outfile:
      outfile.write(config)

    with open(sonarFilePath + "RunIndex.csv", "w") as outfile:
      outfile.write("Time Stamp,Type,File\n")


  def delay_start(self):
    delay_minutes = float(self.runstate.configuration['deployment']['minutes'])
    delay_seconds = int(delay_minutes * 60)

    emit_status('Waiting for ' + str(delay_seconds) + ' seconds')
    for second in range(delay_seconds):
      emit_status('Startup delay', logToFile=False, logToProgress=True, options={'delaySec':delay_seconds - second})
      time.sleep(1)
      if not self.runstate.is_running():
        break
    emit_status('Done waiting ' + str(delay_seconds) + ' seconds', logToProgress=True, options={'delaySec':0})


  def downwardStep(self, deployer):
      emit_status('')
      emit_status('Downward(' + self.runstate.configurationName + ')')
      result = deployer.doSonarStep()
      if result['success']:
        emit_status('Downward(' + self.runstate.configurationName + ') completed with ' + str(result['response']['count']) + ' steps')
      else:
        emit_status('Error during downward(' + str(self.runstate.configurationName) + ': ' + result['message'])



  def scanStep(self, deployer):
    emit_status('')
    emit_status('Scan(' + self.runstate.configurationName + ')')
    result = deployer.doSonarScan()
    if result['success']:
      emit_status('Scan(' + self.runstate.configurationName + ') completed with ' + str(result['response']['count']) + ' steps')
    else:
      emit_status('Error during scan(' + str(self.runstate.configurationName) + ': ' + result['message'])

  def orientationStep(self, deployer):
    emit_status('')
    emit_status('Orientation(' + self.runstate.configurationName + ')')
    result = deployer.doSonarOrientation()
    if result['success']:
      emit_status('Orientation(' + self.runstate.configurationName + ') completed with ' + str(result['response']['count']) + ' steps')
    else:
      emit_status('Error during orientation(' + str(self.runstate.configurationName) + ': ' + result['message'])


  def compose_and_deploy(self, sonar):
    deployer = SonarDeploy(sonar, sonarFilePath, self.runstate.get_configurationName(), self.runstate.get_configuration(), emit_status)

    # All times in seconds.
    samplePeriod = self.runstate.configuration['deployment']['sampleperiod'] * 60
    scanEnabled = self.runstate.configuration['deployment']['scanenabled']
    downwardEnabled = self.runstate.configuration['deployment']['downwardenabled']
    orientationEnabled = self.runstate.configuration['deployment']['orientationenabled']

    emit_status('Composing deployment with scan ' + ('enabled' if scanEnabled else 'disabled') + ', downward ' + ('enabled' if downwardEnabled else 'disabled') + ' and period ' + str(samplePeriod) + ' seconds', logToProgress=True, options={'deployrunning':True})

    self.delay_start()

    while self.runstate.is_running():
      start_timestamp = time.time()

      if scanEnabled:
        self.scanStep(deployer)
      if downwardEnabled:
        self.downwardStep(deployer)
      if orientationEnabled:
        self.orientationStep(deployer)

      end_timestamp = time.time()
      duration = end_timestamp - start_timestamp
      while self.runstate.is_running() and duration < samplePeriod:
        emit_status('Pausing between samples with sampling period ' + str(samplePeriod), logToFile=False, logToProgress=True, options={'delaySec':(samplePeriod - duration)})
        sleepTime = 1 if samplePeriod - duration >= 1.0 else samplePeriod - duration
        time.sleep(sleepTime)
        duration += 1
      emit_status('', logToProgress=True, options={'delaySec':(0)})

    emit_status("Compose and deploy '" + self.runstate.get_configurationName() + "' complete", logToFile=False, logToProgress=True, options={'deploying':False,'deployrunning':False})
