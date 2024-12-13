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
      nodeVale: text,
      children: [],
    },
  };
}
