import { AxiosError } from 'axios';

/**
 * Code d'erreur stable renvoyé par l'API (`GlobalExceptionFilter`), en
 * SCREAMING_SNAKE : BUSINESS_NOT_FOUND, INVALID_CREDENTIALS, TOO_MANY_REQUESTS…
 * C'est cette clé qu'il faut tester, jamais le message, qui n'est pas traduit.
 */
export function errorCode(err: unknown): string | undefined {
  return (err as AxiosError<{ code?: string }>)?.response?.data?.code;
}

/**
 * Traduit les codes communs à tous les écrans. Renvoie `undefined` si le code
 * est spécifique à la page, à elle de le traiter.
 */
export function commonErrorKey(err: unknown): string | undefined {
  return errorCode(err) === 'TOO_MANY_REQUESTS' ? 'common.tooManyRequests' : undefined;
}
