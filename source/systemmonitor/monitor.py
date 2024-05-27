import os
import sys
import json
from hardwarecomm import HardwareCommChannel

def DoShutdown(debug, comm):
    result = "Shutdown"
    response = {"Response": result}
    comm.sendCommand(response)

    shutdownFilePath = '/sonar/' + '__poweroff__'
    
    with open(shutdownFilePath, "w") as outfile:
        if debug:
            print(f'Writing shutdown file at {shutdownFilePath}')
        outfile.write('shutdown')

configurationPath = '/sonar/configuration/'

def DoUndeploy(debug, comm):
    """ Undeploy all configurations by deleting the run file
        if it exists.
    """
    global configurationPath

    result = "Ok"

    runFilePath = configurationPath + '__runfile__.deploy'
    if os.path.exists(runFilePath):
        os.remove(runFilePath)
        if debug:
            print(f"Undeployed all configurations")
    else:
        if debug:
            print(f"Nothing deployed, not undeploying")
        result = "Nothing deployed"

    response = {"Response": result}
    comm.sendCommand(response)


def DoDeploy(debug, comm, deployConfiguration):
    """ Deploy the specified configuration by creating a
        run file with the deployment name.
    """
    global configurationPath

    result = "Ok"
    configurationFile = configurationPath + deployConfiguration + '.json'
    if debug:
        print('Deployment loading configuration {configurationFile}')

    if os.path.isfile(configurationFile):
        runfile = {"configurationName": deployConfiguration}
        runFilePath = configurationPath + '__runfile__.deploy'
        config = json.dumps(runfile, indent=4)
        
        with open(runFilePath, "w") as outfile:
            outfile.write(config)

        if debug:
            print(f"Deployed configuration '{deployConfiguration}")
    else:
        result = f"Configuration '{deployConfiguration}' does not exist"
        if debug:
            print(f"Deploy configuration '{deployConfiguration} does not exist, not deploying")

    response = {"Response": result}
    comm.sendCommand(response)

voltageHasBeenHigh = False
voltageLowDebounceCount = 25
voltageLowConsecutiveTimes = voltageLowDebounceCount
voltageNotAvailable = 25
voltageLowPercent = 5

def DoVoltageMonitor(debug, comm, batteryVoltage, referenceVoltage):
    """ When the battery voltage get less than or equal to the refrence voltage,
        the hardware comparator will turn off the power.  We should shut down the
        computer before that, so pick a point where the batter is a small percentage
        above the reference.
    """
    global voltageHasBeenHigh
    global voltageLowDebounceCount
    global voltageLowConsecutiveTimes
    global voltageNotAvailable
    global voltageLowPercent

    # System does not support voltage monitoring, one or both input hard-grounded.
    if batteryVoltage < voltageNotAvailable or referenceVoltage < voltageNotAvailable:
        if debug:
            print(f'Battery voltage {batteryVoltage} or reference voltage {referenceVoltage} below useful value {voltageNotAvailable}, not checking voltage')
        return

    cutoff = referenceVoltage * voltageLowPercent / 100
    
    # To avoid a situation where we shut down before running, we must establish
    # that the voltage was once higher than the reference.
    if not voltageHasBeenHigh:
        voltageHasBeenHigh = (batteryVoltage > (referenceVoltage + cutoff))
        if debug:
            print(f'Battery voltage has not been high, but is, latching high-once')

    if voltageHasBeenHigh:
        if batteryVoltage < (referenceVoltage + cutoff):
            voltageLowConsecutiveTimes -= 1
            if debug:
                print(f'Battery voltage {batteryVoltage} below cutoff {referenceVoltage + cutoff}, reducing consecutive count from {voltageLowDebounceCount} to {voltageLowConsecutiveTimes}')
        else:
            voltageLowConsecutiveTimes = voltageLowDebounceCount

        if voltageLowConsecutiveTimes <= 0:
            if debug:
                print(f'Voltage = {batteryVoltage} and reference = {referenceVoltage}, below cutoff {referenceVoltage + cutoff} {voltageLowDebounceCount} times, shutting down')
            DoShutdown(debug, comm)




def DoHardwareCommands(debug):
    with HardwareCommChannel() as comm:
        counter = 1
        while True:
            commandString = comm.receiveCommand()
            try:
                response = {"Response": "Unknown"}
                command = json.loads(commandString)
                if 'Command' in command:
                    commandAction = command['Command']
                    if debug:
                        print(f'Received command {commandAction}')
                    if commandAction == 'Status':
                        batteryVoltage = 0
                        if 'batteryVoltage' in command:
                            batteryVoltage = command['batteryVoltage']
                        referenceVoltage = 0
                        if 'referenceVoltage' in command:
                            referenceVoltage = command['referenceVoltage']
                        DoVoltageMonitor(debug, comm, batteryVoltage, referenceVoltage)
                    elif commandAction == 'Deploy':
                        deployConfiguration = ''
                        if 'Deploy' in command:
                            deployConfiguration = command['Deploy']
                        if deployConfiguration == '':
                            DoUndeploy(debug, comm)
                        else:
                            DoDeploy(debug, comm, deployConfiguration)
                    elif commandAction == 'Undeploy':
                        DoUndeploy(debug, comm)
                    elif commandAction == 'Shutdown':
                        DoShutdown(debug, comm)
                    else:
                        if debug:
                            print(f'Unknown command {commandAction}')
                        comm.sendCommand(response)
                else:
                    if debug:
                        print(f'Unexpected JSON {commandString}')
                    comm.sendCommand(response)
            except Exception:
                if debug:
                    print(f'Exception parsing JSON {commandString}')
                
            counter += 1

            #time.sleep(.25)

debug = False
if len(sys.argv) > 1:
  debug = True

DoHardwareCommands(debug)