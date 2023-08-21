import os
import json

configurationpath = '/sonar/configuration/'

"""
    Backend implementation for sonar881 controller.
    Enumerate all sonar configuration files.
    Return through stdout to the calling program.
"""
allfiles = os.listdir(configurationpath)
configurations = [f[:-5] for f in allfiles if f.endswith('.json')]
print(json.dumps(configurations))
exit(0)
  