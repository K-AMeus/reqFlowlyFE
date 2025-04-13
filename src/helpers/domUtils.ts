export const checkElementTruncation = (
  element: HTMLElement | null,
  truncatedClassName: string
): boolean => {
  if (!element) return false;

  const isTruncated = element.scrollHeight > element.clientHeight;

  if (isTruncated) {
    element.classList.add(truncatedClassName);
  } else {
    element.classList.remove(truncatedClassName);
  }

  const ellipsis = element.querySelector(".truncation-ellipsis");
  if (ellipsis) {
    element.removeChild(ellipsis);
  }

  return isTruncated;
};

export const processTruncatedElements = (
  elementsMap: { [key: string]: HTMLElement | null },
  truncatedClassName: string
): void => {
  Object.keys(elementsMap).forEach((key) => {
    checkElementTruncation(elementsMap[key], truncatedClassName);
  });
};

export const createRefCallback =
  <T extends HTMLElement>(
    refMap: React.MutableRefObject<{ [key: string]: T | null }>
  ) =>
  (id: string) =>
  (element: T | null) => {
    refMap.current[id] = element;
  };
