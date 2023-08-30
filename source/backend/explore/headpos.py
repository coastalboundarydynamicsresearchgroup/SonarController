
sonar_data = [0, 0, 0, 0, 0, 124, 71]
high_byte = (sonar_data[6] & 63) << 7
low_byte = (sonar_data[5] & 127)
value = high_byte | low_byte
print('High Byte: ' + str(high_byte) + ", Low Byte: " + str(low_byte) + ", value: " + str(value))
headpos = (((sonar_data[6] & 63) << 7 | (sonar_data[5] & 127)) - 600) * 0.3

print('Head position = ' + str(headpos))