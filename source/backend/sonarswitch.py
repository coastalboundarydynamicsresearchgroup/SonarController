import os
import sys
import json

from sonarcommchannel import SonarCommChannel

# Actual script entry point.  Parse arguments, create an instance of the SonarCommChannel class,
# do the transaction.
# 1. If a file name is suplied, append the raw response to the file.
# 2. Parse the response into a json object and return it on stdout.
#
if len(sys.argv) < 2:
  print('Usage: ' + sys.argv[0] +  ' <sonar parameter object> <optional capture file name> <optional loop count>')
  exit(1)

parameters_cmd = sys.argv[1]
parameters = json.loads(parameters_cmd)

filepath = ''
if len(sys.argv) > 2:
  filepath = sys.argv[2]

loop_count = 1 
if len(sys.argv) > 3:
  loop_count = int(sys.argv[3])

sonar_range = parameters['range']
gain = parameters['gain']
logf = int(parameters['logf']/10) - 1
absorption = int(parameters['absorption'] * 100)
sector_width = int(parameters['sector_width'] / 3)
train_angle = int((parameters['train_angle'] + 180) / 3)
step_size = int(parameters['step_size'] * 10 / 3)
pulse_length = int(parameters['pulse_length'] / 10)
data_points = int(parameters['data_points'] / 10)
profile = parameters['profile']
calibrate = parameters['calibrate']
frequency = int((parameters['frequency'] - 675) / 5) + 100
#print('range: ' + str(sonar_range) + ' gain: ' + str(gain) + ' logf: ' + str(logf) + ' absorption: ' + str(absorption) + ' pulse_length: ' + str(pulse_length) + ' data_points: ' + str(data_points) + ' profile: ' + str(profile) + ' frequncy: ' + str(frequency))

sonar = SonarCommChannel()
command = sonar.create_switch_command(sonar_range=sonar_range, 
                                      gain=gain, 
                                      logf=logf, 
                                      absorption=absorption, 
                                      sector_width = sector_width,
                                      train_angle = train_angle,
                                      step_size = step_size,
                                      pulse_length=pulse_length, 
                                      data_points=data_points, 
                                      profile=profile, 
                                      calibrate=calibrate,
                                      frequency=frequency)

with sonar:
  for _ in range(loop_count):
    sonar_data = sonar.send_switch(command)
    # print(sonar_data)
    response = {}
    if sonar_data:
      # If we got data and a file path was specified, write the raw binary data.
      if filepath:
        if os.path.exists(filepath):
          append_write = 'a'
        else:
          append_write = 'w'
        with open(filepath, append_write + 'b') as file:
          file.write(sonar_data)

      # Convert raw binary response to engineering units, pack in response object.
      response["header"] = sonar_data[0:3].decode('utf-8')
      response["headid"] = sonar_data[3]
      response["serialstatus"] = sonar_data[4]
      response["stepdirection"] = 1 if sonar_data[6] & 64 else 0
      response["headpos"] = (((sonar_data[6] & 63) << 7 | (sonar_data[5] & 127)) - 600) * 0.3
      response["comment"] = "Computing head position " + str(response["headpos"]) + " from byte 5=" + str(sonar_data[5]) + " and 6=" + str(sonar_data[6])
      response["range"] = sonar_data[7]
      response["profilerange"] = sonar_data[9] << 7 | sonar_data[8] & 127
      response["databytes"] = sonar_data[11] << 7 | sonar_data[10] & 127
      data = ""
      for val in sonar_data[12:-1]:
        data += "{0:02x}".format(val)
      response["data"] = data
    else:
      # No response, don't write to file, pack dummy data in response object.
      response["header"] = "DUM"
      response["headid"] = 16
      response["serialstatus"] = 65
      response["stepdirection"] = 1
      response["headpos"] = 4.3
      response["range"] = 42
      response["profilerange"] = 192
      response["databytes"] = 500
      response["comment"]="No response from sonar"
      data = ""
      for i in range(250):
        data += "{0:02x}".format(i)
      for i in range(250):
        data += "{0:02x}".format(250 - i)
      response["data"] = data

  # Single-step requests want the response back on stdout
  if loop_count == 1:
    print(json.dumps(response))

