import * as Didact from "./didact";

function App({ name }) {
  return <h1>{name}</h1>;
}

const element = <App name="foo" />;
const container = document.getElementById("root");
Didact.render(element, container);
