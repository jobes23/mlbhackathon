import { useEffect } from "react";

const useSyncUserTasks = (userId: string | null) => {
  useEffect(() => {
    if (!userId) return;

    const syncTasks = async () => {
      try {
        const response = await fetch(import.meta.env.VITE_SYNC_USER_CHALLENGES, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
          throw new Error("Failed to sync user tasks.");
        }

        const data = await response.json();
        console.log("User tasks synced successfully:", data.message);
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error("Error syncing user tasks:", error.message);
        } else {
          console.error("Error syncing user tasks:", error);
        }
      }
    };

    syncTasks();
  }, [userId]);
};

export default useSyncUserTasks;
