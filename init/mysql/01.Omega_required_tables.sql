SET foreign_key_checks = 0;

#-------------------------------------------------------------------------------
# omega_addresses table
#-------------------------------------------------------------------------------
DROP TABLE IF EXISTS omega_addresses;
CREATE TABLE omega_addresses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  address1 VARCHAR(255) NOT NULL,
  address2 VARCHAR(255) NULL,
  city VARCHAR(255) NOT NULL,
  state VARCHAR(255) NOT NULL,
  zip VARCHAR(255) NOT NULL,
  country VARCHAR(255) NOT NULL,
  lat VARCHAR(255) NULL,
  lng VARCHAR(255) NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT NOW(),
  updated_by BIGINT UNSIGNED NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
  KEY omega_addresses_created_by_i (created_by),
  KEY omega_addresses_updated_by_i (updated_by),
  CONSTRAINT omega_addresses_ibfk_1 FOREIGN KEY (created_by) REFERENCES omega_users (id) ON UPDATE CASCADE,
  CONSTRAINT omega_addresses_ibfk_2 FOREIGN KEY (updated_by) REFERENCES omega_users (id) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8;

#-------------------------------------------------------------------------------
# omega_users table
#-------------------------------------------------------------------------------
DROP TABLE IF EXISTS omega_users;
CREATE TABLE omega_users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  firstname VARCHAR(255) NOT NULL,
  lastname VARCHAR(255) NOT NULL,
  address_id BIGINT UNSIGNED NULL,
  email VARCHAR(255) NOT NULL,
  profile_picture VARCHAR(255) NULL,
  modifiable TINYINT NOT NULL DEFAULT 1,
  disabled TINYINT NOT NULL DEFAULT 0,
  deleted TINYINT NOT NULL DEFAULT 0,
  pwd_exp_warned TINYINT NOT NULL DEFAULT 0,
  pwd_retry_count INT UNSIGNED NOT NULL DEFAULT 0,
  last_login DATETIME NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT NOW(),
  updated_by BIGINT UNSIGNED NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
  KEY omega_users_address_id_i (address_id),
  KEY omega_users_created_by_i (created_by),
  KEY omega_users_updated_by_i (updated_by),
  CONSTRAINT omega_users_ibfk_1 FOREIGN KEY (address_id) REFERENCES omega_addresses (id) ON UPDATE CASCADE,
  CONSTRAINT omega_users_ibfk_2 FOREIGN KEY (created_by) REFERENCES omega_users (id) ON UPDATE CASCADE,
  CONSTRAINT omega_users_ibfk_3 FOREIGN KEY (updated_by) REFERENCES omega_users (id) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8;

#-------------------------------------------------------------------------------
# omega_passwords table
#-------------------------------------------------------------------------------
DROP TABLE IF EXISTS omega_passwords;
CREATE TABLE omega_passwords (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  password VARCHAR(255) NOT NULL,
  active TINYINT NOT NULL DEFAULT 0,
  expires_on DATETIME NOT NULL,
  can_change_on DATETIME NOT NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT NOW(),
  KEY omega_passwords_created_by_i (created_by),
  CONSTRAINT omega_passwords_ibfk_1 FOREIGN KEY (created_by) REFERENCES omega_users (id) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

#-------------------------------------------------------------------------------
# omega_groups table
#-------------------------------------------------------------------------------
DROP TABLE IF EXISTS omega_groups;
CREATE TABLE omega_groups (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description VARCHAR(255) NULL,
  removable TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT NOW(),
  created_by BIGINT UNSIGNED NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
  updated_by BIGINT UNSIGNED NOT NULL,
  KEY omega_groups_created_by_i (created_by),
  KEY omega_groups_updated_by_i (updated_by),
  CONSTRAINT omega_groups_ibfk_1 FOREIGN KEY (created_by) REFERENCES omega_users (id) ON UPDATE CASCADE,
  CONSTRAINT omega_groups_ibfk_2 FOREIGN KEY (updated_by) REFERENCES omega_users (id) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8;

#-------------------------------------------------------------------------------
# omega_user_groups table
#-------------------------------------------------------------------------------
DROP TABLE IF EXISTS omega_user_groups;
CREATE TABLE omega_user_groups (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  group_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT NOW(),
  created_by BIGINT UNSIGNED NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
  updated_by BIGINT UNSIGNED NOT NULL,
  KEY omega_user_groups_user_id_i (user_id),
  KEY omega_user_groups_group_id_i (group_id),
  KEY omega_user_groups_created_by_i (created_by),
  KEY omega_user_groups_updated_by_i (updated_by),
  CONSTRAINT omega_user_groups_ibfk_1 FOREIGN KEY (user_id) REFERENCES omega_users (id) ON UPDATE CASCADE,
  CONSTRAINT omega_user_groups_ibfk_2 FOREIGN KEY (group_id) REFERENCES omega_groups (id) ON UPDATE CASCADE,
  CONSTRAINT omega_user_groups_ibfk_3 FOREIGN KEY (created_by) REFERENCES omega_users (id) ON UPDATE CASCADE,
  CONSTRAINT omega_user_groups_ibfk_4 FOREIGN KEY (updated_by) REFERENCES omega_users (id) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

#-------------------------------------------------------------------------------
# omega_permissions table
#-------------------------------------------------------------------------------
DROP TABLE IF EXISTS omega_permissions;
CREATE TABLE omega_permissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description VARCHAR(255) NULL,
  removable TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT NOW(),
  created_by BIGINT UNSIGNED NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
  updated_by BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  KEY omega_permissions_created_by_i (created_by),
  KEY omega_permissions_updated_by_i (updated_by),
  CONSTRAINT omega_permissions_ibfk_1 FOREIGN KEY (created_by) REFERENCES omega_users (id) ON UPDATE CASCADE,
  CONSTRAINT omega_permissions_ibfk_2 FOREIGN KEY (updated_by) REFERENCES omega_users (id) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8;

#-------------------------------------------------------------------------------
# omega_group_permissions table
#-------------------------------------------------------------------------------
DROP TABLE IF EXISTS omega_group_permissions;
CREATE TABLE omega_group_permissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  group_id BIGINT UNSIGNED NOT NULL,
  permission_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT NOW(),
  created_by BIGINT UNSIGNED NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
  updated_by BIGINT UNSIGNED NOT NULL,
  KEY omega_group_permissions_group_id_i (group_id),
  KEY omega_group_permissions_permission_id_i (permission_id),
  KEY omega_group_permissions_created_by_i (created_by),
  KEY omega_group_permissions_updated_by_i (updated_by),
  CONSTRAINT omega_group_permissions_ibfk_1 FOREIGN KEY (group_id) REFERENCES omega_groups (id) ON UPDATE CASCADE,
  CONSTRAINT omega_group_permissions_ibfk_2 FOREIGN KEY (permission_id) REFERENCES omega_permissions (id) ON UPDATE CASCADE,
  CONSTRAINT omega_group_permissions_ibfk_3 FOREIGN KEY (created_by) REFERENCES omega_users (id) ON UPDATE CASCADE,
  CONSTRAINT omega_group_permissions_ibfk_4 FOREIGN KEY (updated_by) REFERENCES omega_users (id) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

#-------------------------------------------------------------------------------
# omega_sessions table
#-------------------------------------------------------------------------------
DROP TABLE IF EXISTS omega_sessions;
CREATE TABLE omega_sessions (
  user_id BIGINT UNSIGNED NOT NULL,
  username VARCHAR(255) NOT NULL,
  sessionId VARCHAR(255) NOT NULL,
  expires_on DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT NOW(),
  KEY omega_sessions_user_id_i (user_id),
  CONSTRAINT omega_sessions_ibfk_1 FOREIGN KEY (user_id) REFERENCES omega_users (id) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

SET foreign_key_checks = 1;
