import { useState, useEffect } from 'react';
import './App.css';
import configuration from './configuration/configuration.json';
const baseBackendUrl = 'http://' + configuration.services.backend.host + ':' + configuration.services.backend.port;


const SonarConfigField = ({fieldname, fieldTitle, initialValue, onChangeFunc}) => {

    return (
      <div className="configurationfield">
        {fieldTitle}
        <input id={fieldname} type="text" defaultValue={initialValue} onChange={onChangeFunc}></input>
      </div>
    )
}

export default SonarConfigField;
