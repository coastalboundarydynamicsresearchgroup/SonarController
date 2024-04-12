import time
import serial
import json

class HardwareCommChannel:
  """ Implement the transport send and receive to the Sonar881 controller.
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

    return read_data.decode('utf-8').rstrip()

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


with HardwareCommChannel() as comm:
  counter = 1
  while True:
    commandString = comm.receiveCommand()
    try:
      command = json.loads(commandString)
      print(f'The battery voltage is {command["Voltage"]}')
      if 'Remote' in command:
        response = {"Ack": "Ok"}

        if 'Command' in command['Remote']:
          print(f"The remote command is {command['Remote']['Command']}")
          response['Response'] = command['Remote']['Command']
        if 'Deploy' in command['Remote']:
          print(f"The remote deploy configuration is {command['Remote']['Deploy']}")
          response['Deploy'] = command['Remote']['Deploy']
        comm.sendCommand(response)
    except Exception:
      pass
    counter += 1

    #time.sleep(.25)
