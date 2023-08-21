import sys
import os
import json

configurationpath = '/sonar/configuration/'

"""
    Backend implementation for sonar881 controller.
    Delete the file containing json content whose name is based on the given configuration name.
    Return through stdout to the calling program.
"""
if len(sys.argv) < 2:
  print('Usage: ' + sys.argv[0] +  ' <configuration name>')
  exit(1)

configurationName = sys.argv[1]

#print("Deleting configuration '" + configurationName + "'")

if os.path.exists(configurationpath + configurationName + ".json"):
  os.remove(configurationpath + configurationName + ".json")

print('Deleted configuration ' + configurationpath + configurationName + '.json');
exit(0)
