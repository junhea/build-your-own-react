// createElement
// element is a object with type and props
export function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      // children can be primitive, if so, wrap with textElement
      children: children.map((v) =>
        typeof v === "object" ? v : createTextElement(v)
      ),
    },
  };
}

// wrapper for primitive values, object 타입으로 변환하여 관리 편하게 함
// 실제 리액트에서는 이렇게 하지 않음
function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

// render function
export function render(element, container) {
  const dom =
    element.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type);

  const isProperty = ([name]) => name !== "children";

  // copy element props to dom node
  Object.entries(element.props)
    .filter(isProperty)
    .forEach(([name, value]) => (dom[name] = value));

  // render recursively
  element.props.children.forEach((child) => render(child, dom));

  // container is dom object
  container.append(dom);
}

// prevent render job from hogging main thread for too long
let nextUnitOfWork = null;
function workloop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  // runs callback when main thread is idle: yield
  // react uses scheduler package instead, which is conceptually the same
  requestIdleCallback(workloop);
}

function performUnitOfWork() {
  //TODO
}
