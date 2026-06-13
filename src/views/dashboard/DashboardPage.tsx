import { Dashboard } from '../../features/dashboard/Dashboard';
import { useLkh } from '../../context/LkhContext';

export default function DashboardPage() {
  const { summary, month, outstandingCount } = useLkh();

  return <Dashboard summary={summary} month={month} outstandingCount={outstandingCount} />;
}
