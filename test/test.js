//@ts-check

import { Database, testAdapter } from '@lucia-auth/adapter-test';
import { LuciaError } from "lucia";
import { adapter as kinshipLuciaAdapter } from '../src/index.js';
import { adapter as jsonAdapter } from "@kinshipjs/json";
import { KinshipContext } from "@kinshipjs/core";
import "lucia/polyfill/node";

const connection = jsonAdapter({
    $data: {
        User: [],
        Key: [],
        Session: []
    },
    $schema: {
        User: {
            id: {
                table: 'User',
                field: 'id',
                alias: '',
                isPrimary: true,
                isIdentity: false,
                isVirtual: false,
                isNullable: false,
                isUnique: true,
                datatype: 'string',
                defaultValue: () => undefined,
                commandAlias: ''
            },
            username: {
                table: 'User',
                field: 'username',
                alias: '',
                isPrimary: false,
                isIdentity: false,
                isVirtual: false,
                isNullable: false,
                isUnique: false,
                datatype: 'string',
                defaultValue: () => undefined,
                commandAlias: ''
            },
        },
        Key: {
            id: {
                table: 'Key',
                field: 'id',
                alias: '',
                isPrimary: true,
                isIdentity: false,
                isVirtual: false,
                isNullable: false,
                isUnique: true,
                datatype: 'string',
                defaultValue: () => undefined,
                commandAlias: ''
            },
            user_id: {
                table: 'Key',
                field: 'user_id',
                alias: '',
                isPrimary: false,
                isIdentity: false,
                isVirtual: false,
                isNullable: false,
                isUnique: false,
                datatype: 'string',
                defaultValue: () => undefined,
                commandAlias: ''
            },
            hashed_password: {
                table: 'Key',
                field: 'hashed_password',
                alias: '',
                isPrimary: false,
                isIdentity: false,
                isVirtual: false,
                isNullable: true,
                isUnique: false,
                datatype: 'string',
                defaultValue: () => undefined,
                commandAlias: ''
            }
        },
        Session: {
            id: {
                table: 'Session',
                field: 'id',
                alias: '',
                isPrimary: true,
                isIdentity: false,
                isVirtual: false,
                isNullable: false,
                isUnique: false,
                datatype: 'string',
                defaultValue: () => undefined,
                commandAlias: ''
            },
            user_id: {
                table: 'Session',
                field: 'user_id',
                alias: '',
                isPrimary: false,
                isIdentity: false,
                isVirtual: false,
                isNullable: false,
                isUnique: false,
                datatype: 'string',
                defaultValue: () => undefined,
                commandAlias: ''
            },
            idle_expires: {
                table: 'Session',
                field: 'idle_expires',
                alias: '',
                isPrimary: false,
                isIdentity: false,
                isVirtual: false,
                isNullable: false,
                isUnique: false,
                datatype: 'int',
                defaultValue: () => undefined,
                commandAlias: ''
            },
            active_expires: {
                table: 'Session',
                field: 'active_expires',
                alias: '',
                isPrimary: false,
                isIdentity: false,
                isVirtual: false,
                isNullable: false,
                isUnique: false,
                datatype: 'int',
                defaultValue: () => undefined,
                commandAlias: ''
            },
            country: {
                table: 'Session',
                field: 'country',
                alias: '',
                isPrimary: false,
                isIdentity: false,
                isVirtual: false,
                isNullable: true,
                isUnique: false,
                datatype: 'string',
                defaultValue: () => undefined,
                commandAlias: ''
            }
        }
    }
});

/**
 * @typedef {object} User
 * @prop {string} id
 * @prop {string} username
 */

/**
 * @typedef {object} Session
 * @prop {string} id
 * @prop {number} active_expires
 * @prop {number} idle_expires
 * @prop {string} user_id
 * @prop {string} country
 */

/**
 * @typedef {object} Key
 * @prop {string} id
 * @prop {string?} hashed_password
 * @prop {string} user_id
 */

/** @type {KinshipContext<User>} */
const users = new KinshipContext(connection, "User", { disableSafeDeleteMode: true, disableSafeUpdateMode: false });
/** @type {KinshipContext<Session>} */
const sessions = new KinshipContext(connection, "Session", { disableSafeDeleteMode: true, disableSafeUpdateMode: false });
/** @type {KinshipContext<Key>} */
const keys = new KinshipContext(connection, "Key", { disableSafeDeleteMode: true, disableSafeUpdateMode: false });

const adapter = kinshipLuciaAdapter({
    auth_key: keys,
    auth_session: sessions,
    auth_user: users
})(LuciaError);

/**
 * @template {import('@lucia-auth/adapter-test').TestUserSchema
 * |import('lucia').SessionSchema
 * |import('lucia').KeySchema} T
 * @param {KinshipContext<T>} ctx 
 * @param {string} table
 * @returns 
 */
function createQueryHandler(ctx, table) {
    return {
        get: async () => {
            const results = await ctx.select();
            console.log(`getting from ${table}: `, results);
            return results;
        },
        insert: async (value) => {
            console.log(`inserting into ${table}: `, value);
            await ctx.insert(value);
            console.log(await ctx.select());
        },
        clear: async () => {
            console.log(`Truncating ${table}`);
            await ctx.truncate();
        }
    }
}

/** @type {import('@lucia-auth/adapter-test').QueryHandler} */
const queryHandler = {
    key: /** @type {any} */ (createQueryHandler(keys, "Key")),
    session: createQueryHandler(sessions, "Session"),
    user: createQueryHandler(users, "User"),
};


await testAdapter(adapter, new Database(queryHandler));