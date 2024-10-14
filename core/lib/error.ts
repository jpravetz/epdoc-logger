export class LoggerError extends Error {
  errors: Error[] | Record<string, Error> = [];

  constructor(message: string) {
    super(message);
    this.name = 'LoggerError';
  }
}
