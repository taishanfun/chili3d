// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { option, select } from "chili-controls";
import { Config, Navigation3D } from "chili-core";
export const Navigation3DSelector = (props) => {
    let nav3DTypes = [];
    Navigation3D.types.forEach((nav3DType, index) =>
        nav3DTypes.push(
            option({
                selected: index === Config.instance.navigation3DIndex,
                textContent: nav3DType,
            }),
        ),
    );
    return select(
        {
            onchange: (e) => {
                let nav3DType = e.target.selectedIndex;
                Config.instance.navigation3DIndex = nav3DType;
            },
            ...props,
        },
        ...nav3DTypes,
    );
};
