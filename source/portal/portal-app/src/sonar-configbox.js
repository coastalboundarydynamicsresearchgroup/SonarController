import { useState, useEffect } from 'react';
import './App.css';
import SonarConfigField from './sonar-configfield';
import configuration from './configuration/configuration.json';
const baseBackendUrl = 'http://' + configuration.services.backend.host + ':' + configuration.services.backend.port;


const SonarConfigBox = () => {

    const HandleFieldChange = (fieldName, value) => {
      console.log(`New value: ${value}`);
    }

    return (
        <div className="configurationbox">
          <div className="configurationgroup">
            Deployment
            <div className="configurationrow">
              <SonarConfigField fieldname="minutes" fieldTitle="Minutes after hour" initialValue="5"></SonarConfigField>
              <SonarConfigField fieldname="pencilbeamcount" fieldTitle="Pencil Beam Images to Average" initialValue="1"></SonarConfigField>
              <SonarConfigField fieldname="sampleperiod" fieldTitle="Seconds between Samples" initialValue="600"></SonarConfigField>
              <SonarConfigField fieldname="beamdatapoints" fieldTitle="Beam Data Points" initialValue="50"></SonarConfigField>
            </div>
            <div className="configurationrow">
              <SonarConfigField fieldname="serialsendchoice" fieldTitle="Serial Send Choice" initialValue="0"></SonarConfigField>
              <SonarConfigField fieldname="azimuthincrement" fieldTitle="Azimuth Increment in degrees" initialValue="2.40000"></SonarConfigField>
              <SonarConfigField fieldname="downwardsamplingtime" fieldTitle="Minutes for Downward Sampling" initialValue="0"></SonarConfigField>
            </div>
          </div>

          <div className="configurationgroup">
            Downward
            <div className="configurationrow">
              <SonarConfigField fieldname="downwardpencilbeamrange" fieldTitle="Pencil Beam Range" initialValue="4"></SonarConfigField>
              <SonarConfigField fieldname="downwardfrequency" fieldTitle="Frequency" initialValue="165"></SonarConfigField>
              <SonarConfigField fieldname="downwardpencilbeamlogf" fieldTitle="Pencil Beam logf Value" initialValue="1"></SonarConfigField>
              <SonarConfigField fieldname="downwardpencilbeamstartgain" fieldTitle="Pencil Beam Start Gain" initialValue="30"></SonarConfigField>
            </div>
            <div className="configurationrow">
              <SonarConfigField fieldname="downwardpencilbeamabsorption" fieldTitle="Pencil Beam Absorption" initialValue="60"></SonarConfigField>
              <SonarConfigField fieldname="downwardpencilbeampulselength" fieldTitle="Pencil Beam Pulse Length" initialValue="4"></SonarConfigField>
            </div>
          </div>

          <div className="configurationgroup">
            3D
            <div className="configurationrow">
              <SonarConfigField fieldname="3dpencilbeamrange" fieldTitle="Pencil Beam Range" initialValue="2"></SonarConfigField>
              <SonarConfigField fieldname="3dfrequency" fieldTitle="Frequency" initialValue="165"></SonarConfigField>
              <SonarConfigField fieldname="3dpencilbeamlogf" fieldTitle="Pencil Beam logf Value" initialValue="1"></SonarConfigField>
              <SonarConfigField fieldname="3dpencilbeamstartgain" fieldTitle="Pencil Beam Start Gain" initialValue="30"></SonarConfigField>
            </div>
            <div className="configurationrow">
              <SonarConfigField fieldname="3dpencilbeamabsorption" fieldTitle="Pencil Beam Absorption" initialValue="60"></SonarConfigField>
              <SonarConfigField fieldname="3dpencilbeampulselength" fieldTitle="Pencil Beam Pulse Length" initialValue="20"></SonarConfigField>
              <SonarConfigField fieldname="3dmodechoice" fieldTitle="3D Mode Choice" initialValue="1"></SonarConfigField>
            </div>
          </div>
        </div>
    )
}

export default SonarConfigBox;
