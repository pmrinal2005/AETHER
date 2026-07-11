'use client';
import { useAimStore } from '@/lib/store';

// "You've Got Mail!"-style toast stack (retro dialog).
export default function Notifications() {
  const { notifications, dismissNotification } = useAimStore();
  return (
    <div className="fixed bottom-10 right-2 space-y-2 z-[9999]">
      {notifications.map((n) => (
        <div key={n.id} className="window-95 w-64">
          <div className="titlebar">
            <span>📬 {n.title}</span>
            <button className="tb-btn" onClick={() => dismissNotification(n.id)}>
              ✕
            </button>
          </div>
          <div className="p-2 text-xs break-all">{n.body}</div>
          <div className="px-2 pb-2 flex justify-end">
            <button className="btn-95" onClick={() => dismissNotification(n.id)}>
              OK
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
