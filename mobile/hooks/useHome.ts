import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getHome, refreshHome } from '@/services/api';

export function useHome(childId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['home', childId],
    queryFn: () => getHome(childId!),
    enabled: !!childId,
    staleTime: 4 * 60 * 60 * 1000,
  });

  const refresh = useMutation({
    mutationFn: () => refreshHome(childId!),
    onSuccess: (data) => {
      queryClient.setQueryData(['home', childId], data);
    },
  });

  return {
    content: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refresh: refresh.mutate,
    isRefreshing: refresh.isPending,
  };
}
