//@ts-check

import { LuciaError } from 'lucia';

/** @template T @typedef {T extends infer U ? {[K in keyof U]: U[K] } : never} FriendlyType */

/**
 * Object model that contains a reference to each context that must be used with the `lucia-auth` library.
 * @template {object} TUser
 * Model represented by the `auth_user` context.
 * @template {object} TSession
 * Model represented by the `auth_session` context.
 * @template {object} TKey
 * Model represented by the `auth_key` context.
 * @typedef {object} AuthTables
 * @prop {import('@kinshipjs/core').KinshipContext<TUser>} auth_user
 * Context connected to a table for User objects.
 * @prop {import('@kinshipjs/core').KinshipContext<TSession>} auth_session
 * Context connected to a table for Session objects.
 * @prop {import('@kinshipjs/core').KinshipContext<TKey>} auth_key 
 * Context connected to a table for Provider Key objects.
 */

/**
 * Object model that contains a map from the expected columns for a User object in `lucia-auth` to the actual column name represented in your table.
 * @template {object} TUser
 * Model represented by the `auth_user` context.
 * @typedef {object} AuthUserColumnNames
 * @prop {(keyof TUser)=} id
 * Column name that represents the id of the User object.
 */

/**
 * Object model that contains a map from the expected columns for a Session object in `lucia-auth` to the actual column name represented in your table.
 * @template {object} TSession
 * Model represented by the `auth_session` context.
 * @typedef {object} AuthSessionColumnNames
 * @prop {(keyof TSession)=} id
 * Column name that represents the id of the Session object.
 * @prop {(keyof TSession)=} user_id
 * Column name that represents the id of the User object.
 * @prop {(keyof TSession)=} active_expires
 * Column name that represents the milliseconds since 01/01/1970 00:00:00 for when the active session should expire.
 * @prop {(keyof TSession)=} idle_expires
 * Column name that represents the milliseconds since 01/01/1970 00:00:00 for when the idle session should expire.
 */

/**
 * Object model that contains a map from the expected columns for a Provider Key object in `lucia-auth` to the actual column name represented in your table.
 * @template {object} TKey
 * Model represented by the `auth_key` context.
 * @typedef {object} AuthKeyColumnNames
 * @prop {(keyof TKey)=} id
 * Column name that represents the id of the Provider Key object.
 * @prop {(keyof TKey)=} user_id
 * Column name that represents the id of the User object.
 * @prop {(keyof TKey)=} primary_key
 * Column name that represents if the row is the primary key representing the User.
 * @prop {(keyof TKey)=} hashed_password
 * Column name that represents the hash of the password.
 * @prop {(keyof TKey)=} expires
 * Column name that represents the milliseconds since 01/01/1970 00:00:00 for when the key should expire.
 */

/**
 * (model: {[K in keyof TUser]-?: TUser[K] extends object|undefined 
 *     ? TUser[K] 
 *     : TUser[K] extends (infer U)[]|undefined 
 *       ? U
 *       : K}) => AuthUserColumnNames<TUser>
 * @template {object} T
 * @template TColumnNames
 * @callback ToColumnNames
 * @param {{[K in keyof T]-?: NonNullable<T[K]> extends (infer U)[] 
 *   ? U
 * : NonNullable<T[K]> extends object
 *   ? T[K]
 * : K}} model
 * @returns {TColumnNames}
 */

const proxy = new Proxy(/** @type {any} */ ({}), {
    get: (t,p) => {
        if(typeof p !== "string") throw new Error(`Property reference must be of type string. (Property: ${String(p)})`);
        return p;
    }
});

/**
 * @param {any} object 
 * @param {any} $$keys 
 * @param {boolean} maintainOldProperties
 * @returns {any}
 */
function remapProperties(object, $$keys, maintainOldProperties=false) {
    for(const key in $$keys) {
        const realColumnName = $$keys[key];
        if(key in object) {
            object[realColumnName] = object[key];
            if(key !== realColumnName) {
                delete object[key];
            }
        }
    }
    return object;
}

/**
 * Adapter for the [lucia-auth](https://lucia-auth.com/) library for [MyORM](https://myorm.dev) contexts.
 * @template {object} TUser
 * Model represented by the `auth_user` context.
 * @template {object} TSession
 * Model represented by the `auth_session` context.
 * @template {object} TKey
 * Model represented by the `auth_key` context.
 * @param {AuthTables<TUser, TSession, TKey>} contexts
 * Object containing properties for the expected tables in `lucia-auth` (auth_user, auth_session, auth_key) 
 * in which the value expects to be the respective `MyORMContext` object that connects to the appropriate and respective tables.
 * @param {{ 
 *   auth_user: ToColumnNames<TUser, AuthUserColumnNames<TUser>>, 
 *   auth_session: ToColumnNames<TSession, AuthSessionColumnNames<TSession>>, 
 *   auth_key: ToColumnNames<TKey, AuthKeyColumnNames<TKey>>,
 * }} keys
 * Object containing properties for the expected tables in `lucia-auth` (auth_user, auth_session, auth_key) 
 * in which the value expects a callback for mapping the table columns from your contexts to what `lucia-auth` expects them to be.  
 * You can choose to omit columns that may already have the naming scheme, or omit this parameter all together if the table exactly replicates `lucia-auth`'s expected database model.
 * @returns {(E: import('lucia').LuciaErrorConstructor) => import('lucia').Adapter}
 * `lucia-auth` adapter for usage within `lucia`.
 */
export const adapter = ({ 
    auth_user, 
    auth_session, 
    auth_key 
}, { 
    auth_user: $auth_user, 
    auth_session: $auth_session, 
    auth_key: $auth_key 
} = { 
    auth_user: m => m, 
    auth_session: m => m, 
    auth_key: m => m 
}) => {
    const $$auth_user = {
        id: "id",
        ...$auth_user(proxy) 
    };
    const $$auth_session = {
        id: "id",
        user_id: "user_id",
        active_expires: "active_expires",
        idle_expires: "idle_expires",
        ...$auth_session(proxy)
    };
    const $$auth_key = {
        id: "id",
        user_id: "user_id",
        primary_key: "primary_key",
        hashed_password: "hashed_password",
        expires: "expires",
        ...$auth_key(proxy)
    };

    return () => ({
        // Session adapter
        deleteSession: async (sessionId) => {
            await auth_session
                .where(m => (/** @type {any} */(m))[$$auth_session.id]
                    // @ts-ignore .where behaves strangely on untyped contexts.
                    .equals(sessionId)
                ).delete();
        },
        deleteSessionsByUserId: async (userId) => {
            await auth_session
                .where(m => (/** @type {any} */(m))[$$auth_session.user_id]
                    // @ts-ignore .where behaves strangely on untyped contexts.
                    .equals(userId))
                .delete();
        },
        getSession: async (sessionId) => {
            const [session] = (await auth_session
                .where(m => (/** @type {any} */(m))[$$auth_session.id]
                    // @ts-ignore .where behaves strangely on untyped contexts.
                    .equals(sessionId))
                .select()).map(/** @type {any} */ ($auth_session));
            return session ?? null;
        },
        getSessionsByUserId: async (userId) => {
            const sessions = (await auth_session
                .where(m => (/** @type {any} */(m))[$$auth_session.user_id]
                    // @ts-ignore .where behaves strangely on untyped contexts.
                    .equals(userId))
                .select()).map(/** @type {any} */ ($auth_session));
            return sessions;
        },
        setSession: async (session) => {
            await userIdCheck(auth_user, $$auth_user.id, session.user_id);
            const newSession = remapProperties(session, $$auth_session, true);
            try {
                await auth_session.insert(newSession);
            } catch(err) {
                throw new LuciaError('AUTH_INVALID_SESSION_ID');
            }
        },
        updateSession: async (sessionId, partialSession) => {
            try {
                await auth_session
                        .where(m => (/** @type {any} */(m))[$$auth_session.id].equals(sessionId)
                    ).update(() => partialSession);
            } catch(err) {
                throw new LuciaError('AUTH_INVALID_SESSION_ID');
            }
        },

        // User adapter
        getUser: async (userId) => {
            const [user] = (await auth_user
                .where(m => (/** @type {any} */(m))[$$auth_user.id]
                    // @ts-ignore .where behaves strangely on untyped contexts.
                    .equals(userId))
                .select()).map(/** @type {any} */ ($auth_user));
            return user ?? null;
        },
        setUser: async (user, key) => {
            if(key) {
                const count = await auth_key
                    //@ts-ignore
                    .where(m => m[$$auth_key.id].equals(key.id))
                    .count();
                if(count > 0) {
                    throw new LuciaError('AUTH_DUPLICATE_KEY_ID');
                }
            }
            try {
                const [insertedUser] = await auth_user.insert(user);
            } catch(err) {
                throw new LuciaError('AUTH_DUPLICATE_KEY_ID');
            }
            if(key) {
                /** @type {any} */
                const newKey = {};
                for(const k in $$auth_key) {
                    const realColumnName = $$auth_key[/** @type {keyof typeof $$auth_key} */(k)];
                    if(k in key) {
                        newKey[realColumnName] = /** @type {any} */ (key)[k];
                    }
                }
                
                await auth_key.insert(newKey);
            }
        },
        updateUser: async (userId, partialUser) => {
            try {
                await auth_user
                        .where(m => (/** @type {any} */(m))[$$auth_session.id].equals(userId)
                    ).update(() => partialUser);
            } catch(err) {
                throw new LuciaError('AUTH_INVALID_USER_ID');
            }
        },
        deleteUser: async (userId) => {
            await auth_user
                .where(m => (/** @type {any} */(m))[$$auth_user.id]
                    // @ts-ignore .where behaves strangely on untyped contexts.
                    .equals(userId))
                .delete();
        },
        
        getKey: async (keyId) => {
            const [key] = (await auth_key
                .where(m => (/** @type {any} */(m))[$$auth_key.id]
                    // @ts-ignore .where behaves strangely on untyped contexts.
                    .equals(keyId))
                .select()).map(/** @type {any} */ ($auth_key));
            return key ?? null;
        },
        getKeysByUserId: async (userId) => {
            const keys = (await auth_key
                .where(m => (/** @type {any} */(m))[$$auth_key.user_id]
                    // @ts-ignore .where behaves strangely on untyped contexts.
                    .equals(userId))
                .select()).map(/** @type {any} */ ($auth_key));
            return keys ?? null;
        },
        setKey: async (key) => {
            await userIdCheck(auth_user, $$auth_user.id, key.user_id);
            /** @type {any} */
            const newKey = {};
            for(const k in $$auth_key) {
                const realColumnName = $$auth_key[/** @type {keyof typeof $$auth_key} */(k)];
                if(k in key) {
                    newKey[realColumnName] = /** @type {any} */ (key)[k];
                }
            }
            try {
                await auth_key.insert(newKey);
            } catch(err) {
                throw new LuciaError('AUTH_DUPLICATE_KEY_ID');
            }
        },
        updateKey: async (keyId, keySchema) => {
            await auth_key
                .where(m => (/** @type {any} */(m))[$$auth_key.id]
                    // @ts-ignore .where behaves strangely on untyped contexts.
                    .equals(keyId))
                .update(() => keySchema);
        },
        deleteKey: async (keyId) => {
            await auth_key
                .where(m => (/** @type {any} */(m))[$$auth_key.id]
                    // @ts-ignore .where behaves strangely on untyped contexts.
                    .equals(keyId))
                .delete();
        },
        deleteKeysByUserId: async (userId) => {
            await auth_key
                .where(m => (/** @type {any} */(m))[$$auth_key.user_id]
                    // @ts-ignore .where behaves strangely on untyped contexts.
                    .equals(userId))
                .delete();
        }
    });
}

/**
 * Checks if the given `user_id_val` exists within the context. If not, a LuciaError for AUTH_INVALID_USER_ID is thrown.
 * @template {object} TUser
 * @param {import('@kinshipjs/core').KinshipContext<TUser>} auth_user
 * @param {string|keyof TUser} user_id_key
 * @param {string} user_id_val
 */
async function userIdCheck(auth_user, user_id_key, user_id_val) {
    const n = await auth_user
        // @ts-ignore .where behaves strangely on untyped contexts.
        .where(m => m[user_id_key]
            // @ts-ignore .where behaves strangely on untyped contexts.
            .equals(user_id_val))
        .count();
    if(n <= 0) {
        throw new LuciaError('AUTH_INVALID_USER_ID');
    }
}