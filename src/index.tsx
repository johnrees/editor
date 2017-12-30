import * as React from "react";
import * as ReactDOM from "react-dom";
import Scene from "./scene";

class App extends React.Component {
  render() {
    return <Scene width={600} height={600} bgColor={0x333333} />;
  }
}

ReactDOM.render(<App />, document.getElementById("main"));
