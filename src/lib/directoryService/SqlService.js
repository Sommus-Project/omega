const bcrypt = require('bcrypt');
const asyncForEach = require('../asyncForEach');
//const sortWithoutCase = require('../sortWithoutCase');
const { errors, HttpError } = require('../../..');
const { AttributeError } = errors;
const sortWithoutCase = require('../sortWithoutCase');
const MySql = require('../MySql');
const GROUP_CACHE_RESET_TIME = 5 * 60000; // 5 minutes
const USER_SQL =`SELECT u.id, u.username, u.firstname, u.lastname, u.email,
  u.disabled, u.modifiable, u.deleted, pw.password, u.pwd_exp_warned, 
  IFNULL(u.pwd_retry_count, 0) pwd_retry_count, 
  IFNULL((NOW() - INTERVAL 45 DAY) > u.last_login, 0) locked, 
  NOW() > pw.expires_on pwd_expired,
  DATE_FORMAT(IFNULL(u.last_login, NOW() - INTERVAL 1 YEAR), "%Y-%m-%dT%T.000Z") last_login,
  DATE_FORMAT(pw.expires_on, "%Y-%m-%dT%T.000Z") expires_on,
  DATE_FORMAT(pw.can_change_on, "%Y-%m-%dT%T.000Z") can_change_on, u.address_id,
  a.address1, IFNULL(a.address2, '') address2, a.city, a.state, a.zip, a.country,
  IFNULL(a.lat, '') lat, IFNULL(a.lng, '') lng,
  IFNULL(u.profile_picture, '') profile_picture
  FROM omega_users u
  LEFT JOIN omega_passwords pw ON pw.user_id=u.id
  LEFT JOIN omega_addresses a ON u.address_id=a.id
  WHERE u.deleted=0 AND pw.active=1 AND u.username != 'system'`;
const EMPTY_ADDRESS = {
  address1: '',
  address2: '',
  city: '',
  state: '',
  zip: '',
  country: '',
  lat: '',
  lng: ''
}
let groupCache = [];

// ✓ 2021-02-27 - Finished
const comparePw = /*async*/ (pw, hash) => bcrypt.compare(pw, hash);

// ✓ 2021-02-27 - Finished
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

// ✓ 2021-03-01 - Finished
function normalizeGroups(list) {
  let resp;
  if (Array.isArray(list)) {
    resp = list.map(({id, name, description, removable }) => ({
      id,
      name,
      description,
      removable: !!removable
    }));
  }

  return resp;
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
      passwordExpired: !!userInfo.pwd_expired,
      passwordExpirationTime,
      passwordExpirationWarned: userInfo.pwd_exp_warned,
      passwordRetryCount: userInfo.pwd_retry_count,
      canChangePassword: new Date(userInfo.can_change_on),
      profilePicture: userInfo.profile_picture,
      address_id: userInfo.address_id || null,
      address1: userInfo.address1 || '',
      address2: userInfo.address2 || '',
      city: userInfo.city || '',
      state: userInfo.state || '',
      zip: userInfo.zip || '',
      country: userInfo.country || '',
      lat: userInfo.lat || '',
      lng: userInfo.lng || '',
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
    let sql = `SELECT COUNT(*) count FROM omega_groups WHERE id in (${groups.join(', ')})`;
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
      let sql = `SELECT u.id, u.disabled,
        IFNULL(u.pwd_retry_count, 0) pwd_retry_count,
        NOW() > pw.expires_on locked, pw.password
        FROM omega_users u
        LEFT JOIN omega_passwords pw ON pw.user_id=u.id
        WHERE u.deleted=0 AND u.pwd_retry_count < 4 AND pw.active=1 AND username=?`;
      const data = await mySql.queryOne(sql, [username]);
      const isValid = (data.id && await comparePw(password, data.password));
      if (!isValid && data.id) {
        const pwd_retry_count = data.pwd_retry_count + 1;
        const disabled = pwd_retry_count > 3 ? ', disabled=1' : '';
        sql = `UPDATE omega_users SET pwd_retry_count=${pwd_retry_count}${disabled} WHERE id=${data.id}`;
        const newData = await mySql.queryOne(sql);
      }

      return isValid;
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
  async function createGroup(requestor, groupName, description, omega_users = []) {
    const mySql = new MySql(serviceConfig.db);
    try {
      let fields = {
        name: groupName.toLowerCase(),
        description,
        created_by: requestor,
        updated_by: requestor
      };
      const { sql, params } = createInsert('omega_groups', fields);
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

            const { sql: sql2, params: params2 } = createInsert('omega_user_groups', fields);
            await mySql.insert(sql2, params2);
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

  /* ✓ 2021-03-01 - TODO: Fix address
   * • Make sure user does not already exist
   * • Validate groups
   * • Adds user
   * • Adds password
   * • Adds user to groups
   */
  async function createUser(requestor, values, isTempPassword = true) {
    const {
      username, firstname, lastname, address1, address2 = '',
      city, state, zip, country, lat, lng, email, password, groups = []
    } = values;

    const mySql = new MySql(serviceConfig.db);
    try {
      const existsSql = 'SELECT id FROM omega_users WHERE deleted=0 AND username=?';
      const data = await mySql.queryOne(existsSql, [username]);
      if (data.id) {
        throw new Error(`User "${username}" already exists.`);
      }

      await validateGroups(mySql, groups);

      // TODO: Get lat/lng from address
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
        //lat,
        //lng,
        email,
        created_by: requestor,
        updated_by: requestor
      };
      const { sql: createSql, params } = createInsert('omega_users', fields);
      const user_id = await mySql.insert(createSql, params);

      if (user_id) {
        fields = {
          user_id,
          password: await encodePw(password),
          active: 1,
          expires_on: { value: isTempPassword ? 'NOW() - INTERVAL 1 DAY' : `NOW() + INTERVAL ${CONFIG.PASSWORD_MAX_AGE} DAY` },
          can_change_on: { value: isTempPassword ? 'NOW() - INTERVAL 1 DAY' : `NOW() + INTERVAL ${CONFIG.PASSWORD_MIN_AGE} DAY` },
          created_by: requestor
        }
        const { sql: createPasswordSql, params: p2 } = createInsert('omega_passwords', fields);
        await mySql.insert(createPasswordSql, p2);

        if (groups.length > 0) {
          const groupValues = groups.map(group => `(${user_id}, ${Number(group)}, ${requestor}, ${requestor})`).join(', ');
          const sql = `INSERT INTO omega_user_groups (user_id, group_id, created_by, updated_by) VALUES ${groupValues}`
          /*const resp = */await mySql.insert(sql);
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
  async function delGroup(groupName) {
    const existingGroup = await getGroupByName(groupName.toLowerCase());
    if (existingGroup == null) {
      return;
    }
    if (!existingGroup.removable) {
      throw new Error('Unable to delete a protected group');
    }

    const mySql = new MySql(serviceConfig.db);
    try {
      const groupId = existingGroup.id;
      let sql = `DELETE FROM omega_user_groups WHERE group_id=?`;
      /*let resp = */await mySql.queryOne(sql, [groupId]);

      sql = `DELETE FROM omega_groups WHERE id=?`;
      /*resp = */await mySql.queryOne(sql, [groupId]);

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
      const { sql, params } = createUpdate('omega_users', 'username', username, data);
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
  async function getGroupByName(groupName) {
    await getGroups();
    const _groupName = groupName.toLowerCase();
    const groupInfo = groupCache.filter(group => _groupName === group.name);
    return groupInfo[0];
  }

  // ✓ 2021-02-27 - Finished
  async function getGroupUsers(groupName, { start = 0, limit = 12000, order = 'asc' } = {}) { // eslint-disable-line no-unused-vars
    console.info('calling getGroupUsers');
    const mySql = new MySql(serviceConfig.db);
    let members;
    try {
      const sql = `SELECT u.id, u.username, u.firstname, u.lastname
        FROM omega_users u
        LEFT JOIN omega_user_groups ug ON ug.user_id = u.id
        LEFT JOIN omega_groups g ON g.id = ug.group_id
        WHERE u.deleted=0 AND g.name=?
        GROUP BY u.id;`;
      members = [...await mySql.query(sql, groupName.toLowerCase())];
    }

    catch (ex) {
      console.error(ex.stack);
      return false;
    }

    finally {
      mySql.close();
    }

    const total = members.length;
    const omega_users = members.sort(sortWithoutCase(order, 'username')).slice(start, start + limit);
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
        const sql = `SELECT id, name, description, removable FROM omega_groups`;
        groupCache = normalizeGroups(await mySql.query(sql));
        /*const groupCacheTimeout = */setTimeout(clearGroupsCache, GROUP_CACHE_RESET_TIME);
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

  // ✓ 2021-02-27 - Finished
  async function getUserById(uid) {
    const mySql = new MySql(serviceConfig.db);

    try {
      let sql = `${USER_SQL} AND ${typeof id === 'number' ? 'id' : 'username'}=?`;
      const data = await mySql.queryOne(sql, [uid]);
      if (!data.id) {
        console.warn(`No user found for "${uid}"`);
        return null;
      }

      data.groups = [];
      data.roles = [];

      sql = `SELECT g.id, g.name from omega_groups g
        LEFT JOIN omega_user_groups ug ON ug.group_id = g.id
        WHERE ug.user_id = ?
        ORDER BY g.name`;
      let temp = await mySql.query(sql, [data.id]);
      if (temp && temp.length > 0) {
        data.groups = [...temp];
        const groupIds = data.groups.map(obj => obj.id);
        if (groupIds.length > 0) {
          sql = `SELECT p.id, p.name FROM omega_permissions p
            LEFT JOIN omega_group_permissions gp ON gp.permission_id = p.id
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
      const sql = `${USER_SQL}
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
    const group = await getGroupByName(groupName.toLowerCase());
    return !!group;
  }

  // ✓ 2021-02-27 - Finished
  async function setAddress(requestor, user_id, address_id, address) {
    const mySql = new MySql(serviceConfig.db);
    let data, sql, params;

    try {
      if (address_id) {
        data = {
          ...EMPTY_ADDRESS,
          ...address,
          updated_by: requestor
        };
        ({ sql, params } = createUpdate('omega_addresses', 'id', address_id, data));
        await mySql.queryOne(sql, params);
      }
      else {
        data = {
          ...EMPTY_ADDRESS,
          ...address,
          created_by: requestor,
          updated_by: requestor
        };
        ({ sql, params } = createInsert('omega_addresses', data));
        address_id = await mySql.insert(sql, params);

        data = {
          address_id,
          updated_by: requestor
        };
        ({ sql, params } = createUpdate('omega_users', 'id', user_id, data));
        await mySql.queryOne(sql, params);
      }

      return address_id;
    }

    catch (ex) {
      console.error(ex.stack);
      throw new AttributeError(ex.code, ex.message, `Unable to save the "address".`);
    }

    finally {
      mySql.close();
    }
  }

  // ✓ 2021-03-02 - Finished
  async function setAttr(requestor, userId, attrs = {}) {
    const mySql = new MySql(serviceConfig.db);

    try {
      const fields = {
        ...attrs,
        updated_by: requestor
      }
      const { sql, params } = createUpdate('omega_users', 'id', userId, fields) ;
      const data = await mySql.queryOne(sql, params);
    }

    catch (ex) {
      console.error('Failed to update users');
      console.error(ex.stack);
      const attr = Object.keys(attrs).join('", "');
      throw new AttributeError(ex.code, ex.message, `Unable to set the "${attr}" attribute(s).`);
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
        active: 0,
        expires_on: { value: 'expires_on - INTERVAL 1 YEAR' }
      }
      let { sql, params } = createUpdate('omega_passwords', 'user_id', user_id, data);
      await mySql.queryOne(sql, params);

      // Add the new password and set it to active.
      data = {
        user_id,
        password: await encodePw(password),
        active: 1,
        expires_on: { value: forceChangeOnNextLogin ? 'NOW() - INTERVAL 1 HOUR' : `NOW() + INTERVAL ${CONFIG.PASSWORD_MAX_AGE} DAY` },
        can_change_on: { value: forceChangeOnNextLogin ? 'NOW() - INTERVAL 1 HOUR' : `NOW() + INTERVAL ${CONFIG.PASSWORD_MIN_AGE} DAY` },
        created_by: requestor
      };
      ({ sql, params } = createInsert('omega_passwords', data));
      const resp = await mySql.queryOne(sql, params);
      const { insertId } = resp;
      if ( insertId > 0) {
        sql = `SELECT expires_on, can_change_on FROM omega_passwords where id=${insertId}`;
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
    const group = await getGroupByName(groupName.toLowerCase());
    if (group) {
      const mySql = new MySql(serviceConfig.db);

      try {
        // Set all existing password for this user to inactive
        let data = {
          description,
          updated_by: requestor
        }
        let { sql, params } = createUpdate('omega_groups', 'id', group.id, data);
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
    // groupName.toLowerCase()
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
    setAddress,
    setAttr,
    setGroupDescription,
    setPassword,
    setUsersForGroup
  };
}

module.exports = SqlService;
