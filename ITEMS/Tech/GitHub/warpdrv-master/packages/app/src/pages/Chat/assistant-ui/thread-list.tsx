import { ThreadListPrimitive } from "@assistant-ui/react";
import { Box, HStack, Input, Menu, Portal, Text, VStack } from "@chakra-ui/react";
import type { IChatThread as IBridgeChatThread } from "@warpcore/bridge";
import { genThreadId } from "@warpcore/shared";
import {
	CheckIcon,
	ChevronDownIcon,
	ChevronRightIcon,
	FolderIcon,
	FolderOpenIcon,
	FolderPlusIcon,
	MoreHorizontalIcon,
	PencilIcon,
	SearchIcon,
	SortAscIcon,
	SortDescIcon,
	TrashIcon,
	XIcon,
} from "lucide-react";
import { arrayToTree } from "performant-array-to-tree";
import React, {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
	type DragEvent,
} from "react";
import { createPortal } from "react-dom";
import { IoStarSharp } from "react-icons/io5";
import { BsFillChatLeftFill } from "react-icons/bs";
import { fetchWorkspace, reorderFolders } from "@/api/services";
import { useThreadsAndFolders } from "@/hooks/useThreadsAndFolders";
import { useStore } from "@/store";

interface IChatThread extends IBridgeChatThread {
	messageCount?: number;
	totalTokens?: number;
}

type TSortField = "updatedAt" | "createdAt" | "title" | "messageCount";
type TSortDir = "asc" | "desc";

interface TreeEntry {
	id: string;
	parentId: string;
	type: "folder" | "thread";
	children?: TreeEntry[];
}

function RenamePopover({
	value,
	onSave,
	onCancel,
}: {
	value: string;
	onSave: (v: string) => void;
	onCancel: () => void;
}) {
	const [text, setText] = useState(value);
	const ref = useRef<HTMLInputElement>(null);
	useEffect(() => {
		ref.current?.focus();
		ref.current?.select();
	}, []);
	return (
		<HStack gap="1" onClick={(e) => e.stopPropagation()}>
			<Input
				ref={ref}
				size="xs"
				value={text}
				onChange={(e) => setText(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter") onSave(text);
					if (e.key === "Escape") onCancel();
				}}
				bg="var(--wc-bg-card)"
				borderColor="var(--wc-border-hover)"
				color="var(--wc-text-primary)"
				fontSize="12px"
				h="26px"
				px="2"
			/>
			<Box
				cursor="pointer"
				onClick={() => onSave(text)}
				opacity={0.5}
				_hover={{ opacity: 0.8 }}
				p="1"
			>
				<CheckIcon size={11} />
			</Box>
			<Box cursor="pointer" onClick={onCancel} opacity={0.3} _hover={{ opacity: 0.6 }} p="1">
				<XIcon size={11} />
			</Box>
		</HStack>
	);
}

function ConfirmDialog({
	message,
	onConfirm,
	onCancel,
}: {
	message: string;
	onConfirm: () => void;
	onCancel: () => void;
}) {
	return (
		<Box
			position="fixed"
			top="0"
			left="0"
			right="0"
			bottom="0"
			bg="var(--wc-overlay-modal)"
			zIndex={100}
			display="flex"
			alignItems="center"
			justifyContent="center"
			onClick={onCancel}
		>
			<Box
				bg="var(--wc-bg-elevated)"
				borderWidth="1px"
				borderColor="var(--wc-border-overlay)"
				borderRadius="lg"
				p="5"
				maxW="360px"
				w="90%"
				onClick={(e) => e.stopPropagation()}
			>
				<Text fontSize="13px" color="var(--wc-text-primary)" mb="4">
					{message}
				</Text>
				<HStack justify="flex-end" gap="2">
					<Box
						as="button"
						px="3"
						py="1.5"
						borderRadius="md"
						fontSize="12px"
						bg="var(--wc-bg-card)"
						color="var(--wc-text-secondary)"
						_hover={{ bg: "var(--wc-bg-active)" }}
						onClick={onCancel}
					>
						Cancel
					</Box>
					<Box
						as="button"
						px="3"
						py="1.5"
						borderRadius="md"
						fontSize="12px"
						bg="var(--wc-accent-red-alt)"
						color="var(--wc-special-white)"
						_hover={{ bg: "var(--wc-accent-red)" }}
						onClick={onConfirm}
					>
						Delete
					</Box>
				</HStack>
			</Box>
		</Box>
	);
}

interface ThreadActions {
	onRenameThread: (id: string, title: string) => void;
	onDeleteThread: (id: string) => void;
	onSetStarred: (id: string, starred: boolean) => void;
	onSelectThread: (id: string) => void;
	onRenameFolder: (id: string, name: string) => void;
	onDeleteFolder: (id: string) => void;
	onDropThread: (threadId: string, folderId: string | null) => void;
	onReorderFolder: (fromFolderId: string, toFolderId: string) => void;
	onSetParent: (threadId: string, parentId: string | null) => void;
}
const ThreadActionsContext = React.createContext<ThreadActions | null>(null);

const TreeNode = ({ node }: { node: TreeEntry }) => {
	return (
		<Box w="full">
			{node.type === "thread" ? <ThreadNode node={node} /> : <FolderNode node={node} />}
		</Box>
	);
};

const ThreadNode = ({ node }: { node: TreeEntry }) => {
	const thread = useStore((s) => s.threads[node.id]);
	if (!thread) return null;

	const [expanded, setExpanded] = useState(false);
	const [renaming, setRenaming] = useState(false);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const getAnchorRect = useCallback(
		() => triggerRef.current?.getBoundingClientRect(),
		[triggerRef],
	);
	const currentThreadId = useStore((s) => s.currentThreadId);
	const selected = thread.id === currentThreadId;
	const actions = React.useContext(ThreadActionsContext);

	const metaFields = useMemo(() => {
		try {
			const m = JSON.parse(thread.meta);
			return {
				starred: !!m.starred,
				serverId: m.serverId ?? null,
				tags: m.tags ?? [],
				enableAutoEmbed: !!m.enableAutoEmbed,
			};
		} catch {
			return { starred: false, serverId: null, tags: [], enableAutoEmbed: false };
		}
	}, [thread.meta]);

	const containerId = node.parentId;
	const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

	useLayoutEffect(() => {
		if (!metaFields.starred) return;
		setPortalTarget(document.getElementById(`${containerId}-starred`));
	}, [containerId, metaFields.starred]);

	const handleSelect = useCallback(() => {
		const folderId = thread.folderId;
		if (folderId) {
			fetchWorkspace(folderId).then((res) => {
				if (res.ok && res.data) useStore.getState().setWorkspace(res.data);
			});
			useStore.getState().setActiveWorkspaceId(folderId);
		}
		actions?.onSelectThread(node.id);
	}, [thread.folderId, node.id, actions]);

	const displayText = useMemo(() => {
		const total = (thread.totalPromptTokens ?? 0) + (thread.totalCompletionTokens ?? 0);
		if (total > 0) return `${(total / 1000).toFixed(1)}k`;
		if ((thread.messageCount ?? 0) > 0) return `${thread.messageCount ?? 0} msg`;
		return "empty";
	}, [thread.totalPromptTokens, thread.totalCompletionTokens, thread.messageCount]);

	// if (!portalTarget) return null;

	const maybeCreatePortal = useCallback(
		(html: any, ele?: any) => (portalTarget ? createPortal(html, ele) : html),
		[portalTarget],
	);

	return maybeCreatePortal(
		<Box w="100%">
			<Box
				w="100%"
				className={`group ${selected ? "selected" : ""}`}
				bg={selected ? "var(--wc-bg-card)" : undefined}
				border={selected ? "1px solid var(--wc-border-strong)" : undefined}
				draggable
				onDragStart={(e: DragEvent) => {
					e.dataTransfer.setData("threadId", thread.id);
				}}
				onDrop={(e: DragEvent) => {
					const draggedThreadId = e.dataTransfer.getData("threadId");
					if (draggedThreadId && draggedThreadId !== thread.id) {
						e.stopPropagation();
						actions?.onSetParent(draggedThreadId, thread.id);
					}
				}}
				onClick={handleSelect}
				style={{ minHeight: "32px", cursor: "grab" }}
				display="flex"
				alignItems="center"
				gap="1"
				borderRadius="lg"
				px="3"
				py="1"
				_hover={{ bg: "var(--wc-bg-hover)" }}
			>
				{node.children && node.children.length > 0 && (
					<Box
						as="button"
						onClick={(e) => {
							e.stopPropagation();
							setExpanded(!expanded);
						}}
						style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
						p="0.5"
						_hover={{ bg: "var(--wc-bg-hover)" }}
						borderRadius="sm"
					>
						{expanded ? (
							<ChevronDownIcon size={12} style={{ color: "var(--wc-text-muted)" }} />
						) : (
							<ChevronRightIcon size={12} style={{ color: "var(--wc-text-muted)" }} />
						)}
					</Box>
				)}

				{renaming ? (
					<Box flex="1" px="2" py="1">
						<RenamePopover
							value={thread.title}
							onSave={(v) => {
								actions?.onRenameThread(thread.id, v);
								setRenaming(false);
							}}
							onCancel={() => setRenaming(false)}
						/>
					</Box>
				) : (
					<>
						<Box flex="1" display="flex" flexDirection="column" overflow="hidden">
							<HStack>
								{!(node.children && node.children.length > 0) &&
									!metaFields.starred && (
										<BsFillChatLeftFill
											size={14}
											style={{ color: "var(--wc-text-muted)", flexShrink: 0 }}
										/>
									)}
								{metaFields.starred && (
									<IoStarSharp
										size={12}
										style={{ color: "var(--wc-text-secondary)", flexShrink: 0 }}
									/>
								)}
								<Text
									fontSize="13px"
									color="var(--wc-text-primary)"
									overflow="hidden"
									textOverflow="ellipsis"
									whiteSpace="nowrap"
									minW={0}
								>
									{thread.title ?? "New Chat"}
								</Text>
								<Text fontSize="12px" color="var(--wc-text-faint)">
									{displayText}
								</Text>
							</HStack>
						</Box>
						<Box position="relative">
							<Menu.Root positioning={{ getAnchorRect, strategy: "fixed" }}>
								<Menu.Trigger asChild>
									<Box
										ref={triggerRef as any}
										as="button"
										cursor="pointer"
										p="1"
										mr="1"
										borderRadius="sm"
										opacity={0}
										className="group-hover:!opacity-50"
										_hover={{ bg: "var(--wc-bg-hover)" }}
										type="button"
										onClick={(e) => e.stopPropagation()}
									>
										<MoreHorizontalIcon
											size={13}
											style={{ color: "var(--wc-text-secondary)" }}
										/>
									</Box>
								</Menu.Trigger>
								<Menu.Positioner portal>
									<Menu.Content
										bg="var(--wc-bg-elevated)"
										borderWidth="1px"
										borderColor="var(--wc-border-overlay)"
										borderRadius="md"
										py="1"
										minW="120px"
										onClick={(e) => e.stopPropagation()}
									>
										<Menu.Item
											value="rename"
											onClick={() => setRenaming(true)}
											style={{
												fontSize: "12px",
												color: "var(--wc-text-primary)",
											}}
										>
											<HStack gap="2">
												<PencilIcon size={12} />
												<Text>Rename</Text>
											</HStack>
										</Menu.Item>
										<Menu.Item
											value="star"
											onClick={() =>
												actions?.onSetStarred(
													thread.id,
													!metaFields.starred,
												)
											}
											style={{
												fontSize: "12px",
												color: "var(--wc-text-primary)",
											}}
										>
											<HStack gap="2">
												<IoStarSharp
													size={12}
													style={{ color: "var(--wc-text-primary)" }}
												/>
												<Text>
													{metaFields.starred ? "Unstar" : "Star"}
												</Text>
											</HStack>
										</Menu.Item>
										<Menu.Item
											value="delete"
											onClick={() => actions?.onDeleteThread(thread.id)}
											style={{
												fontSize: "12px",
												color: "var(--wc-accent-red)",
											}}
										>
											<HStack gap="2">
												<TrashIcon size={12} />
												<Text>Delete</Text>
											</HStack>
										</Menu.Item>
									</Menu.Content>
								</Menu.Positioner>
							</Menu.Root>
						</Box>
					</>
				)}
			</Box>

			{expanded && node.children && node.children.length > 0 && (
				<Box
					pl="4"
					my="1"
					maxH="600px"
					css={{
						"&::-webkit-scrollbar": { width: "4px" },
						"&::-webkit-scrollbar-thumb": {
							background: "var(--wc-text-disabled)",
							borderRadius: "2px",
						},
					}}
				>
					{node.children
						.filter((c) => c.type === "folder")
						.map((child) => (
							<TreeNode key={child.id} node={child} />
						))}
					<div id={`${node.id}-starred`} style={{ width: "100%" }} />
					{node.children
						.filter((c) => c.type === "thread")
						.map((child) => (
							<TreeNode key={child.id} node={child} />
						))}
				</Box>
			)}
		</Box>,
		portalTarget,
	);
};

const FolderNode = ({ node }: { node: TreeEntry }) => {
	const folder = useStore((s) => s.folders.find((f) => f.id === node.id));
	if (!folder) return null;

	const [expanded, setExpanded] = useState(false);
	const [renaming, setRenaming] = useState(false);
	const [dragOver, setDragOver] = useState(false);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const getAnchorRect = useCallback(
		() => triggerRef.current?.getBoundingClientRect(),
		[triggerRef],
	);
	const actions = React.useContext(ThreadActionsContext);
	const setActiveWorkspaceId = useStore((s) => s.setActiveWorkspaceId);
	const setCurrentThreadId = useStore((s) => s.setCurrentThreadId);
	const setWorkspace = useStore((s) => s.setWorkspace);

	const handleExpandToggle = useCallback(() => {
		setExpanded(!expanded);
	}, [expanded, setExpanded]);

	const handleOpenFolder = useCallback(() => {
		fetchWorkspace(folder.id).then((res) => {
			if (res.ok && res.data) setWorkspace(res.data);
		});
		setActiveWorkspaceId(folder.id);
		setCurrentThreadId(genThreadId());
		setExpanded(true);
	}, [folder.id, setWorkspace, setActiveWorkspaceId, setCurrentThreadId]);

	const threadCount = useMemo(() => {
		const allThreads = Object.values(useStore.getState().threads) as IChatThread[];
		return allThreads.filter((t) => t.folderId === folder.id).length;
	}, [folder.id]);

	// Thread drop target on folder container
	function handleThreadDragOver(e: DragEvent) {
		const threadId = e.dataTransfer.getData("threadId");
		if (threadId) {
			e.preventDefault();
			setDragOver(true);
		}
	}
	function handleThreadDragLeave() {
		setDragOver(false);
	}
	function handleThreadDrop(e: DragEvent) {
		e.preventDefault();
		setDragOver(false);
		const threadId = e.dataTransfer.getData("threadId");
		if (threadId) actions?.onDropThread(threadId, folder.id);
	}

	// Folder reordering via drag-and-drop on folder header
	function handleFolderDragStart(e: DragEvent) {
		e.dataTransfer.setData("folderId", folder.id);
		e.dataTransfer.effectAllowed = "move";
	}
	function handleFolderDragOver(e: DragEvent) {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
	}
	function handleFolderDrop(e: DragEvent) {
		e.preventDefault();
		const fromFolderId = e.dataTransfer.getData("folderId");
		if (fromFolderId && fromFolderId !== folder.id) {
			actions?.onReorderFolder(fromFolderId, folder.id);
		}
	}

	return (
		<Box
			w="full"
			my="1"
			borderRadius="lg"
			border="1px solid var(--wc-border-default)"
			bg={dragOver ? "var(--wc-accent-blue-bg-10)" : "var(--wc-bg-subtle)"}
			transition="background 0.15s"
			onDragOver={handleThreadDragOver}
			onDragLeave={handleThreadDragLeave}
			onDrop={handleThreadDrop}
		>
			<HStack
				gap="1"
				px="2"
				py="1.5"
				cursor="grab"
				borderRadius="md"
				position="relative"
				_hover={{ bg: "var(--wc-bg-card)" }}
				onClick={handleOpenFolder}
				draggable
				onDragStart={handleFolderDragStart}
				onDragOver={handleFolderDragOver}
				onDrop={handleFolderDrop}
				data-foldertype="folder"
			>
				<Box
					as="button"
					onClick={(e) => {
						e.stopPropagation();
						handleExpandToggle();
					}}
					style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
					p="0.5"
					_hover={{ bg: "var(--wc-bg-hover)" }}
					borderRadius="sm"
				>
					{expanded ? (
						<ChevronDownIcon size={12} style={{ color: "var(--wc-text-muted)" }} />
					) : (
						<ChevronRightIcon size={12} style={{ color: "var(--wc-text-muted)" }} />
					)}
				</Box>
				{expanded ? (
					<FolderOpenIcon
						size={14}
						style={{ flexShrink: 0, color: "var(--wc-text-muted)" }}
					/>
				) : (
					<FolderIcon
						size={14}
						style={{ flexShrink: 0, color: "var(--wc-text-muted)" }}
					/>
				)}
				{renaming ? (
					<RenamePopover
						value={folder.name}
						onSave={(v) => {
							actions?.onRenameFolder(folder.id, v);
							setRenaming(false);
						}}
						onCancel={() => setRenaming(false)}
					/>
				) : (
					<Text
						flex="1"
						fontSize="14px"
						fontWeight="500"
						color="var(--wc-text-secondary)"
						overflow="hidden"
						textOverflow="ellipsis"
						whiteSpace="nowrap"
						ml="1"
						minW={0}
					>
						{folder.name}
					</Text>
				)}
				<Text fontSize="12px" color="var(--wc-text-faint)" flexShrink={0}>
					{threadCount}
				</Text>
				<Menu.Root positioning={{ getAnchorRect, strategy: "fixed" }}>
					<Menu.Trigger asChild>
						<Box
							ref={triggerRef as any}
							as="button"
							opacity={0.6}
							cursor="pointer"
							p="0.5"
							className="group-hover:!opacity-100"
							_hover={{ opacity: 1, bg: "var(--wc-bg-hover)" }}
							borderRadius="sm"
							type="button"
							onClick={(e) => e.stopPropagation()}
						>
							<MoreHorizontalIcon size={12} />
						</Box>
					</Menu.Trigger>
					<Menu.Positioner portal>
						<Menu.Content
							bg="var(--wc-bg-elevated)"
							borderWidth="1px"
							borderColor="var(--wc-border-overlay)"
							borderRadius="md"
							py="1"
							minW="120px"
							onClick={(e) => e.stopPropagation()}
						>
							<Menu.Item
								value="rename"
								onClick={() => setRenaming(true)}
								style={{ fontSize: "12px", color: "var(--wc-text-primary)" }}
							>
								<HStack gap="2">
									<PencilIcon size={12} />
									<Text>Rename</Text>
								</HStack>
							</Menu.Item>
							<Menu.Item
								value="delete"
								onClick={() => actions?.onDeleteFolder(folder.id)}
								style={{ fontSize: "12px", color: "var(--wc-accent-red)" }}
							>
								<HStack gap="2">
									<TrashIcon size={12} />
									<Text>Delete</Text>
								</HStack>
							</Menu.Item>
						</Menu.Content>
					</Menu.Positioner>
				</Menu.Root>
			</HStack>

			{expanded && (
				<Box
					pl="4"
					mb="2"
					maxH="600px"
					overflowY="auto"
					css={{
						"&::-webkit-scrollbar": { width: "4px" },
						"&::-webkit-scrollbar-thumb": {
							background: "var(--wc-text-disabled)",
							borderRadius: "2px",
						},
					}}
				>
					<div id={`${node.id}-starred`} style={{ width: "100%" }} />
					{node.children
						.filter((c) => c.type === "thread")
						.map((child) => (
							<TreeNode key={child.id} node={child} />
						))}
					{(node.children ?? []).filter((c) => c.type === "thread").length === 0 && (
						<Text fontSize="11px" color="var(--wc-text-disabled)" px="2" py="1">
							Drop threads here
						</Text>
					)}
				</Box>
			)}
		</Box>
	);
};

export const ThreadList = React.memo(({ onOpenSearch }: { onOpenSearch?: () => void }) => {
	const api = useThreadsAndFolders();
	const [search, setSearch] = useState("");
	const [sortField, setSortField] = useState<TSortField>("updatedAt");
	const [sortDir, setSortDir] = useState<TSortDir>("desc");
	const [confirmDelete, setConfirmDelete] = useState<{
		type: "folder" | "thread";
		id: string;
	} | null>(null);
	const [rootDragOver, setRootDragOver] = useState(false);

	// Stable selectors — Record and array references only change when data changes
	const threads = useStore((s) => s.threads);
	const folders = useStore((s) => s.folders);

	// Convert threads Record to array, filter + sort
	// const sortedThreads = useMemo(() => {
	// 	const arr = Object.values(threads) as IChatThread[];
	// 	if (search) {
	// 		arr.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()));
	// 	}
	// 	return [...arr].sort((a, b) => {
	// 		let cmp = 0;
	// 		if (sortField === "updatedAt") cmp = a.updatedAt - b.updatedAt;
	// 		else if (sortField === "createdAt") cmp = a.createdAt - b.createdAt;
	// 		else if (sortField === "title") cmp = a.title.localeCompare(b.title);
	// 		else if (sortField === "messageCount")
	// 			cmp =
	// 				(a.totalPromptTokens ?? 0) +
	// 				(a.totalCompletionTokens ?? 0) -
	// 				((b.totalPromptTokens ?? 0) + (b.totalCompletionTokens ?? 0));
	// 		return sortDir === "desc" ? -cmp : cmp;
	// 	});
	// }, [threads, folders, search, sortField, sortDir]);

	// Build flat tree entries — sorted by active sort field/direction BEFORE tree creation
	const flatEntries = useMemo((): TreeEntry[] => {
		const threadEntries: TreeEntry[] = [];
		for (const [id, t] of Object.entries(threads)) {
			const thread = t as IChatThread;
			const parentId = thread.parentId ?? thread.folderId ?? "root";
			threadEntries.push({ id, parentId, type: "thread" });
		}
		// Sort thread entries by active sort field/direction
		threadEntries.sort((a, b) => {
			const ta = threads[a.id] as IChatThread;
			const tb = threads[b.id] as IChatThread;
			let cmp = 0;
			if (sortField === "updatedAt") cmp = (ta?.updatedAt ?? 0) - (tb?.updatedAt ?? 0);
			else if (sortField === "createdAt") cmp = (ta?.createdAt ?? 0) - (tb?.createdAt ?? 0);
			else if (sortField === "title") cmp = (ta?.title ?? "").localeCompare(tb?.title ?? "");
			else if (sortField === "messageCount")
				cmp =
					(ta?.totalPromptTokens ?? 0) +
					(ta?.totalCompletionTokens ?? 0) -
					((tb?.totalPromptTokens ?? 0) + (tb?.totalCompletionTokens ?? 0));
			return sortDir === "desc" ? -cmp : cmp;
		});
		const entries: TreeEntry[] = [];
		for (const folder of folders) {
			entries.push({ id: folder.id, parentId: "root", type: "folder" });
		}
		entries.push(...threadEntries);
		return entries;
	}, [threads, folders, sortField, sortDir]);

	// Build tree — only apply folder-before-thread ordering (threads already sorted)
	const tree = useMemo(() => {
		const result = arrayToTree(flatEntries, {
			id: "id",
			parentId: "parentId",
			childrenField: "children",
			rootParentIds: { root: true },
			dataField: null,
		});
		return result as TreeEntry[];
	}, [flatEntries]);

	// Handlers — call API, SSE updates store
	const handleRenameThread = useCallback(
		async (id: string, title: string) => {
			await api.patchThread(id, { title });
		},
		[api.patchThread],
	);

	const handleDeleteThread = useCallback((id: string) => {
		setConfirmDelete({ type: "thread", id });
	}, []);

	const handleSetStarred = useCallback(
		async (id: string, starred: boolean) => {
			await api.patchThread(id, { starred });
		},
		[api.patchThread],
	);

	const handleSelectThread = useCallback(
		(id: string) => {
			api.setCurrentThreadId(id);
		},
		[api.setCurrentThreadId],
	);

	const handleRenameFolder = useCallback(
		async (id: string, name: string) => {
			await api.patchFolder(id, { name });
		},
		[api.patchFolder],
	);

	const handleDeleteFolder = useCallback((id: string) => {
		setConfirmDelete({ type: "folder", id });
	}, []);

	const handleCreateFolder = useCallback(async () => {
		await api.addFolder("New Folder");
	}, [api.addFolder]);

	const handleConfirmDelete = useCallback(async () => {
		if (!confirmDelete) return;
		if (confirmDelete.type === "thread") {
			await api.removeThread(confirmDelete.id);
		} else {
			await api.removeFolder(confirmDelete.id);
		}
		setConfirmDelete(null);
	}, [confirmDelete, api.removeThread, api.removeFolder]);

	// Drag-and-drop handlers
	const handleDropThread = useCallback(
		async (threadId: string, folderId: string | null) => {
			await api.patchThread(threadId, { folderId });
		},
		[api.patchThread],
	);

	const handleReorderFolder = useCallback(
		async (fromFolderId: string, toFolderId: string) => {
			if (fromFolderId === toFolderId) return;
			const foldersArr = useStore.getState().folders;
			const fromIdx = foldersArr.findIndex((f) => f.id === fromFolderId);
			const toIdx = foldersArr.findIndex((f) => f.id === toFolderId);
			if (fromIdx === -1 || toIdx === -1) return;
			const updates: Array<{ id: string; sortOrder: number }> = [];
			if (fromIdx < toIdx) {
				for (let i = fromIdx + 1; i <= toIdx; i++) {
					const f = foldersArr[i];
					if (f) updates.push({ id: f.id, sortOrder: f.sortOrder - 1 });
				}
				const toFolder = foldersArr[toIdx];
				if (toFolder) updates.push({ id: fromFolderId, sortOrder: toFolder.sortOrder });
			} else {
				for (let i = toIdx; i < fromIdx; i++) {
					const f = foldersArr[i];
					if (f) updates.push({ id: f.id, sortOrder: f.sortOrder + 1 });
				}
				const toFolder = foldersArr[toIdx];
				if (toFolder) updates.push({ id: fromFolderId, sortOrder: toFolder.sortOrder });
			}
			await reorderFolders(updates);
			await api.refreshFolders();
		},
		[api.refreshFolders],
	);

	const handleRootDragOver = useCallback((e: DragEvent) => {
		const threadId = (e as DragEvent).dataTransfer.getData("threadId");
		if (threadId) {
			e.preventDefault();
			setRootDragOver(true);
		}
	}, []);

	const handleRootDragLeave = useCallback(() => {
		setRootDragOver(false);
	}, []);

	const handleRootDrop = useCallback(
		(e: DragEvent) => {
			e.preventDefault();
			setRootDragOver(false);
			const threadId = e.dataTransfer.getData("threadId");
			if (threadId) handleDropThread(threadId, null);
		},
		[handleDropThread],
	);

	const handleSetParent = useCallback(
		async (threadId: string, parentId: string | null) => {
			await api.patchThread(threadId, { parentId });
		},
		[api.patchThread],
	);

	// Context value — stable reference
	const actions = useMemo<ThreadActions>(
		() => ({
			onRenameThread: handleRenameThread,
			onDeleteThread: handleDeleteThread,
			onSetStarred: handleSetStarred,
			onSelectThread: handleSelectThread,
			onRenameFolder: handleRenameFolder,
			onDeleteFolder: handleDeleteFolder,
			onDropThread: handleDropThread,
			onReorderFolder: handleReorderFolder,
			onSetParent: handleSetParent,
		}),
		[
			handleRenameThread,
			handleDeleteThread,
			handleSetStarred,
			handleSelectThread,
			handleRenameFolder,
			handleDeleteFolder,
			handleDropThread,
			handleReorderFolder,
			handleSetParent,
		],
	);

	// // When searching, render flat list
	// if (search) {
	// 	return (
	// 		<ThreadListPrimitive.Root className="aui-root aui-thread-list-root flex flex-col flex-1 min-h-0">
	// 			<Box px="3" flex="1" overflowY="auto">
	// 				<VStack gap="1" align="start" w="full">
	// 					{sortedThreads.map((thread) => (
	// 						<FlatSearchThreadItem key={thread.id} thread={thread} />
	// 					))}
	// 				</VStack>
	// 			</Box>
	// 		</ThreadListPrimitive.Root>
	// 	);
	// }

	const sortLabels = useMemo(
		() => ({
			updatedAt: "Updated",
			createdAt: "Created",
			title: "Name",
			messageCount: "Tokens",
		}),
		[],
	);

	const cycleSortField = useCallback(() => {
		const fields: TSortField[] = ["updatedAt", "createdAt", "title", "messageCount"];
		const idx = fields.indexOf(sortField);
		setSortField(fields[(idx + 1) % fields.length]!);
	}, [sortField]);

	return (
		<ThreadActionsContext.Provider value={actions}>
			<ThreadListPrimitive.Root className="aui-root aui-thread-list-root flex flex-col flex-1 min-h-0">
				{onOpenSearch && (
					<Box flexShrink={0} mb="2" px="3">
						<Box
							as="button"
							w="full"
							px="3"
							py="2"
							borderRadius="md"
							borderWidth="1px"
							borderColor="var(--wc-border-subtle)"
							bg="var(--wc-bg-card)"
							color="var(--wc-text-muted)"
							_hover={{ bg: "var(--wc-bg-hover)", color: "var(--wc-text-primary)" }}
							display="flex"
							alignItems="center"
							justifyContent="center"
							gap="2"
							fontSize="13px"
							cursor="pointer"
							onClick={onOpenSearch}
						>
							<SearchIcon size={15} />
							<Text>Search</Text>
						</Box>
					</Box>
				)}

				<HStack
					px="3"
					gap="1"
					mb="2"
					justify="space-between"
					alignItems="center"
					flexShrink={0}
				>
					<HStack gap="1">
						<Box
							as="button"
							px="2.5"
							py="1"
							borderRadius="md"
							fontSize="12px"
							color="var(--wc-text-muted)"
							bg="var(--wc-bg-subtle)"
							_hover={{ bg: "var(--wc-bg-hover)" }}
							onClick={cycleSortField}
							title="Click to change sort field"
						>
							{sortLabels[sortField]}
						</Box>
						<Box
							as="button"
							p="1"
							borderRadius="md"
							color="var(--wc-text-faint)"
							_hover={{ color: "var(--wc-text-tertiary)" }}
							onClick={() => setSortDir(sortDir === "desc" ? "asc" : "desc")}
							title={sortDir === "desc" ? "Newest first" : "Oldest first"}
						>
							{sortDir === "desc" ? (
								<SortDescIcon size={16} />
							) : (
								<SortAscIcon size={16} />
							)}
						</Box>
					</HStack>
					<HStack gap="1">
						<Box
							as="button"
							p="1"
							borderRadius="md"
							color="var(--wc-text-faint)"
							_hover={{ color: "var(--wc-text-secondary)" }}
							onClick={handleCreateFolder}
							title="New folder"
							mt="1"
						>
							<FolderPlusIcon size={16} />
						</Box>
					</HStack>
				</HStack>

				{/* Tree rendering */}
				<Box
					w="full"
					px="3"
					flex="1"
					overflowY="auto"
					overflowX="hidden"
					css={{
						"&::-webkit-scrollbar": { width: "4px" },
						"&::-webkit-scrollbar-thumb": {
							background: "var(--wc-text-disabled)",
							borderRadius: "2px",
						},
					}}
					borderTop="1px solid var(--wc-border-subtle)"
					pt="2"
					onDragOver={handleRootDragOver}
					onDragLeave={handleRootDragLeave}
					onDrop={handleRootDrop}
					bg={rootDragOver ? "var(--wc-bg-hover)" : "transparent"}
					borderRadius="md"
					transition="background 0.15s"
				>
					<VStack align="start" gap="0" w="full">
						{tree
							.filter((node) => node.type === "folder")
							.map((node) => (
								<TreeNode key={node.id} node={node} />
							))}
						<div id="root-starred" style={{ width: "100%" }} />
						{tree
							.filter((node) => node.type === "thread")
							.map((node) => (
								<TreeNode key={node.id} node={node} />
							))}
					</VStack>
				</Box>

				{confirmDelete && (
					<Portal>
						<ConfirmDialog
							message={
								confirmDelete.type === "folder"
									? "Delete this folder? Threads inside will be moved to root."
									: "Delete this thread? This cannot be undone."
							}
							onConfirm={handleConfirmDelete}
							onCancel={() => setConfirmDelete(null)}
						/>
					</Portal>
				)}
			</ThreadListPrimitive.Root>
		</ThreadActionsContext.Provider>
	);
});

function FlatSearchThreadItem({ thread }: { thread: IChatThread }) {
	const currentThreadId = useStore((s) => s.currentThreadId);
	const setCurrentThreadId = useStore((s) => s.setCurrentThreadId);
	const selected = thread.id === currentThreadId;

	const handleSelect = useCallback(() => {
		const folderId = thread.folderId;
		if (folderId) {
			fetchWorkspace(folderId).then((res) => {
				if (res.ok && res.data) useStore.getState().setWorkspace(res.data);
			});
			useStore.getState().setActiveWorkspaceId(folderId);
		}
		setCurrentThreadId(thread.id);
	}, [thread.folderId, thread.id, setCurrentThreadId]);

	const displayText = useMemo(() => {
		const total = (thread.totalPromptTokens ?? 0) + (thread.totalCompletionTokens ?? 0);
		if (total > 0) return `${(total / 1000).toFixed(1)}k`;
		if ((thread.messageCount ?? 0) > 0) return `${thread.messageCount ?? 0} msg`;
		return "empty";
	}, [thread.totalPromptTokens, thread.totalCompletionTokens, thread.messageCount]);

	return (
		<Box
			w="100%"
			className={`group ${selected ? "selected" : ""}`}
			bg={selected ? "var(--wc-bg-card)" : undefined}
			border={selected ? "1px solid var(--wc-border-strong)" : undefined}
			onClick={handleSelect}
			style={{ minHeight: "32px", cursor: "pointer" }}
			display="flex"
			alignItems="center"
			gap="1"
			borderRadius="lg"
			px="3"
			py="1"
			_hover={{ bg: "var(--wc-bg-hover)" }}
			overflow="hidden"
		>
			<Box flex="1" display="flex" flexDirection="column" overflow="hidden">
				<HStack>
					<Text
						fontSize="13px"
						color="var(--wc-text-primary)"
						overflow="hidden"
						textOverflow="ellipsis"
						whiteSpace="nowrap"
						minW={0}
					>
						{thread.title ?? "New Chat"}
					</Text>
					<Text fontSize="12px" color="var(--wc-text-faint)">
						{displayText}
					</Text>
				</HStack>
			</Box>
		</Box>
	);
}
