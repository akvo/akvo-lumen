# Akvo Lumen
An open-source, easy to use data mashup, analysis and publishing platform.

[![Build Status](https://travis-ci.org/akvo/akvo-lumen.svg?branch=develop)](https://travis-ci.org/akvo/akvo-lumen)

## PM

- [Issues](https://github.com/akvo/akvo-lumen/issues)
- [Board](http://waffle.io/akvo/akvo-lumen)

## Client
[Readme](client/README.md)

## Backend
[Readme](backend/README.md)

## Integration
[Data import - Readme](doc/integration/InputFormat.md)

## Keycloak
The admin password for keycloak is "admin" / "password". There is an "akvo" realm, where two tenants (t1 & t2) and they are represesnted by the following groups:

```
akvo
└── lumen
    ├── t1
    │   └── admin
    └── t2
        └── admin
```

Available users are:

- "lumen" service account
- "jerome" t1 admin
- "salim" t1 user
- "ruth" t2 admin
- "harry" t2 user
- "kaj" keycloak user not on a tenant

All passwords are "password".


## Legal
Copyright © 2016 - present Akvo Foundation


### Thanks
<img src="http://www.browserstack.com/images/layout/browserstack-logo-600x315.png" width="280"/>

[BrowserStack](http://www.browserstack.com) is supporting Akvo, allowing us to use their service and infrastructure to test the code in this repository. Thank you for supporting the open source community!
