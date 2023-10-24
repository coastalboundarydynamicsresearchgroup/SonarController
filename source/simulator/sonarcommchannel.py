import time
import serial

class SonarCommChannel:
  """ Implement the transport for the switch command and response.
  """

  def __init__(self):
    pass

  def __enter__(self):
    self.ser = serial.Serial('Com4', baudrate=115200, bytesize=8, parity=serial.PARITY_NONE, stopbits=serial.STOPBITS_ONE)
    #self.ser.timeout = 2

  def __exit__(self, *args):
    self.ser.close()

  def receive_switch(self):
    """ Wait forever for a switch command, and return it as a byte array.
    """
    read_data = self.ser.read_until(b'\xfd')
    #print('Read ' + str(read_data) + ' from sonar controller')

    return read_data

  def send_switch_response(self, response, delay):
    """ Accept a byte array and send it as a switch response.
    """
    time.sleep(float(delay) / 1000.0)
    sent_count = self.ser.write(response)
    self.ser.flush()
    if sent_count != len(response):
      print('Sent ' + str(sent_count) + ' bytes, but should have sent ' + len(response))

