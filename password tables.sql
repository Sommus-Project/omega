SET foreign_key_checks = 0;

DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  firstname VARCHAR(255) NOT NULL,
  lastname VARCHAR(255) NOT NULL,
  address1 VARCHAR(255) NOT NULL,
  address2 VARCHAR(255) NULL,
  city VARCHAR(255) NOT NULL,
  state VARCHAR(255) NOT NULL,
  zip VARCHAR(255) NOT NULL,
  country VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  profile_picture VARCHAR(255) NULL,
  disabled TINYINT NOT NULL DEFAULT 0,
  modifiable TINYINT NOT NULL DEFAULT 1,
  deleted TINYINT NOT NULL DEFAULT 0,
  pwd_exp_warned TINYINT NOT NULL DEFAULT 0,
  pwd_retry_count INT UNSIGNED NULL,
  last_login DATETIME NULL,
  created_by BIGINT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT NOW(),
  updated_by BIGINT UNSIGNED NOT NULL DEFAULT 1,
  updated_at DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
  KEY created_by_i (created_by),
  KEY updated_by_i (updated_by),
  CONSTRAINT users_ibfk_2 FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE,
  CONSTRAINT users_ibfk_3 FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8;

INSERT INTO users (id, username, firstname, lastname, address1, city, state, zip, country, email) VALUES
  (1, 'collinsmg', 'Michael', 'Collins', '561 S 1020 W', 'Orem', 'UT', '84058', 'USA', 'intervalia@gmail.com'),
  (2, 'john', 'John', 'Smith', '123 Left Lane', 'Simi', 'CA', '93065', 'USA', 'barkingmad@gmail.com');

SELECT * FROM users;

DROP TABLE IF EXISTS passwords;
CREATE TABLE passwords (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  password VARCHAR(255) NOT NULL,
  active TINYINT NOT NULL DEFAULT 0,
  expires_on DATETIME NOT NULL,
  can_change_on DATETIME NOT NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT NOW(),
  KEY created_by_i (created_by),
  CONSTRAINT passwords_ibfk_1 FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

SET foreign_key_checks = 1;

INSERT INTO passwords (user_id, password, active, expires_on, can_change_on, created_by ) VALUES 
	( 1, '$2b$10$rLp5C5r1lAmiitrdCxbuHe8LaQ1GShmjFnKDzHdvg9hobtAtDJOse', 1, NOW() + INTERVAL 90 day, NOW(), 1 ),
	( 2, '$2b$10$rLp5C5r1lAmiitrdCxbuHe8LaQ1GShmjFnKDzHdvg9hobtAtDJOse', 1, NOW() + INTERVAL 90 day, NOW(), 1 );

SELECT * FROM users;
SELECT  id, username, firstname, lastname,  disabled, modifiable, deleted, created_by, created_at, updated_by, updated_at FROM users;

DELETE FROM users WHERE id=4;
SELECT * FROM passwords;
SELECT 	u.id, u.username, u.firstname, u.email, u.disabled, NOW() > pw.expires_on locked, u.modifiable,
	.deleted, u.pwd_exp_warned, IFNULL(u.pwd_retry_count, 0) pwd_retry_count,
  IFNULL(u.last_login, NOW() - INTERVAL 1 year) last_login, pw.password,
  pw.expires_on, pw.can_change_on, u.lastname, u.address1,
  IFNULL(u.address2, '') address2, u.city, u.state, u.zip, u.country,
  IFNULL(u.profile_picture, '') profile_picture
	FROM users u LEFT JOIN passwords pw ON pw.user_id=u.id WHERE pw.active=1;

INSERT INTO users (username, firstname, lastname, address1, city, state, zip, country, email, create_by, updated_by) VALUES
  ('testuser', 'Test', 'User', '', '', '', '', 'USA', 'test.user@gmail.com', 2, 2);
INSERT INTO passwords (user_id, password, active, expires_on, can_change_on, created_by) VALUES
  (100, '$2b$10$ORlM32m/Ey9LV.423sUyXuxmC.cN3QNi0iRXuvoPPyUwKTOnNPKOG', 1, NOW(), NOW(), 2 );
