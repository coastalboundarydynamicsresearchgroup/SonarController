class Parse881:
    data_keys = ["File", "scan_index", "headposition", "stepdirection", "range", "profilerange",
                  "tempExternal", "tempInternal", "depth", "pitch", "roll", "heading", "gyroheading", "pingdata"]


    def __init__(self):
        pass


    def make_parse_data(self) -> object:

        parsed_data = {}
        for key in Parse881.data_keys:
            parsed_data[key] = ''

        return parsed_data


    def defumigate(self, lowbyte, highbyte):
        #return highbyte << 7 | lowbyte & 0x7f
        return (highbyte & 0x3f) << 7 | (lowbyte & 0x7f)
    

    def write_csv_header(file):
        header = ','.join(Parse881.data_keys) + '\n'
        file.write(header)
        print(f'Header: {header.strip()}')

    def write_csv_data(self, file, parsed_data):
        data = []
        for key in Parse881.data_keys:
            data.append(str(parsed_data[key]))
        data_line = ','.join(data) + '\n'
        file.write(data_line)
            