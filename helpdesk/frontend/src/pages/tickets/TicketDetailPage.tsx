import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTicket, updateTicket, assignTicket, createMessage } from '../../api/tickets';
import { polishReply, summarizeTicket } from '../../api/ai';
import { statusBadge, priorityBadge } from '../../utils/badges';
import { useAuth } from '../../context/AuthContext';
import type { TicketStatus } from '../../types';

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [replyBody, setReplyBody] = useState('');
  const [summary, setSummary] = useState<string | null>(null);

  const { data: ticket, isLoading, isError } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => getTicket(id!),
    enabled: !!id,
  });

  const assignMutation = useMutation({
    mutationFn: () => assignTicket(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ticket', id] }),
  });

  const statusMutation = useMutation({
    mutationFn: (status: TicketStatus) => updateTicket(id!, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ticket', id] }),
  });

  const replyMutation = useMutation({
    mutationFn: (body: string) => createMessage(id!, body),
    onSuccess: () => {
      setReplyBody('');
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
    },
  });

  const polishMutation = useMutation({
    mutationFn: (draft: string) => polishReply(id!, draft),
    onSuccess: (polished) => setReplyBody(polished),
  });

  const summarizeMutation = useMutation({
    mutationFn: () => summarizeTicket(id!),
    onSuccess: (s) => setSummary(s),
  });

  if (isLoading) return <p className="p-6 text-gray-500">Loading…</p>;
  if (isError || !ticket) return <p className="p-6 text-red-500">Ticket not found.</p>;

  const isAgent = user?.role === 'agent' || user?.role === 'admin';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-900">{ticket.subject}</h1>
          {isAgent && (
            <button
              onClick={() => summarizeMutation.mutate()}
              disabled={summarizeMutation.isPending}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              {summarizeMutation.isPending ? 'Summarising…' : '📋 Summarise'}
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2 items-center text-sm">
          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusBadge[ticket.status]}`}>
            {ticket.status.replace('_', ' ')}
          </span>
          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${priorityBadge[ticket.priority]}`}>
            {ticket.priority}
          </span>
          {ticket.category && (
            <span className="inline-block px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
              {ticket.category}
            </span>
          )}
          <span className="text-gray-500">
            by <strong>{ticket.customer.name}</strong>
          </span>
          <span className="text-gray-500">
            {ticket.assignedAgent
              ? <>assigned to <strong>{ticket.assignedAgent.name}</strong></>
              : 'unassigned'}
          </span>
        </div>
      </div>

      {/* AI Summary box */}
      {summary && (
        <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-xs font-medium text-purple-700 mb-1">AI Summary</p>
          <p className="text-sm text-purple-900">{summary}</p>
          <button onClick={() => setSummary(null)} className="text-xs text-purple-500 mt-1 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Agent action bar */}
      {isAgent && (
        <div className="flex flex-wrap gap-3 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          {ticket.assignedAgentId !== user?.id && (
            <button
              onClick={() => assignMutation.mutate()}
              disabled={assignMutation.isPending}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {assignMutation.isPending ? 'Assigning…' : 'Assign to me'}
            </button>
          )}

          <select
            value={ticket.status}
            onChange={(e) => statusMutation.mutate(e.target.value as TicketStatus)}
            disabled={statusMutation.isPending}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none"
          >
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      )}

      {/* Conversation thread */}
      <div className="space-y-4 mb-6">
        {ticket.messages.map((msg) => {
          const isCurrentUser = msg.authorId === user?.id;
          return (
            <div
              key={msg.id}
              className={`rounded-lg p-4 border ${isCurrentUser ? 'bg-blue-50 border-blue-100 ml-8' : 'bg-white border-gray-200 mr-8'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-900">{msg.author.name}</span>
                <span className="text-xs text-gray-400 capitalize">{msg.author.role}</span>
                {msg.isAiGenerated && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                    🤖 Auto-resolved
                  </span>
                )}
                <span className="text-xs text-gray-400 ml-auto">
                  {new Date(msg.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.body}</p>
            </div>
          );
        })}
      </div>

      {/* Reply box */}
      {(isAgent || ticket.customerId === user?.id) && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Add reply</h3>
          <textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            rows={4}
            placeholder="Write your reply…"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {replyMutation.isError && <p className="text-red-500 text-xs mt-1">Failed to send reply.</p>}
          <div className="flex justify-between mt-2">
            {/* Polish reply button — agents only */}
            {isAgent && (
              <button
                onClick={() => replyBody.trim() && polishMutation.mutate(replyBody)}
                disabled={polishMutation.isPending || !replyBody.trim()}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                {polishMutation.isPending ? 'Polishing…' : '✨ Polish reply'}
              </button>
            )}
            <button
              onClick={() => replyBody.trim() && replyMutation.mutate(replyBody)}
              disabled={replyMutation.isPending || !replyBody.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 ml-auto"
            >
              {replyMutation.isPending ? 'Sending…' : 'Send reply'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
