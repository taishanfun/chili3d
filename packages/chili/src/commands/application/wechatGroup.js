// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
var __decorate =
    (this && this.__decorate) ||
    function (decorators, target, key, desc) {
        var c = arguments.length,
            r =
                c < 3
                    ? target
                    : desc === null
                      ? (desc = Object.getOwnPropertyDescriptor(target, key))
                      : desc,
            d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
            r = Reflect.decorate(decorators, target, key, desc);
        else
            for (var i = decorators.length - 1; i >= 0; i--)
                if ((d = decorators[i]))
                    r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
import { br, div, img, label } from "chili-controls";
import { PubSub, command } from "chili-core";
let WeChatGroup = class WeChatGroup {
    async execute(app) {
        PubSub.default.pub("showDialog", "command.wechat.group", this.ui());
    }
    ui() {
        return div(
            label(
                {
                    style: {
                        fontSize: "14px",
                        display: "block",
                        textAlign: "center",
                        marginBottom: "10px",
                        opacity: "0.75",
                    },
                },
                "群聊人数已超过200人，只可通过邀请进入群聊",
                br(),
                "入群请先添加个人微信：oOxianOo",
            ),
            img({
                width: 360,
                src: "images/wechat.jpg",
                style: {
                    borderRadius: "10px",
                },
            }),
        );
    }
};
WeChatGroup = __decorate(
    [
        command({
            key: "wechat.group",
            icon: "icon-qrcode",
            isApplicationCommand: true,
        }),
    ],
    WeChatGroup,
);
export { WeChatGroup };
