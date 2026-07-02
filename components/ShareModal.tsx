'use client';

import { useState, useEffect } from 'react';
import { X, UserPlus, Trash2, Copy, Link, Check, Eye, Pencil, Bell, CheckCircle, XCircle } from 'lucide-react';
import { addCollaborator, removeCollaborator, getCollaborators, updateCollaboratorPermission } from '@/lib/supabase/collaborations';
import { getPendingRequests, approveRequest, denyRequest } from '@/lib/supabase/access-requests';
import { Collaboration } from '@/types';
import type { AccessRequest } from '@/lib/supabase/access-requests';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  paperId: string;
  paperTitle: string;
  isOwner: boolean;
}

export default function ShareModal({ isOpen, onClose, paperId, paperTitle, isOwner }: ShareModalProps) {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'edit' | 'view'>('edit');
  const [collaborators, setCollaborators] = useState<Collaboration[]>([]);
  const [pendingRequests, setPendingRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && paperId) {
      loadData();
    }
  }, [isOpen, paperId]);

  const loadData = async () => {
    setLoading(true);
    const [collabData, requestData] = await Promise.all([
      getCollaborators(paperId),
      isOwner ? getPendingRequests(paperId) : Promise.resolve([]),
    ]);
    setCollaborators(collabData);
    setPendingRequests(requestData);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!email.trim() || !isOwner) return;
    setAdding(true);
    setError(null);
    const result = await addCollaborator(paperId, email.trim().toLowerCase(), permission);
    if (result) {
      setCollaborators(prev => [...prev, result]);
      setEmail('');
      // Send notification email
      await fetch('/api/email/notify-approved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesterEmail: email.trim().toLowerCase(), paperTitle, paperId, permission, approved: true }),
      });
    } else {
      setError('Failed to add collaborator. They may already have access.');
    }
    setAdding(false);
  };

  const handleRemove = async (collabId: string) => {
    const success = await removeCollaborator(collabId);
    if (success) setCollaborators(prev => prev.filter(c => c.id !== collabId));
  };

  const handleUpdatePermission = async (collabId: string, currentPermission: 'edit' | 'view') => {
    if (!isOwner) return;
    const newPermission = currentPermission === 'edit' ? 'view' : 'edit';
    const success = await updateCollaboratorPermission(collabId, newPermission);
    if (success) {
      setCollaborators(prev => prev.map(c => c.id === collabId ? { ...c, permission: newPermission } : c));
    } else {
      setError('Failed to update permission.');
    }
  };

  const handleApprove = async (req: AccessRequest) => {
    const added = await addCollaborator(paperId, req.requester_email, 'edit');
    if (added) {
      await approveRequest(req.id);
      setPendingRequests(prev => prev.filter(r => r.id !== req.id));
      setCollaborators(prev => [...prev, added]);
      await fetch('/api/email/notify-approved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesterEmail: req.requester_email, paperTitle, paperId, permission: 'edit', approved: true }),
      });
    }
  };

  const handleDeny = async (req: AccessRequest) => {
    await denyRequest(req.id);
    setPendingRequests(prev => prev.filter(r => r.id !== req.id));
    await fetch('/api/email/notify-approved', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requesterEmail: req.requester_email, paperTitle, paperId, approved: false }),
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/paper/${paperId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(26, 26, 46, 0.4)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <div
        className="rounded-xl w-full max-w-lg flex flex-col"
        style={{ background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4" style={{ borderBottom: '1px solid #e2e5ea' }}>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: '#1a1a2e' }}>Share Paper</h2>
            <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{paperTitle}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md transition-colors" style={{ color: '#9ca3af' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f3f6'; e.currentTarget.style.color = '#374151'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}>
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Copy Link */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#9ca3af' }}>Collaboration Link</label>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center px-3 py-2 rounded-lg text-sm truncate" style={{ background: '#f8f9fb', border: '1px solid #e2e5ea', color: '#6b7280' }}>
                <Link size={14} className="shrink-0 mr-2" />
                <span className="truncate">{typeof window !== 'undefined' ? `${window.location.origin}/paper/${paperId}` : ''}</span>
              </div>
              <button onClick={handleCopyLink} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all shrink-0"
                style={{ background: copied ? '#e8f5ee' : '#fff', color: copied ? '#2a7d5f' : '#4b5563', border: `1px solid ${copied ? '#a7d7c5' : '#d1d5db'}` }}>
                {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
              </button>
            </div>
          </div>

          {/* Pending Requests (owner only) */}
          {isOwner && pendingRequests.length > 0 && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: '#d97706' }}>
                <Bell size={12} /> Pending Requests ({pendingRequests.length})
              </label>
              <div className="space-y-2">
                {pendingRequests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg"
                    style={{ background: '#fefce8', border: '1px solid #fde68a' }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#1a1a2e' }}>{req.requester_name || req.requester_email}</p>
                      <p className="text-[11px]" style={{ color: '#9ca3af' }}>{req.requester_email}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => handleApprove(req)} title="Approve"
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                        style={{ background: '#e8f5ee', color: '#2a7d5f', border: '1px solid #c4e5d3' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#d1eddf')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#e8f5ee')}>
                        <CheckCircle size={13} /> Approve
                      </button>
                      <button onClick={() => handleDeny(req)} title="Deny"
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                        style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#fee2e2')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#fef2f2')}>
                        <XCircle size={13} /> Deny
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Collaborator */}
          {isOwner && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#9ca3af' }}>Add Collaborator</label>
              <div className="flex gap-2 mb-2">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
                  placeholder="collaborator@email.com"
                  className="flex-1 px-3 py-2 text-sm rounded-lg" style={{ border: '1px solid #d1d5db', color: '#1a1a2e' }} />
                <button onClick={handleAdd} disabled={adding || !email.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
                  style={{ background: '#2a7d5f' }}
                  onMouseEnter={(e) => { if (!adding) e.currentTarget.style.background = '#236b50'; }}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#2a7d5f')}>
                  <UserPlus size={15} /> {adding ? 'Adding...' : 'Add'}
                </button>
              </div>
              {/* View / Edit Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: '#9ca3af' }}>Access level:</span>
                <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #d1d5db' }}>
                  <button onClick={() => setPermission('view')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
                    style={{ background: permission === 'view' ? '#e8f5ee' : '#fff', color: permission === 'view' ? '#2a7d5f' : '#6b7280' }}>
                    <Eye size={12} /> View
                  </button>
                  <button onClick={() => setPermission('edit')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
                    style={{ background: permission === 'edit' ? '#e8f5ee' : '#fff', color: permission === 'edit' ? '#2a7d5f' : '#6b7280', borderLeft: '1px solid #d1d5db' }}>
                    <Pencil size={12} /> Edit
                  </button>
                </div>
              </div>
              {error && <p className="text-xs mt-1.5" style={{ color: '#dc2626' }}>{error}</p>}
            </div>
          )}

          {/* Collaborators List */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#9ca3af' }}>
              Collaborators {collaborators.length > 0 && `(${collaborators.length})`}
            </label>
            {loading ? (
              <p className="text-sm py-4 text-center" style={{ color: '#9ca3af' }}>Loading...</p>
            ) : collaborators.length === 0 ? (
              <div className="text-center py-6 rounded-lg" style={{ background: '#f8f9fb', border: '1px solid #e2e5ea' }}>
                <p className="text-sm" style={{ color: '#9ca3af' }}>No collaborators yet</p>
                <p className="text-xs mt-1" style={{ color: '#c4c9d1' }}>Add people above or share the link</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {collaborators.map((collab) => (
                  <div key={collab.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg"
                    style={{ background: '#f8f9fb', border: '1px solid #e2e5ea' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: '#6b7280' }}>
                        {collab.collaborator_email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: '#1a1a2e' }}>{collab.collaborator_email}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {isOwner ? (
                             <button
                               onClick={() => handleUpdatePermission(collab.id, collab.permission as 'edit' | 'view')}
                               className={`flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded transition-colors hover:opacity-80 cursor-pointer ${
                                 collab.permission === 'view' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-700'
                               }`}
                               title="Click to toggle permission"
                             >
                               {collab.permission === 'view' ? <><Eye size={9} /> View</> : <><Pencil size={9} /> Edit</>}
                             </button>
                          ) : (
                             collab.permission === 'view'
                              ? <span className="flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: '#eef2ff', color: '#4f46e5' }}><Eye size={9} /> View</span>
                              : <span className="flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: '#e8f5ee', color: '#2a7d5f' }}><Pencil size={9} /> Edit</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {isOwner && (
                      <button onClick={() => handleRemove(collab.id)} className="p-1.5 rounded-md transition-colors" style={{ color: '#c4c9d1' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.background = '#fef2f2'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#c4c9d1'; e.currentTarget.style.background = 'transparent'; }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
