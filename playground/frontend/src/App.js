import React from 'react';
import { useNavigate } from "react-router-dom";
const App = () => {
  const navigate = useNavigate();
  const redirect_text=()=>{
    navigate('/text')
  }

  return (
    <div className="relative text-white bg-black font-mono w-full h-screen flex flex-col items-center justify-start pt-10">
      <h1 className="text-4xl mb-16">Team G-299's Playground</h1>
      <div className="flex-col flex">
        <div><button onClick={redirect_text} className="h-32 mt-12 max-w-76 w-76 pl-4 pr-4 rounded border-white border-2 transition-all duration-300 ease-in-out hover:bg-white hover:text-black hover:scale-105 hover:font-bold">Text CAPTCHA - Powered by <i>svg-captcha</i>&nbsp;&nbsp;</button></div>
         </div>
    </div>
  );
};

export default App;
