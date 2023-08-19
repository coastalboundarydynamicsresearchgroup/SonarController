import { useState, useEffect } from 'react';
import './App.css';
import configuration from './configuration/configuration.json';
const baseBackendUrl = 'http://' + configuration.services.backend.host + ':' + configuration.services.backend.port;

const SonarConfigButtons = ({getStateFunc, onCreateFunc, onSaveFunc, onDeleteFunc, onDeployFunc}) => {

  const GetSelectedConfiguration = () => {
    var selectedConfiguration = -1;
    const configurationsSelectList = document.getElementById("configurationsselectlist");
    if (configurationsSelectList) {
      selectedConfiguration = configurationsSelectList.selectedIndex;
    }

    return selectedConfiguration;
  }

  const CreateButtonEnabled = () => {
    return GetSelectedConfiguration() >= 0 && getStateFunc('nametouched');
  }

  const SaveButtonEnabled = () => {
    return GetSelectedConfiguration() >= 0 && getStateFunc('valuetouched');
  }

  const DeleteButtonEnabled = () => {
    return GetSelectedConfiguration() >= 0 && !getStateFunc('nametouched');
  }

  const DeployButtonEnabled = () => {
    return GetSelectedConfiguration() >= 0 && !getStateFunc('nametouched') && !getStateFunc('valuetouched');
  }

  return (
    <div className="configuration-buttons">
      <div className="configuration-buttonrow">
        <button type="button" id="create-button" disabled={!CreateButtonEnabled()} onClick={onCreateFunc}>
            Create
        </button>

        <button type="button" id="save-button" disabled={!SaveButtonEnabled()} onClick={onSaveFunc}>
            Save
        </button>
      </div>

      <div className="configuration-buttonrow">
        <button type="button" id="delete-button" disabled={!DeleteButtonEnabled()} onClick={onDeleteFunc}>
            Delete
        </button>
      </div>

      <div className="configuration-buttonrow">
        <button type="button" id="deploy-button" disabled={!DeployButtonEnabled()} onClick={onDeployFunc}>
            Deploy
        </button>
      </div>
    </div>
  )
}

export default SonarConfigButtons;

