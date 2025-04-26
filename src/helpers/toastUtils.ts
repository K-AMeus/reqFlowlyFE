
const TOAST_EVENT = "app:showToast";

export interface ToastConfig {
  type: "success" | "error" | "info" | "warning";
  message: string;
  duration?: number;
}

export const showGlobalToast = (
  type: ToastConfig["type"],
  message: string,
  duration: number = 5000
): void => {
  const event = new CustomEvent<ToastConfig>(TOAST_EVENT, {
    detail: {
      type,
      message,
      duration,
    },
  });

  document.dispatchEvent(event);
};


export const registerToastHandler = (
  handler: (config: ToastConfig) => void
): (() => void) => {
  const eventListener = (event: Event) => {
    const toastEvent = event as CustomEvent<ToastConfig>;
    handler(toastEvent.detail);
  };

  document.addEventListener(TOAST_EVENT, eventListener);

  return () => {
    document.removeEventListener(TOAST_EVENT, eventListener);
  };
};
