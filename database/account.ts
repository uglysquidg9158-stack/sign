
import * as Crypto from 'expo-crypto';
import { SQLiteDatabase } from 'expo-sqlite';

export type AccountType = 'user' | 'admin';

export type Account = {
    id: number;
    name: string;
    email: string;
    username: string;
    accountType: AccountType;
};

export type LoginResult = {
    success: boolean;
    account?: Account;
    message?: string;
};

async function hashPassword(
    password: string,
    salt: string
): Promise<string> {
    return await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        salt + password
    );
}

// INITIALIZE DATABASE
export async function initializeDatabase(
    db: SQLiteDatabase
) {

    // Create accounts table
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            username TEXT NOT NULL,
            passwordHash TEXT,
            salt TEXT,
            accountType TEXT NOT NULL DEFAULT 'user'
        );
    `);

    // Create logged-in session table
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS user_session (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            accountId INTEGER NOT NULL,
            FOREIGN KEY (accountId)
                REFERENCES accounts(id)
                ON DELETE CASCADE
        );
    `);

    // Check existing columns
    const columns = await db.getAllAsync<{ name: string }>(
        'PRAGMA table_info(accounts)'
    );

    const columnNames = columns.map(column => column.name);

    // Database migrations
    if (!columnNames.includes('passwordHash')) {
        await db.execAsync(
            'ALTER TABLE accounts ADD COLUMN passwordHash TEXT'
        );
    }

    if (!columnNames.includes('salt')) {
        await db.execAsync(
            'ALTER TABLE accounts ADD COLUMN salt TEXT'
        );
    }

    if (!columnNames.includes('accountType')) {
        await db.execAsync(
            "ALTER TABLE accounts ADD COLUMN accountType TEXT NOT NULL DEFAULT 'user'"
        );
    }

    // Check duplicate usernames
    const duplicates = await db.getAllAsync<{ username: string }>(`
        SELECT username
        FROM accounts
        GROUP BY username
        HAVING COUNT(*) > 1
    `);

    if (duplicates.length === 0) {
        await db.execAsync(`
            CREATE UNIQUE INDEX IF NOT EXISTS
            idx_accounts_username
            ON accounts(username);
        `);
    } else {
        console.warn(
            'Duplicate usernames found:',
            duplicates
        );
    }

    // Check duplicate administrators
    const admins = await db.getAllAsync<{ id: number }>(`
        SELECT id
        FROM accounts
        WHERE accountType = 'admin'
    `);

    if (admins.length > 1) {
        console.warn(
            'Multiple administrators found. Keeping the first administrator.'
        );

        for (const admin of admins.slice(1)) {
            await db.runAsync(
                `UPDATE accounts
                 SET accountType = 'user'
                 WHERE id = ?`,
                admin.id
            );
        }
    }

    await db.execAsync(`
        CREATE UNIQUE INDEX IF NOT EXISTS
        idx_single_admin
        ON accounts(accountType)
        WHERE accountType = 'admin';
    `);

    const adminExists = await hasAdminAccount(db);

    if (!adminExists) {
        const salt = Crypto.randomUUID();
        const password = 'Admin1234';

        const passwordHash = await hashPassword(
            password,
            salt
        );

        await db.runAsync(
            `INSERT INTO accounts
            (name, email, username, passwordHash, salt, accountType)
            VALUES (?, ?, ?, ?, ?, ?)`,
            'System Administrator',
            'admin@example.com',
            'admin',
            passwordHash,
            salt,
            'admin'
        );

        console.log('Default admin account created.');
    }
}

// SAVE LOGGED-IN ACCOUNT
export async function saveUserSession(
    db: SQLiteDatabase,
    accountId: number
) {
    await db.runAsync(
        `INSERT OR REPLACE INTO user_session
         (id, accountId)
         VALUES (1, ?)`,
        accountId
    );
}

// GET LOGGED-IN ACCOUNT
export async function getLoggedInAccount(
    db: SQLiteDatabase
): Promise<Account | null> {

    const account = await db.getFirstAsync<Account>(
        `SELECT
            accounts.id,
            accounts.name,
            accounts.email,
            accounts.username,
            accounts.accountType
         FROM accounts
         INNER JOIN user_session
            ON accounts.id = user_session.accountId
         WHERE user_session.id = 1`
    );

    return account ?? null;
}

// CLEAR LOGGED-IN SESSION
export async function clearUserSession(
    db: SQLiteDatabase
) {
    await db.runAsync(
        'DELETE FROM user_session WHERE id = 1'
    );
}

// VALIDATE USERNAME
export function validateUsername(
    username: string
): string | null {

    if (!username.trim()) {
        return 'Username is required.';
    }

    if (username.length < 4) {
        return 'Username must contain at least 4 characters.';
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return 'Username can only contain letters, numbers and underscores.';
    }

    return null;
}

// VALIDATE PASSWORD
export function validatePassword(
    password: string
): string | null {

    if (!password) {
        return 'Password is required.';
    }

    if (password.length < 8) {
        return 'Password must contain at least 8 characters.';
    }

    if (!/[A-Z]/.test(password)) {
        return 'Password must contain an uppercase letter.';
    }

    if (!/[a-z]/.test(password)) {
        return 'Password must contain a lowercase letter.';
    }

    if (!/[0-9]/.test(password)) {
        return 'Password must contain a number.';
    }

    return null;
}

// CHECK IF ADMIN EXISTS
export async function hasAdminAccount(
    db: SQLiteDatabase
): Promise<boolean> {

    const admin = await db.getFirstAsync<{ id: number }>(
        `SELECT id
         FROM accounts
         WHERE accountType = 'admin'
         LIMIT 1`
    );

    return !!admin;
}

// REGISTER ACCOUNT
export async function addAccount(
    db: SQLiteDatabase,
    name: string,
    email: string,
    username: string,
    password: string,
    accountType: AccountType
) {

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanUsername = username.trim();

    if (!cleanName || !cleanEmail) {
        throw new Error('Name and email are required.');
    }

    const usernameError = validateUsername(cleanUsername);

    if (usernameError) {
        throw new Error(usernameError);
    }

    const passwordError = validatePassword(password);

    if (passwordError) {
        throw new Error(passwordError);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        throw new Error('Enter a valid email address.');
    }

    if (accountType !== 'user' && accountType !== 'admin') {
        throw new Error('Invalid account type.');
    }

    const existing = await db.getFirstAsync<{ id: number }>(
        'SELECT id FROM accounts WHERE username = ?',
        cleanUsername
    );

    if (existing) {
        throw new Error('Username already exists.');
    }

    if (accountType === 'admin') {
        const existingAdmin = await hasAdminAccount(db);

        if (existingAdmin) {
            throw new Error('An admin account already exists.');
        }
    }

    const salt = Crypto.randomUUID();

    const passwordHash = await hashPassword(
        password,
        salt
    );

    return await db.runAsync(
        `INSERT INTO accounts
        (name, email, username, passwordHash, salt, accountType)
        VALUES (?, ?, ?, ?, ?, ?)`,
        cleanName,
        cleanEmail,
        cleanUsername,
        passwordHash,
        salt,
        accountType
    );
}

// LOGIN ACCOUNT
export async function loginAccount(
    db: SQLiteDatabase,
    username: string,
    password: string
): Promise<LoginResult> {

    if (!username.trim() || !password) {
        return {
            success: false,
            message: 'Enter your username and password.'
        };
    }

    const account = await db.getFirstAsync<{
        id: number;
        name: string;
        email: string;
        username: string;
        passwordHash: string;
        salt: string;
        accountType: AccountType;
    }>(
        `SELECT *
         FROM accounts
         WHERE username = ?`,
        username.trim()
    );

    if (
        !account ||
        !account.passwordHash ||
        !account.salt
    ) {
        return {
            success: false,
            message: 'Invalid username or password.'
        };
    }

    const enteredHash = await hashPassword(
        password,
        account.salt
    );

    if (enteredHash !== account.passwordHash) {
        return {
            success: false,
            message: 'Invalid username or password.'
        };
    }

    return {
        success: true,
        account: {
            id: account.id,
            name: account.name,
            email: account.email,
            username: account.username,
            accountType: account.accountType
        }
    };
}

// RETRIEVE ALL ACCOUNTS
export async function getAccounts(
    db: SQLiteDatabase
): Promise<Account[]> {

    return await db.getAllAsync<Account>(
        `SELECT id, name, email, username, accountType
         FROM accounts
         ORDER BY id DESC`
    );
}

// UPDATE ACCOUNT
export async function updateAccount(
    db: SQLiteDatabase,
    id: number,
    name: string,
    email: string,
    username: string
) {

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanUsername = username.trim();

    const usernameError = validateUsername(cleanUsername);

    if (usernameError) {
        throw new Error(usernameError);
    }

    if (!cleanName || !cleanEmail) {
        throw new Error('Name and email are required.');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        throw new Error('Enter a valid email address.');
    }

    const existing = await db.getFirstAsync<{ id: number }>(
        `SELECT id
         FROM accounts
         WHERE username = ? AND id != ?`,
        cleanUsername,
        id
    );

    if (existing) {
        throw new Error('Username already exists.');
    }

    return await db.runAsync(
        `UPDATE accounts
         SET name = ?, email = ?, username = ?
         WHERE id = ?`,
        cleanName,
        cleanEmail,
        cleanUsername,
        id
    );
}

// DELETE ACCOUNT
export async function removeAccount(
    db: SQLiteDatabase,
    id: number
) {

    return await db.runAsync(
        'DELETE FROM accounts WHERE id = ?',
        id
    );
}

// GET ACCOUNT BY ID
export async function getAccountById(
    db: SQLiteDatabase,
    id: number
): Promise<Account | null> {

    const account = await db.getFirstAsync<Account>(
        `SELECT id, name, email, username, accountType
         FROM accounts
         WHERE id = ?`,
        id
    );

    return account ?? null;
}
