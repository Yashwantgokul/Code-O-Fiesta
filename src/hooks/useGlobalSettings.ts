import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useGlobalSettings() {
  const { data, error, mutate } = useSWR('/api/settings', fetcher, {
    refreshInterval: 5000, // Poll every 5s for near real-time updates
  });

  return {
    strictMode: data?.strictMode ?? true, // Default to true for safety
    copyPasteBlocker: data?.copyPasteBlocker ?? false,
    isLoading: !error && !data,
    isError: !!error,
    mutate,
  };
}
