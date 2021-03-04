SET foreign_key_checks = 0;

INSERT INTO omega_addresses
  (id, address1,      city,   state, zip,     country, lat,                  lng,                   created_by, updated_by) VALUES
  (1, '561 S 1020 W', 'Orem', 'UT',  '84058', 'USA',   '40.286766742151464', '-111.71959739734426', 1,          1);


INSERT INTO omega_users 
  (id, username,   firstname, lastname,  email,                  address_id, created_by, updated_by) VALUES
  (1, 'system',    'SYSTEM',  'USER',    '',                     NULL,       1,          1),
  (2, 'collinsmg', 'Michael', 'Collins', 'intervalia@gmail.com', 1,          1,          1);


INSERT INTO omega_passwords
  (user_id, password, active, expires_on, can_change_on, created_by ) VALUES 
  ( 1, '$2b$10$PesEYr6ck5JeJvAT49q0R.7pJq8q7VXuJsb3jWie3nKBB4qEeEE9O', 1, NOW() + INTERVAL 90 day, NOW(), 1 ),
# password if "K4(l@d$%-MW8Ik[_)!wAcd43" and it expires in 90 days  
  ( 2, '$2b$10$69AqsouJnrv7WsDExKe4ouowvzJxpji6owtJ8CVval.tNFJZhqGYq', 1, NOW() - INTERVAL 1 day, NOW() - INTERVAL 1 day, 1 );
# password is "password" and it is auto-expired. It will need to be changed on first login

# --- Required Omega groups
INSERT INTO omega_groups 
  (id, name,                description,                          removable, created_by, updated_by) VALUES
  (1,  'ADMIN',             'System Administrator',               0,         1,          1),
  (2,  'SUPER-USER',        'Super User',                         0,         1,          1);
  (3,  'USER-EDITOR',       'Read, Create and edit users',        0,         1,          1),
  (4,  'GROUP-EDITOR',      'Read, Create and edit groups',       0,         1,          1),
  (5,  'PERMISSION-EDITOR', 'Read, Create and edit permissions',  0,         1,          1);

INSERT INTO omega_user_groups
  (user_id, group_id, created_by, updated_by) VALUES
  (1,       1,        1,          1),
  (2,       1,        1,          1);

# --- Required Omega permissions
INSERT INTO omega_permissions
  (id, name,                  description,                              removable, created_by, updated_by) VALUES
  (1,  'ADMIN',               'System Administrator',                   0,         1,          1),
  (2,  'READ-USERS',          'Read the data related to a user',        0,         1,          1),
  (3,  'WRITE-USERS',         'Write data related to a user',           0,         1,          1),
  (4,  'DELETE-USERS',        'Delete data related to a user',          0,         1,          1),
  (5,  'READ-GROUPS',         'Read the data related to a group',       0,         1,          1),
  (6,  'WRITE-GROUPS',        'Write data related to a group',          0,         1,          1),
  (7,  'DELETE-GROUPS',       'Delete data related to a group',         0,         1,          1),
  (8,  'READ-PERMISSIONS',    'Read the data related to a permission',  0,         1,          1),
  (9,  'WRITE-PERMISSIONS',   'Write data related to a permission',     0,         1,          1),
  (10, 'DELETE-PERMISSIONS',  'Delete data related to a permission',    0,         1,          1);

INSERT INTO omega_group_permissions
  (group_id, permission_id, created_by, updated_by) VALUES
  # ADMIN group OMEGA
  (  1,   1, 1, 1),
  (  1,   2, 1, 1),
  (  1,   3, 1, 1),
  (  1,   4, 1, 1),
  (  1,   5, 1, 1),
  (  1,   7, 1, 1),
  (  1,   8, 1, 1),
  (  1,   9, 1, 1),
  (  1,  10, 1, 1),
  # POWER-USER group Omega
  (  2,   2, 1, 1),
  (  2,   3, 1, 1),
  (  2,   4, 1, 1),
  (  2,   5, 1, 1),
  (  2,   7, 1, 1),
  (  2,   8, 1, 1),
  (  2,   9, 1, 1),
  (  2,  10, 1, 1),
  # USER-EDITOR group Omega
  (  3,   2, 1, 1), # READ-USERS
  (  3,   3, 1, 1), # WRITE-USERS
  (  3,   4, 1, 1), # DELETE-USERS
  # GROUP-EDITOR group Omega
  (  4,   5, 1, 1), # READ-GROUPS
  (  4,   6, 1, 1), # WRITE-GROUPS
  (  4,   7, 1, 1), # DELETE-GROUPS
  # PERMISSION-EDITOR group Omega
  (  5,   8, 1, 1), # READ-PERMISSIONS
  (  5,   9, 1, 1), # WRITE-PERMISSIONS
  (  5,  10, 1, 1); # DELETE-PERMISSIONS

  SET foreign_key_checks = 1;
