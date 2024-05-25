import json
from hardwarecomm import HardwareCommChannel

def DoShutdown(comm):
    print(f'TODO: Shutdown')
    result = "Ok"
    response = {"Response": result}
    comm.sendCommand(response)

def DoUndeploy(comm):
    print(f'TODO: Undeploy')
    result = "Ok"
    response = {"Response": result}
    comm.sendCommand(response)

def DoDeploy(comm, deployConfiguration):
    print(f'TODO: deploy configuration {deployConfiguration}')
    result = "Ok"
    response = {"Response": result}
    comm.sendCommand(response)

def DoVoltageMonitor(comm, batteryVoltage, referenceVoltage):
    print(f'TODO: Status command with voltage = {batteryVoltage} and reference = {referenceVoltage}')



def DoHardwareCommands():
    with HardwareCommChannel() as comm:
        counter = 1
        while True:
            commandString = comm.receiveCommand()
            print(commandString)
            try:
                response = {"Response": "Unknown"}
                command = json.loads(commandString)
                if 'Command' in command:
                    commandAction = command['Command']
                    if commandAction == 'Status':
                        batteryVoltage = 4095
                        if 'batteryVoltage' in command:
                            batteryVoltage = command['batteryVoltage']
                        referenceVoltage = 4095
                        if 'referenceVoltage' in command:
                            referenceVoltage = command['referenceVoltage']
                        DoVoltageMonitor(comm, batteryVoltage, referenceVoltage)
                    elif commandAction == 'Deploy':
                        deployConfiguration = ''
                        if 'Deploy' in command:
                            deployConfiguration = command['Deploy']
                        if deployConfiguration == '':
                            DoUndeploy(comm)
                        else:
                            DoDeploy(comm, deployConfiguration)
                    elif commandAction == 'Undeploy':
                        DoUndeploy(comm)
                    elif commandAction == 'Shutdown':
                        DoShutdown(comm)
                    else:
                        print(f'Unknown command {commandAction}')
                        comm.sendCommand(response)
                else:
                    print(f'Unexpected JSON {commandString}')
                    comm.sendCommand(response)
            except Exception:
                print(f'Exception parsing JSON {commandString}')
                
            counter += 1

            #time.sleep(.25)

DoHardwareCommands()