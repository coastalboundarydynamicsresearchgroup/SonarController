import sys
import os
import json

configurationpath = '/sonar/configuration/'

"""
    Backend implementation for sonar881 controller.
    Write the json content from a file whose name is based on the given configuration name.
    Return through stdout to the calling program.
"""
if len(sys.argv) < 2:
  print('Usage: ' + sys.argv[0] +  ' <configuration name>')
  exit(1)

configurationName = sys.argv[1]

#print("Getting configuration '" + configurationName + "'")

json_configuration = {}
fullpathname = configurationpath + configurationName + ".json"
if os.path.isfile(fullpathname):
  with open(fullpathname, 'r') as configfile:
      json_configuration = json.load(configfile)

  print(json.dumps(json_configuration))
  exit(0)

result = {'result': 'Configuration ' + configurationName + ' does not exist'}
print(json.dumps(result))
exit(503)