import time
from shutil import make_archive

dataPathRoot = '/sonar/data/'
archivePathRoot = '/sonar/archive/'


def zipDataset():
  global dataPathRoot
  global archivePathRoot

  utcDateTime = time.gmtime()
  archiveFilename = "dataArchive_{year:04d}-{month:02d}-{day:02d}_{hour:02d}.{minute:02d}.{second:02d}".format(year=utcDateTime.tm_year, month=utcDateTime.tm_mon, day=utcDateTime.tm_mday, hour=utcDateTime.tm_hour, minute=utcDateTime.tm_min, second=utcDateTime.tm_sec)
  make_archive(archivePathRoot + "/" + archiveFilename, "zip", dataPathRoot)

  return archiveFilename


archiveFilename = zipDataset()

# Return to caller on stdout
response = '{"filename": "' + archiveFilename +'"}'
print(response)
