import { useState, useEffect } from 'react';
import './App.css';
import SonarConfigField from './sonar-configfield';
import SonarProgressField from './sonar-progressfield';
import SonarProgressPollerSingleton from './sonar-progresspoller';
import configuration from './configuration/configuration.json';
const baseBackendUrl = 'http://' + configuration.services.backend.host + ':' + configuration.services.backend.port;


const SonarConfigBoxNormal = ({onChangeFunc}) => {
  useEffect(() => {
    SonarProgressPollerSingleton.getInstance();
  }, []);

  return (
        <div className="configurationbox">
          <div className="configurationgroup">
            Deployment
            <div className="configurationrow">
              <SonarConfigField fieldname="minutes" fieldTitle="Minutes after hour" initialValue="5" onChangeFunc={onChangeFunc}></SonarConfigField>
              <SonarConfigField fieldname="pingdatapoints" fieldTitle="Data Points (250, 500)" initialValue="500" onChangeFunc={onChangeFunc}></SonarConfigField>
              <SonarConfigField fieldname="downwardsamplingtime" fieldTitle="Minutes for Downward Sampling" initialValue="0" onChangeFunc={onChangeFunc}></SonarConfigField>
              <SonarConfigField fieldname="scansamplingtime" fieldTitle="Minutes for Scan Sampling" initialValue="0" onChangeFunc={onChangeFunc}></SonarConfigField>
            </div>
            <div className="configurationrow">
              <SonarProgressField fieldname="progress" fieldTitle="Progress" initialValue=""></SonarProgressField>
            </div>
          </div>

          <div className="configurationgroup">
            Downward
            <div className="configurationrow">
              <SonarConfigField fieldname="downwardrange" fieldTitle="Range (1-200m) inc=1" initialValue="4" onChangeFunc={onChangeFunc}></SonarConfigField>
              <SonarConfigField fieldname="downwardfrequency" fieldTitle="Frequency (175-1175kHz) inc=5" initialValue="165" onChangeFunc={onChangeFunc}></SonarConfigField>
              <SonarConfigField fieldname="downwardlogf" fieldTitle="Logf (10, 20, 30, 40db)" initialValue="1" onChangeFunc={onChangeFunc}></SonarConfigField>
              <SonarConfigField fieldname="downwardstartgain" fieldTitle="Start Gain (0-40db) inc=1" initialValue="30" onChangeFunc={onChangeFunc}></SonarConfigField>
            </div>
            <div className="configurationrow">
              <SonarConfigField fieldname="downwardtrainangle" fieldTitle="Train Angle (-180-180deg) inc=3" initialValue="0" onChangeFunc={onChangeFunc}></SonarConfigField>
            </div>
            <div className="configurationrow">
              <SonarConfigField fieldname="downwardsampleperiod" fieldTitle="Seconds between Samples" initialValue="600" onChangeFunc={onChangeFunc}></SonarConfigField>
              <SonarConfigField fieldname="downwardabsorption" fieldTitle="Absorption (0.00-2.55db) inc=0.01" initialValue="60" onChangeFunc={onChangeFunc}></SonarConfigField>
              <SonarConfigField fieldname="downwardpulselength" fieldTitle="Pulse Length (10-1000us) inc=10" initialValue="4" onChangeFunc={onChangeFunc}></SonarConfigField>
            </div>
          </div>

          <div className="configurationgroup">
            Scan
            <div className="configurationrow">
              <SonarConfigField fieldname="scanrange" fieldTitle="Range (1-200m) inc=1" initialValue="2" onChangeFunc={onChangeFunc}></SonarConfigField>
              <SonarConfigField fieldname="scanfrequency" fieldTitle="Frequency (175-1175kHz) inc=5" initialValue="165" onChangeFunc={onChangeFunc}></SonarConfigField>
              <SonarConfigField fieldname="scanlogf" fieldTitle="Logf (10, 20, 30, 40db)" initialValue="1" onChangeFunc={onChangeFunc}></SonarConfigField>
              <SonarConfigField fieldname="scanstartgain" fieldTitle="Start Gain (0-40db) inc=1" initialValue="30" onChangeFunc={onChangeFunc}></SonarConfigField>
            </div>
            <div className="configurationrow">
              <SonarConfigField fieldname="scansectorwidth" fieldTitle="Sector Width (0-360deg) inc=3" initialValue="0" onChangeFunc={onChangeFunc}></SonarConfigField>
              <SonarConfigField fieldname="scantrainangle" fieldTitle="Train Angle (-180-180deg) inc=3" initialValue="0" onChangeFunc={onChangeFunc}></SonarConfigField>
            </div>
            <div className="configurationrow">
              <SonarConfigField fieldname="scansampleperiod" fieldTitle="Seconds between Samples" initialValue="600" onChangeFunc={onChangeFunc}></SonarConfigField>
              <SonarConfigField fieldname="scanabsorption" fieldTitle="Absorption (0.00-2.55db) inc=0.01" initialValue="60" onChangeFunc={onChangeFunc}></SonarConfigField>
              <SonarConfigField fieldname="scanpulselength" fieldTitle="Pulse Length (10-1000us) inc=10" initialValue="20" onChangeFunc={onChangeFunc}></SonarConfigField>
            </div>
          </div>
        </div>
    )
}

export default SonarConfigBoxNormal;
