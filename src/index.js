//@ts-check
import { transaction } from '@kinshipjs/core';
import { LuciaError } from 'lucia';

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
 * @template {object} T
 * @typedef {{[K in keyof T as NonNullable<T[K]> extends string|number|boolean|bigint|Date ? K : never]-?: K}} CopyKeyToProperty
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
 * @param {{[K in keyof T as NonNullable<T[K]> extends string|number|boolean|bigint|Date ? K : never]-?: K}} model
 * @returns {TColumnNames}
 */

const proxy = new Proxy(/** @type {any} */ ({}), {
    get: (t,p) => {
        if(typeof p !== "string") throw new Error(`Property reference must be of type string. (Property: ${String(p)})`);
        return p;
    }
});

/**
 * Adapter for the [lucia-auth](https://lucia-auth.com/) library for [MyORM](https://myorm.dev) contexts.
 * @template {object} TUser
 * Model represented by the `auth_user` context.
 * @template {object} TSession
 * Model represented by the `auth_session` context.
 * @template {object} TKey
 * Model represented by the `auth_key` context.
 * @param {import('@kinshipjs/core/adapter').KinshipAdapterConnection} connection
 * The connection that was used to instantiate `auth_key`, `auth_session`, and `auth_user`. (Used to execute transactions)
 * @param {import('@kinshipjs/core').KinshipContext<TKey>} auth_key
 * Context representing the table connected to your users.
 * @param {import('@kinshipjs/core').KinshipContext<TSession>} auth_session
 * Context representing the table connected to your sessions.
 * @param {import('@kinshipjs/core').KinshipContext<TUser>} auth_user
 * Context representing the table connected to your provider keys.
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
export const adapter = (connection, auth_key, auth_session, auth_user, { 
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
            try {
                await auth_session.insert(mapSession(session, $$auth_session));
            } catch(err) {
                throw new LuciaError('AUTH_INVALID_SESSION_ID');
            }
        },
        updateSession: async (sessionId, partialSession) => {
            try {
                await auth_session
                    .where(m => (/** @type {any} */(m))[$$auth_session.id].equals(sessionId))
                    .update(() => mapSession(partialSession, $$auth_session));
            } catch(err) {
                throw new LuciaError('AUTH_INVALID_SESSION_ID');
            }
        },

        // User adapter
        getUser: async (userId) => {
            const [user] = (await auth_user
                    .where(m => (/** @type {any} */(m))[$$auth_user.id].equals(userId))
                    .select())
                .map(/** @type {any} */ ($auth_user));
            return user ?? null;
        },
        setUser: async (user, key) => {
            try {
                await transaction(connection).execute(async (tnx) => {
                    await auth_user.using(tnx).insert(mapUser(user, $$auth_user));
                    if(key) {
                        await auth_key.using(tnx).insert(mapKey(key, $$auth_key));
                    }
                });
            } catch(err) {
                throw new LuciaError('AUTH_DUPLICATE_KEY_ID');
            }
        },
        updateUser: async (userId, partialUser) => {
            try {
                const n = await auth_user
                    .where(m => (/** @type {any} */(m))[$$auth_user.id].equals(userId))
                    .update(() => mapUser(partialUser, $$auth_user));
            } catch(err) {
                throw new LuciaError('AUTH_INVALID_USER_ID');
            }
        },
        deleteUser: async (userId) => {
            await auth_user
                .where(m => (/** @type {any} */(m))[$$auth_user.id].equals(userId))
                .delete();
        },
        
        getKey: async (keyId) => {
            const [key] = (await auth_key
                .where(m => (/** @type {any} */(m))[$$auth_key.id].equals(keyId))
                .select()).map(/** @type {any} */ ($auth_key));
            return key ?? null;
        },
        getKeysByUserId: async (userId) => {
            const keys = (await auth_key
                .where(m => (/** @type {any} */(m))[$$auth_key.user_id].equals(userId))
                .select()).map(/** @type {any} */ ($auth_key));
            return keys ?? null;
        },
        setKey: async (key) => {
            await userIdCheck(auth_user, $$auth_user.id, key.user_id);
            
            try {
                await auth_key.insert(mapKey(key, $$auth_key));
            } catch(err) {
                throw new LuciaError('AUTH_DUPLICATE_KEY_ID');
            }
        },
        updateKey: async (keyId, keySchema) => {
            await auth_key
                .where(m => (/** @type {any} */(m))[$$auth_key.id].equals(keyId))
                .update(() => mapKey(keySchema, $$auth_key));
        },
        deleteKey: async (keyId) => {
            await auth_key
                .where(m => (/** @type {any} */(m))[$$auth_key.id].equals(keyId))
                .delete();
        },
        deleteKeysByUserId: async (userId) => {
            await auth_key
                .where(m => (/** @type {any} */(m))[$$auth_key.user_id].equals(userId))
                .delete();
        }
    });
}

function mapKey(key, $$auth_key) {
    return mapProperties(key, $$auth_key);
}

function mapUser(user, $$auth_user) {
    return mapProperties(user, $$auth_user);
}

function mapSession(session, $$auth_session) {
    return mapProperties(session, $$auth_session);
}

/**
 * @param {any} object 
 * @param {any} $$keys 
 * @returns {any}
 */
function mapProperties(object, $$keys) {
    const newObject = { ...object };
    for(const key in $$keys) {
        if(!object[key]) {
            continue;
        }
        const realKey = key in $$keys ? $$keys[key] : key;
        newObject[realKey] = object[key];
        if(key !== realKey) {
            delete newObject[key];
        }
    }
    return newObject;
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