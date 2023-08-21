import sys
import os
import json

configurationpath = '/sonar/configuration/'

"""
    Backend implementation for sonar881 controller.
    Write the json content to a file whose name is based on the given configuration name.
    Return through stdout to the calling program.
"""
if len(sys.argv) < 3:
  print('Usage: ' + sys.argv[0] +  ' <configuration name>' + ' {name1: value1, name2: value2}')
  exit(1)

configurationName = sys.argv[1]
configuration = sys.argv[2]

#print("Putting configuration '" + configurationName + "'")

json_config = json.loads(configuration)
config = json.dumps(json_config, indent=4)
 
with open(configurationpath + configurationName + ".json", "w") as outfile:
    outfile.write(config)

print('Wrote configuration to ' + configurationpath + configurationName + '.json');
exit(0)
