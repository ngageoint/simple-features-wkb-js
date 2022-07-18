const should = require('chai').should();
const { Point, LineString, Polygon, MultiPoint, MultiLineString, GeometryCollection, CompoundCurve, CurvePolygon, GeometryType, MultiPolygon } = require('@ngageoint/simple-features-js');
const { ByteOrder } = require('../lib/ByteOrder')
const { ByteReader } = require('../lib/ByteReader')
const { GeometryReader } = require('../lib/GeometryReader')
const { GeometryCodes } = require('../lib/GeometryCodes')
const { GeometryWriter } = require('../lib/GeometryWriter')

const module = {
	exports: {}
};

global.compareEnvelopes = module.exports.compareEnvelopes = function(expected, actual) {
	if (expected == null) {
		should.not.exist(actual);
	} else {
		should.exist(actual);
		expected.minX.should.be.equal(actual.minX);
		expected.maxX.should.be.equal(actual.maxX);
		expected.minY.should.be.equal(actual.minY);
		expected.maxY.should.be.equal(actual.maxY);
		(expected.minZ === actual.minZ).should.be.true;
		(expected.maxZ === actual.maxZ).should.be.true;
		(expected.hasZ === actual.hasZ).should.be.true;
		(expected.minM === actual.minM).should.be.true;
		(expected.maxM === actual.maxM).should.be.true;
		(expected.hasM === actual.hasM).should.be.true;
	}
}

/**
 * Compare two geometries and verify they are equal
 * @param expected
 * @param actual
 */
global.compareGeometries = module.exports.compareGeometries = function(expected, actual) {
	if (expected == null) {
		should.not.exist(actual);
	} else {
		should.exist(actual);

		const geometryType = expected.geometryType;
		switch (geometryType) {
			case GeometryType.GEOMETRY:
				should.fail(false, false, "Unexpected Geometry Type of " + GeometryType.nameFromType(geometryType) + " which is abstract");
				break;
			case GeometryType.POINT:
				comparePoint(actual, expected);
				break;
			case GeometryType.LINESTRING:
				compareLineString(expected, actual);
				break;
			case GeometryType.POLYGON:
				comparePolygon(expected, actual);
				break;
			case GeometryType.MULTIPOINT:
				compareMultiPoint(expected, actual);
				break;
			case GeometryType.MULTILINESTRING:
				compareMultiLineString(expected, actual);
				break;
			case GeometryType.MULTIPOLYGON:
				compareMultiPolygon(expected, actual);
				break;
			case GeometryType.GEOMETRYCOLLECTION:
			case GeometryType.MULTICURVE:
			case GeometryType.MULTISURFACE:
				compareGeometryCollection(expected, actual);
				break;
			case GeometryType.CIRCULARSTRING:
				compareCircularString(expected, actual);
				break;
			case GeometryType.COMPOUNDCURVE:
				compareCompoundCurve(expected, actual);
				break;
			case GeometryType.CURVEPOLYGON:
				compareCurvePolygon(expected, actual);
				break;
			case GeometryType.CURVE:
				should.fail(false, false, "Unexpected Geometry Type of " + GeometryType.nameFromType(geometryType) + " which is abstract");
				break;
			case GeometryType.SURFACE:
				should.fail(false, false, "Unexpected Geometry Type of " + GeometryType.nameFromType(geometryType) + " which is abstract");
				break;
			case GeometryType.POLYHEDRALSURFACE:
				comparePolyhedralSurface(expected, actual);
				break;
			case GeometryType.TIN:
				compareTIN(expected, actual);
				break;
			case GeometryType.TRIANGLE:
				compareTriangle(expected, actual);
				break;
			default:
				throw new Error("Geometry Type not supported: " + geometryType);
		}
	}
}

/**
 * Compare to the base attributes of two geometries
 *
 * @param expected
 * @param actual
 */
global.compareBaseGeometryAttributes = module.exports.compareBaseGeometryAttributes = function(expected, actual) {
	expected.geometryType.should.be.equal(actual.geometryType);
	expected.hasZ.should.be.equal(actual.hasZ);
	expected.hasM.should.be.equal(actual.hasM);
}

/**
 * Compare the two points for equality
 *
 * @param expected
 * @param actual
 */
global.comparePoint = module.exports.comparePoint = function(expected, actual) {
	compareBaseGeometryAttributes(expected, actual);
	expected.equals(actual).should.be.true;
}

/**
 * Compare the two line strings for equality
 *
 * @param expected
 * @param actual
 */
global.compareLineString = module.exports.compareLineString = function(expected, actual) {
	compareBaseGeometryAttributes(expected, actual);
	expected.numPoints().should.be.equal(actual.numPoints());
	for (let i = 0; i < expected.numPoints(); i++) {
		comparePoint(expected.getPoint(i), actual.getPoint(i));
	}
}

/**
 * Compare the two polygons for equality
 *
 * @param expected
 * @param actual
 */
global.comparePolygon = module.exports.comparePolygon = function(expected, actual) {
	compareBaseGeometryAttributes(expected, actual);
	expected.numRings().should.be.equal(actual.numRings());
	for (let i = 0; i < expected.numRings(); i++) {
		compareLineString(expected.getRing(i), actual.getRing(i));
	}
}

/**
 * Compare the two multi points for equality
 *
 * @param expected
 * @param actual
 */
global.compareMultiPoint = module.exports.compareMultiPoint = function(expected, actual) {
	compareBaseGeometryAttributes(expected, actual);
	expected.numPoints().should.be.equal(actual.numPoints());
	for (let i = 0; i < expected.numPoints(); i++) {
		comparePoint(expected.points[i], actual.points[i]);
	}
}

/**
 * Compare the two multi line strings for equality
 *
 * @param expected
 * @param actual
 */
global.compareMultiLineString = module.exports.compareMultiLineString = function(expected, actual) {
	compareBaseGeometryAttributes(expected, actual);
	expected.numLineStrings().should.be.equal(actual.numLineStrings());
	for (let i = 0; i < expected.numLineStrings(); i++) {
		compareLineString(expected.lineStrings[i], actual.lineStrings[i]);
	}
}

/**
 * Compare the two multi polygons for equality
 *
 * @param expected
 * @param actual
 */
global.compareMultiPolygon = module.exports.compareMultiPolygon = function(expected, actual) {
	compareBaseGeometryAttributes(expected, actual);
	expected.numPolygons().should.be.equal(actual.numPolygons());
	for (let i = 0; i < expected.numPolygons(); i++) {
		comparePolygon(expected.polygons[i], actual.polygons[i]);
	}
}

/**
 * Compare the two geometry collections for equality
 *
 * @param expected
 * @param actual
 */
global.compareGeometryCollection = module.exports.compareGeometryCollection = function(expected, actual) {
	compareBaseGeometryAttributes(expected, actual);
	expected.numGeometries().should.be.equal(actual.numGeometries());
	for (let i = 0; i < expected.numGeometries(); i++) {
		compareGeometries(expected.getGeometry(i), actual.getGeometry(i));
	}
}

/**
 * Compare the two circular strings for equality
 *
 * @param expected
 * @param actual
 */
global.compareCircularString = module.exports.compareCircularString = function(expected, actual) {
	compareBaseGeometryAttributes(expected, actual);
	expected.numPoints().should.be.equal(actual.numPoints());
	for (let i = 0; i < expected.numPoints(); i++) {
		comparePoint(expected.points[i], actual.points[i]);
	}
}

/**
 * Compare the two compound curves for equality
 *
 * @param expected
 * @param actual
 */
global.compareCompoundCurve = module.exports.compareCompoundCurve = function(expected, actual) {
	compareBaseGeometryAttributes(expected, actual);
	expected.numLineStrings().should.be.equal(actual.numLineStrings());
	for (let i = 0; i < expected.numLineStrings(); i++) {
		compareLineString(expected.lineStrings[i], actual.lineStrings[i]);
	}
}

/**
 * Compare the two curve polygons for equality
 *
 * @param expected
 * @param actual
 */
global.compareCurvePolygon = module.exports.compareCurvePolygon = function(expected, actual) {
	compareBaseGeometryAttributes(expected, actual);
	expected.numRings().should.be.equal(actual.numRings());
	for (global. i = 0; i < expected.numRings(); i++) {
		compareGeometries(expected.rings[i], actual.rings[i]);
	}
}

/**
 * Compare the two polyhedral surfaces for equality
 *
 * @param expected
 * @param actual
 */
global.comparePolyhedralSurface = module.exports.comparePolyhedralSurface = function(expected, actual) {
	compareBaseGeometryAttributes(expected, actual);
	expected.numPolygons().should.be.equal(actual.numPolygons());
	for (let i = 0; i < expected.numPolygons(); i++) {
		compareGeometries(expected.polygons[i], actual.polygons[i]);
	}
}

/**
 * Compare the two TINs for equality
 *
 * @param expected
 * @param actual
 */
global.compareTIN = module.exports.compareTIN = function(expected, actual) {
	compareBaseGeometryAttributes(expected, actual);
	expected.numPolygons().should.be.equal(actual.numPolygons());
	for (let i = 0; i < expected.numPolygons(); i++) {
		compareGeometries(expected.polygons[i], actual.polygons[i]);
	}
}

/**
 * Compare the two triangles for equality
 *
 * @param expected
 * @param actual
 */
global.compareTriangle = module.exports.compareTriangle = function(expected, actual) {
	compareBaseGeometryAttributes(expected, actual);
	expected.numRings().should.be.equal(actual.numRings());
	for (let i = 0; i < expected.numRings(); i++) {
		compareLineString(expected.rings[i], actual.rings[i]);
	}
}

/**
 * Compare two byte arrays and verify they are equal
 *
 * @param expected
 * @param actual
 * @return true if equal
 */
global.equalByteArrays = module.exports.equalByteArrays = function(expected, actual) {
	return Buffer.compare(expected, actual) === 0;
}

/**
 * Create a random point
 *
 * @param hasZ
 * @param hasM
 * @return Point
 */
global.createPoint = module.exports.createPoint = function(hasZ, hasM) {
	let x = Math.random() * 180.0 * (Math.random() < .5 ? 1 : -1);
	let y = Math.random() * 90.0 * (Math.random() < .5 ? 1 : -1);
	let point = new Point(hasZ, hasM, x, y);
	if (hasZ) {
		point.z = Math.random() * 1000.0;
	}
	if (hasM) {
		point.m = Math.random() * 1000.0;
	}
	return point;
}

/**
 * Create a random line string
 *
 * @param hasZ
 * @param hasM
 * @param ring
 * @return LineString
 */
global.createLineString = module.exports.createLineString = function(hasZ, hasM, ring = false) {
	const lineString = new LineString(hasZ, hasM);
	const num = 2 + Math.round(Math.random() * 9);
	for (let i = 0; i < num; i++) {
		lineString.addPoint(createPoint(hasZ, hasM));
	}
	if (ring) {
		lineString.addPoint(lineString.points[0]);
	}
	return lineString;
}

/**
 * Create a random polygon
 * @param hasZ
 * @param hasM
 * @return Polygon
 */
global.createPolygon = module.exports.createPolygon = function(hasZ, hasM) {
	const polygon = new Polygon(hasZ, hasM);
	const num = 1 + Math.round(Math.random() * 5);
	for (let i = 0; i < num; i++) {
		polygon.addRing(createLineString(hasZ, hasM, true));
	}
	return polygon;
}

/**
 * Create a random multi point
 *
 * @param hasZ
 * @param hasM
 * @return MultiPoint
 */
global.createMultiPoint = module.exports.createMultiPoint = function(hasZ, hasM) {
	const multiPoint = new MultiPoint(hasZ, hasM);
	const num = 1 + Math.round(Math.random() * 5);
	for (let i = 0; i < num; i++) {
		multiPoint.addPoint(createPoint(hasZ, hasM));
	}
	return multiPoint;
}

/**
 * Create a random multi line string
 *
 * @param hasZ
 * @param hasM
 * @return MultiLineString
 */
global.createMultiLineString = module.exports.createMultiLineString = function(hasZ, hasM) {
	const multiLineString = new MultiLineString(hasZ, hasM);
	const num = 1 + Math.round(Math.random() * 5);
	for (let i = 0; i < num; i++) {
		multiLineString.addLineString(createLineString(hasZ, hasM));
	}
	return multiLineString;
}

/**
 * Create a random multi polygon
 *
 * @param hasZ
 * @param hasM
 * @return MultiPolygon
 */
global.createMultiPolygon = module.exports.createMultiPolygon = function(hasZ, hasM) {
	const multiPolygon = new MultiPolygon(hasZ, hasM);
	const num = 1 + Math.round(Math.random() * 5);
	for (let i = 0; i < num; i++) {
		multiPolygon.addPolygon(createPolygon(hasZ, hasM));
	}
	return multiPolygon;
}

/**
 * Create a random geometry collection
 *
 * @param hasZ
 * @param hasM
 * @return GeometryCollection
 */
global.createGeometryCollection = module.exports.createGeometryCollection = function(hasZ, hasM) {
	const geometryCollection = new GeometryCollection(hasZ, hasM);
	const num = 1 + Math.round(Math.random() * 5);
	for (let i = 0; i < num; i++) {
		let geometry = null;
		let randomGeometry = Math.floor(Math.random() * 6);
		switch (randomGeometry) {
			case 0:
				geometry = createPoint(hasZ, hasM);
				break;
			case 1:
				geometry = createLineString(hasZ, hasM);
				break;
			case 2:
				geometry = createPolygon(hasZ, hasM);
				break;
			case 3:
				geometry = createMultiPoint(hasZ, hasM);
				break;
			case 4:
				geometry = createMultiLineString(hasZ, hasM);
				break;
			case 5:
				geometry = createMultiPolygon(hasZ, hasM);
				break;
		}

		geometryCollection.addGeometry(geometry);
	}

	return geometryCollection;
}

/**
 * Creates a random point
 * @param minX
 * @param minY
 * @param xRange
 * @param yRange
 * @returns Point
 */
global.createRandomPoint = module.exports.createPoint = function(minX, minY, xRange, yRange) {
	const x = minX + (Math.random() * xRange);
	const y = minY + (Math.random() * yRange);
	return new Point(x, y);
}

/**
 * Create a random compound curve
 *
 * @param hasZ
 * @param hasM
 * @param ring
 * @return CompoundCurve
 */
global.createCompoundCurve = module.exports.createCompoundCurve = function(hasZ, hasM, ring = false) {
	const compoundCurve = new CompoundCurve(hasZ, hasM);
	const num = 2 + Math.round(Math.random() * 9);
	for (let i = 0; i < num; i++) {
		compoundCurve.addLineString(createLineString(hasZ, hasM));
	}
	if (ring) {
		compoundCurve.getLineString(num - 1).addPoint(compoundCurve.getLineString(0).startPoint());
	}
	return compoundCurve;
}

/**
 * Create a random curve polygon
 *
 * @param hasZ
 * @param hasM
 * @return CurvePolygon
 */
global.createCurvePolygon = module.exports.createCurvePolygon = function(hasZ, hasM) {
	const curvePolygon = new CurvePolygon(hasZ, hasM);
	const num = 1 + Math.round(Math.random() * 5);
	for (let i = 0; i < num; i++) {
		curvePolygon.addRing(createCompoundCurve(hasZ, hasM, true));
	}
	return curvePolygon;
}

global.createMultiCurve = module.exports.createMultiCurve = function() {
  const multiCurve = new GeometryCollection();
	const num = 1 + (Math.round(Math.random() * 5));

	for (let i = 0; i < num; i++) {
		if (i % 2 === 0) {
			multiCurve.addGeometry(global.createCompoundCurve(global.coinFlip(), global.coinFlip()));
		} else {
			multiCurve.addGeometry(global.createLineString(global.coinFlip(), global.coinFlip()));
		}
	}

	return multiCurve.getAsMultiCurve();
}

global.createMultiSurface = module.exports.createMultiSurface = function() {

	const multiSurface = new GeometryCollection();

	const num = 1 + (Math.round(Math.random() * 5));

	for (let i = 0; i < num; i++) {
		if (i % 2 === 0) {
			multiSurface.addGeometry(global.createCurvePolygon(global.coinFlip(), global.coinFlip()));
		} else {
			multiSurface.addGeometry(global.createPolygon(global.coinFlip(), global.coinFlip()));
		}
	}

	return multiSurface;
}

/**
 * Randomly return true or false
 * @return true or false
 */
global.coinFlip = module.exports.coinFlip = function() {
	return Math.random() < 0.5;
}
/**
 * Write and compare the bytes of the geometries
 *
 * @param expected expected geometry
 * @param actual actual geometry
 */
global.compareGeometryBytes = module.exports.compareGeometryBytes = function(expected, actual) {
	compareGeometryBytes(expected, actual, ByteOrder.BIG_ENDIAN);
}

/**
 * Write and compare the bytes of the geometries using the byte order
 * @param expected expected geometry
 * @param actual actual geometry
 * @param byteOrder byte order
 */
global.compareGeometryBytes = module.exports.compareGeometryBytes = function(expected, actual, byteOrder) {
	const expectedBuffer = writeBuffer(expected, byteOrder);
	const actualBuffer = writeBuffer(actual, byteOrder);

	compareByteArrays(expectedBuffer, actualBuffer);
}

/**
 * Read and compare the byte geometries using the byte order
 *
 * @param expected expected bytes
 * @param actual actual bytes
 * @param byteOrder byte order
 */
global.compareByteGeometries = module.exports.compareByteGeometries = function(expected, actual, byteOrder = ByteOrder.BIG_ENDIAN) {
	const expectedGeometry = readGeometry(expected, byteOrder);
	const actualGeometry = readGeometry(actual, byteOrder);
	compareGeometries(expectedGeometry, actualGeometry);
}

/**
 * Write the geometry to bytes in the provided byte order
 *
 * @param geometry geometry
 * @param byteOrder byte order
 * @return Buffer
 */
global.writeBuffer = module.exports.writeBuffer = function(geometry, byteOrder = ByteOrder.BIG_ENDIAN) {
	return GeometryWriter.writeGeometry(geometry, byteOrder);
}

/**
 * Read a geometry from bytes as the provided byte order
 *
 * @param bytes bytes
 * @param byteOrder byte order
 * @return geometry
 */
global.readGeometry = module.exports.readGeoemtry = function(bytes, byteOrder) {
	const reader = new ByteReader(bytes, byteOrder);
	const geometry = GeometryReader.readGeometry(reader);
	const reader2 = new ByteReader(bytes, byteOrder);
	const geometryTypeInfo = GeometryReader.readGeometryType(reader2);
	geometryTypeInfo.geometryType.should.be.equal(GeometryCodes.getGeometryType(geometryTypeInfo.geometryTypeCode))
	let expectedGeometryType = geometryTypeInfo.geometryType;
	switch (expectedGeometryType) {
		case GeometryType.MULTICURVE:
		case GeometryType.MULTISURFACE:
			expectedGeometryType = GeometryType.GEOMETRYCOLLECTION;
			break;
		default:
	}
	expectedGeometryType.should.be.equal(geometry.geometryType);
	geometryTypeInfo.hasZ.should.be.equal(geometry.hasZ);
	geometryTypeInfo.hasM.should.be.equal(geometry.hasM);
	return geometry;
}

/**
 * Compare two byte arrays and verify they are equal
 * @param expected expected bytes
 * @param actual actual bytes
 */
global.compareByteArrays = module.exports.compareByteArrays = function(expected, actual) {
	Buffer.compare(expected, actual).should.be.equal(0);
}
