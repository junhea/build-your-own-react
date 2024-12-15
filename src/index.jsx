import * as Didact from "./didact";

function App() {
  const [count, setCount] = Didact.useState(1);
  return <h1 onClick={() => setCount((c) => c + 1)}>Count: {count}</h1>;
}

const element = <App name="foo" />;
const container = document.getElementById("root");
Didact.render(element, container);
