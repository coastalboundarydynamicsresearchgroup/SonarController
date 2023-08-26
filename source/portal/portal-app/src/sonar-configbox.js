import { useState, useEffect } from 'react';
import './App.css';
import SonarConfigField from './sonar-configfield';
import SonarConfigBoxNormal from './sonar-configbox-normal';
import SonarConfigBoxTest from './sonar-configbox-test';
import configuration from './configuration/configuration.json';
const baseBackendUrl = 'http://' + configuration.services.backend.host + ':' + configuration.services.backend.port;


const SonarConfigBox = ({onChangeFunc, test}) => {
    return (
      <>
        {test ? <SonarConfigBoxTest onChangeFunc={onChangeFunc}/> : <SonarConfigBoxNormal onChangeFunc={onChangeFunc} />}
      </>
    );
}

export default SonarConfigBox;
