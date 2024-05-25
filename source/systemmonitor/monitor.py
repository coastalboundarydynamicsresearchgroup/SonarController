import json
from hardwarecomm import HardwareCommChannel

def DoHardwareCommands():
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
