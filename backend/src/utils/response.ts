import { Response } from 'express';

export function sendSuccess<T>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = 200
): void {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function sendError(
  res: Response,
  message: string,
  statusCode: number = 500,
  error?: string
): void {
  res.status(statusCode).json({
    success: false,
    message,
    error: error || message,
  });
}
