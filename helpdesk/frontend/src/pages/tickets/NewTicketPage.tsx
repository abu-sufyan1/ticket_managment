import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { createTicket } from '../../api/tickets';

const schema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().min(10, 'Please describe the issue in more detail'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
});
type FormData = z.infer<typeof schema>;

const inputClass = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function NewTicketPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { priority: 'MEDIUM' } });

  const mutation = useMutation({
    mutationFn: createTicket,
    onSuccess: () => navigate('/tickets/mine'),
  });

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Submit a support ticket</h1>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <input {...register('subject')} className={inputClass} placeholder="Brief summary of your issue" />
          {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            {...register('description')}
            rows={5}
            className={inputClass}
            placeholder="Describe the issue in detail…"
          />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <select {...register('priority')} className={inputClass}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>

        {mutation.isError && <p className="text-red-500 text-sm">Failed to submit ticket. Please try again.</p>}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {mutation.isPending ? 'Submitting…' : 'Submit ticket'}
          </button>
        </div>
      </form>
    </div>
  );
}
