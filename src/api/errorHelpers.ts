import axios from 'axios';

type FriendlyApiErrorOptions = {
  fallbackMessage: string;
  warmingUpMessage?: string;
  queryTooLongMessage?: string;
};

const DEFAULT_WARMING_UP_MESSAGE = 'Services are warming up. Please retry in a few seconds.';

const isWarmupLikeFailure = (status: number | undefined, code: string | undefined): boolean => {
  return status === 502 || status === 503 || status === 504 || code === 'ECONNABORTED' || !status;
};

const isQueryTooLongValidation = (status: number | undefined, serverError: string): boolean => {
  return status === 400 && /(cannot exceed\s+1000|q\s+cannot\s+exceed|max\s*1000|too long)/i.test(serverError);
};

export const getFriendlyApiError = (
  err: unknown,
  {
    fallbackMessage,
    warmingUpMessage = DEFAULT_WARMING_UP_MESSAGE,
    queryTooLongMessage,
  }: FriendlyApiErrorOptions
): string => {
  if (!axios.isAxiosError(err)) {
    return fallbackMessage;
  }

  const status = err.response?.status;
  const code = err.code;
  const serverError = typeof err.response?.data?.error === 'string' ? err.response.data.error : '';

  if (queryTooLongMessage && isQueryTooLongValidation(status, serverError)) {
    return queryTooLongMessage;
  }

  if (status === 429) {
    return 'Too many requests right now. Please wait a moment and try again.';
  }

  if (isWarmupLikeFailure(status, code)) {
    return warmingUpMessage;
  }

  return fallbackMessage;
};
