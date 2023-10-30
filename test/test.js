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
            Id: {
                table: 'User',
                field: 'Id',
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
            Username: {
                table: 'User',
                field: 'Username',
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
            Id: {
                table: 'Key',
                field: 'Id',
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
            UserId: {
                table: 'Key',
                field: 'UserId',
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
            HashedPassword: {
                table: 'Key',
                field: 'HashedPassword',
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
            Id: {
                table: 'Session',
                field: 'Id',
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
            UserId: {
                table: 'Session',
                field: 'UserId',
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
            IdleExpires: {
                table: 'Session',
                field: 'IdleExpires',
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
            ActiveExpires: {
                table: 'Session',
                field: 'ActiveExpires',
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
            Country: {
                table: 'Session',
                field: 'Country',
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
 * @prop {string} Id
 * @prop {string} Username
 */

/**
 * @typedef {object} Session
 * @prop {string} Id
 * @prop {number} ActiveExpires
 * @prop {number} IdleExpires
 * @prop {string} UserId
 * @prop {string} Country
 */

/**
 * @typedef {object} Key
 * @prop {string} Id
 * @prop {string?} HashedPassword
 * @prop {string} UserId
 */

/** @type {KinshipContext<User>} */
const users = new KinshipContext(connection, "User", { disableSafeDeleteMode: true, disableSafeUpdateMode: false });
/** @type {KinshipContext<Session>} */
const sessions = new KinshipContext(connection, "Session", { disableSafeDeleteMode: true, disableSafeUpdateMode: false });
/** @type {KinshipContext<Key>} */
const keys = new KinshipContext(connection, "Key", { disableSafeDeleteMode: true, disableSafeUpdateMode: false });

function onSuccess({cmdRaw, resultsInSqlRowFormat}) {
    console.log(resultsInSqlRowFormat);
}

users.onSuccess(onSuccess);
sessions.onSuccess(onSuccess);
keys.onSuccess(onSuccess);

const adapter = kinshipLuciaAdapter(connection, keys, sessions, users, {
    auth_key: m => ({
        id: m.Id,
        hashed_password: m.HashedPassword,
        user_id: m.UserId
    }),
    auth_session: m => ({
        active_expires: m.ActiveExpires,
        id: m.Id,
        idle_expires: m.IdleExpires,
        user_id: m.UserId,
        country: m.Country
    }),
    auth_user: m => ({
        id: m.Id,
        username: m.Username
    })
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
            return results.map((/** @type {any} */value) => {
                let row = {};
                if(table === 'User') {
                    row = {
                        id: value.Id,
                        username: value.Username
                    };
                } else if(table === 'Session') {
                    row = {
                        id: value.Id,
                        active_expires: value.ActiveExpires,
                        idle_expires: value.IdleExpires,
                        user_id: value.UserId,
                        country: value.Country
                    }
                } else if(table === 'Key') {
                    row = {
                        id: value.Id,
                        hashed_password: value.HashedPassword,
                        user_id: value.UserId
                    }
                }
                return row;
            });
        },
        insert: async (value) => {
            /** @type {any} */
            let row = {};
            if(table === 'User') {
                row = {
                    Id: value.id,
                    Username: value.username
                };
            } else if(table === 'Session') {
                row = {
                    Id: value.id,
                    ActiveExpires: value.active_expires,
                    IdleExpires: value.idle_expires,
                    UserId: value.user_id,
                    Country: value.country
                }
            } else if(table === 'Key') {
                row = {
                    Id: value.id,
                    HashedPassword: value.hashed_password,
                    UserId: value.user_id
                }
            }
            console.log(`inserting into ${table}: `, row);
            await ctx.insert(row);
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