import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getTickets } from '../../api/tickets';
import { statusBadge, priorityBadge } from '../../utils/badges';
import type { TicketStatus, TicketPriority } from '../../types';

export default function TicketListPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['tickets', page, status, priority, search, sortBy, sortDir],
    queryFn: () =>
      getTickets({
        page,
        status: status || undefined,
        priority: priority || undefined,
        search: search || undefined,
        sortBy,
        sortDir,
      }),
  });

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  const handleFilter = () => setPage(1);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">All Tickets</h1>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); handleFilter(); }}
          placeholder="Search subject…"
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); handleFilter(); }}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none"
        >
          <option value="">All statuses</option>
          {(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as TicketStatus[]).map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
        <select
          value={priority}
          onChange={(e) => { setPriority(e.target.value); handleFilter(); }}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none"
        >
          <option value="">All priorities</option>
          {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as TicketPriority[]).map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select
          value={`${sortBy}:${sortDir}`}
          onChange={(e) => {
            const [field, dir] = e.target.value.split(':');
            setSortBy(field);
            setSortDir(dir as 'asc' | 'desc');
          }}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none"
        >
          <option value="createdAt:desc">Newest first</option>
          <option value="createdAt:asc">Oldest first</option>
          <option value="priority:desc">Priority ↓</option>
          <option value="priority:asc">Priority ↑</option>
        </select>
      </div>

      {isLoading && <p className="text-gray-500">Loading…</p>}
      {isError && <p className="text-red-500">Failed to load tickets.</p>}

      {data && (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Subject', 'Customer', 'Status', 'Priority', 'Assigned', 'Created'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <Link to={`/tickets/${ticket.id}`} className="text-blue-600 hover:underline font-medium">
                        {ticket.subject}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{ticket.customer.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusBadge[ticket.status]}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${priorityBadge[ticket.priority]}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {ticket.assignedAgent?.name ?? <span className="text-gray-400">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
              <span>{data.total} tickets — page {data.page} of {totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded disabled:opacity-40">Previous</button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 border rounded disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
