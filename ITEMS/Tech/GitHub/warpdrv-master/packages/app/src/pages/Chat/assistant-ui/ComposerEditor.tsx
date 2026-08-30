import Document from "@tiptap/extension-document";
import HardBreak from "@tiptap/extension-hard-break";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import { type Editor, EditorContent, Extension, useEditor } from "@tiptap/react";
import { forwardRef, useImperativeHandle, useRef } from "react";
import { useStore } from "@/store";
import { ComposerPlaceholder } from "./ComposerPlaceholder";
import { clearActiveComposerEditor, setActiveComposerEditor } from "./composerEditorRegistry";
import { docToString, extractCommands } from "./docToString";
import { SlashCommandNode } from "./slash-command/SlashCmdNode";

export interface IWarpComposerEditorRef {
	insertText: (text: string) => void;
	focus: () => void;
	clear: () => void;
	getEditor: () => Editor | null;
}

interface IProps {
	placeholder?: string;
	onChangeText: (text: string) => void;
	onEnter: () => void;
	canSend?: () => boolean;
	className?: string;
}

// drives Enter=send, Shift-Enter=newline
const makeKeymap = (getOnEnter: () => () => void, getCanSend: () => (() => boolean) | undefined) =>
	Extension.create({
		name: "warpComposerKeymap",
		addKeyboardShortcuts() {
			return {
				Enter: () => {
					const canSend = getCanSend();
					if (canSend && !canSend()) return false;
					const json = this.editor.getJSON();
					const text = docToString(json).trim();
					const commands = extractCommands(json);
					if (!text && commands.length === 0) return false;
					getOnEnter()();
					return true;
				},
				"Shift-Enter": () => this.editor.commands.setHardBreak(),
			};
		},
	});

export const ComposerEditor = forwardRef<IWarpComposerEditorRef, IProps>((props, ref) => {
	const setPendingSlashCommands = useStore((s) => s.setPendingSlashCommands);
	const slashCommands = useStore((s) => s.slashCommands);
	const slashCommandsRef = useRef(slashCommands);
	slashCommandsRef.current = slashCommands;
	const chatFontSize = useStore((s) => s.settings.chatFontSize ?? 14);
	const chatFontFamily = useStore((s) => s.settings.chatFontFamily ?? "");
	const onEnterRef = useRef(props.onEnter);
	onEnterRef.current = props.onEnter;
	const canSendRef = useRef(props.canSend);
	canSendRef.current = props.canSend;
	const editor = useEditor({
		extensions: [
			Document,
			Paragraph,
			Text,
			HardBreak,
			makeKeymap(
				() => onEnterRef.current,
				() => canSendRef.current,
			),
			SlashCommandNode,
			ComposerPlaceholder.configure({
				placeholder: "Send a message, or type / to use slash-commands...",
				resolveCommandPlaceholder: (name: string) => {
					const cmd = slashCommandsRef.current[name];
					if (!cmd || !cmd.consumesInput) return null;
					return cmd.inputPlaceholder ?? null;
				},
			}),
		],
		editorProps: {
			attributes: {
				class: "aui-composer-input",
				"aria-label": "Message input",
				style: `outline: none; min-height: 50px; font-size: ${chatFontSize}px;${chatFontFamily ? ` font-family: ${chatFontFamily};` : ""}`,
			},
		},
		onUpdate: ({ editor }) => {
			const json = editor.getJSON();
			props.onChangeText(docToString(json));
			setPendingSlashCommands(extractCommands(json));
		},
		onCreate: ({ editor }) => {
			//console.log("[register] onCreate fired", !!editor);
			setActiveComposerEditor(editor);
		},
		onDestroy: () => {
			if (editor) clearActiveComposerEditor(editor);
		},
	});

	useImperativeHandle(
		ref,
		() => ({
			insertText: (text: string) => {
				editor?.chain().focus().insertContent(text).run();
			},
			focus: () => editor?.commands.focus(),
			clear: () => editor?.commands.clearContent(true),
			getEditor: () => editor,
		}),
		[editor],
	);

	return <EditorContent editor={editor} className={props.className} />;
});

ComposerEditor.displayName = "ComposerEditor";
