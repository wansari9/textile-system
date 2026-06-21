import { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, resetPassword, deleteUser } from '../../api/users';
import { getLines } from '../../api/lines';
import { Button, Card, Input, Select, Badge, Modal } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [lines, setLines] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ username: '', password: '', full_name: '', email: '', role: 'SUPERVISOR', assigned_line_id: '' });
  const { toast } = useToast();

  const fetchUsers = async () => {
    const res = await getUsers();
    if (res.success) setUsers(res.data);
  };

  useEffect(() => {
    fetchUsers();
    getLines().then(res => res.success && setLines(res.data)).catch(() => {});
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ username: '', password: '', full_name: '', email: '', role: 'SUPERVISOR', assigned_line_id: '' });
    setShowForm(true);
  };

  const openEdit = (user: any) => {
    setEditing(user);
    setForm({
      username: user.username,
      password: '',
      full_name: user.full_name,
      email: user.email || '',
      role: user.role,
      assigned_line_id: user.assigned_line_id?.toString() || '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (editing) {
      const payload: any = { full_name: form.full_name, email: form.email, role: form.role };
      if (form.assigned_line_id) payload.assigned_line_id = Number(form.assigned_line_id);
      await updateUser(editing.user_id, payload);
      if (form.password) await resetPassword(editing.user_id, form.password);
      toast('success', 'User updated');
    } else {
      await createUser({
        username: form.username,
        password: form.password,
        full_name: form.full_name,
        email: form.email || undefined,
        role: form.role,
        assigned_line_id: form.assigned_line_id ? Number(form.assigned_line_id) : undefined,
      });
      toast('success', 'User created');
    }
    setShowForm(false);
    fetchUsers();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Deactivate this user?')) {
      await deleteUser(id);
      fetchUsers();
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">User Management</h1>
          <p className="text-sm text-text-muted mt-1">Manage system users and their role assignments</p>
        </div>
        <Button onClick={openCreate}>Add User</Button>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-text-muted uppercase tracking-wider bg-gray-50/50">
                <th className="px-5 py-3 font-medium">Username</th>
                <th className="px-5 py-3 font-medium">Full Name</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Assigned Line</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map(user => (
                <tr key={user.user_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-text-primary">{user.username}</td>
                  <td className="px-5 py-3 text-text-secondary">{user.full_name}</td>
                  <td className="px-5 py-3">
                    <Badge variant={user.role === 'ADMIN' ? 'purple' : 'info'} size="sm">{user.role}</Badge>
                  </td>
                  <td className="px-5 py-3 text-text-secondary">
                    {lines.find(l => l.line_id === user.assigned_line_id)?.line_name || '-'}
                  </td>
                  <td className="px-5 py-3 text-right space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(user)}>Edit</Button>
                    <Button variant="ghost" size="sm" className="text-danger-600 hover:text-danger-700" onClick={() => handleDelete(user.user_id)}>Deactivate</Button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-text-muted">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit User' : 'Create User'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? 'Update User' : 'Create User'}</Button>
          </>
        }
      >
        <Input label="Username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} disabled={!!editing} />
        <Input label="Full Name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
        <Input label="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        <Input label={editing ? 'New Password (leave blank to keep)' : 'Password'} type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
        <Select label="Role" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
          options={[{ value: 'SUPERVISOR', label: 'Supervisor' }, { value: 'ADMIN', label: 'Admin' }]} />
        <Select label="Assigned Line" value={form.assigned_line_id} onChange={e => setForm({ ...form, assigned_line_id: e.target.value })}
          options={lines.map(l => ({ value: l.line_id, label: l.line_name }))} placeholder="No line" />
      </Modal>
    </div>
  );
}
