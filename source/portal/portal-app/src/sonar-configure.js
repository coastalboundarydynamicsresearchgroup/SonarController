import { useState, useEffect } from 'react';
import './App.css';
import configuration from './configuration/configuration.json';
const baseBackendUrl = 'http://' + configuration.services.backend.host + ':' + configuration.services.backend.port;


const SonarConfigure = () => {
    const [configurations, setConfigurations] = useState([]);

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
    
    
    const handleConfigurationSelectionClick = () => {
      }
    
    
    return (
        <div className="configuration-management">
            Hi
          <div className="configuration-controls">
            <input id="newconfiguration" type="text"></input>
            <select name="configurationsselectlist" id="configurationsselectlist" onChange={handleConfigurationSelectionClick} size="9">
              {configurations.map(configuration => (
                <option key={configuration} value={configuration}>{configuration}</option>
              ))}
             </select>
           </div>
        </div>
    )
}

export default SonarConfigure;
