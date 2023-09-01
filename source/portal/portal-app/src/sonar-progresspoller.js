import { useState, useEffect } from 'react';
import './App.css';

import configuration from './configuration/configuration.json';
const baseBackendUrl = 'http://' + configuration.services.backend.host + ':' + configuration.services.backend.port;


const PollProgress = () => {
    const messages = document.getElementById('messages');
    fetch(baseBackendUrl + '/sonar/deploy/progress', { method: 'GET', mode: 'cors' })
    .then(data => data.json())
    .then(response => {
      if (messages) {
        // TODO
      }
      const progressfield = document.getElementById('progress');
      if (progressfield && response.status) {
        progressfield.value = response.status;
      }
    });

    setTimeout(PollProgress, 1000);
}


class progressPoller {
  constructor() {
    console.log(`progressPoller launching poll`);
    PollProgress();
  }
}

class SonarProgressPollerSingleton {
  constructor() {
    throw new Error('Use SonarProgressPollerSingleton.getInstance()');
  }
  
  static getInstance() {
    if (!SonarProgressPollerSingleton.instance) {
        SonarProgressPollerSingleton.instance = new progressPoller();
    }
    return SonarProgressPollerSingleton.instance;
  }
}

export default SonarProgressPollerSingleton;
