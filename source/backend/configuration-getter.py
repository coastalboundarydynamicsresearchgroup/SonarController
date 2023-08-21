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
with open(configurationpath + configurationName + ".json", 'r') as configfile:
    json_configuration = json.load(configfile)

print(json.dumps(json_configuration))
exit(0)
