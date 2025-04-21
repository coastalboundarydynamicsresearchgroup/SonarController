import os

from  parse881 import Parse881

class ScanParser (Parse881):
    """
    A class to parse scan data from a file.
    """
    def __init__(self):
        """
        Initialize the ScanParser with the run path and orientation file name.
        """
        self.scan_data = []
        self.scan_index = 1

    def parse_data(self, fileName, scanFile) -> bool:
        done = False
        while not done:
            parsed_data = self.make_parse_data()
            parsed_data['scan_index'] = self.scan_index
            parsed_data['File'] = fileName

            pingHeader = scanFile.read(12)
            if not pingHeader or len(pingHeader) < 12:
                done = True
                break

            headposition = self.defumigate(pingHeader[5], pingHeader[6])
            parsed_data['headposition'] = (headposition - 600) * 0.3
            parsed_data['stepdirection'] = ' cw' if (pingHeader[6] & 0x40) != 0 else 'ccw'
            parsed_data['range'] = pingHeader[7]
            parsed_data['profilerange'] = self.defumigate(pingHeader[8], pingHeader[9])

            datalength = self.defumigate(pingHeader[10], pingHeader[11])
            scanData = scanFile.read(datalength)
            if not scanData or len(scanData) < datalength:
                if not scanData:
                    print('No data in scan or downward file')
                else:
                    print(f'Data {self.scan_index} in scan or downward file is short at {len(scanData)} bytes when it should be {datalength} ({pingHeader[10]},{pingHeader[11]})')
                return False

            pingData = ''
            for scanbyte in scanData:
                pingData += str(scanbyte) + ','
            parsed_data['pingdata'] = pingData[:-1]

            _ = scanFile.read(1) # Read the 0xfc terminator

            self.scan_data.append(parsed_data)
            self.scan_index += 1

        return True

    def write_csv(self, file):
        for scan in self.scan_data:
            self.write_csv_data(file, scan)
