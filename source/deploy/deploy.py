import sys
import os
import json

from sonardeploycompose import SonarDeployCompose

configurationpath = '/sonar/configuration/'

"""
    Backend implementation for sonar881 controller.
    Start the deployment engine.
"""
debug = False
if len(sys.argv) > 1:
  debug = True

deployer = SonarDeployCompose(debug)
deployer.compose_and_deploy()

result = { 'result': 201, 'message': 'deployment complete' }
print(json.dumps(result))
exit(0)
