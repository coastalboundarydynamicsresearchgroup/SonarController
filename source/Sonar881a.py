class Sonar881a:
    """
    This class provides serial interfacing with a LattePanda which controls the 
    Model 881A Digital Multi-Frequency Imaging Sonar
    """
    # TODO:
    # testing testing testing ....... I dont know if any of the below actually works!
    
    #   Add function that transmits low power warning to LattePanda, telling it to shut off the sonar
    #    (this functionality may just be added to main)

    
    __recieved_msg = ''
    __transmit_msg = ''
    
    def __init__(self):
        self.port = serial.Serial("/dev/ttyAMA0", baudrate=115200, timeout=3.0)
        t_listen = Thread(target=self.listen, daemon=True)
        t_listen.start()
    
    @property
    def recieved_msg(self):
        """ Gets latest recieved message """
        return self.__recieved_msg

    @recieved_msg.setter
    def recieved_msg(self, value:str) -> bool:
        """ Sets latest recieved message """
        self.__recieved_msg = value
        return True
    
    @property
    def transmit_msg(self):
        """ Gets latest transmit message """
        return self.__transmit_msg

    @transmit_msg.setter
    def transmit_msg(self, value:str) -> bool:
        """ Sets latest transmit message """
        try:
            if not '\n' in value:
                value = value + '\n' # append new line char to msg
            self.port.write(value)
            self.__transmit_msg = value
            return True
        except Exception:
            logging.info("ERROR transmitting message to LattePanda: " + value)
            logging.info(traceback.format_exc())
            return False
    
    def listen(self):
        """ 
        Thread to listen for incoming messages.
        Updates recieved_msg on reading new line
        """
        while True:
            inp = self.port.readline()
            self.recieved_msg = inp.strip().decode("utf-8")