// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { Command, ICommand, Logger, PubSub } from "chili-core";
export class CommandService {
    _lastCommand;
    _checking = false;
    _app;
    get app() {
        if (this._app === undefined) {
            throw new Error("Executor is not initialized");
        }
        return this._app;
    }
    start() {
        PubSub.default.sub("executeCommand", this.executeCommand);
        PubSub.default.sub("activeViewChanged", this.onActiveViewChanged);
        Logger.info(`${CommandService.name} started`);
    }
    stop() {
        PubSub.default.remove("executeCommand", this.executeCommand);
        PubSub.default.remove("activeViewChanged", this.onActiveViewChanged);
        Logger.info(`${CommandService.name} stoped`);
    }
    register(app) {
        this._app = app;
        Logger.info(`${CommandService.name} registed`);
    }
    onActiveViewChanged = async (view) => {
        if (this.app.executingCommand && ICommand.isCancelableCommand(this.app.executingCommand))
            await this.app.executingCommand.cancel();
    };
    executeCommand = async (commandName) => {
        const command = commandName === "special.last" ? this._lastCommand : commandName;
        if (!command || !(await this.canExecute(command))) return;
        Logger.info(`executing command ${command}`);
        await this.executeAsync(command);
    };
    async executeAsync(commandName) {
        const commandCtor = Command.get(commandName);
        if (!commandCtor) {
            Logger.error(`Can not find ${commandName} command`);
            return;
        }
        const command = new commandCtor();
        this.app.executingCommand = command;
        PubSub.default.pub("showProperties", this.app.activeView?.document, []);
        try {
            await command.execute(this.app);
        } catch (err) {
            PubSub.default.pub("displayError", err);
            Logger.error(err);
        } finally {
            this._lastCommand = commandName;
            this.app.executingCommand = undefined;
        }
    }
    async canExecute(commandName) {
        if (this._checking) return false;
        this._checking = true;
        const result = await this.checking(commandName);
        this._checking = false;
        return result;
    }
    async checking(commandName) {
        const commandData = Command.getData(commandName);
        if (!commandData?.isApplicationCommand && this.app.activeView === undefined) {
            Logger.error("No active document");
            return false;
        }
        if (!this.app.executingCommand) {
            return true;
        }
        if (Command.getData(this.app.executingCommand)?.key === commandName) {
            PubSub.default.pub("showToast", "toast.command.{0}excuting", commandName);
            return false;
        }
        if (ICommand.isCancelableCommand(this.app.executingCommand)) {
            await this.app.executingCommand.cancel();
            return true;
        }
        return false;
    }
}
