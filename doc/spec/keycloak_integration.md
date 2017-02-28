## Keycloak integration

We partition tenants in Keycloak via Groups. A big reason for this is that
groups enable us to ask Keycloak for all users in a group / tenant. This is
handy in the user admin view.

Within a tenant users can either be admin or users. We implemented this as two
groups where the user is a member of one or the other, but shuld not be member
of both as per:

- t1       -> Salim is member of this group
- t1/admin -> Jerome is member of this group

Each group has a role mapping as:

- t1       -> akvo:lumen:t1
- t1/admin -> akvo:lumen:t2:admin

If a user is memnber of both they will show up multiple times in the
user admins - user list.
