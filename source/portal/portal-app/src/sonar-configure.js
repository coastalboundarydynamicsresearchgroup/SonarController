import { useState, useEffect } from 'react';
import './App.css';
import configuration from './configuration/configuration.json';
import SonarConfigButtons from './sonar-configbuttons'
const baseBackendUrl = 'http://' + configuration.services.backend.host + ':' + configuration.services.backend.port;


const SonarConfigure = ({getState, setState}) => {
    const [configurations, setConfigurations] = useState([]);
    const [selectedConfiguration, setSelectedConfiguration] = useState('');

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
        });
      }, []);
    
    
    const isDirty = () => {
        return getState('dirty');
    }

    const onCreate = () => {
      console.log(`Creating configuration`);
    }
  
    const onSave = () => {
        console.log(`Saving configuration`);
    }
  
    const onDelete = () => {
      console.log(`Deleting configuration`);
    }

    const onDeploy = () => {
      console.log(`Deploying configuration`);
    }

    const handleConfigurationSelectionClick = (selectedConfiguration) => {
      const clickedConfiguration = document.getElementById("configurationsselectlist").value;
      setSelectedConfiguration(clickedConfiguration);

      document.getElementById("newconfiguration").value = clickedConfiguration;
      setState('nametouched', false);
      console.log(`Selected configuration ${clickedConfiguration}`);
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
