

class Simulate:
  """ Wrap the high-level behavior of the simulator,
      given a transport and protocol object.
  """
  
  def __init__(self, protocol, sonarcommchannel):
    self.protocol = protocol
    self.sonarcommchannel = sonarcommchannel

  def run(self):
    while True:
      self.protocol.reset()
      sonar_switch = self.sonarcommchannel.receive_switch()
      self.protocol.parse_switch(sonar_switch)
      if self.protocol.good_response():
        response = self.protocol.switch_response()
        #print(response)
        self.sonarcommchannel.send_switch_response(response, self.protocol.response_delay())


