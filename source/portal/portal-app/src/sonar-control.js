import { useState } from 'react';
import SonarConfigure from './sonar-configure';
import SonarConfigBox from './sonar-configbox';
import './App.css';

const SonarControl = () => {
    const [configNameTouched, setConfigNameTouched] = useState(false);
    const [configValueTouched, setConfigValueTouched] = useState(false);
    
    const getState = (stateName) => {
        switch(stateName)
        {
            case 'nametouched':
                console.log(`Getting state ${stateName} as ${configNameTouched}`);
                return configNameTouched;
            case 'valuetouched':
                console.log(`Getting state ${stateName} as ${configValueTouched}`);
                return configValueTouched;
            default:
                return false;
        }
    }

    const setState = (stateName, value) => {
        console.log(`Setting state ${stateName} to ${value}`);
        switch(stateName)
        {
            case 'nametouched':
                setConfigNameTouched(value);
                break;
            case 'valuetouched':
                setConfigValueTouched(value);
                break;
            default:
                break;
        }
    }


    return (
        <section className="fullpane">
        <div className="connectbar">
            <div className="titleLabel">Sonar 881 Configuration and Control</div>

            <div className="messagebar">
            <div className="messages">
                <div className="configurationsLabel">Select a configuration, edit, and deploy</div>
                <div className="configurations">
                    <SonarConfigure getState={getState} setState={setState} />
                    <SonarConfigBox  onChangeFunc={() => setState('valuetouched', true)}/>
                </div>
                <textarea name="messages" id="messages" cols="120" rows="8" readOnly></textarea>
                <textarea name="status" id="status" cols="120" rows="5" readOnly></textarea>
            </div>
            </div>

        </div>
        </section>
    );
}

export default SonarControl;
