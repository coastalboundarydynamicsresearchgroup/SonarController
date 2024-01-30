import os
import shutil
import sys
import re
import glob

PhysicalPath = ""
class LogConsumer:
  def __init__(self, rootPath):
    self.rootPath = rootPath
    self.convertedPath = rootPath + '/converted'
    self.convertedDirectory = self.convertedPath + '/default'
    self.newDataPathRe = re.compile('.*Making new sonar data path /sonar(.*)/')         # Group 1 is path to data and configuration directory.
    self.executeRe = re.compile('^(.*): Executing with filepath=/sonar(.*), and loop_count=(.*)$') # Group 1 is time stamp, 2 is data file path, 3 is sample count.
    self.logPathRe = re.compile('(.*/log/)(.*)')                                        # Group 2 is the log folder, a time stamp.
    self.dataPathRe = re.compile('(.*/data/)(.*)(/sonar.dat.*)')                        # Group 2 is the timestamp part that may need ':' replaced with '.'
    self.writingRe = re.compile('(.*Writing )(.*)( received bytes to file /sonar)(.*)') # Group 2 is byte count, 4 is data file path.
    self.downwardCount = 0
    self.scanCount = 0

    if not os.path.exists(self.convertedPath):
      os.makedirs(self.convertedPath)



  def FindAllLogDirectories(self):
    paths = []

    # Note the hard-coding of the pattern.  The tool is pretty general except for this pattern.
    path = self.rootPath + '/log/*'

    for file in glob.iglob(path, recursive=False):
      paths.append(file)

    return paths


  def FixDataPath(self, path):
    parts = self.dataPathRe.split(path)
    timestamp = parts[2].replace(':', '.')
    timestamp = timestamp.replace(' ', '_')
    return parts[1] + timestamp + parts[3]

  def FindDownwardLine(self, line):
    if 'Downward(' in line:
      if 'being skipped' not in line and 'completed' not in line:
        return True
      
    return False

  def FindDownwardEndLine(self, line):
    if 'Downward(' in line:
      if 'completed' in line:
        return True
      
    return False

  def FindScanLine(self, line):
    if 'Scan(' in line:
      if 'being skipped' not in line and 'completed' not in line:
        return True
      
    return False

  def FindScanEndLine(self, line):
    if 'Scan(' in line:
      if 'completed' in line:
        return True
      
    return False


  def ProcessDownward(self, logFile, indexfile):
    line = logFile.readline()
    if 'Executing' in line:
      m = self.executeRe.match(line)
      timestamp = m.group(1).replace(':', '.')
      timestamp = timestamp.replace(' ', '_')
      dataPath = self.rootPath + self.FixDataPath(m.group(2))
      sampleCount = m.group(3)
      print('Downward data file is ' + dataPath + ', for ' + sampleCount + ' samples')

      if not os.path.exists(dataPath):
        print('Unable to process downward, data file at ' + dataPath + ' does not exist')
      else:
        self.downwardCount += 1
        downwardFilename = "SonarDownward" + str(self.downwardCount) + ".dat"
        indexfile.write(timestamp + ',downward,' + downwardFilename + '\n')
        with open(dataPath, 'rb') as dataFile:
          with open(self.convertedDirectory + '/' + downwardFilename, "wb") as convertedDatafile:
            endOfDownward = False
            while not endOfDownward:
              line = logFile.readline()
              if not line or self.FindDownwardEndLine(line):
                endOfDownward = True
              elif 'Writing' in line:
                m = self.writingRe.match(line)
                byteCount = int(m.group(2))
                pingData = dataFile.read(byteCount)
                convertedDatafile.write(pingData)


  def ProcessScan(self, logFile, indexfile):
    line = logFile.readline()
    if 'Executing' in line:
      m = self.executeRe.match(line)
      timestamp = m.group(1).replace(':', '.')
      timestamp = timestamp.replace(' ', '_')
      dataPath = self.rootPath + self.FixDataPath(m.group(2))
      sampleCount = m.group(3)
      print('Scan data file is ' + dataPath + ', for ' + sampleCount + ' samples')

      if not os.path.exists(dataPath):
        print('Unable to process scan, data file at ' + dataPath + ' does not exist')
      else:
        self.scanCount += 1
        scanFilename = "SonarScan" + str(self.scanCount) + ".dat"
        indexfile.write(timestamp + ',scan,' + scanFilename + '\n')
        with open(dataPath, 'rb') as dataFile:
          with open(self.convertedDirectory + '/' + scanFilename, "wb") as convertedDatafile:
            endOfScan = False
            while not endOfScan:
              line = logFile.readline()
              if not line or self.FindScanEndLine(line):
                endOfScan = True
              elif 'Writing' in line:
                m = self.writingRe.match(line)
                byteCount = int(m.group(2))
                pingData = dataFile.read(byteCount)
                convertedDatafile.write(pingData)


  def CreateConvertedDirectory(self, path):
    parts = self.logPathRe.split(path)
    self.convertedDirectory = self.convertedPath + '/' + parts[2]
    print('Creating directory for converted data ' + self.convertedDirectory)
    if not os.path.exists(self.convertedDirectory):
      os.makedirs(self.convertedDirectory)

    with open(self.convertedDirectory + "/RunIndex.csv", "w") as outfile:
      outfile.write("Time Stamp,Type,File\n")


  def ConvertRun(self, path):
    if os.path.isfile(path):
      return
    
    print('\nConverting with log file in ' + path)
    self.CreateConvertedDirectory(path)
    self.downwardCount = 0
    self.scanCount = 0

    with open(self.convertedDirectory + "/RunIndex.csv", "a") as indexfile:
      with open(path + '/sonar.log', 'r') as logFile:
        while True:
          line = logFile.readline()
          if not line:
            break

          if 'Making new sonar data path' in line:
            m = self.newDataPathRe.match(line)
            timestamp = m.group(1).replace(':', '.')
            dataPath = self.rootPath + timestamp
            if not os.path.exists(dataPath):
              break
            if os.path.exists(dataPath + '/configuration.json'):
              shutil.copy(dataPath + '/configuration.json', self.convertedDirectory + '/configuration.json')
          elif self.FindDownwardLine(line):
            self.ProcessDownward(logFile, indexfile)
          elif self.FindScanLine(line):
            self.ProcessScan(logFile, indexfile)


  def ConvertAllRuns(self):
    paths = self.FindAllLogDirectories()

    for path in paths:
      self.ConvertRun(path)
