// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
let currentApplication;
export function getCurrentApplication() {
    return currentApplication;
}
export function setCurrentApplication(app) {
    currentApplication = app;
}
