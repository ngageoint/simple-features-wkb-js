const should = require('chai').should();
import WKBTestUtils from './WKBTestUtils';
import { ByteOrder } from '../lib/ByteOrder'
import { GeometryWriter } from '../lib/GeometryWriter'
import {
  CompoundCurve,
  ExtendedGeometryCollection,
  FiniteFilterType, GeometryCollection,
  GeometryType, LineString, MultiPolygon, Point,
  PointFiniteFilter, Polygon
} from '@ngageoint/simple-features-js'
import { GeometryReader } from '../lib/GeometryReader'
import { GeometryCodes } from '../lib/GeometryCodes'
import { ByteReader } from '../lib/ByteReader'


const GEOMETRIES_PER_TEST = 10;

/**
 * Test the geometry writing to and reading from bytes, compare with the
 * provided geometry
 * @param geometry geometry
 * @param compareGeometry compare geometry
 */
function geometryTester(geometry, compareGeometry) {
  if (compareGeometry == null) {
    compareGeometry = geometry;
  }
  // Write the geometries to bytes
  const bytes1 = global.writeBuffer(geometry, ByteOrder.BIG_ENDIAN);
  const bytes2 = global.writeBuffer(geometry, ByteOrder.LITTLE_ENDIAN);

  global.equalByteArrays(bytes1, bytes2).should.be.false;

  // Test that the bytes are read using their written byte order, not
  // the specified
  const geometry1opposite = global.readGeometry(bytes1, ByteOrder.LITTLE_ENDIAN);
  const geometry2opposite = global.readGeometry(bytes2, ByteOrder.BIG_ENDIAN);
  global.compareByteArrays(global.writeBuffer(compareGeometry), global.writeBuffer(geometry1opposite));
  global.compareByteArrays(global.writeBuffer(compareGeometry), global.writeBuffer(geometry2opposite));

  const geometry1 = global.readGeometry(bytes1, ByteOrder.BIG_ENDIAN);
  const geometry2 = global.readGeometry(bytes2, ByteOrder.LITTLE_ENDIAN);

  global.compareGeometries(compareGeometry, geometry1);
  global.compareGeometries(compareGeometry, geometry2);
  global.compareGeometries(geometry1, geometry2);

  const envelope = compareGeometry.getEnvelope();
  const envelope1 = geometry1.getEnvelope();
  const envelope2 = geometry2.getEnvelope();

  global.compareEnvelopes(envelope, envelope1);
  global.compareEnvelopes(envelope1, envelope2);
}

/**
 * Convert the hex string to a byte array
 * @param hex hex string
 * @return byte array
 */
function hexStringToBuffer(hex) {
  return Buffer.from(hex, 'hex');
}

/**
 * Test fine filter for the geometry
 * @param geometry geometry
 */
function testFiniteFilter(geometry) {
  const bytes = GeometryWriter.writeGeometry(geometry);
  _testFiniteFilter(bytes, new PointFiniteFilter(FiniteFilterType.FINITE));
  _testFiniteFilter(bytes, new PointFiniteFilter(FiniteFilterType.FINITE, true));
  _testFiniteFilter(bytes, new PointFiniteFilter(FiniteFilterType.FINITE, false, true));
  _testFiniteFilter(bytes, new PointFiniteFilter(FiniteFilterType.FINITE,true, true));
  _testFiniteFilter(bytes, new PointFiniteFilter(FiniteFilterType.FINITE_AND_NAN));
  _testFiniteFilter(bytes, new PointFiniteFilter(FiniteFilterType.FINITE_AND_NAN, true));
  _testFiniteFilter(bytes, new PointFiniteFilter(FiniteFilterType.FINITE_AND_NAN, false, true));
  _testFiniteFilter(bytes, new PointFiniteFilter(FiniteFilterType.FINITE_AND_NAN, true, true));
  _testFiniteFilter(bytes, new PointFiniteFilter(FiniteFilterType.FINITE_AND_INFINITE));
  _testFiniteFilter(bytes, new PointFiniteFilter(FiniteFilterType.FINITE_AND_INFINITE, true));
  _testFiniteFilter(bytes, new PointFiniteFilter(FiniteFilterType.FINITE_AND_INFINITE, false, true));
  _testFiniteFilter(bytes, new PointFiniteFilter(FiniteFilterType.FINITE_AND_INFINITE, true, true));
}

/**
 * Filter and validate the geometry bytes
 * @param bytes geometry bytes
 * @param filter point finite filter
 */
function _testFiniteFilter(bytes, filter) {
  const geometry = GeometryReader.readGeometry(bytes, filter);

  if (geometry != null) {
    const points = [];

    switch (geometry.geometryType) {
      case GeometryType.POINT:
        points.push(geometry);
        break;
      case GeometryType.LINESTRING:
        points.push(...geometry.points);
        break;
      case GeometryType.POLYGON:
        points.push(...geometry.getRing(0).points);
        break;
      default:
        should.fail("Unexpected test case: " + geometry.geometryType);
    }

    for (const point of points) {

      switch (filter.getType()) {
        case FiniteFilterType.FINITE:
          Number.isFinite(point.x).should.be.true;
          Number.isFinite(point.y).should.be.true;
          if (filter.isFilterZ() && point.hasZ) {
            Number.isFinite(point.z).should.be.true;
          }
          if (filter.isFilterM() && point.hasM) {
            Number.isFinite(point.m).should.be.true;
          }
          break;
        case FiniteFilterType.FINITE_AND_NAN:
          (Number.isFinite(point.x) || Number.isNaN(point.x)).should.be.true;
          (Number.isFinite(point.y) || Number.isNaN(point.y)).should.be.true;
          if (filter.isFilterZ() && point.hasZ) {
            (Number.isFinite(point.z) || Number.isNaN(point.z)).should.be.true;
          }
          if (filter.isFilterM() && point.hasM) {
            (Number.isFinite(point.m) || Number.isNaN(point.m)).should.be.true;
          }
          break;
        case FiniteFilterType.FINITE_AND_INFINITE:
          (Number.isFinite(point.x) || !Number.isFinite(point.x)).should.be.true;
          (Number.isFinite(point.y) || !Number.isFinite(point.y)).should.be.true;
          if (filter.isFilterZ() && point.hasZ) {
            (Number.isFinite(point.z) || !Number.isFinite(point.z)).should.be.true;
          }
          if (filter.isFilterM() && point.hasM) {
            (Number.isFinite(point.m) || !Number.isFinite(point.m)).should.be.true;
          }
          break;
      }

    }
  }

}

describe('WKB Tests', function () {
  it('test point', function () {
    for (let i = 0; i < GEOMETRIES_PER_TEST; i++) {
      // Create and test a point
      const point = global.createPoint(global.coinFlip(), global.coinFlip());
      geometryTester(point);
    }
  });


  it('test line string', function () {

    for (let i = 0; i < GEOMETRIES_PER_TEST; i++) {
      // Create and test a line string
      const lineString = global.createLineString(global.coinFlip(), global.coinFlip());
      geometryTester(lineString);
    }

  });

  it('test polygon', function () {

    for (let i = 0; i < GEOMETRIES_PER_TEST; i++) {
      // Create and test a polygon
      const polygon = global.createPolygon(global.coinFlip(), global.coinFlip());
      geometryTester(polygon);
    }

  });

  it('test multi point', function () {

    for (let i = 0; i < GEOMETRIES_PER_TEST; i++) {
      // Create and test a multi point
      const multiPoint = global.createMultiPoint(global.coinFlip(), global.coinFlip());
      geometryTester(multiPoint);
    }

  });

  it('test multi line string', function () {

    for (let i = 0; i < GEOMETRIES_PER_TEST; i++) {
      // Create and test a multi line string
      const multiLineString = global.createMultiLineString(global.coinFlip(), global.coinFlip());
      geometryTester(multiLineString);
    }

  });

  it('test multi curve with line strings', function () {

    // Test a pre-created WKB saved as the abstract MultiCurve type with LineStrings

    const bytes = Buffer.from(new Uint8Array([ 0, 0, 0, 0, 11, 0, 0, 0, 2, 0, 0, 0, 0, 2,
      0, 0, 0, 3, 64, 50, -29, -55, -6, 126, -15, 120, -64, 65, -124,
      -86, -46, -62, -60, 94, -64, 66, -31, -40, 124, -2, -47, -5,
      -64, 82, -13, -22, 8, -38, 6, 111, 64, 81, 58, 88, 78, -15, 82,
      111, -64, 86, 20, -18, -37, 3, -99, -86, 0, 0, 0, 0, 2, 0, 0, 0,
      10, 64, 98, 48, -84, 37, -62, 34, 98, -64, 68, -12, -81, 104,
      13, -109, 6, -64, 101, -82, 76, -68, 34, 117, -110, 64, 39,
      -125, 83, 1, 50, 86, 8, -64, 83, 127, -93, 42, -89, 54, -56,
      -64, 67, -58, -13, -104, 1, -17, -10, 64, 97, 18, -82, -112,
      100, -128, 16, 64, 68, -13, -86, -112, 112, 59, -3, 64, 67, -4,
      -71, -91, -16, -15, 85, -64, 49, 110, -16, 94, -71, 24, -13,
      -64, 94, 84, 94, -4, -78, -101, -75, -64, 80, 74, -39, 90, 38,
      107, 104, 64, 72, -16, -43, 82, -112, -39, 77, 64, 28, 30, 97,
      -26, 64, 102, -110, 64, 92, 63, -14, -103, 99, -67, 63, -64, 65,
      -48, 84, -37, -111, -55, -25, -64, 101, -10, -62, -115, 104,
      -125, 28, -64, 66, 5, 108, -56, -59, 69, -36, -64, 83, 33, -36,
      -86, 106, -84, -16, 64, 70, 30, -104, -50, -57, 15, -7]));

    GeometryCodes.getCodeForGeometryType(GeometryType.MULTICURVE).should.be.equal(bytes[4]);

    const geometry = global.readGeometry(bytes);
    (geometry instanceof GeometryCollection).should.be.true;
    geometry.geometryType.should.be.equal(GeometryType.GEOMETRYCOLLECTION)
    const multiCurve = geometry;
    (multiCurve.numGeometries() === 2).should.be.true;
    const geometry1 = multiCurve.geometries[0];
    const geometry2 = multiCurve.geometries[1];
    (geometry1 instanceof LineString).should.be.true;
    (geometry2 instanceof LineString).should.be.true;
    const lineString1 = geometry1;
    const lineString2 = geometry2;
    (lineString1.numPoints() === 3).should.be.true;
    (lineString2.numPoints() === 10).should.be.true;
    const point1 = lineString1.startPoint();
    const point2 = lineString2.endPoint();
    point1.x.should.be.equal(18.889800697319032);
    point1.y.should.be.equal(-35.036463112927535);
    point2.x.should.be.equal(-76.52909336488278);
    point2.y.should.be.equal(44.2390383216843);

    const extendedMultiCurve = new ExtendedGeometryCollection(multiCurve);
    (GeometryType.MULTICURVE).should.be.equal(extendedMultiCurve.geometryType);

    geometryTester(extendedMultiCurve, multiCurve);

    const bytes2 = global.writeBuffer(extendedMultiCurve);
    (GeometryCodes.getCodeForGeometryType(GeometryType.MULTICURVE)).should.be.equal(bytes2[4]);
    global.compareByteArrays(bytes, bytes2);

  });

  it('test multi curve with compound curve', function () {

    // Test a pre-created WKB saved as the abstract MultiCurve type with a CompoundCurve

    const bytes = Buffer.from(new Uint8Array([0, 0, 0, 0, 11, 0, 0, 0, 1, 0, 0, 0, 0, 9,
      0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 3, 65, 74, 85, 13, 0, -60,
      -101, -90, 65, 84, -23, 84, 60, -35, 47, 27, 65, 74, 85, 12,
      -28, -68, 106, 127, 65, 84, -23, 84, 123, 83, -9, -49, 65, 74,
      85, 8, -1, 92, 40, -10, 65, 84, -23, 83, -81, -99, -78, 45, 0,
      0, 0, 0, 2, 0, 0, 0, 2, 65, 74, 85, 8, -1, 92, 40, -10, 65, 84,
      -23, 83, -81, -99, -78, 45, 65, 74, 85, 13, 0, -60, -101, -90,
    65, 84, -23, 84, 60, -35, 47, 27 ]));

    (GeometryCodes.getCodeForGeometryType(GeometryType.MULTICURVE)).should.be.equal(bytes[4]);

    const geometry = global.readGeometry(bytes);
    (geometry instanceof GeometryCollection).should.be.true;
    (geometry.geometryType).should.be.equal(GeometryType.GEOMETRYCOLLECTION);
    const multiCurve = geometry;
    (1).should.be.equal(multiCurve.numGeometries());
    const geometry1 = multiCurve.geometries[0];
    (geometry1 instanceof CompoundCurve).should.be.true;
    const compoundCurve1 = geometry1;
    (2).should.be.equal(compoundCurve1.numLineStrings());
    const lineString1 = compoundCurve1.lineStrings[0];
    const lineString2 = compoundCurve1.lineStrings[1];
    (3).should.be.equal(lineString1.numPoints());
    (2).should.be.equal(lineString2.numPoints());

    lineString1.getPoint(0).equals(new Point(3451418.006, 5481808.951)).should.be.true;
    lineString1.getPoint(1).equals(new Point(3451417.787, 5481809.927)).should.be.true;
    lineString1.getPoint(2).equals(new Point(3451409.995, 5481806.744)).should.be.true;

    lineString2.getPoint(0).equals(new Point(3451409.995, 5481806.744)).should.be.true;
    lineString2.getPoint(1).equals(new Point(3451418.006, 5481808.951)).should.be.true;


    const extendedMultiCurve = new ExtendedGeometryCollection(multiCurve);
    (GeometryType.MULTICURVE).should.be.equal(extendedMultiCurve.geometryType);

    geometryTester(extendedMultiCurve, multiCurve);

    const bytes2 = global.writeBuffer(extendedMultiCurve);
    (GeometryCodes.getCodeForGeometryType(GeometryType.MULTICURVE)).should.be.equal(bytes2[4]);
    global.compareByteArrays(bytes, bytes2);

  })

  it('test multi curve', function () {

    // Test the abstract MultiCurve type
    const multiCurve = global.createMultiCurve();
    const bytes = global.writeBuffer(multiCurve);

    const extendedMultiCurve = new ExtendedGeometryCollection(multiCurve);
    (GeometryType.MULTICURVE).should.be.equal(extendedMultiCurve.geometryType);

    const extendedBytes = global.writeBuffer(extendedMultiCurve);

    let byteReader = new ByteReader(bytes.slice(1, 5));
    const code = byteReader.readInt();
    byteReader = new ByteReader(extendedBytes.slice(1, 5));
    const extendedCode = byteReader.readInt();

    (GeometryCodes.getCode(multiCurve)).should.be.equal(code);
    (GeometryCodes._getCode(GeometryType.MULTICURVE, extendedMultiCurve.hasZ, extendedMultiCurve.hasM)).should.be.equal(extendedCode);

    const geometry1 = global.readGeometry(bytes);
    const geometry2 = global.readGeometry(extendedBytes);

    (geometry1 instanceof GeometryCollection).should.be.true;
    (geometry2 instanceof GeometryCollection).should.be.true;
    (GeometryType.GEOMETRYCOLLECTION).should.be.equal(geometry1.geometryType);
    (GeometryType.GEOMETRYCOLLECTION).should.be.equal(geometry2.geometryType);

    geometry1.equals(multiCurve).should.be.true;
    geometry1.equals(geometry2).should.be.true;

    const geometryCollection1 = geometry1;
    const geometryCollection2 = geometry2;
    (geometryCollection1.isMultiCurve()).should.be.true;
    (geometryCollection2.isMultiCurve()).should.be.true;

    geometryTester(multiCurve);
    geometryTester(extendedMultiCurve, multiCurve);
  });

  it('test multi surface', function () {

    // Test the abstract MultiSurface type

    const multiSurface = global.createMultiSurface();

    const bytes = global.writeBuffer(multiSurface);

    const extendedMultiSurface = new ExtendedGeometryCollection(multiSurface);
    (GeometryType.MULTISURFACE).should.be.equal(extendedMultiSurface.geometryType);

    const extendedBytes = global.writeBuffer(extendedMultiSurface);

    let byteReader = new ByteReader(bytes.slice(1, 5));
    const code = byteReader.readInt();
    byteReader = new ByteReader(extendedBytes.slice(1, 5));
    const extendedCode = byteReader.readInt();

    (GeometryCodes.getCode(multiSurface)).should.be.equal(code);
    (GeometryCodes._getCode(GeometryType.MULTISURFACE, extendedMultiSurface.hasZ, extendedMultiSurface.hasM)).should.be.equal(extendedCode);

    const geometry1 = global.readGeometry(bytes);
    const geometry2 = global.readGeometry(extendedBytes);

    (geometry1 instanceof GeometryCollection).should.be.true;
    (geometry2 instanceof GeometryCollection).should.be.true;
    (GeometryType.GEOMETRYCOLLECTION).should.be.equal(geometry1.geometryType);
    (GeometryType.GEOMETRYCOLLECTION).should.be.equal(geometry2.geometryType);

    multiSurface.equals(geometry1).should.be.true;
    geometry1.equals(geometry2).should.be.true;

    const geometryCollection1 = geometry1;
    const geometryCollection2 = geometry2;
    (geometryCollection1.isMultiSurface()).should.be.true;
    (geometryCollection2.isMultiSurface()).should.be.true;

    geometryTester(multiSurface);
    geometryTester(extendedMultiSurface, multiSurface);
  });

  it('test multi polygon', function () {
    for (let i = 0; i < GEOMETRIES_PER_TEST; i++) {
      // Create and test a multi polygon
      const multiPolygon = global.createMultiPolygon(global.coinFlip(), global.coinFlip());
      geometryTester(multiPolygon);
    }
  });

  it('test geometry collection', function () {
    for (let i = 0; i < GEOMETRIES_PER_TEST; i++) {
      // Create and test a geometry collection
      const geometryCollection = global.createGeometryCollection(global.coinFlip(), global.coinFlip());
      geometryTester(geometryCollection);
    }

  });

  it('test multi polygon 2.5D', function () {
    // Test a pre-created WKB hex saved as a 2.5D MultiPolygon
    const bytes = hexStringToBuffer("0106000080010000000103000080010000000F0000007835454789C456C0DFDB63124D3F2C4000000000000000004CE4512E89C456C060BF20D13F3F2C400000000000000000A42EC6388CC456C0E0A50400423F2C400000000000000000B4E3B1608CC456C060034E67433F2C400000000000000000F82138508DC456C09FD015C5473F2C400000000000000000ECD6591B8CC456C000C305BC5B3F2C4000000000000000001002AD0F8CC456C060DB367D5C3F2C40000000000000000010996DEF8AC456C0BF01756A6C3F2C4000000000000000007054A08B8AC456C0806A0C1F733F2C4000000000000000009422D81D8AC456C041CA3C5B8A3F2C4000000000000000003CCB05C489C456C03FC4FC52AA3F2C400000000000000000740315A689C456C0BFC8635EB33F2C400000000000000000E4A5630B89C456C0DFE726D6B33F2C400000000000000000F45A4F3389C456C000B07950703F2C4000000000000000007835454789C456C0DFDB63124D3F2C400000000000000000");

    (1).should.be.equal(bytes[0]); // little endian
    (GeometryCodes.getCodeForGeometryType(GeometryType.MULTIPOLYGON)).should.be.equal(bytes[1]);
    (0).should.be.equal(bytes[2]);
    (0).should.be.equal(bytes[3]);
    (128).should.be.equal(bytes[4]);

    const geometry = global.readGeometry(bytes);
    (geometry instanceof MultiPolygon).should.be.true;
    (geometry.geometryType).should.be.equal(GeometryType.MULTIPOLYGON);
    const multiPolygon = geometry;
    (multiPolygon.hasZ).should.be.true;
    multiPolygon.hasM.should.be.false;
    multiPolygon.numGeometries().should.be.equal(1);
    const polygon = multiPolygon.getPolygon(0);
    (polygon.hasZ).should.be.true;
    (polygon.hasM).should.be.false;
    polygon.numRings().should.be.equal(1);
    const ring = polygon.getRing(0);
    (ring.hasZ).should.be.true;
    (ring.hasM).should.be.false;
    ring.numPoints().should.be.equal(15);
    for (const point of ring.points) {
      (point.hasZ).should.be.true;
      (point.hasM).should.be.false;
      should.exist(point.z);
      should.not.exist(point.m);
    }

    const multiPolygonBytes = global.writeBuffer(multiPolygon, ByteOrder.LITTLE_ENDIAN);
    const geometry2 = global.readGeometry(multiPolygonBytes);

    geometryTester(geometry, geometry2);

    (bytes.length).should.be.equal(multiPolygonBytes.length);
    let equalBytes = 0;
    for (let i = 0; i < bytes.length; i++) {
      if (bytes[i] === multiPolygonBytes[i]) {
        equalBytes++;
      }
    }

    (bytes.length - 6).should.be.equal(equalBytes);
  });

  it('test finite filter', function () {
    const point = global.createPoint(false, false);
    const nan = new Point(Number.NaN, Number.NaN);
    const nanZ = global.createPoint(true, false);
    nanZ.z = (Number.NaN);
    const nanM = global.createPoint(false, true);
    nanM.m = (Number.NaN);
    const nanZM = global.createPoint(true, true);
    nanZM.z = (Number.NaN);
    nanZM.m = (Number.NaN);

    const infinite = new Point(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
    const infiniteZ = global.createPoint(true, false);
    infiniteZ.z = (Number.POSITIVE_INFINITY);
    const infiniteM = global.createPoint(false, true);
    infiniteM.m = (Number.POSITIVE_INFINITY);
    const infiniteZM = global.createPoint(true, true);
    infiniteZM.z = (Number.POSITIVE_INFINITY);
    infiniteZM.m = (Number.POSITIVE_INFINITY);

    const nanInfinite = new Point(Number.NaN, Number.POSITIVE_INFINITY);
    const nanInfiniteZM = global.createPoint(true, true);
    nanInfiniteZM.z = (Number.NaN);
    nanInfiniteZM.m = (Number.NEGATIVE_INFINITY);

    const infiniteNan = new Point(Number.POSITIVE_INFINITY, Number.NaN);
    const infiniteNanZM = global.createPoint(true, true);
    infiniteNanZM.z = (Number.NEGATIVE_INFINITY);
    infiniteNanZM.m = (Number.NaN);

    const lineString1 = new LineString();
    lineString1.addPoint(point);
    lineString1.addPoint(nan);
    lineString1.addPoint(global.createPoint(false, false));
    lineString1.addPoint(infinite);
    lineString1.addPoint(global.createPoint(false, false));
    lineString1.addPoint(nanInfinite);
    lineString1.addPoint(global.createPoint(false, false));
    lineString1.addPoint(infiniteNan);

    const lineString2 = new LineString(true, false);
    lineString2.addPoint(global.createPoint(true, false));
    lineString2.addPoint(nanZ);
    lineString2.addPoint(global.createPoint(true, false));
    lineString2.addPoint(infiniteZ);

    const lineString3 = new LineString(false, true);
    lineString3.addPoint(global.createPoint(false, true));
    lineString3.addPoint(nanM);
    lineString3.addPoint(global.createPoint(false, true));
    lineString3.addPoint(infiniteM);

    const lineString4 = new LineString(true, true);
    lineString4.addPoint(global.createPoint(true, true));
    lineString4.addPoint(nanZM);
    lineString4.addPoint(global.createPoint(true, true));
    lineString4.addPoint(infiniteZM);
    lineString4.addPoint(global.createPoint(true, true));
    lineString4.addPoint(nanInfiniteZM);
    lineString4.addPoint(global.createPoint(true, true));
    lineString4.addPoint(infiniteNanZM);

    const polygon1 = new Polygon(lineString1);
    const polygon2 = new Polygon(lineString2);
    const polygon3 = new Polygon(lineString3);
    const polygon4 = new Polygon(lineString4);

    for (const pnt of lineString1.points) {
      testFiniteFilter(pnt);
    }

    for (const pnt of lineString2.points) {
      testFiniteFilter(pnt);
    }

    for (const pnt of lineString3.points) {
      testFiniteFilter(pnt);
    }

    for (const pnt of lineString4.points) {
      testFiniteFilter(pnt);
    }

    testFiniteFilter(lineString1);
    testFiniteFilter(lineString2);
    testFiniteFilter(lineString3);
    testFiniteFilter(lineString4);
    testFiniteFilter(polygon1);
    testFiniteFilter(polygon2);
    testFiniteFilter(polygon3);
    testFiniteFilter(polygon4);
  });
});
