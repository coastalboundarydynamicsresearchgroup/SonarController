import { useState, useEffect } from 'react';
import './App.css';
import configuration from './configuration/configuration.json';
const baseBackendUrl = 'http://' + configuration.services.backend.host + ':' + configuration.services.backend.port;


const SonarConfigField = ({fieldname, fieldTitle, initialValue}) => {

    return (
        <div className="configurationfield">
            {fieldTitle}
          <input id={fieldname} type="text" defaultValue={initialValue}></input>
        </div>
    )
}

export default SonarConfigField;
