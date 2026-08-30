import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { Extension } from "@tiptap/react";

export interface IComposerPlaceholderOptions {
	placeholder: string;
	resolveCommandPlaceholder: (name: string) => string | null;
}

const placeholderKey = new PluginKey("composerPlaceholder");

function makeHint(text: string): HTMLElement {
	const el = document.createElement("span");
	el.textContent = text;
	el.className = "aui-composer-placeholder";
	el.style.color = "var(--wc-text-muted, #888)";
	el.style.pointerEvents = "none";
	el.style.userSelect = "none";
	return el;
}

export const ComposerPlaceholder = Extension.create<IComposerPlaceholderOptions>({
	name: "composerPlaceholder",
	addOptions() {
		return {
			placeholder: "",
			resolveCommandPlaceholder: () => null,
		};
	},
	addProseMirrorPlugins() {
		const options = this.options;
		return [
			new Plugin({
				key: placeholderKey,
				props: {
					decorations: (state) => {
						const doc = state.doc;
						if (
							doc.childCount === 1 &&
							doc.firstChild &&
							doc.firstChild.content.size === 0
						) {
							if (!options.placeholder) return null;
							return DecorationSet.create(doc, [
								Decoration.widget(1, makeHint(options.placeholder), { side: 1 }),
							]);
						}
						let decoration: Decoration | null = null;
						doc.descendants((node, pos) => {
							if (decoration) return false;
							if (node.type.name !== "slashCommand") return true;
							const text = options.resolveCommandPlaceholder(
								node.attrs.name as string,
							);
							if (!text) return false;
							const endOfNode = pos + node.nodeSize;
							const endOfBlock = doc.resolve(pos).end();
							const trailing = doc.textBetween(endOfNode, endOfBlock, "", "");
							if (trailing.trim().length > 0) return false;
							decoration = Decoration.widget(endOfNode, makeHint(text), { side: 1 });
							return false;
						});
						if (!decoration) return null;
						return DecorationSet.create(doc, [decoration]);
					},
				},
			}),
		];
	},
});
