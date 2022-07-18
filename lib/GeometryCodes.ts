import {Geometry, GeometryType, SFException} from "@ngageoint/simple-features-js";

/**
 * Geometry Code utilities to convert between geometry attributes and geometry codes
 */
export class GeometryCodes {

	/**
	 * Get the geometry code from the geometry
	 * @param geometry geometry
	 * @return geometry code
	 */
	public static getCode(geometry: Geometry): number {
		return GeometryCodes._getCode(geometry.geometryType, geometry.hasZ, geometry.hasM);
	}

	/**
	 * Get the geometry code from the geometry type
	 * @param geometryType geometry type
	 * @param hasZ has z
	 * @param hasM mas m
	 * @return geometry code
	 * @since 2.0.3
	 */
	public static _getCode(geometryType: GeometryType, hasZ: boolean, hasM: boolean): number {
		let code = GeometryCodes.getCodeForGeometryType(geometryType);
		if (hasZ) {
			code += 1000;
		}
		if (hasM) {
			code += 2000;
		}
		return code;
	}

	/**
	 * Get the geometry code from the geometry type
	 * 
	 * @param geometryType geometry type
	 * @return geometry code
	 */
	public static getCodeForGeometryType(geometryType: GeometryType): number {

		let code;

		switch (geometryType) {
		case GeometryType.GEOMETRY:
			code = 0;
			break;
		case GeometryType.POINT:
			code = 1;
			break;
		case GeometryType.LINESTRING:
			code = 2;
			break;
		case GeometryType.POLYGON:
			code = 3;
			break;
		case GeometryType.MULTIPOINT:
			code = 4;
			break;
		case GeometryType.MULTILINESTRING:
			code = 5;
			break;
		case GeometryType.MULTIPOLYGON:
			code = 6;
			break;
		case GeometryType.GEOMETRYCOLLECTION:
			code = 7;
			break;
		case GeometryType.CIRCULARSTRING:
			code = 8;
			break;
		case GeometryType.COMPOUNDCURVE:
			code = 9;
			break;
		case GeometryType.CURVEPOLYGON:
			code = 10;
			break;
		case GeometryType.MULTICURVE:
			code = 11;
			break;
		case GeometryType.MULTISURFACE:
			code = 12;
			break;
		case GeometryType.CURVE:
			code = 13;
			break;
		case GeometryType.SURFACE:
			code = 14;
			break;
		case GeometryType.POLYHEDRALSURFACE:
			code = 15;
			break;
		case GeometryType.TIN:
			code = 16;
			break;
		case GeometryType.TRIANGLE:
			code = 17;
			break;
		default:
			throw new SFException("Unsupported Geometry Type for code retrieval: " + geometryType);
		}

		return code;
	}

	/**
	 * Get the Geometry Type from the code
	 * @param code geometry type code
	 * @return geometry type
	 */
	public static getGeometryType(code: number): GeometryType {

		// Look at the last 2 digits to find the geometry type code
		let geometryTypeCode = code % 1000;

		let geometryType: GeometryType = null;

		switch (geometryTypeCode) {
		case 0:
			geometryType = GeometryType.GEOMETRY;
			break;
		case 1:
			geometryType = GeometryType.POINT;
			break;
		case 2:
			geometryType = GeometryType.LINESTRING;
			break;
		case 3:
			geometryType = GeometryType.POLYGON;
			break;
		case 4:
			geometryType = GeometryType.MULTIPOINT;
			break;
		case 5:
			geometryType = GeometryType.MULTILINESTRING;
			break;
		case 6:
			geometryType = GeometryType.MULTIPOLYGON;
			break;
		case 7:
			geometryType = GeometryType.GEOMETRYCOLLECTION;
			break;
		case 8:
			geometryType = GeometryType.CIRCULARSTRING;
			break;
		case 9:
			geometryType = GeometryType.COMPOUNDCURVE;
			break;
		case 10:
			geometryType = GeometryType.CURVEPOLYGON;
			break;
		case 11:
			geometryType = GeometryType.MULTICURVE;
			break;
		case 12:
			geometryType = GeometryType.MULTISURFACE;
			break;
		case 13:
			geometryType = GeometryType.CURVE;
			break;
		case 14:
			geometryType = GeometryType.SURFACE;
			break;
		case 15:
			geometryType = GeometryType.POLYHEDRALSURFACE;
			break;
		case 16:
			geometryType = GeometryType.TIN;
			break;
		case 17:
			geometryType = GeometryType.TRIANGLE;
			break;
		default:
			throw new SFException("Unsupported Geometry code for type retrieval: " + code);
		}

		return geometryType;
	}

	/**
	 * Determine if the geometry code has a Z (3D) value
	 * 
	 * @param code
	 *            geometry code
	 * @return true is has Z
	 */
	public static hasZ(code: number): boolean {

		let hasZ: boolean = false;

		const mode = GeometryCodes.getGeometryMode(code);

		switch (mode) {
		case 0:
		case 2:
			break;
		case 1:
		case 3:
			hasZ = true;
			break;
		default:
			throw new SFException("Unexpected Geometry code for Z determination: " + code);
		}

		return hasZ;
	}

	/**
	 * Determine if the geometry code has a M (linear referencing system) value
	 * @param code geometry code
	 * @return true is has M
	 */
	public static hasM(code: number): boolean {

		let hasM: boolean = false;

		const mode = GeometryCodes.getGeometryMode(code);

		switch (mode) {
		case 0:
		case 1:
			break;
		case 2:
		case 3:
			hasM = true;
			break;
		default:
			throw new SFException( "Unexpected Geometry code for M determination: " + code);
		}

		return hasM;
	}

	/**
	 * Get the geometry mode from the geometry code. Returns the digit in the
	 * thousands place. (z is enabled when 1 or 3, m is enabled when 2 or 3)
	 * 
	 * @param code geometry code
	 * @return geometry mode
	 */
	public static getGeometryMode(code: number): number {
		return Math.round(code / 1000);
	}

}
