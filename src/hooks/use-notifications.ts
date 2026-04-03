import { useState } from "react";

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default",
  );

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (typeof Notification === "undefined") return "denied";
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  };

  const sendNotification = (
    title: string,
    body: string,
    data?: { url: string },
  ) => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;

    new Notification(title, {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data,
    });
  };

  return { permission, requestPermission, sendNotification };
}
