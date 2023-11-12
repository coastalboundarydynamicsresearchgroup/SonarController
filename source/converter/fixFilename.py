import os
import sys
import glob

"""
This one-time converter can only be used on files returned from the first deployment
of the Sonar881 controller in September of 2023 (that date is even hard-coded below).
At that time, directories were based on the time stamp of the start of a run, and the
time portion of that name included colons (eg, 14:23:28).  This works ok for Linux 
(where it was written) and probably Macs, but Windows hates it.  After several copies,
one onto a Windows machine, the colons get expanded to some weird Unicode character.
This is not so bad in principle, but our post-processing will assume we can find the 
files we need by referencing paths in the log file, which include the colons.

Run this utility to convert all the folder names with colons or funny unicode characters
to a style where the time portion uses dots (eg, 14.23.28).  Future data acquisition
will write folder names with this dot format.

python3 ./fixFilename /path/to/data
"""

class FilenameFixer:
    def __init__(self, path):
        self.path = path

    def FixName(self, name):
        fixedName = name

        secondFunnyChar = name[-3]
        firstFunnyChar = name[-6]

        fixupNeeded = False
        if firstFunnyChar != secondFunnyChar:
            print('Name does not match pattern, two funny chars are not the same')
            return fixedName
        
        if firstFunnyChar == '.':
            # Ok, no changes needed.
            return fixedName

        if name[-9] == firstFunnyChar:
            fixupNeeded = True

        # If the funny chars were the same as the '_' separating date from time, return it here.
        fixedName = name.replace(firstFunnyChar, '.')
        if fixupNeeded:
            fixedName = fixedName.replace('.', firstFunnyChar, 1)

        return fixedName
    
    def FixPath(self, path):
        lastSlash = path.rfind('/')
        fixedName = self.FixName(path[lastSlash + 1:])
        fixedPath = path[:lastSlash + 1] + fixedName
        return fixedPath
    
    def FindAllNamesNeedingFixing(self):
        paths = []

        # Note the hard-coding of the pattern.  The tool is pretty general except for this pattern.
        path = self.path + '/*/2023-09-*'

        for file in glob.iglob(path, recursive=True):
            paths.append(file)

        return paths
    
    def FixAllPaths(self):
        print('Fixing all paths in ' + self.path)

        paths = self.FindAllNamesNeedingFixing()

        for path in paths:
            fixedPath = self.FixPath(path)
            print('Renaming ' + path + ' to ' + fixedPath)
            os.rename(path, fixedPath)

        print('Done')

"""
Main entry point.  Create an object using the provided path,
and fix all folders under that path that need fixing.
"""
if len(sys.argv) < 2:
    print('Usage: fixFilename.py <rootPath>')
    sys.exit(-1)

fixer = FilenameFixer(sys.argv[1])
fixer.FixAllPaths()
