import { useState, useEffect } from 'react';
import './App.css';
import SonarConfigField from './sonar-configfield';
import configuration from './configuration/configuration.json';
const baseBackendUrl = 'http://' + configuration.services.backend.host + ':' + configuration.services.backend.port;


const SonarConfigBoxNormal = ({onChangeFunc}) => {
    return (
        <div className="configurationbox">
          <div className="configurationgroup">
            Deployment
            <div className="configurationrow">
              <SonarConfigField fieldname="minutes" fieldTitle="Minutes after hour" initialValue="5" onChangeFunc={onChangeFunc}></SonarConfigField>
              <SonarConfigField fieldname="pingdatapoints" fieldTitle="Ping Data Points" initialValue="500" onChangeFunc={onChangeFunc}></SonarConfigField>
            </div>
            <div className="configurationrow">
              <SonarConfigField fieldname="downwardsamplingtime" fieldTitle="Minutes for Downward Sampling" initialValue="0" onChangeFunc={onChangeFunc}></SonarConfigField>
              <SonarConfigField fieldname="scansamplingtime" fieldTitle="Minutes for Scan Sampling" initialValue="0" onChangeFunc={onChangeFunc}></SonarConfigField>
            </div>
          </div>

          <div className="configurationgroup">
            Downward
            <div className="configurationrow">
              <SonarConfigField fieldname="downwardrange" fieldTitle="Range (m)" initialValue="4" onChangeFunc={onChangeFunc}></SonarConfigField>
              <SonarConfigField fieldname="downwardfrequency" fieldTitle="Frequency (kHz)" initialValue="165" onChangeFunc={onChangeFunc}></SonarConfigField>
              <SonarConfigField fieldname="downwardlogf" fieldTitle="logf (dB)" initialValue="1" onChangeFunc={onChangeFunc}></SonarConfigField>
              <SonarConfigField fieldname="downwardstartgain" fieldTitle="Start Gain" initialValue="30" onChangeFunc={onChangeFunc}></SonarConfigField>
            </div>
            <div className="configurationrow">
              <SonarConfigField fieldname="downwardsampleperiod" fieldTitle="Seconds between Samples" initialValue="600" onChangeFunc={onChangeFunc}></SonarConfigField>
              <SonarConfigField fieldname="downwardabsorption" fieldTitle="Absorption" initialValue="60" onChangeFunc={onChangeFunc}></SonarConfigField>
              <SonarConfigField fieldname="downwardpulselength" fieldTitle="Pulse Length" initialValue="4" onChangeFunc={onChangeFunc}></SonarConfigField>
            </div>
          </div>

          <div className="configurationgroup">
            Scan
            <div className="configurationrow">
              <SonarConfigField fieldname="scanrange" fieldTitle="Range (m)" initialValue="2" onChangeFunc={onChangeFunc}></SonarConfigField>
              <SonarConfigField fieldname="scanfrequency" fieldTitle="Frequency (kHz)" initialValue="165" onChangeFunc={onChangeFunc}></SonarConfigField>
              <SonarConfigField fieldname="scanlogf" fieldTitle="logf (dB)" initialValue="1" onChangeFunc={onChangeFunc}></SonarConfigField>
              <SonarConfigField fieldname="scanstartgain" fieldTitle="Start Gain" initialValue="30" onChangeFunc={onChangeFunc}></SonarConfigField>
            </div>
            <div className="configurationrow">
              <SonarConfigField fieldname="scansampleperiod" fieldTitle="Seconds between Samples" initialValue="600" onChangeFunc={onChangeFunc}></SonarConfigField>
              <SonarConfigField fieldname="scanabsorption" fieldTitle="Absorption" initialValue="60" onChangeFunc={onChangeFunc}></SonarConfigField>
              <SonarConfigField fieldname="scanpulselength" fieldTitle="Pulse Length (uSec)" initialValue="20" onChangeFunc={onChangeFunc}></SonarConfigField>
            </div>
          </div>
        </div>
    )
}

export default SonarConfigBoxNormal;
