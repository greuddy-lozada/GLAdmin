import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface OptimisticCrudOptions<T, CreateDTO, UpdateDTO> {
  queryKey: string[];
  queryFn: () => Promise<T[]>;
  createFn: (data: CreateDTO) => Promise<T>;
  updateFn: (id: number, data: UpdateDTO) => Promise<T>;
  deleteFn: (id: number) => Promise<void>;
  getTempId?: () => number;
  buildOptimistic?: (data: CreateDTO, tempId: number) => T;
  mergeOptimistic?: (items: T[], updated: T) => T[];
}

const defaultGetTempId = () => -Date.now();

function defaultBuildOptimistic<CreateDTO>(data: CreateDTO, tempId: number) {
  return { id: tempId, ...data } as unknown as never;
}

function defaultMerge<T extends { id: number }>(items: T[], updated: T): T[] {
  return items.map((item) => (item.id === updated.id ? updated : item));
}

export function useOptimisticCrud<T extends { id: number }, CreateDTO = Partial<T>, UpdateDTO = Partial<T>>(
  options: OptimisticCrudOptions<T, CreateDTO, UpdateDTO>,
) {
  const queryClient = useQueryClient();
  const getTempId = options.getTempId ?? defaultGetTempId;
  const buildOptimistic = options.buildOptimistic ?? defaultBuildOptimistic<CreateDTO>;
  const mergeOptimistic = options.mergeOptimistic ?? defaultMerge<T>;

  const { data: items = [], isLoading } = useQuery({
    queryKey: options.queryKey,
    queryFn: options.queryFn,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateDTO) => options.createFn(data),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: options.queryKey });
      const previous = queryClient.getQueryData<T[]>(options.queryKey);
      const tempId = getTempId();
      const optimistic = buildOptimistic(newData, tempId);
      queryClient.setQueryData<T[]>(options.queryKey, (old) => [optimistic, ...(old ?? [])]);
      return { previous, tempId };
    },
    onError: (_err, _data, context) => {
      if (context?.previous) {
        queryClient.setQueryData(options.queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: options.queryKey });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateDTO }) => options.updateFn(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: options.queryKey });
      const previous = queryClient.getQueryData<T[]>(options.queryKey);
      queryClient.setQueryData<T[]>(options.queryKey, (old) => {
        if (!old) return old;
        const dummy = { ...old.find((i) => i.id === id), ...data, id } as unknown as T;
        return mergeOptimistic(old, dummy);
      });
      return { previous };
    },
    onError: (_err, _data, context) => {
      if (context?.previous) {
        queryClient.setQueryData(options.queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: options.queryKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => options.deleteFn(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: options.queryKey });
      const previous = queryClient.getQueryData<T[]>(options.queryKey);
      queryClient.setQueryData<T[]>(options.queryKey, (old) =>
        (old ?? []).filter((item) => item.id !== id),
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(options.queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: options.queryKey });
    },
  });

  return {
    items,
    isLoading,
    create: { mutate: createMutation.mutate, isPending: createMutation.isPending },
    update: { mutate: updateMutation.mutate, isPending: updateMutation.isPending },
    remove: { mutate: deleteMutation.mutate, isPending: deleteMutation.isPending },
  };
}
