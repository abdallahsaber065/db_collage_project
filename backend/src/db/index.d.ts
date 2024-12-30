// Type definitions for our lightweight mssql compatibility layer.

export interface Transaction {
  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export interface Request {
  input(name: string, type?: any, value?: any): Request;
  query(text: string): Promise<{ recordset: any[] }>;
}

export interface SqlType {
  Int: any;
  VarChar: (...args: any[]) => any;
  Date: any;
  Decimal?: any;
  Transaction: { new(pool: any): Transaction };
  Request: { new(ctx: any): Request };
}

export const sql: SqlType;
export const pool: any;
export const poolConnect: Promise<void>;
