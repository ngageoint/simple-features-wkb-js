import {
	CircularString,
	CompoundCurve,
	Curve,
	CurvePolygon,
	Geometry,
	GeometryCollection,
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
import {ByteWriter} from "./ByteWriter";
import {ByteOrder} from "./ByteOrder";
import {GeometryCodes} from "./GeometryCodes";

/**
 * Well Known Binary writer
 */
export class GeometryWriter {
	private static readonly BYTE_ORDER_BYTE_LENGTH = 1;
	private static readonly GEOMETRY_TYPE_BYTE_LENGTH = 4;
	private static readonly INT_BYTE_LENGTH = 4;
	private static readonly DOUBLE_BYTE_LENGTH = 8;

	/**
	 * Write a geometry to a well-known bytes
	 *
	 * @param geometry geometry
	 * @param byteOrder byteOrder
	 * @return well-known bytes
	 */
	public static writeGeometry(geometry: Geometry, byteOrder): Buffer {
		const writer = new GeometryWriter(new ByteWriter(GeometryWriter.getGeometryByteLength(geometry), byteOrder));
		writer.write(geometry);
		return writer.getBuffer();
	}

	/**
	 * Byte Writer
	 */
	private readonly writer: ByteWriter;

	/**
	 * Constructor
	 * @param writer byte writer
	 * @param size
	 */
	public constructor(writer: ByteWriter, byteOrder: ByteOrder = ByteOrder.BIG_ENDIAN, size: number = 1024) {
		this.writer = writer || new ByteWriter(size, byteOrder, true);
	}

	/**
	 * Get the byte writer
	 * @return byte writer
	 */
	public getByteWriter(): ByteWriter {
		return this.writer;
	}

	/**
	 * Get the written bytes
	 *
	 * @return written bytes
	 */
	public getBuffer(): Buffer {
		return this.writer.getBuffer();
	}

	/**
	 * Write a geometry to the byte writer
	 * @param geometry geometry
	 */
	public write(geometry: Geometry): void {

		this.writer.writeUInt8(this.writer.getByteOrder());

		// Write the geometry type integer
		this.writer.writeInt(GeometryCodes.getCode(geometry));

		const geometryType = geometry.geometryType;

		switch (geometryType) {
			case GeometryType.GEOMETRY:
				throw new SFException("Unexpected Geometry Type of Geometry which is abstract");
			case GeometryType.POINT:
				this.writePoint(geometry as Point);
				break;
			case GeometryType.LINESTRING:
				this.writeLineString(geometry as LineString);
				break;
			case GeometryType.POLYGON:
				this.writePolygon(geometry as Polygon);
				break;
			case GeometryType.MULTIPOINT:
				this.writeMultiPoint(geometry as MultiPoint);
				break;
			case GeometryType.MULTILINESTRING:
				this.writeMultiLineString(geometry as MultiLineString);
				break;
			case GeometryType.MULTIPOLYGON:
				this.writeMultiPolygon(geometry as MultiPolygon);
				break;
			case GeometryType.GEOMETRYCOLLECTION:
			case GeometryType.MULTICURVE:
			case GeometryType.MULTISURFACE:
				this.writeGeometryCollection(geometry as GeometryCollection<Geometry>);
				break;
			case GeometryType.CIRCULARSTRING:
				this.writeCircularString(geometry as CircularString);
				break;
			case GeometryType.COMPOUNDCURVE:
				this.writeCompoundCurve(geometry as CompoundCurve);
				break;
			case GeometryType.CURVEPOLYGON:
				this.writeCurvePolygon(geometry as CurvePolygon<Curve>);
				break;
			case GeometryType.CURVE:
				throw new SFException("Unexpected Geometry Type of Curve which is abstract");
			case GeometryType.SURFACE:
				throw new SFException("Unexpected Geometry Type of Surface which is abstract");
			case GeometryType.POLYHEDRALSURFACE:
				this.writePolyhedralSurface(geometry as PolyhedralSurface);
				break;
			case GeometryType.TIN:
				this.writeTIN(geometry as TIN);
				break;
			case GeometryType.TRIANGLE:
				this.writeTriangle(geometry as Triangle);
				break;
			default:
				throw new SFException("Geometry Type not supported: " + geometryType);
		}

	}

	public static getGeometryByteLength(geometry: Geometry): number {
		let byteLength = GeometryWriter.BYTE_ORDER_BYTE_LENGTH + GeometryWriter.GEOMETRY_TYPE_BYTE_LENGTH;

		const geometryType = geometry.geometryType;

		switch (geometryType) {
			case GeometryType.GEOMETRY:
				throw new SFException("Unexpected Geometry Type of Geometry which is abstract");
			case GeometryType.POINT:
				byteLength += GeometryWriter.getPointByteLength(geometry as Point);
				break;
			case GeometryType.LINESTRING:
				byteLength += GeometryWriter.getLineStringByteLength(geometry as LineString);
				break;
			case GeometryType.POLYGON:
				byteLength += GeometryWriter.getPolygonByteLength(geometry as Polygon);
				break;
			case GeometryType.MULTIPOINT:
				byteLength += GeometryWriter.getMultiPointByteLength(geometry as MultiPoint);
				break;
			case GeometryType.MULTILINESTRING:
				byteLength += GeometryWriter.getMultiLineStringByteLength(geometry as MultiLineString);
				break;
			case GeometryType.MULTIPOLYGON:
				byteLength += GeometryWriter.getMultiPolygonByteLength(geometry as MultiPolygon);
				break;
			case GeometryType.GEOMETRYCOLLECTION:
			case GeometryType.MULTICURVE:
			case GeometryType.MULTISURFACE:
				byteLength += GeometryWriter.getGeometryCollectionByteLength(geometry as GeometryCollection<Geometry>);
				break;
			case GeometryType.CIRCULARSTRING:
				byteLength += GeometryWriter.getCircularStringByteLength(geometry as CircularString);
				break;
			case GeometryType.COMPOUNDCURVE:
				byteLength += GeometryWriter.getCompoundCurveByteLength(geometry as CompoundCurve);
				break;
			case GeometryType.CURVEPOLYGON:
				byteLength += GeometryWriter.getCurvePolygonByteLength(geometry as CurvePolygon<Curve>);
				break;
			case GeometryType.CURVE:
				throw new SFException("Unexpected Geometry Type of Curve which is abstract");
			case GeometryType.SURFACE:
				throw new SFException("Unexpected Geometry Type of Surface which is abstract");
			case GeometryType.POLYHEDRALSURFACE:
				byteLength += GeometryWriter.getPolyhedralSurfaceByteLength(geometry as PolyhedralSurface);
				break;
			case GeometryType.TIN:
				byteLength += GeometryWriter.getTINByteLength(geometry as TIN);
				break;
			case GeometryType.TRIANGLE:
				byteLength += GeometryWriter.getTriangleByteLength(geometry as Triangle);
				break;
			default:
				throw new SFException("Geometry Type not supported: " + geometryType);
		}

		return byteLength;
	}

	/**
	 * Write a Point
	 * @param point point
	 */
	public writePoint(point: Point): void {
		this.writeXY(point);
		this.writeZ(point);
		this.writeM(point);
	}

	/**
	 * Write a Point X and Y value
	 * @param point point
	 */
	public writeXY(point: Point): void {
		this.writer.writeDouble(point.x);
		this.writer.writeDouble(point.y);
	}

	/**
	 * Write a Point Z value
	 * @param point point
	 */
	public writeZ(point: Point): void {
		if (point.hasZ) {
			this.writer.writeDouble(point.z);
		}
	}

	/**
	 * Write a Point M value
	 * @param point point
	 */
	public writeM(point: Point): void {
		if (point.hasM) {
			this.writer.writeDouble(point.m);
		}
	}

	/**
	 * Write a Line String
	 * @param lineString Line String
	 */
	public writeLineString(lineString: LineString): void {
		this.writer.writeInt(lineString.numPoints());
		for (const point of lineString.points) {
			this.writePoint(point);
		}

	}

	/**
	 * Write a Polygon
	 * @param polygon  Polygon
	 */
	public writePolygon(polygon: Polygon): void {
		this.writer.writeInt(polygon.numRings());
		for (const ring of polygon.rings) {
			this.writeLineString(ring);
		}

	}

	/**
	 * Write a Multi Point
	 * @param multiPoint Multi Point
	 */
	public writeMultiPoint(multiPoint: MultiPoint): void {
		this.writer.writeInt(multiPoint.numPoints());
		for (const point of multiPoint.points) {
			this.write(point);
		}
	}

	/**
	 * Write a Multi Line String
	 * @param multiLineString Multi Line String
	 */
	public writeMultiLineString(multiLineString: MultiLineString): void {
		this.writer.writeInt(multiLineString.numLineStrings());
		for (const lineString of multiLineString.lineStrings) {
			this.write(lineString);
		}

	}

	/**
	 * Write a Multi Polygon
	 * @param multiPolygon Multi Polygon
	 */
	public writeMultiPolygon(multiPolygon: MultiPolygon): void {
		this.writer.writeInt(multiPolygon.numPolygons());
		for (const polygon of multiPolygon.polygons) {
			this.write(polygon);
		}

	}

	/**
	 * Write a Geometry Collection
	 * @param geometryCollection Geometry Collection
	 */
	public writeGeometryCollection(geometryCollection: GeometryCollection<Geometry>): void {
		this.writer.writeInt(geometryCollection.numGeometries());
		for (const geometry of geometryCollection.geometries) {
			this.write(geometry);
		}

	}

	/**
	 * Write a Circular String
	 * @param circularString Circular String
	 */
	public writeCircularString(circularString: CircularString): void {
		this.writer.writeInt(circularString.numPoints());
		for (const point of circularString.points) {
			this.writePoint(point);
		}
	}

	/**
	 * Write a Compound Curve
	 * @param compoundCurve Compound Curve
	 */
	public writeCompoundCurve(compoundCurve: CompoundCurve): void {
		this.writer.writeInt(compoundCurve.numLineStrings());
		for (const lineString of compoundCurve.lineStrings) {
			this.write(lineString);
		}
	}

	/**
	 * Write a Curve Polygon
	 * @param curvePolygon Curve Polygon
	 */
	public writeCurvePolygon(curvePolygon: CurvePolygon<Curve>): void {
		this.writer.writeInt(curvePolygon.numRings());
		for (const ring of curvePolygon.rings) {
			this.write(ring);
		}
	}

	/**
	 * Write a Polyhedral Surface
	 * @param polyhedralSurface Polyhedral Surface
	 */
	public writePolyhedralSurface(polyhedralSurface: PolyhedralSurface): void {
		this.writer.writeInt(polyhedralSurface.numPolygons());
		for (const polygon of polyhedralSurface.polygons) {
			this.write(polygon);
		}
	}

	/**
	 * Write a TIN
	 * @param tin TIN
	 */
	public writeTIN(tin: TIN): void {
		this.writer.writeInt(tin.numPolygons());
		for (const polygon of tin.polygons) {
			this.write(polygon);
		}
	}

	/**
	 * Write a Triangle
	 * @param triangle Triangle
	 */
	public writeTriangle(triangle: Triangle): void {
		this.writer.writeInt(triangle.numRings());
		for (const ring of triangle.rings) {
			this.writeLineString(ring);
		}
	}

	/**
	 * Write a geometry to the byte writer
	 * @param writer  byte writer
	 * @param geometry geometry
	 */
	public static writeGeometryWithByteWriter(writer: ByteWriter, geometry: Geometry): void {
		const geometryWriter = new GeometryWriter(writer);
		geometryWriter.write(geometry);
	}

	/**
	 * Write a Point
	 *
	 * @param writer
	 *            byte writer
	 * @param point
	 *            point
	 * @throws IOException
	 *             upon failure to write
	 */
	public static writePoint(writer: ByteWriter, point: Point) {
		const geometryWriter: GeometryWriter = new GeometryWriter(writer);
		geometryWriter.writePoint(point);
	}

	/**
	 * Write a Line String
	 *
	 * @param writer
	 *            byte writer
	 * @param lineString
	 *            Line String
	 */
	public static writeLineString(writer: ByteWriter, lineString: LineString) {
		const geometryWriter: GeometryWriter = new GeometryWriter(writer);
		geometryWriter.writeLineString(lineString);
	}

	/**
	 * Write a Polygon
	 *
	 * @param writer
	 *            byte writer
	 * @param polygon
	 *            Polygon
	 * @throws IOException
	 *             upon failure to write
	 */
	public static writePolygon(writer: ByteWriter, polygon: Polygon) {
		const geometryWriter: GeometryWriter = new GeometryWriter(writer);
		geometryWriter.writePolygon(polygon);
	}

	/**
	 * Write a Multi Point
	 *
	 * @param writer
	 *            byte writer
	 * @param multiPoint
	 *            Multi Point
	 * @throws IOException
	 *             upon failure to write
	 */
	public static writeMultiPoint(writer: ByteWriter, multiPoint: MultiPoint) {
		const geometryWriter: GeometryWriter = new GeometryWriter(writer);
		geometryWriter.writeMultiPoint(multiPoint);
	}

	/**
	 * Write a Multi Line String
	 *
	 * @param writer
	 *            byte writer
	 * @param multiLineString
	 *            Multi Line String
	 * @throws IOException
	 *             upon failure to write
	 */
	public static writeMultiLineString(writer: ByteWriter, multiLineString: MultiLineString) {
		const geometryWriter: GeometryWriter = new GeometryWriter(writer);
		geometryWriter.writeMultiLineString(multiLineString);
	}

	/**
	 * Write a Multi Polygon
	 *
	 * @param writer
	 *            byte writer
	 * @param multiPolygon
	 *            Multi Polygon
	 * @throws IOException
	 *             upon failure to write
	 */
	public static writeMultiPolygon(writer: ByteWriter, multiPolygon: MultiPolygon) {
		const geometryWriter: GeometryWriter = new GeometryWriter(writer);
		geometryWriter.writeMultiPolygon(multiPolygon);
	}

	/**
	 * Write a Geometry Collection
	 *
	 * @param writer
	 *            byte writer
	 * @param geometryCollection
	 *            Geometry Collection
	 * @throws IOException
	 *             upon failure to write
	 */
	public static writeGeometryCollection(writer: ByteWriter,  geometryCollection: GeometryCollection<Geometry>) {
		const geometryWriter: GeometryWriter = new GeometryWriter(writer);
		geometryWriter.writeGeometryCollection(geometryCollection);
	}

	/**
	 * Write a Circular String
	 *
	 * @param writer
	 *            byte writer
	 * @param circularString
	 *            Circular String
	 * @throws IOException
	 *             upon failure to write
	 */
	public static writeCircularString(writer: ByteWriter, circularString: CircularString) {
		const geometryWriter: GeometryWriter = new GeometryWriter(writer);
		geometryWriter.writeCircularString(circularString);
	}

	/**
	 * Write a Compound Curve
	 *
	 * @param writer
	 *            byte writer
	 * @param compoundCurve
	 *            Compound Curve
	 * @throws IOException
	 *             upon failure to write
	 */
	public static writeCompoundCurve(writer: ByteWriter, compoundCurve: CompoundCurve) {
		const geometryWriter: GeometryWriter = new GeometryWriter(writer);
		geometryWriter.writeCompoundCurve(compoundCurve);
	}

	/**
	 * Write a Curve Polygon
	 *
	 * @param writer
	 *            byte writer
	 * @param curvePolygon
	 *            Curve Polygon
	 * @throws IOException
	 *             upon failure to write
	 */
	public static writeCurvePolygon(writer: ByteWriter, curvePolygon: CurvePolygon<Curve>) {
		const geometryWriter: GeometryWriter = new GeometryWriter(writer);
		geometryWriter.writeCurvePolygon(curvePolygon);
	}

	/**
	 * Write a Polyhedral Surface
	 *
	 * @param writer
	 *            byte writer
	 * @param polyhedralSurface
	 *            Polyhedral Surface
	 * @throws IOException
	 *             upon failure to write
	 */
	public static writePolyhedralSurface(writer: ByteWriter, polyhedralSurface: PolyhedralSurface) {
		const geometryWriter: GeometryWriter = new GeometryWriter(writer);
		geometryWriter.writePolyhedralSurface(polyhedralSurface);
	}

	/**
	 * Write a TIN
	 *
	 * @param writer
	 *            byte writer
	 * @param tin
	 *            TIN
	 * @throws IOException
	 *             upon failure to write
	 */
	public static writeTIN(writer: ByteWriter, tin: TIN) {
		const geometryWriter: GeometryWriter = new GeometryWriter(writer);
		geometryWriter.writeTIN(tin);
	}

	/**
	 * Write a Triangle
	 *
	 * @param writer
	 *            byte writer
	 * @param triangle
	 *            Triangle
	 * @throws IOException
	 *             upon failure to write
	 */
	public static writeTriangle(writer: ByteWriter, triangle: Triangle) {
		const geometryWriter: GeometryWriter = new GeometryWriter(writer);
		geometryWriter.writeTriangle(triangle);
	}

	private static getPointByteLength (point: Point): number {
		let byteLength = GeometryWriter.DOUBLE_BYTE_LENGTH  // x
			+ GeometryWriter.DOUBLE_BYTE_LENGTH; // y
		if (point.hasZ) {
			byteLength += GeometryWriter.DOUBLE_BYTE_LENGTH;
		}
		if (point.hasM) {
			byteLength += GeometryWriter.DOUBLE_BYTE_LENGTH;
		}
		return byteLength
	}

	/**
	 * Write a Line String
	 * @param lineString Line String
	 */
	private static getLineStringByteLength(lineString: LineString): number {
		let byteLength = GeometryWriter.INT_BYTE_LENGTH
		for (const point of lineString.points) {
			byteLength += GeometryWriter.getPointByteLength(point);
		}
		return byteLength;
	}

	/**
	 * Write a Polygon
	 * @param polygon Polygon
	 */
	private static getPolygonByteLength(polygon: Polygon): number {
		let byteLength = GeometryWriter.INT_BYTE_LENGTH
		for (const ring of polygon.rings) {
			byteLength += GeometryWriter.getLineStringByteLength(ring);
		}
		return byteLength;
	}

	/**
	 * Write a Multi Point
	 * @param multiPoint Multi Point
	 */
	private static getMultiPointByteLength(multiPoint: MultiPoint): number {
		let byteLength = GeometryWriter.INT_BYTE_LENGTH
		for (const point of multiPoint.points) {
			byteLength += GeometryWriter.getGeometryByteLength(point);
		}
		return byteLength;
	}

	/**
	 * Write a Multi Line String
	 * @param multiLineString Multi Line String
	 */
	private static getMultiLineStringByteLength(multiLineString: MultiLineString): number {
		let byteLength = GeometryWriter.INT_BYTE_LENGTH
		for (const lineString of multiLineString.lineStrings) {
			byteLength += GeometryWriter.getGeometryByteLength(lineString);
		}
		return byteLength;
	}

	/**
	 * Write a Multi Polygon
	 * @param multiPolygon Multi Polygon
	 */
	private static getMultiPolygonByteLength(multiPolygon: MultiPolygon): number {
		let byteLength = GeometryWriter.INT_BYTE_LENGTH
		for (const polygon of multiPolygon.polygons) {
			byteLength += GeometryWriter.getGeometryByteLength(polygon);
		}
		return byteLength;
	}

	/**
	 * Write a Geometry Collection
	 * @param geometryCollection Geometry Collection
	 */
	private static getGeometryCollectionByteLength(geometryCollection: GeometryCollection<Geometry>): number {
		let byteLength = GeometryWriter.INT_BYTE_LENGTH
		for (const geometry of geometryCollection.geometries) {
			byteLength += GeometryWriter.getGeometryByteLength(geometry);
		}
		return byteLength;
	}

	/**
	 * Write a Circular String
	 * @param circularString Circular String
	 */
	private static getCircularStringByteLength(circularString: CircularString): number {
		let byteLength = GeometryWriter.INT_BYTE_LENGTH
		for (const point of circularString.points) {
			byteLength += GeometryWriter.getPointByteLength(point);
		}
		return byteLength;
	}

	/**
	 * Write a Compound Curve
	 * @param compoundCurve Compound Curve
	 */
	private static getCompoundCurveByteLength(compoundCurve: CompoundCurve): number {
		let byteLength = GeometryWriter.INT_BYTE_LENGTH
		for (const lineString of compoundCurve.lineStrings) {
			byteLength += GeometryWriter.getGeometryByteLength(lineString);
		}
		return byteLength;
	}

	/**
	 * Write a Curve Polygon
	 * @param curvePolygon Curve Polygon
	 */
	private static getCurvePolygonByteLength(curvePolygon: CurvePolygon<Curve>): number {
		let byteLength = GeometryWriter.INT_BYTE_LENGTH
		for (const ring of curvePolygon.rings) {
			byteLength += GeometryWriter.getGeometryByteLength(ring);
		}
		return byteLength;
	}

	/**
	 * Write a Polyhedral Surface
	 * @param polyhedralSurface Polyhedral Surface
	 */
	private static getPolyhedralSurfaceByteLength(polyhedralSurface: PolyhedralSurface): number {
		let byteLength = GeometryWriter.INT_BYTE_LENGTH
		for (const polygon of polyhedralSurface.polygons) {
			byteLength += GeometryWriter.getGeometryByteLength(polygon);
		}
		return byteLength;
	}

	/**
	 * Write a TIN
	 * @param tin TIN
	 */
	private static getTINByteLength(tin: TIN): number {
		let byteLength = GeometryWriter.INT_BYTE_LENGTH
		for (const polygon of tin.polygons) {
			byteLength += GeometryWriter.getGeometryByteLength(polygon);
		}
		return byteLength;
	}

	/**
	 * Write a Triangle
	 * @param triangle Triangle
	 */
	private static getTriangleByteLength(triangle: Triangle): number {
		let byteLength = GeometryWriter.INT_BYTE_LENGTH
		for (const ring of triangle.rings) {
			byteLength += GeometryWriter.getLineStringByteLength(ring);
		}
		return byteLength;
	}

}
