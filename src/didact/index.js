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
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot,
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
}

function commitRoot() {
  deletions.forEach(commitWork);
  // mount completed dom nodes
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
}

function commitWork(fiber) {
  // recursively commit work(mount dom nodes)
  if (!fiber) return;
  const domParent = fiber.parent.dom;

  if (fiber.effectTag === "PLACEMENT" && fiber.dom !== null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom !== null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag === "DELETION") {
    domParent.removeChild(fiber.dom);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function createDom(fiber) {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  const isProperty = ([name]) => name !== "children";

  // copy element props to dom node
  Object.entries(fiber.props)
    .filter(isProperty)
    .forEach(([name, value]) => (dom[name] = value));

  return dom;
}

const isEvent = (key) => key.startsWith("on");
const isProperty = (key) => key != children && !isEvent(key);
const isNew = (prev, next) => (key) => prev[key] !== next[key];
const isGone = (prev, next) => (key) => !(key in next);
function updateDom(dom, prevProps, nextProps) {
  // remove old or changed event handlers
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => isGone(prevProps, nextProps)(key) || !(key in nextProps))
    .forEach((key) => {
      const eventType = key.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[key]);
    });

  // remove old props
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((key) => (dom[key] = ""));

  // set new/changed props
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((key) => (dom[key] = nextProps[key]));

  // attach new event handlers
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((key) => {
      const eventType = key.toLowerCase().substring(2);
      dom.addEventListener(eventType, prevProps[key]);
    });
}

function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let prevSibling = null;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;

  // 굳이 forEach 말고 while 사용하는 이유?
  // 동기적으로 실행하기 위함?
  while (index < element.length || oldFiber !== null) {
    const element = elements[index];

    let newFiber = null;

    // compare old fiber to element
    // 매번 새로 만들지 말고 있는 dom node를 사용해서 업데이트만 해줌
    const sameType = oldFiber && element && oldFiber.type === element.type;

    if (sameType) {
      // update
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
      };
    }

    if (element && !sameType) {
      // 노드 추가
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT",
      };
    }

    if (oldFiber && !sameType) {
      // 노드 삭제
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber);
    }

    // 다음 fiber 선택
    oldFiber = oldFiber.sibling;

    // children은 링크드 리스트 형태
    if (index === 0) wipFiber.child = newFiber;
    else prevSibling.sibling = newFiber;

    prevSibling = newFiber;
    index++;
  }
}

// prevent render job from hogging main thread for too long
let nextUnitOfWork = null;
let wipRoot = null;
let currentRoot = null;
let deletions = null;
function workloop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  // 모든 작업 완료
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  // runs callback when main thread is idle: yield
  // react uses scheduler package instead, which is conceptually the same
  requestIdleCallback(workloop);
}
// start workloop
requestIdleCallback(workloop);

// 작업들은 fiber tree 형태로 관리 -> 다음 작업을 쉽게 찾기 위함
// unitOfWork는 각 element 당 하나씩 생성
function performUnitOfWork(fiber) {
  // add element to dom
  if (!fiber.dom) fiber.dom = createDom(fiber);

  // if (fiber.parent) fiber.parent.dom.append(fiber.dom); // 완료되기 전까지 마운트 방지

  // create fibers for children
  const elements = fiber.props.children;

  // reconcile children
  reconcileChildren(fiber, elements);

  // select next unit of work
  // child -> sibling -> uncle 순
  if (fiber.child) return fiber.child;
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) return nextFiber.sibling;
    nextFiber = nextFiber.parent;
  }
}
