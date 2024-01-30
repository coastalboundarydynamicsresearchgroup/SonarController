import { useState, useEffect } from 'react';
import './App.css';
import { DistributeConfiguration, WriteConfiguration, DeleteConfiguration } from './sonar-configpersist';
import SendSwitchCommand from './sonar-communication';
import SonarProgressPollerSingleton from './sonar-progresspoller';
import configuration from './configuration/configuration.json';
import SonarConfigButtons from './sonar-configbuttons'
const baseBackendUrl = 'http://' + configuration.services.backend.host + ':' + configuration.services.backend.port;


const SonarConfigure = ({getState, setState, onTestClicked, onPingData, test}) => {
  const [configurations, setConfigurations] = useState([]);
  const [configurationChanged, setConfigurationChanged] = useState(0);
  const [selectedConfiguration, setSelectedConfiguration] = useState(0);
  const [deployButtonLabel, setDeployButtonLabel] = useState("Deploy");

  useEffect(() => {
    const messages = document.getElementById('messages');
    fetch(baseBackendUrl + '/configurations', { method: 'GET', mode: 'cors' })
    .then(data => data.json())
    .then(response => {
      setConfigurations([...response]);
      if (messages) {
        messages.value += 'Retrieved configurations ' + response + '\n'
      }
      document.getElementById("configurationsselectlist").selectedIndex = selectedConfiguration;
      const configName = document.getElementById("configurationsselectlist").value;
      document.getElementById("newconfiguration").value = configName;
      if (configName) {
        fetch(baseBackendUrl + '/configuration/' + configName, { method: 'GET', mode: 'cors' })
        .then(data => data.json())
        .then(response => {
          DistributeConfiguration(response);
          setState('nametouched', false);
          setState('valuetouched', false);
          if (messages) {
            messages.value += `Retrieved configuration ${configName}\n`;
          }
        });
      }
    });
  }, [configurationChanged, selectedConfiguration]);
  
  const onCreate = () => {
    WriteConfiguration(() => {
      setConfigurationChanged(configurationChanged + 1);
    });
  }

  const onSave = () => {
    WriteConfiguration(() => {
      setConfigurationChanged(configurationChanged + 1);
    });
  }
  
  const onDelete = () => {
    DeleteConfiguration(() => {
      setSelectedConfiguration(0);
      setConfigurationChanged(configurationChanged + 1);
    });
  }

  const onDeploy = () => {
    if (test) {
      SendSwitchCommand(test, (pingdata) => {
        onPingData(pingdata);
      });
    } else {
      console.log(`Deploying configuration`);
      GetDeployResponse();
    }
  }

  const onDownload = () => {
    var init = {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Content-type': 'application/json'
      }
    };
    
    fetch(baseBackendUrl + '/dataset', init)
    .then(data => data.json())
    .then(response => {
      console.log(response)
      const fileName = response.filename + '.zip';
      const aTag = document.createElement("a");
      aTag.href = "/sonar/archive/" + fileName;         // Root '/' is the nodejs /public folder
      aTag.setAttribute("download", "/sonar/archive/" + fileName);
      document.body.appendChild(aTag);
      aTag.click();
      aTag.remove();
    });
  }

  const GetDeployResponse = () => {
    const messages = document.getElementById('messages');

    var init = {
      method: 'PUT',
      mode: 'cors',
      headers: {
        'Content-type': 'application/json'
      }
    };
    
    var deployFlag = true;
    var progressSingleton = SonarProgressPollerSingleton.getInstance();
    if (progressSingleton.progress) {
      deployFlag = !progressSingleton.progress.deploying && !progressSingleton.progress.deployrunning;
    }
  
    const configurationName = document.getElementById("newconfiguration").value;
    const commandUrl = deployFlag ? '/sonar/deploy/' + configurationName : '/sonar/undeploy'
    fetch(baseBackendUrl + commandUrl, init)
    .then(data => data.json())
    .then(response => {
      if (response.status === 201) {
        messages.value += 'Sent deploy command with status ' + response.status + '\n';
        messages.value += response.response + '\n';
        if (response.progress) {
          console.log(`Got deploy/undeploy response with deploying ${response.progress.deploying} and deployrunning ${response.progress.deployrunning}`);
          deployFlag = !response.progress.deploying /*&& !response.progress.deployrunning*/;
          setDeployButtonLabel(deployFlag ? "Deploy" : "Undeploy");
        }
      }
      else {
        messages.value += 'Error sending deploy command with status ' + response.status + '\n';
      }
    });
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
      <SonarConfigButtons getStateFunc={getState} deployButtonLabel={deployButtonLabel} onCreateFunc={onCreate} onSaveFunc={onSave} onDeleteFunc={onDelete} onDeployFunc={onDeploy} onDownloadFunc={onDownload} onTestClicked={onTestClicked} test={test} />
    </div>
  )
}



export default SonarConfigure;
