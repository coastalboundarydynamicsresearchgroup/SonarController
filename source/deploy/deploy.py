import sys
import os
import time
import json

from filewatcher import Watcher
from sonarcommchannel import SonarCommChannel
from sonardeploycompose import SonarDeployCompose

configurationpath = '/sonar/configuration/'

def TestTiming():
  test_count = 1000000
  start_timestamp = time.time()
  for _ in range(test_count):
    deployer.get_runstate()
  end_timestamp = time.time()

  duration = end_timestamp - start_timestamp
  print(str(test_count) + ' iterations took ' + str(duration))
  ### End test timing


def ExecuteDeploy(runstate):
  deployer = SonarDeployCompose(runstate, debug)
  sonar = SonarCommChannel(runstate)
  with sonar:
    deployer.compose_and_deploy(sonar)


"""
    Backend implementation for sonar881 controller.
    Start the deployment engine.
"""
debug = False
if len(sys.argv) > 1:
  debug = True

### Test timing
#TestTiming()
### End test timing

#deployer = SonarDeployCompose(debug)

#deployer.compose_and_deploy()
watcher = Watcher(ExecuteDeploy)
watcher.run()


result = { 'result': 201, 'message': 'deployment complete' }
print(json.dumps(result))
exit(0)
