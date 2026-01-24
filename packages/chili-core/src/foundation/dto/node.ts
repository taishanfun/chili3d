// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

export interface XYZDTO {
    x: number;
    y: number;
    z: number;
}

export interface PlaneDTO {
    origin: XYZDTO;
    normal: XYZDTO;
    xvec: XYZDTO;
    yvec: XYZDTO;
}

export type Matrix4DTO = number[];
export interface ChiliDocumentDTO {
    schemaVersion: "1.0";
    documentId: string;
    units: "mm" | "cm" | "m" | "inch";
    meta?: Record<string, unknown>;
    layers: LayerDTO[];
    blocks?: BlockDTO[];
    entities: EntityDTO[];
    view?: {
        camera?: unknown;
        workplane?: unknown;
    };
}

export interface LayerDTO {
    id: string;
    name: string;
    visible: boolean;
    locked: boolean;
    color: number;
}

export interface BlockDTO {
    name: string;
    entities: EntityDTO[];
}

export type BizValue =
    | { t: "string"; v: string }
    | { t: "number"; v: number }
    | { t: "boolean"; v: boolean }
    | { t: "object"; v: any }
    | { t: "delete"; v: null };

export interface BizPropsDTO {
    ns?: string;
    values: Record<string, BizValue>;
}

export interface EntityBase {
    id: string;
    type: string;
    name: string;
    visible?: boolean;
    parentVisible?: boolean;
    layerId?: string;
    transform?: Matrix4DTO;
    nativeProps?: Record<string, unknown>;
    bizProps?: BizPropsDTO;
    rev: number;
}

export interface VisualNodeDTO extends EntityBase {
    color?: number;
}

export interface GeometryNodeDTO extends VisualNodeDTO {
    materialId: string | string[];
    faceMaterialPair?: { faceIndex: number; materialIndex: number }[];
}

export interface FacebaseNodeDTO extends GeometryNodeDTO {
    isFace: boolean;
}

export interface LineNodeDTO extends GeometryNodeDTO {
    type: "LineNode";
    start: XYZDTO;
    end: XYZDTO;
}

export interface CircleNodeDTO extends FacebaseNodeDTO {
    type: "CircleNode";
    center: XYZDTO;
    radius: number;
    normal: XYZDTO;
}

export interface BoxNodeDTO extends GeometryNodeDTO {
    type: "BoxNode";
    plane: PlaneDTO;
    dx: number;
    dy: number;
    dz: number;
}

export interface SphereNodeDTO extends GeometryNodeDTO {
    type: "SphereNode";
    center: XYZDTO;
    radius: number;
}

export interface CylinderNodeDTO extends GeometryNodeDTO {
    type: "CylinderNode";
    plane: PlaneDTO;
    radius: number;
    height: number;
}

export interface ConeNodeDTO extends GeometryNodeDTO {
    type: "ConeNode";
    plane: PlaneDTO;
    radius: number;
    height: number;
}

export interface RectNodeDTO extends FacebaseNodeDTO {
    type: "RectNode";
    plane: PlaneDTO;
    width: number;
    height: number;
}

export interface EllipseNodeDTO extends FacebaseNodeDTO {
    type: "EllipseNode";
    center: XYZDTO;
    majorRadius: number;
    minorRadius: number;
    normal: XYZDTO;
    majorAxis: XYZDTO;
}

export interface GroupNodeDTO extends EntityBase {
    type: "GroupNode";
    children: EntityDTO[];
}

export type EntityDTO =
    | LineNodeDTO
    | CircleNodeDTO
    | BoxNodeDTO
    | SphereNodeDTO
    | CylinderNodeDTO
    | ConeNodeDTO
    | RectNodeDTO
    | EllipseNodeDTO
    | GroupNodeDTO
    | GeometryNodeDTO;

export type PatchSetDTO = Partial<
    VisualNodeDTO &
        GeometryNodeDTO &
        LineNodeDTO &
        CircleNodeDTO &
        BoxNodeDTO &
        SphereNodeDTO &
        CylinderNodeDTO &
        ConeNodeDTO &
        RectNodeDTO &
        EllipseNodeDTO
>;

export type PatchUnsetKey = Extract<keyof PatchSetDTO, string>;

export type PatchOp =
    | { op: "add"; entities: EntityDTO[] }
    | { op: "remove"; ids: string[] }
    | { op: "replace"; entity: EntityDTO }
    | { op: "update"; id: string; rev: number; set?: PatchSetDTO; unset?: PatchUnsetKey[] }
    | {
          op: "updateVisual";
          id: string;
          rev: number;
          set?: Partial<VisualNodeDTO & GeometryNodeDTO>;
          unset?: Extract<keyof (VisualNodeDTO & GeometryNodeDTO), string>[];
      }
    | { op: "updateGeom"; id: string; rev: number; set?: PatchSetDTO; unset?: PatchUnsetKey[] }
    | { op: "updateBiz"; id: string; rev: number; values: Record<string, BizValue> }
    | { op: "batch"; label?: string; ops: PatchOp[] };

export interface PatchEnvelope {
    documentId: string;
    source: "host" | "editor";
    mutationId: string;
    baseDocumentRev?: number;
    patches: PatchOp[];
    ts?: number;
}
