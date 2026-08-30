import type { EventNode } from "@warpcore/realmcore";
import type { TAppletBaseAPI } from "@warpcore/realmcore/src/applet/types";

export interface IAppletAPIBE extends TAppletBaseAPI {
	eventNode: EventNode;
}
