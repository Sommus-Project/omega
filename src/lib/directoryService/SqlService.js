const bcrypt = require('bcrypt');
const asyncForEach = require('../asyncForEach');
//const sortWithoutCase = require('../sortWithoutCase');
const { errors, HttpError } = require('../../..');
const { AttributeError } = errors.NoEntityError;
const sortWithoutCase = require('../sortWithoutCase');
const MySql = require('../MySql');
const GROUP_CACHE_RESET_TIME = 5*60*60*1000; // 5 minutes
let groupCache = [];

const comparePw = /*async*/ (pw, hash) => bcrypt.compare(pw, hash);
const encodePw = /*async*/ (pw) => bcrypt.hash(pw, 10);

// ✓ 2021-02-27 - Finished
function clearGroupsCache() {
  groupCache = [];
}

// ✓ 2021-02-27 - Finished
function createInsert(table, data) {
  const fields = [];
  const vals = [];
  const params = [];
  Object.entries(data).forEach(([key, val]) => {
    fields.push(`\`${key}\``);
    if (val && typeof val === 'object') {
      vals.push(val.value);
    }
    else {
      vals.push('?');
      params.push(val);
    }
  })

  const sql = `INSERT INTO \`${table}\` (${fields.join(',')}) VALUES (${vals.join(',')})`;
  return { sql, params };
}

// ✓ 2021-02-27 - Finished
function createUpdate(table, idField, idValue, data) {
  const fields = [];
  const params = [];
  Object.entries(data).forEach(([key, val]) => {
    if (val && typeof val === 'object') {
      fields.push(`\`${key}\`=${val.value}`);
    }
    else {
      fields.push(`\`${key}\`=?`);
      params.push(val);
    }
  })

  const sql = `UPDATE \`${table}\` SET ${fields.join(',')} WHERE \`${idField}\`=?`;
  params.push(idValue);
  return { sql, params };
}

// ✓ 2021-02-27 - Finished
function normalizeGroupsAndRoles(list) {
  if (list) {
    return list.map(obj => obj.name.toUpperCase().replace(/-/g, '_')).sort();
  }
}

// ✓ 2021-02-27 - Finished
function normalizeUserInfo(userInfoList) {
  return userInfoList.map(userInfo => {
    const passwordExpirationTime = new Date(userInfo.expires_on)
    const resp = {
      id: userInfo.id,
      username: userInfo.username,
      email: userInfo.email,
      firstname: userInfo.firstname,
      lastname: userInfo.lastname,
      deleted: !!userInfo.deleted,
      disabled: !!userInfo.disabled,
      locked: !!userInfo.locked,
      modifiable: !!userInfo.modifiable,
      removable: userInfo.id > 99,
      lastLogin: new Date(userInfo.last_login),
      passwordExpirationTime,
      passwordExpirationWarned: userInfo.pwd_exp_warned,
      passwordRetryCount: userInfo.pwd_retry_count,
      profilePicture: userInfo.profile_picture,
      address1: userInfo.address1,
      address2: userInfo.address2,
      canChangePassword: new Date(userInfo.can_change_on),
      city: userInfo.city,
      state: userInfo.state,
      zip: userInfo.zip,
      country: userInfo.country,
      groups: normalizeGroupsAndRoles(userInfo.groups),
      roles: normalizeGroupsAndRoles(userInfo.roles)
    };

    return resp;
  });
}

// ✓ 2021-02-27 - Finished
async function validateGroups(mySql, groups) {
  const len = groups.length;
  if (len > 0) {
    let sql = `SELECT COUNT(*) count FROM groups WHERE id in (${groups.join(', ')})`;
    const { count } = await mySql.queryOne(sql);

    if (len !== count) {
      throw new Error(`One, or more, of the groups are invalid`);
    }
  }
}

function SqlService(serviceConfig) {
  const CONFIG = {
    // TODO: Need a way to set these
    DISABLE_USER_LOCKING: false,
    PASSWORD_IN_HISTORY: 10,
    PASSWORD_MIN_AGE: 1,
    PASSWORD_MAX_AGE: 60,
    PASSWORD_MAX_FAILURE: 3
  }

  // ✓ 2021-02-23 - Finished
  async function authenticate(username, password) {
    const mySql = new MySql(serviceConfig.db);
    try {
      const sql = `SELECT u.id, u.disabled, NOW() > pw.expires_on locked, pw.password FROM users u
        LEFT JOIN passwords pw ON pw.user_id=u.id
        WHERE deleted=0 AND pw.active=1 AND username=?`;
      const data = await mySql.queryOne(sql, [username]);
      return (data.id && await comparePw(password, data.password));
    }

    catch (ex) {
      console.error(ex.stack);
      return false;
    }

    finally {
      mySql.close();
    }
  }

  // ✓ 2021-02-27 - Finished
  async function createGroup(requestor, name, description, users = []) {
    const mySql = new MySql(serviceConfig.db);
    try {
      let fields = {
        name,
        description,
        created_by: requestor,
        updated_by: requestor
      };
      let { sql, params } = createInsert('groups', fields);
      const group_id = await mySql.insert(sql, params);
      clearGroupsCache()

      if (group_id) {
        if (users.length > 0) {
          await asyncForEach(users, async user_id => {
            fields = {
              user_id,
              group_id,
              created_by: requestor,
              updated_by: requestor
            }

            ({ sql, params } = createInsert('user_groups', fields));
            await mySql.insert(sql, params);
          });
        }

        return group_id;
      }

      throw new HttpError(500, "Unable to create group");
    }

    catch (ex) {
      console.error(ex.stack);
      throw (ex);
    }

    finally {
      mySql.close();
    }
  }

  // ✓ 2021-02-25 - 'createUser' seems to be finished
  // • Adds user
  // • Adds password
  // • Adds user to groups
  // - Still need to validate groups are good before inserting user
  // ------------------------------- NEED TO FINISH -------------------------------
  async function createUser(requestor, values, tempPassword = true) {
    const {
      username, firstname, lastname, address1, address2 = '',
      city, state, zip, country, email, password, groups = []
    } = values;

    const mySql = new MySql(serviceConfig.db);
    try {
      const existsSql = 'SELECT id FROM users WHERE deleted=0 AND username=?';
      const data = await mySql.queryOne(existsSql, [username]);
      if (data.id) {
        throw new Error(`User "${username}" already exists.`);
      }

      await validateGroups(mySql, groups);

      let fields = {
        username,
        firstname,
        lastname,
        address1,
        address2,
        city,
        state,
        zip,
        country,
        email,
        created_by: requestor,
        updated_by: requestor
      };
      const { sql: createSql, params } = createInsert('users', fields);
      const user_id = await mySql.insert(createSql, params);

      if (user_id) {
        fields = {
          user_id,
          password: await encodePw(password),
          active: 1,
          expires_on: { value: tempPassword ? 'NOW() - INTERVAL 1 day' : `NOW() + INTERVAL ${CONFIG.PASSWORD_MAX_AGE} day` },
          can_change_on: { value: tempPassword ? 'NOW() - INTERVAL 1 day' : `NOW() + INTERVAL ${CONFIG.PASSWORD_MIN_AGE} DAY` },
          created_by: requestor
        }
        const { sql: createPasswordSql, params: p2 } = createInsert('passwords', fields);
        await mySql.insert(createPasswordSql, p2);

        if (groups.length > 0) {
          const values = groups.map(group => `(${user_id}, ${Number(group)}, ${requestor}, ${requestor})`).join(', ');
          const sql = `INSERT INTO user_groups (user_id, group_id, created_by, updated_by) VALUES ${values}`
          const resp = await mySql.insert(sql);
        }

        return user_id;
      }

      throw new HttpError(500, "Unable to create user" );
    }

    catch (ex) {
      console.error(ex.stack);
      throw(ex);
    }

    finally {
      mySql.close();
    }
  }

  // ✓ 2021-02-27 - Finished
  async function delGroup(groupName) { // eslint-disable-line no-unused-vars
    const existingGroup = await getGroupByName(groupName);
    if (existingGroup == null) {
      return;
    }
    if (!existingGroup.removable) {
      throw new Error('Unable to delete a protected group');
    }

    const mySql = new MySql(serviceConfig.db);
    try {
      const groupId = existingGroup.id;
      let sql = `DELETE FROM user_groups WHERE group_id=?`;
      let resp = await mySql.queryOne(sql, [groupId]);

      sql = `DELETE FROM groups WHERE id=?`;
      resp = await mySql.queryOne(sql, [groupId]);

      clearGroupsCache();
    }

    catch (ex) {
      console.error(ex.stack);
      return false;
    }

    finally {
      mySql.close();
    }
  }

  // ✓ 2021-02-27 - Finished
  async function delUser(requestor, username) {
    const mySql = new MySql(serviceConfig.db);
    try {
      const data = {
        deleted: 1,
        updated_by: requestor
      }
      const { sql, params } = createUpdate('users', 'username', username, data);
      await mySql.query(sql, params);
      return true;
    }

    catch (ex) {
      console.error(ex.stack);
      return false;
    }

    finally {
      mySql.close();
    }
  }

  // ✓ 2021-02-27 - Finished
  async function getConfig(key) {
    return CONFIG[key];
  }

  // ✓ 2021-02-27 - Finished
  async function getGroupByName(groupName) { // eslint-disable-line no-unused-vars
    await getGroups();
    const groupInfo = groupCache.filter(group => groupName === group.name);
    return groupInfo[0];
  }

  // ✓ 2021-02-27 - Finished
  async function getGroupUsers(groupName, { start = 0, limit = 12000, order = 'asc' } = {}) { // eslint-disable-line no-unused-vars
    console.info('calling getGroupUsers');
    const mySql = new MySql(serviceConfig.db);
    let members;
    try {
      const sql = `SELECT u.id, u.username, u.firstname, u.lastname
        FROM users u
        LEFT JOIN user_groups ug ON ug.user_id = u.id
        LEFT JOIN groups g ON g.id = ug.group_id
        WHERE u.deleted=0 AND g.name=?
        GROUP BY u.id;`;
      members = [...await mySql.query(sql, groupName)];
    }

    catch (ex) {
      console.error(ex.stack);
      return false;
    }

    finally {
      mySql.close();
    }

    const total = members.length;
    const users = members.sort(sortWithoutCase(order, 'username')).slice(start, start + limit);
    const count = users.length;
    return {
      users,
      start,
      count,
      total
    };
  }

  // ✓ 2021-02-27 - Finished
  async function getGroups({ start = 0, limit = 12000, order = 'asc' } = {}) { // eslint-disable-line no-unused-vars
    if (groupCache.length === 0) {
      console.info('getting groups from DB');
      const mySql = new MySql(serviceConfig.db);
      try {
        const sql = `SELECT id, name, description, removable FROM groups`;
        groupCache = [...await mySql.query(sql)];
        groupCacheTimeout = setTimeout(clearGroupsCache, GROUP_CACHE_RESET_TIME);
      }

      catch (ex) {
        console.error(ex.stack);
        return false;
      }

      finally {
        mySql.close();
      }
    }

    const total = groupCache.length;
    const groups = groupCache.sort(sortWithoutCase(order, 'name')).slice(start, start + limit);
    const count = groups.length;
    return {
      groups,
      start,
      count,
      total
    };
  }

  // ------------------------------- NEED TO FINISH -------------------------------
  async function getPasswordExpirationTime(client, uid) { // eslint-disable-line no-unused-vars
    console.info('calling getPasswordExpirationTime');
    /*
    // Used by the function 'connectRoot'
    const opts = {
      filter: `(&(objectClass=posixAccount)(uid=${uid}))`,
      scope: 'sub',
      attributes: ['passwordExpirationTime']
    }
    const resp = await client.search(PEOPLE_DN, opts);
    if (!resp.searchEntries || resp.searchEntries.length == 0) {
      throw new NoEntityError(`No user with uid "${uid}"`);
    }

    return dateFromLdapDate(resp.searchEntries[0].passwordExpirationTime);
    */
  }

  // ✓ 2021-02-27 - Finished
  async function getUserById(uid) {
    const mySql = new MySql(serviceConfig.db);

    try {
      let sql = `SELECT u.id, u.username, u.firstname, u.lastname, u.email,
        u.disabled, u.modifiable,	u.deleted, NOW() > pw.expires_on locked,
        pw.password, u.pwd_exp_warned, IFNULL(u.pwd_retry_count, 0) pwd_retry_count, 
        DATE_FORMAT(IFNULL(u.last_login, NOW() - INTERVAL 1 year), "%Y-%m-%dT%T.000Z") last_login,
        DATE_FORMAT(pw.expires_on, "%Y-%m-%dT%T.000Z") expires_on,
        DATE_FORMAT(pw.can_change_on, "%Y-%m-%dT%T.000Z") can_change_on,
        u.address1, IFNULL(u.address2, '') address2, u.city, u.state, u.zip, u.country,
        IFNULL(u.profile_picture, '') profile_picture
	      FROM users u
        LEFT JOIN passwords pw ON pw.user_id=u.id
        WHERE deleted=0
          AND ${typeof id === 'number' ? 'id' : 'username'}=?
          AND pw.active=1`
      const data = await mySql.queryOne(sql, [uid]);
      if (!data.id) {
        console.warn(`No user found for "${uid}"`);
        return null;
      }

      data.groups = [];
      data.roles = [];

      sql = `SELECT g.id, g.name from groups g
        LEFT JOIN user_groups ug ON ug.group_id = g.id
        WHERE ug.user_id = ?
        ORDER BY g.name`
      let temp = await mySql.query(sql, [data.id]);
      if (temp && temp.length > 0) {
        data.groups = [...temp];
        const groupIds = data.groups.map(obj => obj.id);
        if (groupIds.length > 0) {
          sql = `SELECT p.id, p.name from permissions p
            LEFT JOIN group_permissions gp ON gp.permission_id = p.id
            WHERE gp.group_id in (${groupIds.join(',')})`
          data.roles = [...(await mySql.query(sql))||[]];
        }
      }

      const ndata = normalizeUserInfo([data])[0];
      return ndata;
    }

    catch (ex) {
      console.error('Failed to get user by id');
      console.error(ex.stack);
      return null;
    }

    finally {
      mySql.close();
    }
  }

  // ✓ 2021-02-27 - Finished
  async function getUsers(params = {}) {
    const mySql = new MySql(serviceConfig.db);
    try {
      const sql = `SELECT u.id, u.username, u.firstname, u.email, u.disabled,
        NOW() > pw.expires_on locked, u.modifiable,
    		u.deleted, u.pwd_exp_warned, IFNULL(u.pwd_retry_count, 0) pwd_retry_count,
        IFNULL(u.last_login, NOW() - INTERVAL 1 year) last_login, pw.password,
        pw.expires_on, pw.can_change_on, u.lastname, u.address1,
        IFNULL(u.address2, '') address2, u.city, u.state, u.zip, u.country,
        IFNULL(u.profile_picture, '') profile_picture
	      FROM users u LEFT JOIN passwords pw ON pw.user_id=u.id
        WHERE deleted=0 AND pw.active=1
        ORDER BY username ${params.order === 'desc'?'DESC':'ASC'}
        LIMIT ${params.start}, ${params.limit}`
      const data = await mySql.query(sql);

      return normalizeUserInfo(data);
    }

    catch (ex) {
      console.error('Failed to get users');
      console.error(ex.stack);
      return {};
    }

    finally {
      mySql.close();
    }
  }

  // ✓ 2021-02-27 - Finished
  async function isExistingGroup(groupName) {
    const group = await getGroupByName(groupName);
    console.log(!!group, JSON.stringify(group, 0, 2));
    return !!group;
  }

  // ------------------------------- NEED TO FINISH -------------------------------
  async function setAttr(requestor, userId, attr, value) {
    console.info('calling setAttr');
    // TODO: If typeof attr === 'object' then allow for
    // multiple attributes to be set by key:value pairs

    // START TEMP: Keep this until we have fixed all calls to setAttr
    if (value == null) {
      throw new Error('not enough parameters passed. Fix the code that called this.');
    }
    // END TEMP
    const mySql = new MySql(serviceConfig.db);

    try {
      const sql = `UPDATE users SET \`${attr}\`=?, updated_by=? WHERE id=?`;
      const data = await mySql.query(sql, [value, requestor, userId]);
      console.info('============');
      console.info(data);
      console.info('************');
    }

    catch (ex) {
      console.error('Failed to get users');
      console.error(ex.stack);
      //throw new AttributeError(ex.code, ex.message, `Unable to set the '${attr}' attribute.`);
      throw new Error(`Unable to set the '${attr}' attribute.`);
    }

    finally {
      mySql.close();
    }
  }

  // ✓ 2021-02-27 - Finished
  async function setPassword(requestor, user_id, password, forceChangeOnNextLogin = false) {
    const mySql = new MySql(serviceConfig.db);

    try {
      // Set all existing password for this user to inactive
      let data = {
        active: 0
      }
      let { sql, params } = createUpdate('passwords', 'user_id', user_id, data);
      await mySql.queryOne(sql, params);

      // Add the new password and set it to active.
      data = {
        user_id,
        password: await encodePw(password),
        active: 1,
        expires_on: { value: forceChangeOnNextLogin ? 'NOW()' : `NOW() + INTERVAL ${CONFIG.PASSWORD_MAX_AGE} day` },
        can_change_on: { value: forceChangeOnNextLogin ? 'NOW()' : `NOW() + INTERVAL ${CONFIG.PASSWORD_MIN_AGE} DAY` },
        created_by: requestor
      };
      ({ sql, params } = createInsert('passwords', data));
      const resp = await mySql.queryOne(sql, params);
      const { insertId } = resp;
      if ( insertId > 0) {
        sql = `SELECT expires_on, can_change_on FROM passwords where id=${insertId}`;
        const resp1 = await mySql.queryOne(sql, params);
        const passwordExpirationTime = new Date(resp1.expires_on);
        const canChangePassword = new Date(resp1.can_change_on);

        return {
          passwordExpirationTime,
          canChangePassword
        };
      }
    }

    catch (ex) {
      console.error('Failed to set password');
      console.error(ex.stack);
      throw new AttributeError(ex.code||0, ex.message, `Unable to set the 'password' attribute.`);
    }

    finally {
      mySql.close();
    }
  }

  // ✓ 2021-02-27 - Finished
  async function setGroupDescription(requestor, groupName, description) { // eslint-disable-line no-unused-vars
    const group = await getGroupByName(groupName);
    console.log({group});
    if (group) {
      const mySql = new MySql(serviceConfig.db);

      try {
        // Set all existing password for this user to inactive
        let data = {
          description,
          updated_by: requestor
        }
        let { sql, params } = createUpdate('groups', 'id', group.id, data);
        await mySql.queryOne(sql, params);
        clearGroupsCache();
        return;
      }

      catch (ex) {
        console.error('Failed to set password');
        console.error(ex.stack);
        throw new AttributeError(ex.code || 0, ex.message, `Unable to set the 'password' attribute.`);
      }

      finally {
        mySql.close();
      }
    }

    throw new Error('NOT_FOUND');
  }

  // ------------------------------- NEED TO FINISH -------------------------------
  async function setUsersForGroup({ groupName, add: membersToAdd = [], del: membersToRemove = [] }) { // eslint-disable-line no-unused-vars
    console.info('calling setUsersForGroup');
    /*
    const groupDn = `cn=${groupName},${GROUPS_DN}`;
    await asyncForEach(membersToRemove, async username => {
      await delAttr(`uid=${username},${PEOPLE_DN}`, 'memberof', groupDn);
    });
    await asyncForEach(membersToAdd, async username => {
      await addAttr(`uid=${username},${PEOPLE_DN}`, 'memberof', groupDn);
    });
    */
  }
  
  return {
    authenticate,
    createGroup,
    createUser,
    delGroup,
    delUser,
    getConfig,
    getGroupByName,
    getGroupUsers,
    getGroups,
    getUserById,
    getUsers,
    isExistingGroup,
    setAttr,
    setGroupDescription,
    setPassword,
    setUsersForGroup
  };
}

module.exports = SqlService;
