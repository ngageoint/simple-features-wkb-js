import {
	CircularString,
	CompoundCurve,
	Curve,
	CurvePolygon,
	Geometry,
	GeometryCollection,
	GeometryFilter,
	GeometryType,
	LineString,
	MultiLineString,
	MultiPoint,
	MultiPolygon,
	Point,
	Polygon,
	PolyhedralSurface,
	SFException,
	TIN,
	Triangle
} from "@ngageoint/simple-features-js";
import { ByteReader } from "./ByteReader";
import { GeometryTypeInfo } from "./GeometryTypeInfo";
import { ByteOrder } from "./ByteOrder";
import { GeometryCodes } from "./GeometryCodes";

/**
 * Well Known Binary reader
 */
export class GeometryReader {

	/**
	 * 2.5D bit
	 */
	private static readonly WKB25D: number = 0x80000000;

	/**
	 * Byte Reader
	 */
	private reader: ByteReader;

	public constructor(reader: ByteReader);
	public constructor(buffer: Buffer);

	/**
	 * Constructor
	 * @param args
	 */
	public constructor(...args) {
		if (args.length === 1 && args[0] instanceof ByteReader) {
			this.reader = args[0];
		} else if (args.length === 1 && args[0] instanceof Buffer) {
			this.reader = new ByteReader(args[0]);
		}
	}

	/**
	 * Get the byte reader
	 * @return byte reader
	 */
	public getByteReader(): ByteReader {
		return this.reader;
	}

	/**
	 * Read a geometry from the byte reader
	 * 
	 * @param filter geometry filter
	 * @param containingType containing geometry type
	 * @return geometry
	 */
	public read(filter: GeometryFilter, containingType: GeometryType = undefined): Geometry {
		const originalByteOrder = this.reader.getByteOrder();

		// Read the byte order and geometry type
		const geometryTypeInfo: GeometryTypeInfo = this.readGeometryType();

		const geometryType = geometryTypeInfo.geometryType;
		const hasZ = geometryTypeInfo.hasZ;
		const hasM = geometryTypeInfo.hasM;

		let geometry = null;

		switch (geometryType) {

			case GeometryType.GEOMETRY:
				throw new SFException("Unexpected Geometry Type of Geometry which is abstract");
			case GeometryType.POINT:
				geometry = this.readPoint(hasZ, hasM);
				break;
			case GeometryType.LINESTRING:
				geometry = this.readLineString(filter, hasZ, hasM);
				break;
			case GeometryType.POLYGON:
				geometry = this.readPolygon(filter, hasZ, hasM);
				break;
			case GeometryType.MULTIPOINT:
				geometry = this.readMultiPoint(filter, hasZ, hasM);
				break;
			case GeometryType.MULTILINESTRING:
				geometry = this.readMultiLineString(filter, hasZ, hasM);
				break;
			case GeometryType.MULTIPOLYGON:
				geometry = this.readMultiPolygon(filter, hasZ, hasM);
				break;
			case GeometryType.GEOMETRYCOLLECTION:
			case GeometryType.MULTICURVE:
			case GeometryType.MULTISURFACE:
				geometry = this.readGeometryCollection(filter, hasZ, hasM);
				break;
			case GeometryType.CIRCULARSTRING:
				geometry = this.readCircularString(filter, hasZ, hasM);
				break;
			case GeometryType.COMPOUNDCURVE:
				geometry = this.readCompoundCurve(filter, hasZ, hasM);
				break;
			case GeometryType.CURVEPOLYGON:
				geometry = this.readCurvePolygon(filter, hasZ, hasM);
				break;
			case GeometryType.CURVE:
				throw new SFException("Unexpected Geometry Type of Curve which is abstract");
			case GeometryType.SURFACE:
				throw new SFException("Unexpected Geometry Type of Surface which is abstract");
			case GeometryType.POLYHEDRALSURFACE:
				geometry = this.readPolyhedralSurface(filter, hasZ, hasM);
				break;
			case GeometryType.TIN:
				geometry = this.readTIN(filter, hasZ, hasM);
				break;
			case GeometryType.TRIANGLE:
				geometry = this.readTriangle(filter, hasZ, hasM);
				break;
			default:
				throw new SFException("Geometry Type not supported: " + geometryType);
		}

		if (!GeometryReader.filter(filter, containingType, geometry)) {
			geometry = null;
		}

		// Restore the byte order
		this.reader.setByteOrder(originalByteOrder);

		return geometry;
	}

	/**
	 * Read the geometry type info
	 * @return geometry type info
	 */
	public readGeometryType(): GeometryTypeInfo {
		// Read the single byte order byte
		const byteOrderValue = this.reader.readByte();
		const byteOrder = byteOrderValue === 0 ? ByteOrder.BIG_ENDIAN : ByteOrder.LITTLE_ENDIAN;
		this.reader.setByteOrder(byteOrder);

		// Read the geometry type unsigned integer
		let unsignedGeometryTypeCode = this.reader.readUInt32();
		// Check for 2.5D geometry types
		let hasZ = false;
		if (unsignedGeometryTypeCode > GeometryReader.WKB25D) {
			hasZ = true;
			unsignedGeometryTypeCode -= GeometryReader.WKB25D;
		}

		const geometryTypeCode = unsignedGeometryTypeCode

		// Determine the geometry type
		const geometryType = GeometryCodes.getGeometryType(geometryTypeCode);

		// Determine if the geometry has a z (3d) or m (linear referencing system) value
		if (!hasZ) {
			hasZ = GeometryCodes.hasZ(geometryTypeCode);
		}
		const hasM = GeometryCodes.hasM(geometryTypeCode);

		return new GeometryTypeInfo(geometryTypeCode, geometryType, hasZ, hasM);
	}

	/**
	 * Read a Point
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return point
	 */
	public readPoint(hasZ: boolean, hasM: boolean): Point {
		const x = this.reader.readDouble();
		const y = this.reader.readDouble();

		const point = new Point(hasZ, hasM, x, y);

		if (hasZ) {
			point.z = this.reader.readDouble();
		}

		if (hasM) {
			point.m = this.reader.readDouble();
		}

		return point;
	}

	/**
	 * Read a Line String
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return line string
	 */
	public readLineString(filter: GeometryFilter, hasZ: boolean, hasM: boolean): LineString {
		const lineString = new LineString(hasZ, hasM);
		const numPoints = this.reader.readInt();
		for (let i = 0; i < numPoints; i++) {
			const point = this.readPoint(hasZ, hasM);
			if (GeometryReader.filter(filter, GeometryType.LINESTRING, point)) {
				lineString.addPoint(point);
			}
		}
		return lineString;
	}


	/**
	 * Read a Polygon
	 * @param filter geometry filter
	 * @param hasZ  has z flag
	 * @param hasM has m flag
	 * @return polygon
	 */
	public readPolygon(filter: GeometryFilter, hasZ: boolean, hasM: boolean): Polygon {
		const polygon = new Polygon(hasZ, hasM);
		const numRings = this.reader.readInt();
		for (let i = 0; i < numRings; i++) {
			const ring = this.readLineString(filter, hasZ, hasM);
			if (GeometryReader.filter(filter, GeometryType.POLYGON, ring)) {
				polygon.addRing(ring);
			}
		}
		return polygon;
	}


	/**
	 * Read a Multi Point
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return multi point
	 */
	public readMultiPoint(filter: GeometryFilter, hasZ: boolean, hasM: boolean): MultiPoint {
		const multiPoint = new MultiPoint(hasZ, hasM);
		const numPoints = this.reader.readInt();
		for (let i = 0; i < numPoints; i++) {
			const point = this.read(filter, GeometryType.MULTIPOINT);
			if (point != null) {
				multiPoint.addPoint(point as Point);
			}
		}

		return multiPoint;
	}


	/**
	 * Read a Multi Line String
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return multi line string
	 */
	public readMultiLineString(filter: GeometryFilter, hasZ: boolean, hasM: boolean): MultiLineString {
		const multiLineString = new MultiLineString(hasZ, hasM);
		const numLineStrings = this.reader.readInt();
		for (let i = 0; i < numLineStrings; i++) {
			const lineString = this.read(filter, GeometryType.MULTILINESTRING);
			if (lineString != null) {
				multiLineString.addLineString(lineString as LineString);
			}
		}

		return multiLineString;
	}


	/**
	 * Read a Multi Polygon
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return multi polygon
	 */
	public readMultiPolygon(filter: GeometryFilter, hasZ: boolean, hasM: boolean): MultiPolygon {
		const multiPolygon = new MultiPolygon(hasZ, hasM);
		let numPolygons = this.reader.readInt();
		for (let i = 0; i < numPolygons; i++) {
			const polygon = this.read(filter, GeometryType.MULTIPOLYGON);
			if (polygon != null) {
				multiPolygon.addPolygon(polygon as Polygon);
			}
		}
		return multiPolygon;
	}

	/**
	 * Read a Geometry Collection
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return geometry collection
	 */
	public readGeometryCollection(filter: GeometryFilter, hasZ: boolean, hasM: boolean): GeometryCollection<Geometry> {
		const geometryCollection = new GeometryCollection<Geometry>(hasZ, hasM);
		let numGeometries = this.reader.readInt();
		for (let i = 0; i < numGeometries; i++) {
			const geometry = this.read(filter, GeometryType.GEOMETRYCOLLECTION);
			if (geometry != null) {
				geometryCollection.addGeometry(geometry);
			}
		}
		return geometryCollection;
	}

	/**
	 * Read a Circular String
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return circular string
	 */
	public readCircularString(filter: GeometryFilter, hasZ: boolean, hasM: boolean): CircularString {
		const circularString = new CircularString(hasZ, hasM);
		let numPoints = this.reader.readInt();
		for (let i = 0; i < numPoints; i++) {
			const point = this.readPoint(hasZ, hasM);
			if (GeometryReader.filter(filter, GeometryType.CIRCULARSTRING, point)) {
				circularString.addPoint(point);
			}
		}

		return circularString;
	}


	/**
	 * Read a Compound Curve
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return compound curve
	 */
	public readCompoundCurve(filter: GeometryFilter, hasZ: boolean, hasM: boolean): CompoundCurve {
		const compoundCurve = new CompoundCurve(hasZ, hasM);
		let numLineStrings = this.reader.readInt();
		for (let i = 0; i < numLineStrings; i++) {
			const lineString = this.read(filter, GeometryType.COMPOUNDCURVE);
			if (lineString != null) {
				compoundCurve.addLineString(lineString as LineString);
			}
		}

		return compoundCurve;
	}

	/**
	 * Read a Curve Polygon
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return curve polygon
	 */
	public readCurvePolygon(filter: GeometryFilter, hasZ: boolean, hasM: boolean) : CurvePolygon<Curve> {
		const curvePolygon = new CurvePolygon<Curve>(hasZ, hasM);
		let numRings = this.reader.readInt();
		for (let i = 0; i < numRings; i++) {
			let ring = this.read(filter, GeometryType.CURVEPOLYGON);
			if (ring != null) {
				curvePolygon.addRing(ring as Curve);
			}
		}
		return curvePolygon;
	}

	/**
	 * Read a Polyhedral Surface
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return polyhedral surface
	 */
	public readPolyhedralSurface(filter: GeometryFilter, hasZ: boolean, hasM: boolean): PolyhedralSurface {
		const polyhedralSurface = new PolyhedralSurface(hasZ, hasM);
		let numPolygons = this.reader.readInt();
		for (let i = 0; i < numPolygons; i++) {
			const polygon = this.read(filter, GeometryType.POLYHEDRALSURFACE);
			if (polygon != null) {
				polyhedralSurface.addPolygon(polygon as Polygon);
			}
		}
		return polyhedralSurface;
	}

	/**
	 * Read a TIN
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM  has m flag
	 * @return TIN
	 */
	public readTIN(filter: GeometryFilter, hasZ: boolean, hasM: boolean): TIN {
		const tin = new TIN(hasZ, hasM);
		let numPolygons = this.reader.readInt();
		for (let i = 0; i < numPolygons; i++) {
			const polygon = this.read(filter, GeometryType.TIN);
			if (polygon != null) {
				tin.addPolygon(polygon as Polygon);
			}
		}

		return tin;
	}

	/**
	 * Read a Triangle
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return triangle
	 */
	public readTriangle(filter: GeometryFilter, hasZ: boolean, hasM: boolean): Triangle {
		const triangle = new Triangle(hasZ, hasM);
		let numRings = this.reader.readInt();
		for (let i = 0; i < numRings; i++) {
			const ring = this.readLineString(filter, hasZ, hasM);
			if (GeometryReader.filter(filter, GeometryType.TRIANGLE, ring)) {
				triangle.addRing(ring as LineString);
			}
		}
		return triangle;
	}

	/**
	 * Read a geometry from the byte reader
	 * @param buffer buffer
	 * @param filter geometry filter
	 * @param containingType containing geometry type
	 * @return geometry
	 */
	public static readGeometry(buffer: Buffer, filter: GeometryFilter = undefined, containingType: GeometryType = undefined): Geometry {
		const geometryReader = new GeometryReader(buffer);
		return geometryReader.read(filter, containingType);
	}

	/**
	 * Read a geometry from the byte reader
	 * @param reader byte reader
	 * @param filter geometry filter
	 * @param containingType containing geometry type
	 * @return geometry
	 */
	public static readGeometryWithByteReader(reader: ByteReader, filter: GeometryFilter = undefined, containingType: GeometryType = undefined): Geometry {
		const geometryReader = new GeometryReader(reader);
		return geometryReader.read(filter, containingType);
	}

	/**
	 * Read the geometry type info
	 * @param reader byte reader
	 * @return geometry type info
	 */
	public static readGeometryType(reader: ByteReader): GeometryTypeInfo {
		const geometryReader = new GeometryReader(reader);
		return geometryReader.readGeometryType();
	}

	/**
	 * Read a Point
	 * @param reader byte reader
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return point
	 */
	public static readPoint(reader: ByteReader, hasZ: boolean, hasM: boolean): Point {
		const geometryReader = new GeometryReader(reader);
		return geometryReader.readPoint(hasZ, hasM);
	}

	/**
	 * Read a Line String
	 * @param reader byte reader
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return line string
	 */
	public static readLineString(reader: ByteReader, filter: GeometryFilter, hasZ: boolean, hasM: boolean): LineString {
		const geometryReader = new GeometryReader(reader);
		return geometryReader.readLineString(filter, hasZ, hasM);
	}

	/**
	 * Read a Polygon
	 * @param reader byte reader
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return polygon
	 */
	public static readPolygon(reader: ByteReader, filter: GeometryFilter, hasZ: boolean, hasM: boolean): Polygon {
		const geometryReader = new GeometryReader(reader);
		return geometryReader.readPolygon(filter, hasZ, hasM);
	}


	/**
	 * Read a Multi Point
	 * @param reader byte reader
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return multi point
	 */
	public static readMultiPoint(reader: ByteReader, filter: GeometryFilter, hasZ: boolean, hasM: boolean): MultiPoint {
		const geometryReader = new GeometryReader(reader);
		return geometryReader.readMultiPoint(filter, hasZ, hasM);
	}

	/**
	 * Read a Multi Line String
	 * @param reader byte reader
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return multi line string
	 */
	public static readMultiLineString(reader: ByteReader, filter: GeometryFilter, hasZ: boolean, hasM: boolean): MultiLineString {
		const geometryReader = new GeometryReader(reader);
		return geometryReader.readMultiLineString(filter, hasZ, hasM);
	}


	/**
	 * Read a Multi Polygon
	 * @param reader byte reader
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return multi polygon
	 */
	public static readMultiPolygon(reader: ByteReader, filter: GeometryFilter, hasZ: boolean, hasM: boolean): MultiPolygon {
		const geometryReader = new GeometryReader(reader);
		return geometryReader.readMultiPolygon(filter, hasZ, hasM);
	}

	/**
	 * Read a Geometry Collection
	 * @param reader byte reader
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return geometry collection
	 */
	public static readGeometryCollection(reader: ByteReader, filter: GeometryFilter, hasZ: boolean, hasM: boolean): GeometryCollection<Geometry> {
		const geometryReader = new GeometryReader(reader);
		return geometryReader.readGeometryCollection(filter, hasZ, hasM);
	}


	/**
	 * Read a Circular String
	 * @param reader byte reader
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return circular string
	 */
	public static readCircularString(reader: ByteReader, filter: GeometryFilter, hasZ: boolean, hasM: boolean): CircularString {
		let geometryReader = new GeometryReader(reader);
		return geometryReader.readCircularString(filter, hasZ, hasM);
	}

	/**
	 * Read a Compound Curve
	 * @param reader byte reader
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return compound curve
	 */
	public static readCompoundCurve(reader: ByteReader, filter: GeometryFilter, hasZ: boolean, hasM: boolean): CompoundCurve{
		let geometryReader = new GeometryReader(reader);
		return geometryReader.readCompoundCurve(filter, hasZ, hasM);
	}

	/**
	 * Read a Curve Polygon
	 * @param reader byte reader
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return curve polygon
	 */
	public static readCurvePolygon(reader: ByteReader, filter: GeometryFilter, hasZ: boolean, hasM: boolean): CurvePolygon<Curve> {
		let geometryReader = new GeometryReader(reader);
		return geometryReader.readCurvePolygon(filter, hasZ, hasM);
	}

	/**
	 * Read a Polyhedral Surface
	 * @param reader byte reader
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return polyhedral surface
	 */
	public static readPolyhedralSurface(reader: ByteReader, filter: GeometryFilter, hasZ: boolean, hasM: boolean): PolyhedralSurface{
		let geometryReader = new GeometryReader(reader);
		return geometryReader.readPolyhedralSurface(filter, hasZ, hasM);
	}
	

	/**
	 * Read a TIN
	 * @param reader byte reader
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return TIN
	 */
	public static readTIN(reader: ByteReader, filter: GeometryFilter, hasZ: boolean, hasM: boolean): TIN {
		let geometryReader = new GeometryReader(reader);
		return geometryReader.readTIN(filter, hasZ, hasM);
	}
	
	/**
	 * Read a Triangle
	 * @param reader byte reader
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return triangle
	 */
	public static readTriangle(reader: ByteReader, filter: GeometryFilter, hasZ: boolean, hasM: boolean): Triangle {
		let geometryReader = new GeometryReader(reader);
		return geometryReader.readTriangle(filter, hasZ, hasM);
	}

	/**
	 * Filter the geometry
	 * 
	 * @param filter geometry filter or null
	 * @param containingType containing geometry type
	 * @param geometry geometry or null
	 * @return true if passes filter
	 */
	private static filter(filter: GeometryFilter, containingType: GeometryType, geometry: Geometry): boolean {
		return filter == null || geometry == null || filter.filter(containingType, geometry);
	}

}
