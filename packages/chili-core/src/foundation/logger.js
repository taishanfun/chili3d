// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
export class Logger {
    static debug(message, ...optionalParams) {
        console.log(message, ...optionalParams);
    }
    static info(message, ...optionalParams) {
        console.log(message, ...optionalParams);
    }
    static warn(message, ...optionalParams) {
        console.warn(message, ...optionalParams);
    }
    static error(message, ...optionalParams) {
        console.error(message, ...optionalParams);
    }
}
// facilitate debugging
Logger.info = console.log;
Logger.warn = console.warn;
Logger.debug = console.log;
Logger.error = console.error;
