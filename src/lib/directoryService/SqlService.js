const bcrypt = require('bcrypt');
const asyncForEach = require('../asyncForEach');
const sortWithoutCase = require('../sortWithoutCase');
/*
const AttributeError = errors.AttributeError;
const AuthenticationError = errors.AuthenticationError;
const InvalidActionError = errors.InvalidActionError;
const NoEntityError = errors.NoEntityError;
*/
const MySql = require('../MySql');
const { HttpError } = require('../../..');

const comparePw = /*async*/ (pw, hash) => bcrypt.compare(pw, hash);
const encodePw = /*async*/ (pw) => bcrypt.hash(pw, 10);

function createInsert(table, data) {
  const fields = [];
  const vals = [];
  const params = [];
  Object.entries(data).forEach(([key, val]) => {
    fields.push(`\`${key}\``);
    vals.push('?');
    params.push(val);
  })

  const sql = `INSERT INTO \`${table}\` (${fields.join(',')}) VALUES (${vals.join(',')})`;
  return { sql, params };
}

function createUpdate(table, idField, idValue, data) {
  const fields = [];
  const params = [];
  Object.entries(data).forEach(([key, val]) => {
    fields.push(`\`${key}\`=?`);
    params.push(val);
  })

  const sql = `UPDATE \`${table}\` SET ${fields.join(',')} WHERE \`${idField}\`=?`;
  params.push(idValue);
  return { sql, params };
}

function escapeOne(val) {
  const type = val.constructor.toString().substr(9, 4);
  if (type === 'Bool') {
    return val ? '1' : '0';
  }

  if (type === 'Date') {
    return val;
  }

  return val.toString();
};

function normalizeGroupsAndRoles(list) {
  if (list) {
    return list.map(obj => obj.name.toUpperCase().replace(/-/g, '_')).sort();
  }
}

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

function SqlService(serviceConfig) {
  const CONFIG = {
    // TODO: Need a way to set these
    DISABLE_USER_LOCKING: false,
    PASSWORD_IN_HISTORY: 10,
    PASSWORD_MIN_AGE: 1,
    PASSWORD_MAX_AGE: 60,
    PASSWORD_MAX_FAILURE: 3
  }

  // ✓ 2021-02-23 - 'authenticate' seems to be finished
  async function authenticate(username, password) {
    const mySql = new MySql(serviceConfig.db);
    try {
      //const sql = 'SELECT * FROM users WHERE deleted=0 AND username = ?';
      const sql = `SELECT u.id, u.disabled, NOW() > pw.expires_on locked, pw.password
	      FROM users u
        LEFT JOIN passwords pw ON pw.user_id=u.id
        WHERE deleted=0
          AND username=?
          AND pw.active=1`;
      const data = await mySql.queryOne(sql, [username]);
      let authenticated = false;
      if (data.id && !data.disabled && !data.locked) {
        authenticated = await comparePw(password, data.password);
      }
      return authenticated;
    }

    catch (ex) {
      console.error(ex.stack);
      return false;
    }

    finally {
      mySql.close();
    }
  }

  // ✓ 2021-02-23 - 'createUser' seems to be finished EXCEPT for groups
  async function createUser(requestor, values, tempPassword = true) {
    console.info(`${requestor} calling createUser`);

    const {
      username, firstname, lastname, address1, address2 = '',
      city, state, zip, country, email, password, groups
    } = values;

    const mySql = new MySql(serviceConfig.db);
    try {
      const existsSql = 'SELECT id FROM users WHERE deleted=0 AND username=?';
      const data = await mySql.queryOne(existsSql, [username]);
      if (data.id) {
        throw new Error(`User "${username}" already exists.`);
      }

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
          expired: 0,
          expires_on: tempPassword ? 'NOW()' : `NOW() + INTERVAL ${CONFIG.PASSWORD_MAX_AGE} day`,
          can_change_on: tempPassword ? 'NOW()' : `NOW() + INTERVAL ${CONFIG.PASSWORD_MIN_AGE} DAY`,
          created_by: requestor
        }
        const { sql: createPasswordSql, params: p2 } = createInsert('passwords', fields);
        await mySql.insert(createPasswordSql, p2);

        if (groups.length > 0) {
          // TODO: Add the user to supplied groups.
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

  async function delGroup(groupName) {
    console.info('calling delGroup');
    /*
    const group = await getGroupByName(groupName);
    if (!group) {
      throw new InvalidActionError('NOT_FOUND', `Group ${groupName} was not found.`);
    }
    // Make sure this group can be removed
    if (group.removable) {
      // Get the list of users that are members of this group
      const { users } = await getGroupUsers(groupName);
      let client = await connectRoot();
      const groupDn = `cn=${groupName},${GROUPS_DN}`;
      // Delete the group
      await client.del(groupDn);
      // Clear the group cache
      clearGroupsCache();
      // Remove the group from the user
      await asyncForEach(users, async ({ username }) => {
        await delAttr(`uid=${username},${PEOPLE_DN}`, 'memberof', groupDn);
      });
    }
    else {
      throw new InvalidActionError('UNABLE_TO_DELETE', `Group ${groupName} is non-removable`);
    }
    */
  }

  // ✓ 2021-02-23 - 'delUser' seems to be finished
  async function delUser(requestor, username) {
    console.info(`${requestor} calling delUser[${username}]`);
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

  async function getConfig(key) {
    return CONFIG[key];
  }

  async function getGroupByName(groupName) {
    console.info('calling getGroupByName');
    /*
    await getGroups();
    let groupInfo;
    groupCache.some(group => {
      if (groupName === group.name) {
        groupInfo = group;
        return true;
      }
    });

    return groupInfo;
    */
  }

  async function getGroupLdapData(username, groupList = []) {
    console.info('calling getGroupLdapData');
    /*
    const gidNumber = groupList.includes(SSH_USER_NAME) ? '10' : '1000';
    const { homeDirectory, loginShell } = getUserShellInfo(username, groupList);
    let ldapGroups;

    if (groupList.length > 0) {
      ldapGroups = groupList.sort(sortWithoutCase('asc')).map(group => `cn=${group},${GROUPS_DN}`);
    }

    return {
      gidNumber,
      ldapGroups,
      homeDirectory,
      loginShell
    };
    */
  }

  async function getGroupUsers(groupName, { start = 0, limit = 99999, order = 'asc' } = {}) {
    console.info('calling getGroupUsers');
    /*
    const client = await connectRoot();
    const opts = {
      filter: `(memberof=cn=${escape(groupName)},${GROUPS_DN})`,
      scope: 'sub',
      attributes: ['cn', 'uid']
    }
    const resp = await client.search(PEOPLE_DN, opts);
    const groupInfo = resp.searchEntries;

    if (groupInfo) {
      const members = groupInfo.map(info => ({ name: info.cn, username: info.uid }));
      const total = members.length;
      const users = members.sort(sortWithoutCase(order, 'username')).slice(start, start + limit);
      const count = users.length;
      return {
        count,
        start,
        total,
        users
      };
    }
    */
  }

  async function getGroups({ start = 0, limit = 99999, order = 'asc' } = {}) {
    console.info('calling getGroups');
    /*
    if (groupCache.length === 0) {
      const client = await connectRoot();
      const opts = {
        filter: 'objectClass=posixGroup',
        scope: 'sub',
        attributes: GROUP_ATTRIBUTES
      }

      const resp = await client.search(GROUPS_DN, opts);
      groupCache = normalizeGroups(resp.searchEntries); // normalizeGroups was removed
      groupCacheTimeout = setTimeout(clearGroupsCache, GROUP_CACHE_RESET_TIME);
    }

    const total = groupCache.length;
    const groups = groupCache.sort(sortWithoutCase(order, 'name')).slice(start, start + limit);
    const count = groups.length;
    return {
      count,
      groups,
      start,
      total
    };
    */
  }

  async function getNextGroupGid(client) {
    console.info('calling getNextGroupGid');
    /*
    const opts = {
      scope: 'sub',
      attributes: ['gidNumber']
    }
    const resp = await client.search(GROUPS_DN, opts);
    return '' + (resp.searchEntries.reduce((acc, obj) => {
      const nGid = Number(obj.gidNumber);
      return (nGid > acc ? nGid : acc);
    }, 999) + 1);
    */
  }

  async function getNextPersonUid(client) {
    console.info('calling getNextPersonUid');
    /*
    const opts = {
      scope: 'sub',
      attributes: ['uidNumber']
    }
    const resp = await client.search(PEOPLE_DN, opts);
    return '' + (resp.searchEntries.reduce((acc, obj) => {
      const nUid = Number(obj.uidNumber);
      return (nUid > acc ? nUid : acc);
    }, 999) + 1);
    */
  }

  async function getPasswordExpirationTime(client, uid) {
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

  // ✓ 2021-02-23 - 'getUserById' seems to be finished
  async function getUserById(uid) {
    const mySql = new MySql(serviceConfig.db);

    try {
      const sql = `SELECT u.id, u.username, u.firstname, u.email, u.disabled, 
        NOW() > pw.expires_on locked, u.modifiable,	u.deleted, u.pwd_exp_warned,
        IFNULL(u.pwd_retry_count, 0) pwd_retry_count, IFNULL(u.last_login,
        NOW() - INTERVAL 1 year) last_login, pw.password, pw.expires_on,
        pw.can_change_on, u.lastname, u.address1, IFNULL(u.address2, '') address2,
        u.city, u.state, u.zip, u.country, IFNULL(u.profile_picture, '') profile_picture
	      FROM users u
        LEFT JOIN passwords pw ON pw.user_id=u.id
        WHERE deleted=0
          AND ${typeof id === 'number' ? 'id' : 'username'} = ?
          AND pw.active=1`
      const data = await mySql.queryOne(sql, [uid]);
      if (!data.id) {
        return null;
      }

      data.groups = [];
      data.roles = [];

      const groupSql = `SELECT g.id, g.name from groups g
        LEFT JOIN user_groups ug ON ug.group_id = g.id
        WHERE ug.user_id = ?
        ORDER BY g.name`
      let temp = await mySql.query(groupSql, [data.id]);
      if (temp && temp.length > 0) {
        data.groups = [...temp];
        const groupIds = data.groups.map(obj => obj.id);
        if (groupIds.length > 0) {
          const rolesSql = `SELECT p.id, p.name from permissions p
            LEFT JOIN group_permissions gp ON gp.permission_id = p.id
            WHERE gp.group_id in (${groupIds.join(',')})`
          data.roles = [...(await mySql.query(rolesSql))||[]];
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

  // ✓ 2021-02-23 - 'getUsers' seems to be finished
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

  async function getUsersForGroups() {
    console.info('calling getUsersForGroups');
    /*
    const client = await connectRoot();
    const opts = {
      filter: 'objectClass=posixAccount',
      scope: 'sub',
      attributes: [MEMBER_OF, UID]
    }

    const { searchEntries } = await client.search(PEOPLE_DN, opts);
    return normalizeUsersForGroups(searchEntries, ldapOptions).filter(user => !NONMODIFIABLE_USERS.includes(user.username));
    */
  }

  async function setAttr(userId, attr, value) {
    console.info('calling setAttr');
    const mySql = new MySql(serviceConfig.db);

    try {
      const sql = `UPDATE users SET '${attr}' = ?`;
      const data = await mySql.query(sql, [value]);
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

  async function setPassword(requestor, user_id, password, mustReset = false) {
    console.info('calling setPassword');
    const mySql = new MySql(serviceConfig.db);

    try {
      let data = {
        active: 0
      }
      let { sql, params } = createUpdate('passwords', 'user_id', user_id, data);
      let resp = await mySql.query(sql, params);
      console.info('============');
      console.info(resp);
      console.info('************');
      data = {
        password: await encodePw(password),
        active: 1,
        expires_on: mustReset ? 'NOW()' : `NOW() + INTERVAL ${CONFIG.PASSWORD_MAX_AGE} day`,
        can_change_on: mustReset ? 'NOW()' : `NOW() + INTERVAL ${CONFIG.PASSWORD_MIN_AGE} DAY`,
        created_by: requestor
      };
      ({ sql, params } = createInsert('passwords', data));
      resp = await mySql.query(sql, params);
      console.info('============');
      console.info(resp);
      console.info('************');
    }

    catch (ex) {
      console.error('Failed to set password');
      console.error(ex.stack);
      //throw new AttributeError(ex.code, ex.message, `Unable to set the '${attr}' attribute.`);
      throw new Error(`Unable to set the '${attr}' attribute.`);
    }

    finally {
      mySql.close();
    }
  }

  async function setGroupDescription(groupName, description) {
    console.info('calling setGroupDescription');
    /*
    const dn = `cn=${groupName},${GROUPS_DN}`;
    await setAttr(dn, DESCRIPTION, description);
    clearGroupsCache();
    */
  }

  async function setUsersForGroup({ groupName, add: membersToAdd = [], del: membersToRemove = [] }) {
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
    CONFIG,
    createUser,
    delGroup,
    delUser,
    getConfig,
    getGroupByName,
    getGroupLdapData,
    getGroupUsers,
    getGroups,
    getUserById,
    getUsers,
    getUsersForGroups,
    setAttr,
    setGroupDescription,
    setPassword,
    setUsersForGroup
  };
}

module.exports = SqlService;