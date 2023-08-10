import SonarConfigure from './sonar-configure';
import SonarConfigBox from './sonar-configbox';
import './App.css';

const SonarControl = () => {


    return (
        <section className="fullpane">
        <div className="connectbar">
            <div className="titleLabel">Sonar 881 Configuration and Control</div>

            <div className="messagebar">
            <div className="messages">
                <div className="configurationsLabel">Select a configuration, edit, and deploy</div>
                <div className="configurations">
                    <SonarConfigure  />
                    <SonarConfigBox />
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
