import { Point } from "@ngageoint/simple-features-js";
import {GeometryReader} from "../lib/GeometryReader";
import {GeometryWriter} from "../lib/GeometryWriter";
import WKBTestUtils from "./WKBTestUtils";

describe('README Tests', function () {
	const GEOMETRY = new Point(1.0, 1.0);
	const BYTES = Buffer.from(new Uint8Array([0, 0, 0, 0, 1, 63, -16, 0, 0, 0, 0, 0, 0, 63, -16, 0, 0, 0, 0, 0, 0]));

	function testRead(buffer) {
		// let bytes = ...
		const geometry = GeometryReader.readGeometry(buffer);
		const geometryType = geometry.geometryType;
		return geometry;
	}

	function testWrite(geometry) {
		// const geometry = ...
		const buffer = GeometryWriter.writeGeometry(geometry);
		return buffer;
	}

	it('test read', function () {
		const geometry = testRead(BYTES);
		geometry.equals(GEOMETRY).should.be.true;
	});

	it('test write', function () {
		const buffer = testWrite(GEOMETRY);
		global.compareByteArrays(BYTES, buffer);
	});
});