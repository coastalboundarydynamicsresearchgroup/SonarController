import { useState, useEffect } from 'react';
import './App.css';
import SonarConfigField from './sonar-configfield';
import SonarCheckBox from './sonar-checkbox';
import SonarProgressField from './sonar-progressfield';
import SonarUpdateField from './sonar-updatefield';
import SonarStatusLed from './sonar-statusled';
import SonarProgressPollerSingleton from './sonar-progresspoller';
import configuration from './configuration/configuration.json';
const baseBackendUrl = 'http://' + configuration.services.backend.host + ':' + configuration.services.backend.port;


const SonarConfigBoxNormal = ({onChangeFunc}) => {
  const [deploying, setDeploying] = useState(false);
  const [deployrunning, setDeployrunning] = useState(false);

  const handleProgressUpdate = (progress) => {
    console.log(progress);

    const progressfield = document.getElementById('progress');
    if (progressfield) {
      if (progress.status) {
        progressfield.value = progress.status;
      }
    }

    const timeremainingfield = document.getElementById('timeremaining');
    if (timeremainingfield) {
      if (progress.delaySec != null) {
        timeremainingfield.value = progress.delaySec;
      }
    }

    const iterationfield = document.getElementById('iteration');
    if (iterationfield) {
      if (progress.count != null) {
        iterationfield.value = progress.count;
      }
    }

    if (progress.deploying != null) {
      setDeploying(progress.deploying);
    }

    if (progress.deployrunning != null) {
      setDeployrunning(progress.deployrunning);
    }
  }

  useEffect(() => {
    SonarProgressPollerSingleton.getInstance(handleProgressUpdate);
  }, []);


  const makecolor = () => {
    return "green";
  }

  return (
        <div className="configurationbox">
          <div className="configurationgroup">
            Deployment
            <div className="configurationrow">
              <SonarConfigField fieldname="minutes" fieldTitle="Delay to start (minutes)" initialValue="5" onChangeFunc={onChangeFunc}></SonarConfigField>
              <SonarConfigField fieldname="pingdatapoints" fieldTitle="Data Points (250, 500)" initialValue="500" onChangeFunc={onChangeFunc}></SonarConfigField>
            </div>
            <div className="configurationrow">
              <SonarConfigField fieldname="sampleperiod" fieldTitle="Minutes between Samples" initialValue="0" onChangeFunc={onChangeFunc}></SonarConfigField>
              <SonarCheckBox fieldname="scancheckbox" fieldTitle="Scan" initialValue="scan" onChangeFunc={onChangeFunc}></SonarCheckBox>
              <SonarCheckBox fieldname="downwardcheckbox" fieldTitle="Downward" initialValue="downward" onChangeFunc={onChangeFunc}></SonarCheckBox>
              <SonarCheckBox fieldname="orientationcheckbox" fieldTitle="Orientation" initialValue="downward" onChangeFunc={onChangeFunc}></SonarCheckBox>
            </div>
            <div className="configurationrow">
              <SonarProgressField fieldname="progress" fieldTitle="Progress" initialValue=""></SonarProgressField>
              <SonarUpdateField fieldname="timeremaining" fieldTitle="Seconds" initialValue=""></SonarUpdateField>
              <SonarUpdateField fieldname="iteration" fieldTitle="Count" initialValue=""></SonarUpdateField>
              <SonarStatusLed fieldTitle="Deploy Starting" value={deploying}></SonarStatusLed>
              <SonarStatusLed fieldTitle="Deploy Running" value={deployrunning}></SonarStatusLed>
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
              <SonarConfigField fieldname="step_size" fieldTitle="Step Size (0-2.4deg) inc 0.3" initialValue="0" onChangeFunc={onChangeFunc}></SonarConfigField>
            </div>
            <div className="configurationrow">
              <SonarConfigField fieldname="scanabsorption" fieldTitle="Absorption (0.00-2.55db) inc=0.01" initialValue="60" onChangeFunc={onChangeFunc}></SonarConfigField>
              <SonarConfigField fieldname="scanpulselength" fieldTitle="Pulse Length (10-1000us) inc=10" initialValue="20" onChangeFunc={onChangeFunc}></SonarConfigField>
            </div>
          </div>
        </div>
    )
}

export default SonarConfigBoxNormal;
