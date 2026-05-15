export class AppError extends Error {
  statusCode: number;
  errorCode: string;

  constructor(message: string, statusCode = 500, errorCode = "SERVER_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}
