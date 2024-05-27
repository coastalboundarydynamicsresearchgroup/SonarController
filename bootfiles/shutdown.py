import os

shutdownFilePath = '/mnt/m2/sonar/' + '__poweroff__'
if os.path.exists(shutdownFilePath):
    os.remove(shutdownFilePath)
    os.system('shutdown -h now')
