import './App.css';


const SonarUpdateField = ({fieldname, fieldTitle, initialValue}) => {

    return (
      <div className="updatefield">
        {fieldTitle}
        <input id={fieldname} type="text" defaultValue={initialValue} disabled={false}></input>
      </div>
    )
}

export default SonarUpdateField;
