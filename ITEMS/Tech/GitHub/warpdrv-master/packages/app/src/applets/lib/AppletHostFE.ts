import { AppletHost } from "@warpcore/realmcore";
import { nanoid } from "nanoid";
import type React from "react";
import { useStore } from "@/store";
import type { ISlashCommand } from "@/store/slices/slashCommands";
import type { TUISpaceComponent, TUISpaceComponentId } from "@/store/slices/uiSpaces";
import { EUISpaceLoc } from "@/store/slices/uiSpaces";
import { UiSpaceChip } from "../ui/UiSpaceChip";
import type { IAppletAPIFE } from "./types";

export class AppletHostFE extends AppletHost<IAppletAPIFE> {
	protected override buildApi(): IAppletAPIFE {
		const appletName = this.definition.name;
		const api = super.buildApi();

		return {
			...api,
			useStore,

			registerSlashCommand: (command: ISlashCommand) => {
				useStore.getState().registerSlashCommand(command, appletName);
			},
			unregisterSlashCommand: (name: string) => {
				useStore.getState().unregisterSlashCommand(name, appletName);
			},

			registerUiSpaceComponent: (
				spaceId: string,
				component: TUISpaceComponent,
				opts: {
					label: string;
					componentId?: string;
					icon?: React.ComponentType<any>;
					align?: "start" | "end";
				},
			) => {
				return useStore.getState().registerUiSpaceComponent({
					location: spaceId as EUISpaceLoc,
					component,
					label: opts.label,
					appletName,
					componentId: opts.componentId,
					icon: opts.icon,
					align: opts.align,
				});
			},
			unregisterUiSpaceComponent: (id: TUISpaceComponentId) => {
				useStore.getState().unregisterUiSpaceComponent(appletName, id);
			},
			registerComposerChip: (options) => {
				const id = options.componentId ?? nanoid();
				return useStore.getState().registerUiSpaceComponent({
					componentId: id,
					location: EUISpaceLoc.COMPOSER,
					component: UiSpaceChip,
					label: "UiSpaceChip",
					appletName,
					props: options,
					icon: options.icon,
				});
			},
		};
	}

	public override terminate(): Promise<void> {
		const state = useStore.getState();
		const tracked = state.slashCommandsByApplet[this.definition.name];
		if (tracked) {
			for (const cmd of Object.keys(tracked)) {
				state.unregisterSlashCommand(cmd, this.definition.name);
			}
		}
		state.unregisterUiSpaceComponent(this.definition.name);
		return super.terminate();
	}
}
