import { useState, useEffect } from 'react';
import { isAxiosError } from 'axios';
import { getUsers, createUser, updateUser, resetPassword, deleteUser } from '../../api/users';
import { getLines } from '../../api/lines';
import { Button, Card, Input, Select, Badge, Modal } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { page, table } from '../../design';
import { ROLE_LABELS } from '../../domain';

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [lines, setLines] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<{ username: string; password: string; full_name: string; email: string; role: string; assigned_line_ids: number[] }>({
    username: '', password: '', full_name: '', email: '', role: 'LINE_MANAGER', assigned_line_ids: [],
  });
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
    setForm({ username: '', password: '', full_name: '', email: '', role: 'LINE_MANAGER', assigned_line_ids: [] });
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
      assigned_line_ids: Array.isArray(user.line_ids)
        ? user.line_ids.map(Number)
        : user.assigned_line_id
          ? [Number(user.assigned_line_id)]
          : [],
    });
    setShowForm(true);
  };

  const toggleLine = (lineId: number) => {
    setForm(prev => ({
      ...prev,
      assigned_line_ids: prev.assigned_line_ids.includes(lineId)
        ? prev.assigned_line_ids.filter(id => id !== lineId)
        : [...prev.assigned_line_ids, lineId],
    }));
  };

  const lineNames = (user: any): string => {
    const ids: number[] = Array.isArray(user.line_ids) && user.line_ids.length
      ? user.line_ids.map(Number)
      : user.assigned_line_id
        ? [Number(user.assigned_line_id)]
        : [];
    return ids
      .map(id => lines.find(l => l.line_id === id)?.line_name)
      .filter(Boolean)
      .join(', ') || '—';
  };

  const handleSave = async () => {
    const needsLine = form.role === 'LINE_MANAGER' || form.role === 'SUPERVISOR';
    if (needsLine && form.assigned_line_ids.length === 0) {
      toast('error', 'Assign at least one production line to this line manager');
      return;
    }

    try {
      if (editing) {
        const payload: any = {
          full_name: form.full_name,
          email: form.email,
          role: form.role,
          assigned_line_ids: form.assigned_line_ids,
        };
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
          assigned_line_ids: form.assigned_line_ids,
        });
        toast('success', 'User created');
      }
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      const message = isAxiosError(err)
        ? (err.response?.data as { message?: string } | undefined)?.message
        : undefined;
      toast('error', message || 'Failed to save the user');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Deactivate this user?')) {
      await deleteUser(id);
      fetchUsers();
    }
  };

  return (
    <div className={page.shell}>
      <div className={page.header}>
        <div>
          <h1 className={page.title}>User Management</h1>
          <p className={page.subtitle}>Manage system users and their role assignments</p>
        </div>
        <Button onClick={openCreate}>Add User</Button>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className={table.headRow}>
                <th className="px-5 py-3 font-medium">Username</th>
                <th className="px-5 py-3 font-medium">Full Name</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Assigned Lines</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={table.body}>
              {users.map(user => (
                <tr key={user.user_id} className={table.row}>
                  <td className="px-5 py-3 font-medium text-ink">{user.username}</td>
                  <td className="px-5 py-3 text-ink-soft">{user.full_name}</td>
                  <td className="px-5 py-3">
                    <Badge status={user.role === 'ADMIN' ? 'default' : 'on_target'} size="sm">{ROLE_LABELS[user.role] ?? user.role}</Badge>
                  </td>
                  <td className="px-5 py-3 text-ink-soft">
                    {lineNames(user)}
                  </td>
                  <td className="px-5 py-3 text-right space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(user)}>Edit</Button>
                    <Button variant="ghost" size="sm" className="text-risk hover:text-risk" onClick={() => handleDelete(user.user_id)}>Deactivate</Button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className={table.empty}>No users found.</td>
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
          options={[{ value: 'LINE_MANAGER', label: 'Line Manager' }, { value: 'ADMIN', label: 'Admin' }]} />
        <div className="space-y-[6px]">
          <p className="text-[12px] font-semibold text-cool-gray uppercase tracking-wider font-sans">
            Assigned Lines
          </p>
          <p className="text-xs text-muted font-sans">
            A line manager can manage several lines. Select every line this user should see.
          </p>
          <div className="max-h-52 overflow-y-auto rounded-lg border border-rule divide-y divide-rule">
            {lines.length === 0 && (
              <p className="px-3 py-2 text-xs text-muted">No production lines configured.</p>
            )}
            {lines.map(line => (
              <label key={line.line_id} className="flex items-center gap-3 px-3 py-2 text-sm text-ink-soft cursor-pointer hover:bg-raw-cotton/60">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-rule text-ink focus:ring-ink/20"
                  checked={form.assigned_line_ids.includes(line.line_id)}
                  onChange={() => toggleLine(line.line_id)}
                />
                <span className="flex-1">{line.line_name}</span>
                <span className="text-[11px] uppercase tracking-wide text-muted">
                  {line.line_type === 'CUTTING' ? 'Cutting' : 'Sewing'}
                </span>
              </label>
            ))}
          </div>
          {form.assigned_line_ids.length > 0 && (
            <p className="text-xs text-muted font-sans">
              {form.assigned_line_ids.length} line{form.assigned_line_ids.length === 1 ? '' : 's'} selected
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
