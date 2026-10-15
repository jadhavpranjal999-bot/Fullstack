import logo from './logo.svg';
import './App.css';

function App() {

  return (
   <div id="container">
    <h1>Simple Calculator</h1>
    <input id="a" type="number" placeholder='Enter First Number'/>
    <input id="b" type="number" placeholder='Enter second Number'/>
    <br/>
    <button onClick={() => {
      let a=Number(document.getElementById("a").value);
      let b=Number(document.getElementById("b").value);
      alert("Addition =" +(a+b));
    }}> 
    Add </button>

    <button onClick={() => {
      let a=Number(document.getElementById("a").value);
      let b=Number(document.getElementById("b").value);
      alert("Subtraction =" +(a-b));
    }}> 
    Subtraction </button>
<br/>
<button onClick={() => {
      let a=Number(document.getElementById("a").value);
      let b=Number(document.getElementById("b").value);
      alert("Mulitiplication =" +(a*b));
    }}> 
    Mulitiplication </button>

    <button onClick={() => {
      let a=Number(document.getElementById("a").value);
      let b=Number(document.getElementById("b").value);
      alert("Divison =" +(a/b));
    }}> 
    Divison </button>

    
    
   </div>
  );
}

export default App;