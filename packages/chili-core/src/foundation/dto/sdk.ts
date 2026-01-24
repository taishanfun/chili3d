// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

import { ChiliDocumentDTO, PatchEnvelope } from "./node";

export interface ExportDxfOptions {
    scope?: "all" | "selection";
    version?: "R12" | "R2000" | "R2013";
    precision?: number;
    units?: "mm" | "cm" | "m" | "inch";
}

export interface Chili3D {
    load(dto: ChiliDocumentDTO): Promise<void>;
    dump(): ChiliDocumentDTO;
    applyPatch(envelope: PatchEnvelope): void;
    setMode(mode: "view" | "edit", opts?: { preserveSelection?: boolean }): void;
    getSelection(): string[];
    setSelection(ids: string[]): void;
    exportDxf(options?: ExportDxfOptions): Promise<Blob | string>;
    on(event: string, handler: (payload: any) => void): () => void;
    dispose(): void;
}
