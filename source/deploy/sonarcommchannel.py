import os
import serial
import time

configurationpath = '/sonar/configuration/'


class SonarCommChannel:
  """ First, define a class to encapsulate the serial port transaction
      plus formatting the command from parameters.
  """
  def __init__(self, runstate):
    self.runstate = runstate
    self.ending_head_position = None

  def __enter__(self):
    self.ser = serial.Serial('/dev/ttyUSB0', baudrate=115200, bytesize=8, parity=serial.PARITY_NONE, stopbits=serial.STOPBITS_ONE)
    self.ser.timeout = 10 # Exprimentally determined, some commands require the head to slew.
    self.ser.reset_output_buffer()
    self.ser.reset_input_buffer()
    time.sleep(1)


  def __exit__(self, *args):
    self.ser.close()

  def reorient_head_for_first_scan(self, parameters, onStatus):
    """ On the first scan, we do a dummy ping, allowing the head to
        slew to the right angle after that dummy.   Then, we do one
        good ping, but throw away the data.  This ping will return
        with a head angle that should be the ending place of all 
        future scans.
    """
    sector_width_save = parameters['sector_width']

    # The first ping may be pointing anywhere, so throw its return away.
    #response = self.transact_switch_response(command, None, onStatus)
    #onStatus('Reorienting head, throwaway head angle is ' + str(response['headpos']))
    parameters['sector_width'] = 0
    command = self.build_switch_command_from_parameters(parameters, onStatus)
    self.transact_switch_response(command, None, onStatus)

    # Set the train angle, where the head is now pointing, as the target position
    # of that terminates every scan.
    onStatus('Reorienting head, capturing hending head angle of ' + str(parameters['train_angle']))
    self.ending_head_position = parameters['train_angle']

    # The second ping uses the same sector width as all subsequent scans.  It just
    # emulates how each scan will end up one ping past the train angle, allowing
    # the first real scan to start in the same place as all subsequent scans.
    parameters['sector_width'] = sector_width_save
    command = self.build_switch_command_from_parameters(parameters, onStatus)
    self.transact_switch_response(command, None, onStatus)


  def execute(self, parameters, filepath, onStatus, loop_count=1):
    """ Execute a downward step or full scan, depending on loop_count.
        If self.ending_head_position is invalid, and loop_count is > 1,
        reorient the head angle, this is a first scan.
    """
    if not self.ending_head_position and loop_count > 1:
      self.reorient_head_for_first_scan(parameters, onStatus)

    onStatus('Executing with filepath=' + filepath + ", and loop_count=" + str(loop_count))
    if 'orientation' in parameters and parameters['orientation']:
      command = self.create_orientation_switch_command()
    else:
      command = self.build_switch_command_from_parameters(parameters, onStatus)

    # The primary loop terminator here is when our head angle returns to self.ending_head_position.
    # However, we will guard against some coding error or comms error causing this loop to never
    # terminate by using loop_count as a sentry.
    ending_head_pos_count = 0
    loop_sentry = 1 if loop_count == 1 else loop_count + 2
    while ending_head_pos_count < 2 and (loop_sentry > 0):
      response = self.transact_switch_response(command, filepath, onStatus)

      if 'headpos' in response:
        if self.ending_head_position and (response['headpos'] == self.ending_head_position):
          ending_head_pos_count += 1

      if not self.runstate.is_running():
        print('Sonar comm loop terminated because we are not running')
        break

      loop_sentry -= 1

    response = {}
    response['count'] = loop_count
    return response

  def build_switch_command_from_parameters(self, parameters, onStatus):
    #print(parameters) # TODO - test only, remove
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

    command = self.create_switch_command(sonar_range=sonar_range, 
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
    
    onStatus('Created switch command: range=' + str(parameters['range']) + ', sector width=' + str(parameters['sector_width']) + ', train angle=' + str(parameters['train_angle']) + ', step size=' + str(parameters['step_size']))
    #print(command) # TODO - test only, remove

    return command

  def transact_switch_response(self, command, filepath, onStatus):
    response = {}
    try:
      sonar_data = self.send_switch(command, onStatus)
      # print(sonar_data)
      if sonar_data:
        response = self.handle_sonar_response(sonar_data, filepath, onStatus)
      else:
        response = self.make_dummy_response()
    except Exception:
      onStatus('Failure in serial transaction')

    return response


  def send_switch(self, command, onStatus):
    self.ser.reset_input_buffer()
    sent_count = self.ser.write(command)
    self.ser.flush()
    if sent_count != len(command):
      onStatus('Sent ' + str(sent_count) + ' bytes, but should have sent ' + len(command))

    read_data = self.ser.read_until(b'\xfc')
    #print('Read ' + str(read_data) + ' from sonar')

    return read_data

  def handle_sonar_response(self, sonar_data, filepath, onStatus):
    response = {}
    # If we got data and a file path was specified, write the raw binary data.
    if filepath:
      if os.path.exists(filepath):
        append_write = 'a'
      else:
        append_write = 'w'
      with open(filepath, append_write + 'b') as file:
        file.write(sonar_data)

    if len(sonar_data) > 12:
        # Convert raw binary response to engineering units, pack in response object.
        response["header"] = sonar_data[0:3].decode('utf-8')
        response["headid"] = sonar_data[3]
        response["serialstatus"] = sonar_data[4]
        if response["header"] != 'IOX':
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
        #onStatus('Response has step direction=' + str(response['stepdirection']) + ', head position=' + str(response['headpos']) + ', data byte count=' + str(response['databytes']))
    else:
      onStatus('Bad response with total length=' + str(len(sonar_data)))

    return response

  def make_dummy_response(self):
      response = {}
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
      print('No response')

      return response


  def create_switch_command(self, sonar_range, gain, logf, absorption, sector_width, train_angle, step_size, pulse_length, data_points, profile, calibrate, frequency):
    command=bytearray(27)

    # Switch data header
    command[0] = bytearray.fromhex('fe')[0]
    command[1] = bytearray.fromhex('44')[0]

    command[2] = 16                          # Head ID
    command[3] = sonar_range                 # Range
    command[4] = 0                           # Reserved, must be 0
    command[5] = 0                           # Rev / hold
    command[6] = bytearray.fromhex('43')[0]  # Master / Slave (always slave)
    command[7] = 0                           # Reserved, must be 0

    command[8] = gain                        # Start Gain
    command[9] = logf                        # Logf (0=10dB 1=20dB 2=30dB 3=40dB)
    command[10] = absorption                 # Absorption dB per m * 100 - Do not use a value of 253 (\xfd)
    command[11] = train_angle                # (Train angle in degrees + 180) / 3 - 60 is 0 degrees
    command[12] = sector_width               # Sector width in 3-degree steps - 60 is 180 degrees
    command[13] = step_size                  # Step size (0 to 8 in 0.3-degree steps) - 4 is 1.2 degrees/step
    command[14] = pulse_length               # Pulse length 1-100 -> 10 to 1000 usec in 10-usec increments - usec / 10
    command[15] = 0                          # Profile Minimum Range: 0-250 -> 0 to 25 meters in 0.1-meter increments

    command[16] = 0                          # Reserved, must be 0
    command[17] = 0                          # Reserved, must be 0
    command[18] = 0                          # Reserved, must be 0
    command[19] = data_points                # 25 - 250 data points returned, header 'IMX'   50 - 500 data points returned, header 'IGX'
    command[20] = 8                          # 4, 8, 16: resolution.  8 is 8-bit data, one sample per byte.
    command[21] = bytearray.fromhex('06')[0] # up baud: \x0b 9600, \x03 14400, \x0c 19200, \x04 28800, \x02 38400, \x05 57600, \x06 115200
    command[22] = profile                    # 0 - off, 1 = on
    command[23] = calibrate                  # calibrate, 0 = off, 1 = on

    command[24] = 1                          # Switch delay 0-255 in 2-msec increments - Do not use value of 253 (\fd)
    command[25] = frequency                  # 0-200 in (kHz - 675)/5 + 100 - 175kHz-1175kHz in 5kHz increments

    # Termination byte
    command[26] = bytearray.fromhex('fd')[0]

    return command


  def create_orientation_switch_command(self):
    command=bytearray(27)

    # Switch data header
    command[0] = bytearray.fromhex('fe')[0]
    command[1] = bytearray.fromhex('44')[0]

    command[2] = 16 + 8                      # Head ID
    command[3] = 0                           # Reserved, must be 0
    command[4] = 0                           # Reserved, must be 0
    command[5] = 0                           # Reserved, must be 0
    command[6] = 0                           # Reserved, must be 0
    command[7] = 0                           # Reserved, must be 0

    command[8] = 0                           # Reserved, must be 0
    command[9] = 0                           # Reserved, must be 0
    command[10] = 0                          # Reserved, must be 0
    command[11] = 0                          # Reserved, must be 0
    command[12] = 0                          # Reserved, must be 0
    command[13] = 0                          # Reserved, must be 0
    command[14] = 0                          # Reserved, must be 0
    command[15] = 0                          # Reserved, must be 0

    command[16] = 0                          # Reserved, must be 0
    command[17] = 0                          # Reserved, must be 0
    command[18] = 0                          # Reserved, must be 0
    command[19] = 0                          # Reserved, must be 0
    command[20] = 0                          # Operation: 0 (normal), 1 (cal data), 2 (cal mem), 3 (write cal mem) 0x21 reset gyro to zero
    command[21] = 0                          # Cal memory page; 0 (operation = normal), page number (operation != 0)
    command[22] = 0                          # Reserved, must be 0
    command[23] = 0                          # Reserved, must be 0

    command[24] = 0                          # Switch delay 0-255 in 2-msec increments - Do not use value of 253 (\fd)
    command[25] = 0                          # Reserved, must be 0

    # Termination byte
    command[26] = bytearray.fromhex('fd')[0]

    return command
