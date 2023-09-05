import sys
import os
import json

from sonardeploycompose import SonarDeployCompose

configurationpath = '/sonar/configuration/'

"""
    Backend implementation for sonar881 controller.
    Start the deployment engine.
"""
if len(sys.argv) < 2:
  print('Usage: ' + sys.argv[0] +  ' <configuration name>')
  exit(1)

configurationName = sys.argv[1]

debug = False
if len(sys.argv) > 2:
  debug = True

deployer = SonarDeployCompose(configurationName, debug)
deployer.compose_and_deploy()

result = { 'result': 201, 'message': 'deployment complete' }
print(json.dumps(result))
exit(0)
