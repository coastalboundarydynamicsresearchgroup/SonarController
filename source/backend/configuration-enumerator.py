import os
import json

allfiles = os.listdir('/sonar/configuration/')
configurations = [f[:-5] for f in allfiles if f.endswith('.json')]
print(json.dumps(configurations))
exit(0)
  