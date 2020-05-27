# Omega Directory Service API

## ACCOUNT
| Verb | Endpoint | Description | Done |
| --- | --- | --- | --- |
| POST | /api/account/login | Log in user | ✓ |
| POST | /api/account/logout | Log out user | ✓ |
| GET | /api/account/whoami | Get logged in user info | ✓ |
| PUT | /api/account/name | Set own name | ✓ |
| PUT | /api/account/password | Set own password | ✓ |
| **PUT** | **/api/account/security** | **Set own security answers** | |
| GET | /api/account/session | Get session expiration | ✓ |
| PUT | /api/account/session | Renew the session. Returns same as GET | ✓ |
| DEL | /api/account/session | Delete session/Log out | ✓ |

## USERS
| Verb | Endpoint | Description | Done |
| --- | --- | --- | --- |
| GET | /api/users | Get a list of all users without their group information | ✓ |
| POST | /api/users | Create a new user | ✓ |
| GET | /api/users/{userid} | Get all information of user including their groups | ✓ |
| DEL | /api/users/{userid} | Delete a user | ✓ |
| GET | /api/users/{userid}/disabled | Get disabled state for user | ✓ |
| PUT | /api/users/{userid}/disabled | Set/Clear disabled state for user | ✓ |
| GET | /api/users/{userid}/groups | Get groups for user | ✓ |
| PUT | /api/users/{userid}/groups | Set groups for user | ✓ |
| **PATCH** | **/api/users/{userid}/groups** | **Change groups for user - FUTURE** |  |
| GET | /api/users/{userid}/locked | Get locked state for user | ✓ |
| PUT | /api/users/{userid}/locked | Set/Clear locked state for user | ✓ |
| GET | /api/users/{userid}/name | Get name for user | ✓ |
| PUT | /api/users/{userid}/name | Set name for user | ✓ |
| PUT | /api/users/{userid}/password | Set password for user | ✓ |
| **DEL** | **/api/users/{userid}/security** | **Clear security answers for user** |  |

## GROUPS
| Verb | Endpoint | Description | Done |
| --- | --- | --- | --- |
| GET | /api/groups | Get a list of all the available groups | ✓ |
| POST | /api/groups | Create a new group | ✓ |
| GET | /api/groups/{groupid} | Get info for group | ✓ |
| DEL | /api/groups/{groupid} | Delete a group | ✓ |
| GET | /api/groups/{groupid}/description | Get description for group | ✓ |
| PUT | /api/groups/{groupid}/description | Set description for group | ✓ |
| GET | /api/groups/{groupid}/users | Get list of users for group | ✓ |
| PUT | /api/groups/{groupid}/users | Set list of users for group | ✓ |
