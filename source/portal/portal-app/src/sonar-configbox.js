import { useState, useEffect } from 'react';
import './App.css';
import configuration from './configuration/configuration.json';
const baseBackendUrl = 'http://' + configuration.services.backend.host + ':' + configuration.services.backend.port;


const SonarConfigBox = () => {

    return (
        <div className="configurationbox">
          <div className="configurationrow">
            <input id="newconfiguration1" type="text"></input>
            <input id="newconfiguration2" type="text"></input>
            <input id="newconfiguration3" type="text"></input>
            <input id="newconfiguration4" type="text"></input>
           </div>
           <div className="configurationrow">
            <input id="newconfiguration1" type="text"></input>
            <input id="newconfiguration2" type="text"></input>
            <input id="newconfiguration3" type="text"></input>
            <input id="newconfiguration4" type="text"></input>
           </div>
           <div className="configurationrow">
            <input id="newconfiguration1" type="text"></input>
            <input id="newconfiguration2" type="text"></input>
            <input id="newconfiguration3" type="text"></input>
            <input id="newconfiguration4" type="text"></input>
           </div>
           <div className="configurationrow">
            <input id="newconfiguration1" type="text"></input>
            <input id="newconfiguration2" type="text"></input>
            <input id="newconfiguration3" type="text"></input>
            <input id="newconfiguration4" type="text"></input>
           </div>
        </div>
    )
}

export default SonarConfigBox;
