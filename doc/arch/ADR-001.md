# ADR 001: Using React as framework for front-end development

## Context

We need a framework that serve as base for the front-end development of
Akvo Lumen. There are several options on the market, some of them are
JavaScript based others languages that compile to JavaScript
(transpilers) like ClojureScript.

## Decision

After discussing with the team and taking into account the skill set at
hand, we have decided that JavaScript and
[React](https://facebook.github.io/react/) it's a safer approach to
build the UI. It has a large community and we can use some available
components as the base of our UI.

## Status

Accepted

## Consequences

* The UI of Akvo Lumen will be made with React
* We need to incorporate a couple of pre-built components and use them
  as base, e.g. data grid, panel layout, etc
