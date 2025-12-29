declare module 'sql.js' {
  export interface Statement {
    run(params?: any[]): void;
    free(): void;
  }

  export interface Database {
    exec(sql: string, params?: any[]): Array<{
      columns: string[];
      values: any[][];
    }>;
    run(sql: string, params?: any[]): void;
    prepare(sql: string): Statement;
    export(): Uint8Array;
    close(): void;
  }

  export default function initSqlJs(options?: {
    locateFile?: (file: string) => string;
  }): Promise<{
    Database: new (data?: Uint8Array) => Database;
  }>;
}
