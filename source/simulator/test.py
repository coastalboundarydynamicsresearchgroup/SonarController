from sonarcommchannel import SonarCommChannel
from protocol881 import Protocol881
from simulate import Simulate

sonarcommchannel = SonarCommChannel()
protocol = Protocol881()
sim = Simulate(protocol, sonarcommchannel)

with sonarcommchannel:
  sim.run()
