import { useState, useEffect } from 'react';
import { Users as UsersIcon, Shield, User, UserPlus, Mail, MoreVertical, Trash2, X, Check } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null); 
  const [editingUserId, setEditingUserId] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Read Only');
  const [password, setPassword] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Failed to fetch Users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/users/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role, password })
      });

      if (res.ok) {
        setName('');
        setEmail('');
        setPassword('');
        setRole('Read Only');
        setIsAdding(false);
        await fetchUsers();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to add user");
      }
    } catch (err) {
      console.error("Error creating user:", err);
      alert("Network Error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently revoke this user's profile context?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchUsers();
      } else {
        alert("Failed to drop User profile.");
      }
    } catch (err) {
      console.error(err);
      alert("Network Error");
    }
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      const res = await fetch(`http://localhost:5000/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        setEditingUserId(null);
        await fetchUsers();
      } else {
        alert("Failed to modify User privileges.");
      }
    } catch (err) {
      console.error(err);
      alert("Network Error");
    }
  };

  return (
    <div className="animate-in" onClick={() => setOpenMenuId(null)}>
      <header style={{ marginBottom: 'var(--gap-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <UsersIcon size={28} color="var(--accent-blue)" /> Access Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Manage dashboard access constraints, roles, and notification subscriptions.
          </p>
        </div>
        
        <button 
          onClick={(e) => { e.stopPropagation(); setIsAdding(!isAdding); }}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', 
            padding: '10px 16px', background: isAdding ? 'var(--bg-secondary)' : 'var(--accent-blue)', 
            color: isAdding ? 'var(--text-primary)' : '#fff', borderRadius: 'var(--radius-sm)', 
            fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
            border: isAdding ? '1px solid var(--border-subtle)' : 'none', transition: 'all 0.2s'
          }}
        >
          {isAdding ? <><X size={16} /> Cancel</> : <><UserPlus size={16} /> Add User</>}
        </button>
      </header>

      {isAdding && (
        <form onSubmit={handleAdd} onClick={e => e.stopPropagation()} className="card" style={{ marginBottom: '24px', animation: 'fadeIn 0.3s ease-out' }}>
          <div className="card__header" style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
            <span className="card__label" style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>Add New Member</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem' }} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@airq.local" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem' }} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Temporary Password</label>
              <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="welcome123" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Access Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                <option value="Administrator">Administrator</option>
                <option value="Settings Manager">Settings Manager</option>
                <option value="Alert Responder">Alert Responder</option>
                <option value="Read Only">Read Only</option>
              </select>
            </div>
          </div>

          <button type="submit" style={{ padding: '10px 24px', background: 'var(--status-safe)', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Check size={18} /> Create User
          </button>
        </form>
      )}

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading Users...</p>
      ) : users.length === 0 ? (
        <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No active users found. Invite someone to start collaborating.
        </div>
      ) : (
        <div className="dash-section">
          {users.map((user, i) => (
            <div key={user._id} className="card" style={{ animationDelay: `${i * 0.1}s`, padding: 'var(--gap-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                    {user.avatar}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{user.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <Mail size={12} /> {user.email}
                    </div>
                  </div>
                </div>

                <div style={{ position: 'relative' }}>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === user._id ? null : user._id);
                    }} 
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
                  >
                    <MoreVertical size={18} />
                  </button>

                  {openMenuId === user._id && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      style={{ 
                        position: 'absolute', right: 0, top: '30px', background: 'var(--bg-primary)', 
                        border: '1px solid var(--border-subtle)', borderRadius: '8px', 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)', padding: '8px', zIndex: 100, minWidth: '160px' 
                      }}
                    >
                      <button 
                        onClick={() => { setEditingUserId(user._id); setOpenMenuId(null); }} 
                        style={{ display: 'flex', width: '100%', alignItems: 'center', gap: '8px', padding: '8px', border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.85rem', cursor: 'pointer', borderRadius: '4px' }}
                      >
                        <Shield size={14} /> Edit Role
                      </button>
                      <button 
                        onClick={() => { handleDelete(user._id); setOpenMenuId(null); }} 
                        style={{ display: 'flex', width: '100%', alignItems: 'center', gap: '8px', padding: '8px', border: 'none', background: 'transparent', color: 'var(--status-critical)', fontSize: '0.85rem', cursor: 'pointer', borderRadius: '4px' }}
                      >
                        <Trash2 size={14} /> Remove User
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', background: editingUserId === user._id ? 'var(--bg-secondary)' : 'var(--bg-primary)', padding: '4px 10px', borderRadius: '12px' }}>
                  {editingUserId === user._id ? (
                    <>
                      <select 
                        value={user.role} 
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: 'inherit', fontWeight: 'inherit', fontSize: 'inherit', outline: 'none', cursor: 'pointer', paddingRight: '12px' }}
                      >
                        <option value="Administrator">Administrator</option>
                        <option value="Settings Manager">Settings Manager</option>
                        <option value="Alert Responder">Alert Responder</option>
                        <option value="Read Only">Read Only</option>
                      </select>
                      <X size={14} style={{ cursor: 'pointer', opacity: 0.5 }} onClick={() => setEditingUserId(null)} />
                    </>
                  ) : (
                    <>
                      {user.role === 'Administrator' ? <Shield size={14} color="var(--accent-blue)" /> : <User size={14} />}
                      {user.role}
                    </>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: user.status === 'Active' ? 'var(--status-safe)' : 'var(--text-muted)' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: user.status === 'Active' ? 'var(--status-safe)' : 'var(--text-muted)' }} />
                  {user.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
