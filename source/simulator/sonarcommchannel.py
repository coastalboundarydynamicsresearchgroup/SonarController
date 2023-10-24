import time
import serial

class SonarCommChannel:
  def __init__(self):
    pass

  def __enter__(self):
    self.ser = serial.Serial('Com4', baudrate=115200, bytesize=8, parity=serial.PARITY_NONE, stopbits=serial.STOPBITS_ONE)
    #self.ser.timeout = 2

  def __exit__(self, *args):
    self.ser.close()

  def receive_switch(self):
    read_data = self.ser.read_until(b'\xfd')
    #print('Read ' + str(read_data) + ' from sonar controller')

    return read_data

  def send_switch_response(self, response, delay):
    time.sleep(float(delay) / 1000.0)
    sent_count = self.ser.write(response)
    self.ser.flush()
    if sent_count != len(response):
      print('Sent ' + str(sent_count) + ' bytes, but should have sent ' + len(response))

  # Reference only below here, to be deleted.
  def send_switch(self):
    command = self.create_switch_command(range=1, gain=30, logf=1, absorption=60, pulse_length=20, data_points=50, profile=0, frequency=165)
    sent_count = self.ser.write(command)
    self.ser.flush()
    if sent_count != len(command):
      print('Sent ' + str(sent_count) + ' bytes, but should have sent ' + len(command))

    read_data = self.ser.read_until(b'\xfc')
    print('Read ' + str(read_data) + ' from sonar')

    return read_data


  def create_switch_command(self, range, gain, logf, absorption, pulse_length, data_points, profile, frequency):
    command=bytearray(27)

    # Switch data header
    command[0] = bytearray.fromhex('fe')[0]
    command[1] = bytearray.fromhex('44')[0]

    command[2] = 16                          # Head ID
    command[3] = range                       # Range
    command[4] = 0                           # Reserved, must be 0
    command[5] = 0                           # Rev / hold
    command[6] = bytearray.fromhex('43')[0]  # Master / Slave (always slave)
    command[7] = 0                           # Reserved, must be 0

    command[8] = gain                        # Start Gain
    command[9] = logf                        # Logf (0=10dB 1=20dB 2=30dB 3=40dB)
    command[10] = absorption                 # Absorption dB per m * 100 - Do not use a value of 253 (\xfd)
    command[11] = 60                         # (Train angle in degrees + 180) / 3 - 60 is 0 degrees
    command[12] = 60                         # Sector width in 3-degree steps - 60 is 180 degrees
    command[13] = 4                          # Step size (0 to 8 in 0.3-degree steps) - 4 is 1.2 degrees/step
    command[14] = pulse_length               # Pulse length 1-100 -> 10 to 1000 usec in 10-usec increments - usec / 10
    command[15] = 0                          # Profile Minimum Range: 0-250 -> 0 to 25 meters in 0.1-meter increments

    command[16] = 0                          # Reserved, must be 0
    command[17] = 0                          # Reserved, must be 0
    command[18] = 0                          # Reserved, must be 0
    command[19] = data_points                # 25 - 250 data points returned, header 'IMX'   50 - 500 data points returned, header 'IGX'
    command[20] = 8                          # 4, 8, 16: resolution.  8 is 8-bit data, one sample per byte.
    command[21] = bytearray.fromhex('06')[0] # up baud: \x0b 9600, \x03 14400, \x0c 19200, \x04 28800, \x02 38400, \x05 57600, \x06 115200
    command[22] = profile                    # 0 - off, 1 = on
    command[23] = 0                          # calibrate, 0 = off, 1 = on

    command[24] = 1                          # Switch delay 0-255 in 2-msec increments - Do not use value of 253 (\fd)
    command[25] = frequency                  # 0-200 in (kHz - 675)/5 + 100 - 175kHz-1175kHz in 5kHz increments

    # Termination byte
    command[26] = bytearray.fromhex('fd')[0]

    return command

