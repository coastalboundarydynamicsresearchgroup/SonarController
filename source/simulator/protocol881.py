from enum import Enum

class Direction(Enum):
  CLOCKWISE = 1
  COUNTERCLOCKWISE = 2


class Protocol881:
  """ This class represents the application layer of the simulator.  It accepts raw packets
      from the sonar client, which should be valid switch commands, and generates the respones.
      It also manages a simulation of the internal state of the sonar, including the head angle
      and step direction, and attempts to provide behavior consistent with that requested in
      the switch command.
      TODO - Future versions will return some reasonable data, but for now, the correct number
             of all zeros is returned.
  """
  def __init__(self):
    self.head_angle = 0.0
    self.direction = Direction.CLOCKWISE
    self.parse_result = {}
    self.reset()

  def reset(self):
    """ Make sure nothing ls left of any previous commands, start fresh.
    """
    self.parse_result = {'status': 'none'}

  def good_response(self):
      """ Accessor.  True return means a current response has been parsed with good status.
      """
      return 'status' in self.parse_result and self.parse_result['status'] == 'good'
  
  def response_delay(self):
    """ Accessor. Return the response delay requested by the most recent parsed command.
    """
    if 'delay' not in self.parse_result:
      return 0
    
    return self.parse_result['delay']

  def parse_switch(self, read_data):
    """ A new switch commnad has been received.  Parse it into a useful dictionary.
    """
    self.parse_result = {'status': 'good'}

    if len(read_data) != 27:
      self.parse_result['status'] = 'badlength'
    
    if self.parse_result['status'] == 'good':
      if read_data[0] != 0xfe or read_data[1] != 0x44:
        self.parse_result['status'] = 'badheader ' + format(read_data[0], '02x') + format(read_data[1], '02x')
    
    if self.parse_result['status'] == 'good':
      self.parse_result['headid'] = read_data[2]
      self.parse_result['range'] = read_data[3]
      self.parse_result['hold'] = True if read_data[4] and b'x\01' != 0 else False
      self.parse_result['reverse'] = True if read_data[4] and b'x\40' != 0 else False
      self.parse_result['gain'] = read_data[8]
      self.parse_result['logf'] = read_data[9]
      self.parse_result['absorption'] = float(read_data[10]) / 100.0
      self.parse_result['trainangle'] = float(read_data[11]) * 3.0 - 180.0
      self.parse_result['sectorwidth'] = float(read_data[12]) * 3.0
      self.parse_result['step'] = float(read_data[13]) * 0.3
      self.parse_result['pulselength'] = float(read_data[14]) * 10.0
      self.parse_result['profilerange'] = float(read_data[15]) * 0.1
      self.parse_result['datapoints'] = read_data[19] * 10    # 250 'IMX' or 500 'IGX'
      self.parse_result['databits'] = read_data[20]
      self.parse_result['baud'] = read_data[21]               # Wierd mapping, see docs
      self.parse_result['profile'] = True if read_data[22] != 0 else False   # 0 'IPX'
      self.parse_result['calibrate'] = True if read_data[23] != 0 else False
      self.parse_result['delay'] = read_data[24] * 2          # return delay in ms
      self.parse_result['frequency'] = (read_data[25] - 100) * 5 + 675

      print(self.parse_result)

      self.execute_switch_command()

  def execute_switch_command(self):
    """ Add behavior to the sonar consistent with the switch command.
        Primarily, this means step the head angle using the specified parameters.
    """
    if self.parse_result['hold']:
      return

    if self.parse_result['calibrate']:
      self.head_angle = 0.0
      return

    if self.direction == Direction.CLOCKWISE:
      self.head_angle += self.parse_result['step']
      if self.head_angle > (self.parse_result['sectorwidth'] / 2.0):
        self.direction = Direction.COUNTERCLOCKWISE
    else:
      self.head_angle -= self.parse_result['step']
      if self.head_angle < (-self.parse_result['sectorwidth'] / 2.0):
        self.direction = Direction.CLOCKWISE


  def switch_response(self):
    """ Generate a switch response appropriate to the previously-received command.
    """

    data_length = 0
    if not self.parse_result['profile']:
      data_length = int((self.parse_result['datapoints'] * self.parse_result['databits']) / 8)

    response=bytearray(13 + data_length)

    # Switch response header
    if self.parse_result['profile']:
      response[0] = b'I'[0]
      response[1] = b'P'[0]
      response[2] = b'X'[0]
    else:
      if self.parse_result['datapoints'] == 250:
        response[0] = b'I'[0]
        response[1] = b'M'[0]
        response[2] = b'X'[0]
      else:
        response[0] = b'I'[0]
        response[1] = b'G'[0]
        response[2] = b'X'[0]

    response[3] = self.parse_result['headid']
    response[4] = bytearray.fromhex('41')[0]

    # TODO - Head position and direction
    head_position = int(self.head_angle)
    step_direction = 1 if self.direction == Direction.CLOCKWISE else 0
    response[5] = head_position & 0x7f
    response[6] = head_position & 0x1f80 >> 7 | step_direction << 6

    response[7] = self.parse_result['range']

    # TODO - Profile range
    response[8] = 0
    response[9] = 0

    response[10] = data_length & 0x7f
    response[11] = data_length & 0x3f80 >> 7

    # TODO - add some data

    response[13 + data_length - 1] = 0xfc

    print('Response: ' + str(response[0:3]) + ' head pos ' + str(head_position) + ' direction ' + str(self.direction))
    return response
