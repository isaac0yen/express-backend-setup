import "dotenv/config";
import { Pool, createPool, PoolConnection } from "mysql2/promise";
import { RowDataPacket, ResultSetHeader } from "mysql2";

let connection: Pool;

// Function to initialize the connection pool
async function connect() {
    if (!connection) {
        connection = createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            timezone: '+00:00'
        });
        console.log('Database connection established');
    }
}

// Wrapper object for database operations
const db = {
    async transaction(): Promise<PoolConnection> {
        if (!connection) await connect(); // Ensure connection is initialized
        const conn = await connection.getConnection();
        await conn.beginTransaction();
        return conn;
    },

    async commit(conn: PoolConnection): Promise<void> {
        await conn.commit();
        conn.release();
    },

    async rollback(conn: PoolConnection): Promise<void> {
        await conn.rollback();
        conn.release();
    },

    async query<T extends RowDataPacket[]>(sql: string, params: unknown[] = []): Promise<T> {
        if (!connection) await connect(); // Ensure connection is initialized
        const [rows] = await connection.execute<T>(sql, params);
        return rows;
    },

    async insertOne(tableName: string, data: Record<string, unknown>): Promise<number> {
        if (!connection) await connect(); // Ensure connection is initialized
        const columns = Object.keys(data).join(", ");
        const placeholders = Object.keys(data).map(() => "?").join(", ");
        const values = Object.values(data);
        const [result] = await connection.query<ResultSetHeader>(
            `INSERT INTO ?? (${columns}) VALUES (${placeholders})`,
            [tableName, ...values]
        );
        return result.insertId;
    },

    async insertMany(tableName: string, data: Record<string, unknown>[]): Promise<number> {
        if (!connection) await connect(); // Ensure connection is initialized
        if (data.length === 0) return 0;
        const columns = Object.keys(data[0]).join(", ");
        const placeholders = data.map(() => `(${Object.keys(data[0]).map(() => "?").join(", ")})`).join(", ");
        const values = data.flatMap(Object.values);
        const [result] = await connection.query<ResultSetHeader>(
            `INSERT INTO ?? (${columns}) VALUES ${placeholders}`,
            [tableName, ...values]
        );
        return result.affectedRows;
    },

    async updateOne(
        tableName: string,
        data: Record<string, unknown>,
        condition: Record<string, unknown>
    ): Promise<number> {
        if (!connection) await connect();
        const setClause = Object.keys(data).map((key) => `${key} = ?`).join(", ");
        const whereClause = Object.keys(condition).map((key) => `${key} = ?`).join(" AND ");
        const values = [...Object.values(data), ...Object.values(condition)];
        const [result] = await connection.query<ResultSetHeader>(
            `UPDATE ?? SET ${setClause} WHERE ${whereClause}`,
            [tableName, ...values]
        );
        return result.affectedRows;
    },

    async updateMany(
        tableName: string,
        data: Record<string, unknown>,
        condition: Record<string, unknown>
    ): Promise<number> {
        if (!connection) await connect(); // Ensure connection is initialized
        return this.updateOne(tableName, data, condition); // Same logic applies
    },

    async deleteOne(tableName: string, condition: Record<string, unknown>): Promise<number> {
        if (!connection) await connect(); // Ensure connection is initialized
        const whereClause = Object.keys(condition).map((key) => `${key} = ?`).join(" AND ");
        const values = Object.values(condition);
        const [result] = await connection.query<ResultSetHeader>(
            `DELETE FROM ?? WHERE ${whereClause}`,
            [tableName, ...values]
        );
        return result.affectedRows;
    },

    async deleteMany(tableName: string, condition: Record<string, unknown>): Promise<number> {
        if (!connection) await connect(); // Ensure connection is initialized
        return this.deleteOne(tableName, condition); // Same logic applies
    },

    async findOne(
        tableName: string,
        condition: Record<string, unknown>,
        options: { columns?: string; useIndex?: string } = {}
    ): Promise<RowDataPacket | undefined> {
        if (!connection) await connect(); // Ensure connection is initialized
        const { columns = "*", useIndex = "" } = options;
        const indexHint = useIndex ? `USE INDEX (${useIndex})` : "";
        const whereClause = Object.keys(condition).map((key) => `${key} = ?`).join(" AND ");
        const values = Object.values(condition);
        const [rows] = await connection.query<RowDataPacket[]>(
            `SELECT ${columns} FROM ?? ${indexHint} WHERE ${whereClause} LIMIT 1`,
            [tableName, ...values]
        );
        return rows[0];
    },

    async findMany(
        tableName: string,
        condition: Record<string, unknown>,
        options: { columns?: string; useIndex?: string } = {}
    ): Promise<RowDataPacket[]> {
        if (!connection) await connect(); // Ensure connection is initialized
        const { columns = "*", useIndex = "" } = options;
        const indexHint = useIndex ? `USE INDEX (${useIndex})` : "";
        const whereClause = Object.keys(condition).length > 0 
            ? Object.keys(condition).map((key) => `${key} = ?`).join(" AND ")
            : "1=1";
        const values = Object.values(condition);
        const [rows] = await connection.query<RowDataPacket[]>(
            `SELECT ${columns} FROM ?? ${indexHint} WHERE ${whereClause}`,
            [tableName, ...values]
        );
        return rows;
    },};

export { connect, db };

