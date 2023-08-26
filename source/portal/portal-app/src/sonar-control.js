import { useState } from 'react';
import SonarConfigure from './sonar-configure';
import SonarConfigBox from './sonar-configbox';
import './App.css';

const SonarControl = () => {
    const [configNameTouched, setConfigNameTouched] = useState(false);
    const [configValueTouched, setConfigValueTouched] = useState(false);
    const [test, setTest] = useState(false);
    
    const getState = (stateName) => {
        switch(stateName)
        {
            case 'nametouched':
                return configNameTouched;
            case 'valuetouched':
                return configValueTouched;
            default:
                return false;
        }
    }

    const setState = (stateName, value) => {
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

    const onTestClicked = () => {
      if (test) {
          setTest(false);
      } else {
          setTest(true);
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
                    <SonarConfigure getState={getState} setState={setState} onTestClicked={onTestClicked} />
                    <SonarConfigBox  onChangeFunc={() => setState('valuetouched', true)} test={test}/>
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
