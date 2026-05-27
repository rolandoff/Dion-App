import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listMemories, createMemory } from '@/services/api';
import type { MemoryType } from '@/services/api';

export function useMemories(childId: string | undefined, type?: MemoryType) {
  return useQuery({
    queryKey: ['memories', childId, type],
    queryFn: () => listMemories(childId!, type),
    enabled: !!childId,
  });
}

export function useCreateMemory(childId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMemory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories', childId] });
      queryClient.invalidateQueries({ queryKey: ['home', childId] });
    },
  });
}
