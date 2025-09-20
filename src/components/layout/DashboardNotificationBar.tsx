import NotificationCenter from '@/components/notifications/NotificationCenter';

export default function DashboardNotificationBar() {
  return (
    <div className="flex items-center justify-end">
      <NotificationCenter />
    </div>
  );
}