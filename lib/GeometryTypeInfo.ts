import { GeometryType } from "@ngageoint/simple-features-js";

/**
 * Geometry type info
 */
export class GeometryTypeInfo {

	/**
	 * Geometry type code
	 */
	private readonly _geometryTypeCode: number;

	/**
	 * Geometry type
	 */
	private readonly _geometryType: GeometryType;

	/**
	 * Has Z values flag
	 */
	private readonly _hasZ: boolean;

	/**
	 * Has M values flag
	 */
	private readonly _hasM: boolean;

	/**
	 * Constructor
	 * 
	 * @param geometryTypeCode geometry type code
	 * @param geometryType geometry type
	 * @param hasZ has z
	 * @param hasM has m
	 */
	public constructor(geometryTypeCode: number, geometryType: GeometryType, hasZ: boolean, hasM: boolean) {
		this._geometryTypeCode = geometryTypeCode;
		this._geometryType = geometryType;
		this._hasZ = hasZ;
		this._hasM = hasM;
	}

	/**
	 * Get the geometry type code
	 * 
	 * @return geometry type code
	 */
	public get geometryTypeCode(): number {
		return this._geometryTypeCode;
	}

	/**
	 * Get the geometry type
	 * 
	 * @return geometry type
	 */
	public get geometryType(): GeometryType {
		return this._geometryType;
	}

	/**
	 * Has z values
	 * 
	 * @return true if has z values
	 */
	public get hasZ(): boolean {
		return this._hasZ;
	}

	/**
	 * Has m values
	 * 
	 * @return true if has m values
	 */
	public get hasM(): boolean {
		return this._hasM;
	}

}
