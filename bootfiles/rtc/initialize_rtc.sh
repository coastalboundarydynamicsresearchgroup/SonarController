#!/bin/bash

mkdir -p /usr/local/bin/rtc
cp ./rtc_define.py /usr/local/bin/rtc
cp ./get_time_from_rtc.py /usr/local/bin/rtc
cp ./set_time_from_rtc.py /usr/local/bin/rtc
cp ./set_rtc_datetime.py /usr/local/bin/rtc
(crontab -l ; echo "@reboot /usr/bin/python3 /usr/local/bin/rtc/set_time_from_rtc.py") 2>&1 | grep -v "no crontab" | sort | uniq | crontab -

python3 ./set_rtc_datetime.py