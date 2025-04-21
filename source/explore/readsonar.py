import sys
import os
import csv

from parse881 import Parse881
from scanparser import ScanParser
from orientationparser import OrientationParser

"""
This script reads sonar data from a specified path and converts it into a CSV format.
It processes orientation and scan/downward data files, extracting relevant information and writing it to a CSV file.
"""
def convertRun(path='./'):
    indexPath = os.path.join(path, 'RunIndex.csv')
    with open(indexPath, newline='') as csvfile:
        reportPath = os.path.join(path, 'RunData.csv')
        with open(reportPath, 'w') as reportFile:
            Parse881.write_csv_header(reportFile)
            indexreader = csv.DictReader(csvfile)
            for row in indexreader:
                if row['Type'] == 'orientation':
                    orientationFilePath = os.path.join(path, row['File'])
                    with open(orientationFilePath, 'rb') as orientationFile:
                        parser = OrientationParser()
                        if parser.parse_data(row['File'], orientationFile):
                            parser.write_csv(reportFile)
                elif row['Type'] == 'scan' or row['Type'] == 'downward':
                    scanFilePath = os.path.join(path, row['File'])
                    with open(scanFilePath, 'rb') as scanFile:
                        parser = ScanParser()
                        if parser.parse_data(row['File'], scanFile):
                            parser.write_csv(reportFile)
                else:
                    print('Unrecognized type in RunIndex.csv: ' + row['Type'])

datapath = ''
if len(sys.argv) > 1:
  datapath = sys.argv[1]

convertRun(datapath)
