import sys
import time
import json

from filewatcher import Watcher
from sonarcommchannel import SonarCommChannel
from sonardeploycompose import SonarDeployCompose

configurationpath = '/sonar/configuration/'


def ExecuteDeploy(runstate):
  """ Callback sent to the file watcher that allows
      the deployment to run when a runfile is present.
  """
  deployer = SonarDeployCompose(runstate, debug)
  with SonarCommChannel(runstate) as sonar:
    deployer.compose_and_deploy(sonar)


"""
    Backend implementation for sonar881 controller.
    Start the deployment engine.
"""
debug = False
if len(sys.argv) > 1:
  debug = True

watcher = Watcher(ExecuteDeploy)
watcher.run()

exit(0)
