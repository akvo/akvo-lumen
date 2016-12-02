# ADR 005: Using JavaScript for user defined transformations

# Context

It is not possible to list and up front define all the different
transformations a user might want to apply to a dataset. User defined
transformations is therefor an important feature in Lumen.

We must decide what kind of data transformation language we want to
use for these transformations. There are a couple of options:

We could create a custom DSL perhaps inspired by Excel formulas. A
custom DSL could be made less powerful (non Turing complete) which
could mean that it's easier to learn for the user and easier to
sandbox by the system.

We can also use an existing scripting language such as Clojure or
JavaScript. The obvious advantage is that the language is already
developed/tested/documented/optimized etc. It can be more challenging
to securely sandbox the execution and the language isn't tailor made
for our particular use case.

# Decision

We'll use JavaScript running in a sandboxed
[Nashorn](https://docs.oracle.com/javase/8/docs/technotes/guides/scripting/nashorn/intro.html)
js environment as the transformation language in Lumen.

# Status

Proposed

# Consequences

* User code must run in a sandboxed environment for security reasons
* We must guard against non-termination via some timeout mechanism.
* Lumen relies on typed columns but JavaScript is a dynamic language.
  We need to somehow ensure that the result of a user defined
  transformation doesn't result in inconsistent column types.
