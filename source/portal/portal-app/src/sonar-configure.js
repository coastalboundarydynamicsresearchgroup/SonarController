import { useState, useEffect } from 'react';
import './App.css';
import { DistributeConfiguration, WriteConfiguration, DeleteConfiguration } from './sonar-configpersist';
import configuration from './configuration/configuration.json';
import SonarConfigButtons from './sonar-configbuttons'
const baseBackendUrl = 'http://' + configuration.services.backend.host + ':' + configuration.services.backend.port;


const SonarConfigure = ({getState, setState}) => {
    const [configurations, setConfigurations] = useState([]);
    const [configurationChanged, setConfigurationChanged] = useState(0);
    const [selectedConfiguration, setSelectedConfiguration] = useState(0);

    useEffect(() => {
      const messages = document.getElementById('messages');
      fetch(baseBackendUrl + '/configurations', { method: 'GET', mode: 'cors' })
      .then(data => data.json())
      .then(response => {
        console.log(response);
        setConfigurations([...response]);
        if (messages) {
          messages.value += 'Retrieved configurations ' + response + '\n'
        }
        console.log(`Setting selected index to ${selectedConfiguration}`)
        document.getElementById("configurationsselectlist").selectedIndex = selectedConfiguration;
      });
    }, [configurationChanged]);
    
    useEffect(() => {
      const messages = document.getElementById('messages');
      const configName = document.getElementById("newconfiguration").value;
      fetch(baseBackendUrl + '/configuration/' + configName, { method: 'GET', mode: 'cors' })
      .then(data => data.json())
      .then(response => {
        console.log(response);
        DistributeConfiguration(response);
        if (messages) {
          messages.value += 'Retrieved configuration ' + configName + ': ' + response + '\n'
        }
      });
    }, [selectedConfiguration]);
    
    
    const isDirty = () => {
        return getState('dirty');
    }

    const onCreate = () => {
      WriteConfiguration();
      setConfigurationChanged(configurationChanged + 1);
    }
  
    const onSave = () => {
      WriteConfiguration();
      setConfigurationChanged(configurationChanged + 1);
    }
  
    const onDelete = () => {
      DeleteConfiguration();
      setConfigurationChanged(configurationChanged + 1);
    }

    const onDeploy = () => {
      console.log(`Deploying configuration`);
    }

    const handleConfigurationSelectionClick = (selectedConfiguration) => {
      const messages = document.getElementById('messages');

      const clickedConfiguration = document.getElementById("configurationsselectlist").value;
      setSelectedConfiguration(document.getElementById("configurationsselectlist").selectedIndex);

      document.getElementById("newconfiguration").value = clickedConfiguration;
      setState('nametouched', false);

      messages.value += `Selected configuration ${clickedConfiguration}\n`;
    }
    
    
    return (
        <div className="configuration-management">
          <div className="configuration-controls">
            <input id="newconfiguration" type="text" onChange={() => setState('nametouched', true)}></input>
            <select name="configurationsselectlist" id="configurationsselectlist" onChange={handleConfigurationSelectionClick} size="14">
              {configurations.map(configuration => (
                <option key={configuration} value={configuration}>{configuration}</option>
              ))}
             </select>
             Configurations
           </div>
         <SonarConfigButtons getStateFunc={getState} onCreateFunc={onCreate} onSaveFunc={onSave} onDeleteFunc={onDelete} onDeployFunc={onDeploy}/>
        </div>
    )
}

export default SonarConfigure;
