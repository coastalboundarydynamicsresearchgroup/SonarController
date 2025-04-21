import os

from  parse881 import Parse881

class OrientationParser (Parse881):
    """
    A class to parse orientation data from a file.
    """
    def __init__(self):
        """
        Initialize the OrientationParser with the run path and orientation file name.
        """
        self.parsed_data = self.make_parse_data()

    def parse_data(self, fileName, orientationFile) -> bool:
        self.parsed_data = self.make_parse_data()
        self.parsed_data['scan_index'] = 0
        self.parsed_data['File'] = fileName

        pingHeader = orientationFile.read(12)
        if not pingHeader or len(pingHeader) < 12:
            if not pingHeader:
                print('No header data in orientation file ' + self.orientationFilePath)
            else:
                print('Header data in orientation file ' + self.orientationFilePath + ' is short at ' + str(len(pingHeader) + ' bytes'))
            return False

        datalength = self.defumigate(pingHeader[10], pingHeader[11])
        orientationData = orientationFile.read(datalength)
        if not orientationData or len(orientationData) < datalength:
            if not orientationData:
                print('No data in orientation file ' + self.orientationFilePath)
            else:
                print('Data in orientation file ' + self.orientationFilePath + ' is short at ' + str(len(orientationData) + ' bytes'))
            return False

        headersize = len(pingHeader)
        tempExternal = self.defumigate(orientationData[12-headersize], orientationData[13-headersize])
        self.parsed_data["tempExternal"] = tempExternal/16 - 55
        tempInternal = self.defumigate(orientationData[14-headersize], orientationData[15-headersize])
        self.parsed_data["tempInternal"] = tempInternal/16 - 55
        depth = self.defumigate(orientationData[16-headersize], orientationData[17-headersize])
        self.parsed_data["depth"] = depth / 10
        pitch = self.defumigate(orientationData[18-headersize], orientationData[19-headersize])
        self.parsed_data["pitch"] = pitch / 10 - 90
        roll = self.defumigate(orientationData[20-headersize], orientationData[21-headersize])
        self.parsed_data["roll"] = roll / 10 - 90
        heading = self.defumigate(orientationData[22-headersize], orientationData[23-headersize])
        self.parsed_data["heading"] = heading / 10
        gyroheading = self.defumigate(orientationData[24-headersize], orientationData[25-headersize])
        self.parsed_data["gyroheading"] = gyroheading / 10

        return True

    def write_csv(self, file):
        self.write_csv_data(file, self.parsed_data)