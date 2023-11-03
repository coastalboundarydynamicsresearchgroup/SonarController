import './App.css';
import SonarProgressPollerSingleton from './sonar-progresspoller';

const SonarStatusLed = ({fieldTitle, value}) => {

    return (
      <div className="colordot">
        {fieldTitle}
        <span className={value ? "greendot" : "greydot"}></span>
      </div>
    )
}

export default SonarStatusLed;
