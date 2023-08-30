import { useState, useEffect } from 'react';
import './App.css';
import configuration from './configuration/configuration.json';
const baseBackendUrl = 'http://' + configuration.services.backend.host + ':' + configuration.services.backend.port;


const SonarPingData = ({pingdata}) => {
    var pingdataint = [];
    if (pingdata) {
        console.log(`Expanding string of length ${pingdata.length}`);
        for (var i = 0; i < pingdata.length; i+=2) {
            const val = parseInt(pingdata.substring(i, i+2), 16);
            pingdataint.push(val);
        } 
        console.log(`Ping Data: ${pingdataint}`);
    }

    var keyval = 0;
    var brightness = 1;
    const brightness_field = document.getElementById("resp_brightness");
    if (brightness_field) {
      brightness = brightness_field.value;
    }

    const makeColor = (val) => {
      const grey = val * brightness;
      return `rgb(${grey},${grey},${grey})`;
    }

    return (
        <div className="sonardata">
          {pingdataint.map(val => (
            <div className="pingdata" key={keyval++} style={{backgroundColor: makeColor(val)}} > 
            </div>
          ))}
        </div>
    )
}

export default SonarPingData;
