import { isAxiosError } from 'axios';

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) return fallback;

  const apiError: unknown = error.response?.data?.error;
  if (typeof apiError === 'string') return apiError;
  if (Array.isArray(apiError)) {
    const messages = apiError
      .map((item: unknown) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && 'message' in item
          && typeof item.message === 'string') return item.message;
        return null;
      })
      .filter((message): message is string => message !== null);

    if (messages.length) return messages.join(' ');
  }

  return fallback;
}
