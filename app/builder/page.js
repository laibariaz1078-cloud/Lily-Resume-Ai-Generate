import BuilderWorkspace from '@/components/BuilderWorkspace';
import {RequireAuth} from '@/components/AuthProvider';
export default function BuilderPage(){return <RequireAuth><BuilderWorkspace/></RequireAuth>}
