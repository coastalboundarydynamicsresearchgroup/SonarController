import sys
import os
import csv

def defumigate(lowbyte, highbyte):
    high = highbyte >> 1
    bit7 = 128 if highbyte & 1 else 0
    low = lowbyte & 127 | bit7

    return high << 8 | low


def convertOrientationFile(path, file, reportFile):
    orientationFilePath = os.path.join(path, file)
    with open(orientationFilePath, 'rb') as orientationFile:
        pingHeader = orientationFile.read(12)
        if not pingHeader or len(pingHeader) < 12:
            if not pingHeader:
                print('No header data in orientation file ' + orientationFilePath)
            else:
                print('Header data in orientation file ' + orientationFilePath + ' is short at ' + str(len(pingHeader) + ' bytes'))
            return

        datalength = defumigate(pingHeader[10], pingHeader[11])
        orientationData = orientationFile.read(datalength)
        if not orientationData or len(orientationData) < datalength:
            if not orientationData:
                print('No data in orientation file ' + orientationFilePath)
            else:
                print('Data in orientation file ' + orientationFilePath + ' is short at ' + str(len(orientationData) + ' bytes'))
            return

        headersize = len(pingHeader)
        tempExternal = defumigate(orientationData[12-headersize], orientationData[13-headersize])
        tempExternal_cal = tempExternal/16 - 55
        tempInternal = defumigate(orientationData[14-headersize], orientationData[15-headersize])
        tempInternal_cal = tempInternal/16 - 55
        depth = defumigate(orientationData[16-headersize], orientationData[17-headersize])
        depth_cal = depth / 10
        pitch = defumigate(orientationData[18-headersize], orientationData[19-headersize])
        pitch_cal = pitch / 10 - 90
        roll = defumigate(orientationData[20-headersize], orientationData[21-headersize])
        roll_cal = roll / 10 - 90
        heading = defumigate(orientationData[22-headersize], orientationData[23-headersize])
        heading_cal = heading / 10
        gyroheading = defumigate(orientationData[24-headersize], orientationData[25-headersize])
        gyroheading_cal = gyroheading / 10

        reportFile.write(f'{file},{tempExternal_cal},{tempInternal_cal},{depth_cal},{pitch_cal},{roll_cal},{heading_cal},{gyroheading_cal}\n')

        print()
        print('Orientation data for ' + orientationFilePath)
        print('Temp External: ' + str(tempExternal) + ' = ' + str(tempExternal_cal) + ' Deg C')
        print('Temp Internal: ' + str(tempInternal) + ' = ' + str(tempInternal_cal) + ' Deg C')
        print('Depth: ' + str(depth) + ' = ' + str(depth_cal) + ' Meters')
        print('Pitch: ' + str(pitch) + ' = ' + str(pitch_cal) + ' Degrees')
        print('Roll: ' + str(roll) + ' = ' + str(roll_cal) + ' Degrees')
        print('Heading: ' + str(heading) + ' = ' + str(heading_cal) + ' Degrees')
        print('Gyro Heading: ' + str(gyroheading) + ' = ' + str(gyroheading_cal) + ' Degrees')

def convertRun(path='./'):
    indexPath = os.path.join(path, 'RunIndex.csv')
    with open(indexPath, newline='') as csvfile:
        reportPath = os.path.join(path, 'Orientation.csv')
        with open(reportPath, 'w') as reportFile:
            reportFile.write('Name,Temp External,Temp Internal,Depth,Pitch,Roll,Heading,Gyro Heading\n')
            indexreader = csv.DictReader(csvfile)
            for row in indexreader:
                if row['Type'] == 'orientation':
                    convertOrientationFile(path, row['File'], reportFile)

datapath = ''
if len(sys.argv) > 1:
  datapath = sys.argv[1]

convertRun(datapath)