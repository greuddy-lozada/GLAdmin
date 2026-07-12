import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOptimisticCrud } from '../use-optimistic-crud';

interface TestItem {
  id: string;
  name: string;
}

interface CreateDTO {
  name: string;
}

interface UpdateDTO {
  name: string;
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const defaultItems: TestItem[] = [
  { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', name: 'Item 1' },
  { id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901', name: 'Item 2' },
  { id: 'c3d4e5f6-a7b8-9012-cdef-123456789012', name: 'Item 3' },
];

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
};

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function defaultOptions(
  queryFn: ReturnType<typeof vi.fn<() => Promise<TestItem[]>>>,
  createFn: ReturnType<typeof vi.fn<(data: CreateDTO) => Promise<TestItem>>>,
  updateFn: ReturnType<typeof vi.fn<(id: string, data: UpdateDTO) => Promise<TestItem>>>,
  deleteFn: ReturnType<typeof vi.fn<(id: string) => Promise<void>>>,
) {
  return { queryKey: ['test-items'] as string[], queryFn, createFn, updateFn, deleteFn };
}

describe('useOptimisticCrud', () => {
  let queryClient: QueryClient;
  let queryFn: ReturnType<typeof vi.fn<() => Promise<TestItem[]>>>;
  let createFn: ReturnType<typeof vi.fn<(data: CreateDTO) => Promise<TestItem>>>;
  let updateFn: ReturnType<typeof vi.fn<(id: string, data: UpdateDTO) => Promise<TestItem>>>;
  let deleteFn: ReturnType<typeof vi.fn<(id: string) => Promise<void>>>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    queryFn = vi.fn().mockResolvedValue(defaultItems);
    createFn = vi.fn();
    updateFn = vi.fn();
    deleteFn = vi.fn();
  });

  // --- 1. Basic query ---

  test('returns items from queryFn and isLoading transitions to false', async () => {
    const { result } = renderHook(
      () => useOptimisticCrud<TestItem, CreateDTO, UpdateDTO>(defaultOptions(queryFn, createFn, updateFn, deleteFn)),
      { wrapper: createWrapper(queryClient) },
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.items).toEqual([]);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.items).toEqual(defaultItems);
    expect(queryFn).toHaveBeenCalledOnce();
  });

  // --- 2. Create mutation ---

  test('calls createFn with the provided data', async () => {
    const d = deferred<TestItem>();
    createFn.mockReturnValueOnce(d.promise);

    const { result } = renderHook(
      () => useOptimisticCrud<TestItem, CreateDTO, UpdateDTO>(defaultOptions(queryFn, createFn, updateFn, deleteFn)),
      { wrapper: createWrapper(queryClient) },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      result.current.create.mutate({ name: 'New Item' });
    });

    expect(createFn).toHaveBeenCalledWith({ name: 'New Item' });

    d.resolve({ id: 'new-real-id', name: 'New Item' });
  });

  test('optimistically adds item with tempId at the start of the list', async () => {
    const d = deferred<TestItem>();
    createFn.mockReturnValueOnce(d.promise);

    const { result } = renderHook(
      () => useOptimisticCrud<TestItem, CreateDTO, UpdateDTO>(defaultOptions(queryFn, createFn, updateFn, deleteFn)),
      { wrapper: createWrapper(queryClient) },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.create.mutate({ name: 'Optimistic' });
    });

    await waitFor(() => {
      expect(result.current.items[0]?.name).toBe('Optimistic');
    });

    expect(result.current.items).toHaveLength(defaultItems.length + 1);
    expect(result.current.items[0].id).toMatch(/^temp-/);

    d.resolve({ id: 'real-id', name: 'Optimistic' });
  });

  test('revalidates on settle after create', async () => {
    const d = deferred<TestItem>();
    createFn.mockReturnValueOnce(d.promise);

    const { result } = renderHook(
      () => useOptimisticCrud<TestItem, CreateDTO, UpdateDTO>(defaultOptions(queryFn, createFn, updateFn, deleteFn)),
      { wrapper: createWrapper(queryClient) },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const updatedItems = [...defaultItems, { id: 'new-real-id', name: 'New Item' }];
    queryFn.mockResolvedValueOnce(updatedItems);

    await act(async () => {
      result.current.create.mutate({ name: 'New Item' });
    });

    d.resolve({ id: 'new-real-id', name: 'New Item' });

    await waitFor(() => {
      expect(queryFn).toHaveBeenCalledTimes(2);
    });
  });

  // --- 3. Update mutation ---

  test('calls updateFn with correct id (string)', async () => {
    const d = deferred<TestItem>();
    updateFn.mockReturnValueOnce(d.promise);

    const targetId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const { result } = renderHook(
      () => useOptimisticCrud<TestItem, CreateDTO, UpdateDTO>(defaultOptions(queryFn, createFn, updateFn, deleteFn)),
      { wrapper: createWrapper(queryClient) },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      result.current.update.mutate({ id: targetId, data: { name: 'Updated' } });
    });

    expect(updateFn).toHaveBeenCalledWith(targetId, { name: 'Updated' });

    d.resolve({ id: targetId, name: 'Updated' });
  });

  test('optimistically updates item in cache', async () => {
    const d = deferred<TestItem>();
    updateFn.mockReturnValueOnce(d.promise);

    const targetId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const { result } = renderHook(
      () => useOptimisticCrud<TestItem, CreateDTO, UpdateDTO>(defaultOptions(queryFn, createFn, updateFn, deleteFn)),
      { wrapper: createWrapper(queryClient) },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.update.mutate({ id: targetId, data: { name: 'Updated' } });
    });

    await waitFor(() => {
      expect(result.current.items.find((i) => i.id === targetId)?.name).toBe('Updated');
    });

    expect(result.current.items).toHaveLength(defaultItems.length);

    d.resolve({ id: targetId, name: 'Updated' });
  });

  // --- 4. Delete mutation ---

  test('calls deleteFn with correct id (string)', async () => {
    const d = deferred<void>();
    deleteFn.mockReturnValueOnce(d.promise);

    const targetId = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
    const { result } = renderHook(
      () => useOptimisticCrud<TestItem, CreateDTO, UpdateDTO>(defaultOptions(queryFn, createFn, updateFn, deleteFn)),
      { wrapper: createWrapper(queryClient) },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      result.current.remove.mutate(targetId);
    });

    expect(deleteFn).toHaveBeenCalledWith(targetId);

    d.resolve();
  });

  test('optimistically removes item from cache', async () => {
    const d = deferred<void>();
    deleteFn.mockReturnValueOnce(d.promise);

    const targetId = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
    const { result } = renderHook(
      () => useOptimisticCrud<TestItem, CreateDTO, UpdateDTO>(defaultOptions(queryFn, createFn, updateFn, deleteFn)),
      { wrapper: createWrapper(queryClient) },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.remove.mutate(targetId);
    });

    await waitFor(() => {
      expect(result.current.items).toHaveLength(defaultItems.length - 1);
    });

    expect(result.current.items.find((i) => i.id === targetId)).toBeUndefined();

    d.resolve();
  });

  // --- 5. Error handling ---

  test('reverts optimistic add when createFn rejects', async () => {
    const d = deferred<TestItem>();
    createFn.mockReturnValueOnce(d.promise);

    const { result } = renderHook(
      () => useOptimisticCrud<TestItem, CreateDTO, UpdateDTO>(defaultOptions(queryFn, createFn, updateFn, deleteFn)),
      { wrapper: createWrapper(queryClient) },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.create.mutate({ name: 'Fail Item' });
    });

    await waitFor(() => {
      expect(result.current.items[0]?.name).toBe('Fail Item');
    });

    await act(async () => {
      d.reject(new Error('Network error'));
    });

    await waitFor(() => {
      expect(result.current.items).toEqual(defaultItems);
    });
  });

  test('reverts optimistic update when updateFn rejects', async () => {
    const d = deferred<TestItem>();
    updateFn.mockReturnValueOnce(d.promise);

    const targetId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const { result } = renderHook(
      () => useOptimisticCrud<TestItem, CreateDTO, UpdateDTO>(defaultOptions(queryFn, createFn, updateFn, deleteFn)),
      { wrapper: createWrapper(queryClient) },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.update.mutate({ id: targetId, data: { name: 'Fail Update' } });
    });

    await waitFor(() => {
      expect(result.current.items.find((i) => i.id === targetId)?.name).toBe('Fail Update');
    });

    await act(async () => {
      d.reject(new Error('Update failed'));
    });

    await waitFor(() => {
      const reverted = result.current.items.find((i) => i.id === targetId);
      expect(reverted?.name).toBe('Item 1');
    });
  });

  test('reverts optimistic delete when deleteFn rejects', async () => {
    const d = deferred<void>();
    deleteFn.mockReturnValueOnce(d.promise);

    const targetId = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
    const { result } = renderHook(
      () => useOptimisticCrud<TestItem, CreateDTO, UpdateDTO>(defaultOptions(queryFn, createFn, updateFn, deleteFn)),
      { wrapper: createWrapper(queryClient) },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.remove.mutate(targetId);
    });

    await waitFor(() => {
      expect(result.current.items).toHaveLength(defaultItems.length - 1);
    });

    await act(async () => {
      d.reject(new Error('Delete failed'));
    });

    await waitFor(() => {
      expect(result.current.items).toHaveLength(defaultItems.length);
      expect(result.current.items.find((i) => i.id === targetId)).toBeDefined();
    });
  });

  // --- 6. Temp ID generation ---

  test('getTempId generates UUID-like strings by default', async () => {
    const d = deferred<TestItem>();
    createFn.mockReturnValueOnce(d.promise);

    const { result } = renderHook(
      () => useOptimisticCrud<TestItem, CreateDTO, UpdateDTO>(defaultOptions(queryFn, createFn, updateFn, deleteFn)),
      { wrapper: createWrapper(queryClient) },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.create.mutate({ name: 'A' });
    });

    await waitFor(() => {
      expect(result.current.items[0]?.id).toMatch(
        /^temp-[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i,
      );
    });

    d.resolve({ id: 'real-id', name: 'A' });
  });

  test('uses custom getTempId when provided', async () => {
    const d = deferred<TestItem>();
    createFn.mockReturnValueOnce(d.promise);

    const customGetTempId = vi.fn().mockReturnValue('custom-temp-id-123');

    const { result } = renderHook(
      () =>
        useOptimisticCrud<TestItem, CreateDTO, UpdateDTO>({
          queryKey: ['test-items'],
          queryFn,
          createFn,
          updateFn,
          deleteFn,
          getTempId: customGetTempId,
        }),
      { wrapper: createWrapper(queryClient) },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.create.mutate({ name: 'Custom' });
    });

    await waitFor(() => {
      expect(customGetTempId).toHaveBeenCalled();
    });

    expect(result.current.items[0].id).toBe('custom-temp-id-123');

    d.resolve({ id: 'real-id', name: 'Custom' });
  });

  // --- 7. Custom mergeOptimistic ---

  test('uses custom mergeOptimistic when provided', async () => {
    const d = deferred<TestItem>();
    updateFn.mockReturnValueOnce(d.promise);

    const customMerge = vi.fn((items: TestItem[], updated: TestItem) => {
      return items.map((item) => (item.id === updated.id ? { ...item, ...updated } : item));
    });

    const targetId = 'c3d4e5f6-a7b8-9012-cdef-123456789012';
    const { result } = renderHook(
      () =>
        useOptimisticCrud<TestItem, CreateDTO, UpdateDTO>({
          queryKey: ['test-items'],
          queryFn,
          createFn,
          updateFn,
          deleteFn,
          mergeOptimistic: customMerge,
        }),
      { wrapper: createWrapper(queryClient) },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.update.mutate({ id: targetId, data: { name: 'Custom Merged' } });
    });

    await waitFor(() => {
      expect(customMerge).toHaveBeenCalled();
    });

    expect(customMerge.mock.calls[0][0]).toEqual(defaultItems);
    expect(customMerge.mock.calls[0][1].id).toBe(targetId);

    const updated = result.current.items.find((i) => i.id === targetId);
    expect(updated?.name).toBe('Custom Merged');

    d.resolve({ id: targetId, name: 'Custom Merged' });
  });

  // --- 8. Edge cases ---

  test('handles create on empty list', async () => {
    const d = deferred<TestItem>();
    createFn.mockReturnValueOnce(d.promise);

    const freshQueryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const emptyQueryFn = vi.fn().mockResolvedValue([]);

    const { result } = renderHook(
      () =>
        useOptimisticCrud<TestItem, CreateDTO, UpdateDTO>({
          queryKey: ['empty-items'],
          queryFn: emptyQueryFn,
          createFn,
          updateFn,
          deleteFn,
        }),
      { wrapper: createWrapper(freshQueryClient) },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items).toEqual([]);

    act(() => {
      result.current.create.mutate({ name: 'First Item' });
    });

    await waitFor(() => {
      expect(result.current.items).toHaveLength(1);
    });

    expect(result.current.items[0].name).toBe('First Item');

    d.resolve({ id: 'real-id', name: 'First Item' });
  });

  test('update on non-existent id does not change list length', async () => {
    const d = deferred<TestItem>();
    updateFn.mockReturnValueOnce(d.promise);

    const { result } = renderHook(
      () => useOptimisticCrud<TestItem, CreateDTO, UpdateDTO>(defaultOptions(queryFn, createFn, updateFn, deleteFn)),
      { wrapper: createWrapper(queryClient) },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const lengthBefore = result.current.items.length;

    act(() => {
      result.current.update.mutate({ id: 'non-existent-id', data: { name: 'Ghost' } });
    });

    await waitFor(() => {
      expect(result.current.items).toHaveLength(lengthBefore);
    });

    d.resolve({ id: 'non-existent-id', name: 'Ghost' });
  });

  test('create.mutate sets isPending during mutation', async () => {
    const d = deferred<TestItem>();
    createFn.mockReturnValueOnce(d.promise);

    const { result } = renderHook(
      () => useOptimisticCrud<TestItem, CreateDTO, UpdateDTO>(defaultOptions(queryFn, createFn, updateFn, deleteFn)),
      { wrapper: createWrapper(queryClient) },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.create.mutate({ name: 'Pending' });
    });

    await waitFor(() => {
      expect(result.current.create.isPending).toBe(true);
    });

    await act(async () => {
      d.resolve({ id: 'resolved-id', name: 'Resolved' });
    });

    await waitFor(() => {
      expect(result.current.create.isPending).toBe(false);
    });
  });
});
