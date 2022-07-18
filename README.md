# Simple Features WKB Javascript

#### Simple Features Well Known Binary Lib ####

The Simple Features Libraries were developed at the [National Geospatial-Intelligence Agency (NGA)](http://www.nga.mil/) in collaboration with [BIT Systems](https://www.caci.com/bit-systems/). The government has "unlimited rights" and is releasing this software to increase the impact of government investments by providing developers with the opportunity to take things in new directions. The software use, modification, and distribution rights are stipulated within the [MIT license](http://choosealicense.com/licenses/mit/).

### Pull Requests ###
If you'd like to contribute to this project, please make a pull request. We'll review the pull request and discuss the changes. All pull request contributions to this project will be released under the MIT license.

Software source code previously released under an open source license and then modified by NGA staff is considered a "joint work" (see 17 USC § 101); it is partially copyrighted, partially public domain, and as a whole is protected by the copyrights of the non-government authors and must be released according to the terms of the original open source license.

### About ###

[Simple Features WKB](http://ngageoint.github.io/simple-features-wkb-js/) is a Javascript library for reading and writing [Simple Feature](https://github.com/ngageoint/simple-features-js) Geometries to and from Well-Known Binary.


### Usage ###

View the latest [JS Docs](http://ngageoint.github.io/simple-features-wkb-js)


#### Browser Usage ####
```html
<script src="/path/to/simple-features-wkb-js/dist/sf-wkb.min.js"></script>
```
##### - Read
```javascript
const { GeometryReader } = window.SimpleFeaturesWKB;

//const buffer = ...
const geometry = GeometryReader.readGeometry(bytes);
const geometryType = geometry.getGeometryType();
```
##### - Write
```javascript
const { GeometryWriter } = window.SimpleFeaturesWKB;
// const geometry = ...

const buffer = GeometryWriter.writeGeometry(geometry);
```

#### Node Usage ####
[![NPM](https://img.shields.io/npm/v/@ngageoint/simple-features-wkb-js.svg)](https://www.npmjs.com/package/@ngageoint/simple-features-wkb-js)

Pull from [NPM](https://www.npmjs.com/package/@ngageoint/simple-features-wkb-js)

```install
npm install --save simple-features-wkb-js
```
##### - Read
```javascript
const { GeometryReader } = require("@ngageoint/simple-features-wkb-js");

//const buffer = ...
const geometry = GeometryReader.readGeometry(bytes);
const geometryType = geometry.getGeometryType();
```
##### - Write
```javascript
const { GeometryWriter } = require("@ngageoint/simple-features-wkb-js");

// const geometry = ...
const buffer = GeometryWriter.writeGeometry(geometry);
```

### Build ###

![Build & Test](https://github.com/ngageoint/simple-features-wkb-js/actions/workflows/run-tests.yml/badge.svg)

Build this repository using Node.js:
   
    npm install
    npm run build
