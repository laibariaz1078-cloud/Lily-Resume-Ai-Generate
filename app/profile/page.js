import AccountView from '@/components/AccountView';
import { RequireAuth } from '@/components/AuthProvider';
import StudioShell from '@/components/StudioShell';

export default function ProfilePage() {
  return <RequireAuth><StudioShell><AccountView /></StudioShell></RequireAuth>;
}
