import serial
import json

class HardwareCommChannel:
  """ Implement the transport send and receive to the embedded Arduino comms.
  """

  def __init__(self):
    pass

  def __enter__(self):
    self.ser = serial.Serial('/dev/ttyACM0', baudrate=115200, bytesize=8, parity=serial.PARITY_NONE, stopbits=serial.STOPBITS_ONE)
    # We wake up once in a while so the program can be interrupted.
    self.ser.timeout = 0.5
    return self
  
  def __exit__(self, *args):
    self.ser.close()

  def receiveCommand(self) -> str:
    """ Wait forever for a command, and return it as a string.
    """
    got_line = False
    read_data = bytearray(0)
    while not got_line:
      partial_data = self.ser.read_until(b'\n')
      read_data.extend(partial_data)
      if len(read_data) > 0 and read_data[-1] == 0x0a:
        got_line = True

    return_data = ''
    try:
      return_data = read_data.decode('utf-8').rstrip()
    except:
      pass

    return return_data


  def sendCommand(self, command:object):
    """ Serializes and sends a command object to the Sonar881 controller.
        Typically, this will be a dictionary, but limited arrays are also allowed.
    """
    commandString = json.dumps(command) + '\n'
    sent_count = 0
    sent_count = self.ser.write(bytes(commandString, "utf-8"))
    self.ser.flush()
    if sent_count != len(commandString):
      print('Sent ' + str(sent_count) + ' bytes, but should have sent ' + str(len(commandString)))

