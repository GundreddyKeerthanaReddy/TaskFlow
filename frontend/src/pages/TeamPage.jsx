import { useState, useEffect } from 'react';
import { Plus, Users, Mail, Shield, UserMinus, MoreVertical, Search } from 'lucide-react';
import { teamsAPI, usersAPI } from '../lib/api';
import Avatar from '../components/ui/Avatar';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import useAuthStore from '../store/authStore';

const ROLE_COLORS = {
  owner: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  member: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
};

export default function TeamPage() {
  const { user: currentUser } = useAuthStore();
  const [teams, setTeams] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [removeMemberTarget, setRemoveMemberTarget] = useState(null);
  const [teamForm, setTeamForm] = useState({ name: '', description: '', color: '#6366f1' });
  const [addMemberForm, setAddMemberForm] = useState({ userId: '', role: 'member' });
  const [saving, setSaving] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [teamsRes, usersRes] = await Promise.all([
        teamsAPI.getAll(),
        usersAPI.getAll({ limit: 50 })
      ]);
      setTeams(teamsRes.data.data);
      setAllUsers(usersRes.data.data);
      if (teamsRes.data.data.length > 0) setSelectedTeam(teamsRes.data.data[0]);
    } catch {
      toast.error('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!teamForm.name.trim()) return;
    setSaving(true);
    try {
      const { data } = await teamsAPI.create(teamForm);
      setTeams(prev => [data.data, ...prev]);
      setSelectedTeam(data.data);
      setShowCreateTeam(false);
      setTeamForm({ name: '', description: '', color: '#6366f1' });
      toast.success('Team created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create team');
    } finally {
      setSaving(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!addMemberForm.userId) return;
    setSaving(true);
    try {
      const { data } = await teamsAPI.addMember(selectedTeam._id, addMemberForm);
      setSelectedTeam(data.data);
      setTeams(prev => prev.map(t => t._id === data.data._id ? data.data : t));
      setShowAddMember(false);
      setAddMemberForm({ userId: '', role: 'member' });
      toast.success('Member added!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async () => {
    setSaving(true);
    try {
      await teamsAPI.removeMember(selectedTeam._id, removeMemberTarget._id);
      const updated = { ...selectedTeam, members: selectedTeam.members.filter(m => m.user._id !== removeMemberTarget._id) };
      setSelectedTeam(updated);
      setTeams(prev => prev.map(t => t._id === updated._id ? updated : t));
      setRemoveMemberTarget(null);
      toast.success('Member removed');
    } catch {
      toast.error('Failed to remove member');
    } finally {
      setSaving(false);
    }
  };

  const availableUsers = allUsers.filter(u =>
    !selectedTeam?.members?.some(m => m.user._id === u._id) &&
    (userSearch === '' || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()))
  );

  const isOwner = selectedTeam?.owner?._id === currentUser?._id || selectedTeam?.owner === currentUser?._id;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Team</h1>
          <p className="page-subtitle">Manage your team members and roles</p>
        </div>
        <button onClick={() => setShowCreateTeam(true)} className="btn-primary">
          <Plus size={16} /> New Team
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-16 skeleton rounded-xl" />)}
          </div>
          <div className="lg:col-span-2 h-64 skeleton rounded-xl" />
        </div>
      ) : teams.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No teams yet"
          description="Create a team to collaborate with others"
          action={<button onClick={() => setShowCreateTeam(true)} className="btn-primary"><Plus size={16} /> Create Team</button>}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Team list */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">Your Teams</h3>
            {teams.map(team => (
              <button
                key={team._id}
                onClick={() => setSelectedTeam(team)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                  selectedTeam?._id === team._id
                    ? 'border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ backgroundColor: team.color }}>
                  {team.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{team.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{team.members?.length || 0} members</p>
                </div>
              </button>
            ))}
          </div>

          {/* Team detail */}
          {selectedTeam && (
            <div className="lg:col-span-2 card p-6 space-y-5">
              {/* Team header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold" style={{ backgroundColor: selectedTeam.color }}>
                    {selectedTeam.name[0]}
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 dark:text-slate-100">{selectedTeam.name}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{selectedTeam.description || 'No description'}</p>
                  </div>
                </div>
                {isOwner && (
                  <button onClick={() => setShowAddMember(true)} className="btn-primary btn-sm">
                    <Plus size={14} /> Add Member
                  </button>
                )}
              </div>

              {/* Members */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Members ({selectedTeam.members?.length || 0})
                </h3>
                <div className="space-y-2">
                  {selectedTeam.members?.map(({ user: member, role, joinedAt }) => (
                    <div key={member._id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 group">
                      <Avatar user={member} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{member.name}</p>
                          <span className={`badge ${ROLE_COLORS[role] || ROLE_COLORS.member}`}>
                            {role === 'owner' && <Shield size={10} />}
                            {role}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{member.email}</p>
                        {member.jobTitle && <p className="text-xs text-slate-400 dark:text-slate-500">{member.jobTitle}</p>}
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs text-slate-400">
                          Joined {joinedAt ? format(new Date(joinedAt), 'MMM yyyy') : ''}
                        </span>
                        {isOwner && role !== 'owner' && (
                          <button
                            onClick={() => setRemoveMemberTarget(member)}
                            className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <UserMinus size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create team modal */}
      <Modal isOpen={showCreateTeam} onClose={() => setShowCreateTeam(false)} title="Create Team" size="sm">
        <form onSubmit={handleCreateTeam} className="space-y-4">
          <div>
            <label className="label">Team Name *</label>
            <input
              type="text"
              value={teamForm.name}
              onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
              className="input"
              placeholder="e.g. Engineering Team"
              required
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              value={teamForm.description}
              onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
              className="input resize-none"
              rows={2}
              placeholder="What does this team work on?"
            />
          </div>
          <div>
            <label className="label">Color</label>
            <input type="color" value={teamForm.color} onChange={(e) => setTeamForm({ ...teamForm, color: e.target.value })} className="h-10 w-full rounded-lg border border-slate-300 dark:border-slate-600 cursor-pointer" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowCreateTeam(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Creating...' : 'Create Team'}</button>
          </div>
        </form>
      </Modal>

      {/* Add member modal */}
      <Modal isOpen={showAddMember} onClose={() => setShowAddMember(false)} title="Add Team Member" size="sm">
        <form onSubmit={handleAddMember} className="space-y-4">
          <div>
            <label className="label">Search Users</label>
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="input mb-2"
              placeholder="Search by name or email..."
            />
            <select
              value={addMemberForm.userId}
              onChange={(e) => setAddMemberForm({ ...addMemberForm, userId: e.target.value })}
              className="input"
              required
            >
              <option value="">Select a user</option>
              {availableUsers.map(u => (
                <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Role</label>
            <select value={addMemberForm.role} onChange={(e) => setAddMemberForm({ ...addMemberForm, role: e.target.value })} className="input">
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowAddMember(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving || !addMemberForm.userId} className="btn-primary flex-1">{saving ? 'Adding...' : 'Add Member'}</button>
          </div>
        </form>
      </Modal>

      {/* Remove member confirm */}
      <ConfirmDialog
        isOpen={!!removeMemberTarget}
        onClose={() => setRemoveMemberTarget(null)}
        onConfirm={handleRemoveMember}
        title="Remove Member"
        message={`Remove ${removeMemberTarget?.name} from ${selectedTeam?.name}?`}
        confirmLabel="Remove"
        isLoading={saving}
      />
    </div>
  );
}
