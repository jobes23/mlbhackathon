import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  ReactNode
} from "react";
import { NotificationContextType, Notification } from "./types/InterfaceTypes";
import "./styles/Notification.css";

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const timeoutsRef = useRef<{ [key: number]: NodeJS.Timeout }>({});

  const removeNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
    clearTimeout(timeoutsRef.current[id]);
    delete timeoutsRef.current[id];
  }, []);

  const addNotification = useCallback(
    (type: "success" | "error" | "info", message: string, title?: string, description?: string) => {
      const id = Date.now();
      setNotifications((prev) => [...prev, { id, type, message, title, description }]);

      timeoutsRef.current[id] = setTimeout(() => removeNotification(id), 7500);
    },
    [removeNotification]
  );

  useEffect(() => {
    return () => {
      Object.values(timeoutsRef.current).forEach(clearTimeout);
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}

      {/* Notification UI */}
      <div className="notification-container">
        {notifications.map((notif) => (
          <div key={notif.id} className={`notification ${notif.type}`} role="alert">
            <div className="notification-content">
              {notif.title && <strong>{notif.title}</strong>}
              <span className="notification-message">{notif.message}</span>
              {notif.description && <p className="notification-description">{notif.description}</p>}
            </div>
            <button
              className="notification-close-btn"
              onClick={() => removeNotification(notif.id)}
              aria-label="Close notification"
            >
              ❌
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};
