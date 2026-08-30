import { Box, Flex, Input, Text, VStack } from "@chakra-ui/react";
import type { ITodoItem } from "@warpcore/shared";
import { Check, Edit2, Trash2, XCircle } from "lucide-react";
import { nanoid } from "nanoid";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { MdDragHandle } from "react-icons/md";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import { useStore } from "@/store";

import { EMPTY_TODOS } from "../constants";

export const TodoPanel = React.memo(() => {
	const threadId = useStore((s) => s.currentThreadId);
	const todos = useStore((s) => {
		if (!threadId) return EMPTY_TODOS;
		return (s.getCurrentThreadState(s)?.todos as ITodoItem[]) || EMPTY_TODOS;
	});
	const setThreadState = useStore((s) => s.setThreadState);
	const annotations = useStore((s) => s.annotations);
	const addAnnotation = useStore((s) => s.addAnnotation);
	const removeAnnotation = useStore((s) => s.removeAnnotation);

	const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
	const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
	const [editingIndex, setEditingIndex] = useState<number | null>(null);
	const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
	const [addText, setAddText] = useState("");
	const [draftText, setDraftText] = useState("");
	const editRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (editingIndex !== null) {
			setDraftText(todos[editingIndex]?.text || "");
		}
	}, [editingIndex, todos]);

	const addTodoAnnotation = useCallback(
		(updatedTodos: ITodoItem[]) => {
			// const existing = annotations.find(a => a.selectedText.startsWith('<todos>'));
			// if (existing) removeAnnotation(existing.id);
			// const formatted = updatedTodos.map((t, i) => `${i + 1}. ${t.text} ${t.status === 'done' ? '[DONE]' : '[PENDING]'}`).join('\\n');
			// addAnnotation(`<todos>\\n${formatted}\\n</todos>`, 'Updated Todos');
		},
		[annotations, addAnnotation, removeAnnotation],
	);

	const toggleDone = useCallback(
		(index: number) => {
			const updated = todos.map((t, j) =>
				j === index ? { ...t, status: t.status === "done" ? "pending" : "done" } : t,
			);
			setThreadState(threadId, { todos: updated, todoEtag: nanoid(6) });
			addTodoAnnotation(updated);
		},
		[todos, setThreadState, threadId, addTodoAnnotation],
	);

	const startEdit = useCallback((index: number) => {
		setEditingIndex(index);
		setTimeout(() => editRef.current?.focus(), 0);
	}, []);

	const saveEdit = useCallback(() => {
		if (editingIndex === null) return;
		const trimmed = draftText.trim();
		if (!trimmed) {
			setEditingIndex(null);
			return;
		}
		const updated = todos.map((t, j) => (j === editingIndex ? { ...t, text: trimmed } : t));
		setThreadState(threadId, { todos: updated, todoEtag: nanoid(6) });
		setEditingIndex(null);
		addTodoAnnotation(updated);
	}, [editingIndex, draftText, todos, setThreadState, threadId, addTodoAnnotation]);

	const cancelEdit = useCallback(() => {
		setEditingIndex(null);
	}, []);

	const deleteTodo = useCallback(
		(index: number) => {
			const updated = todos.filter((_, j) => j !== index);
			setThreadState(threadId, { todos: updated, todoEtag: nanoid(6) });
			setDeleteConfirm(null);
			addTodoAnnotation(updated);
		},
		[todos, setThreadState, threadId, addTodoAnnotation],
	);

	const addTodo = useCallback(() => {
		const trimmed = addText.trim();
		if (!trimmed) return;
		const newTodos = [...todos, { text: trimmed, status: "pending" }];
		setThreadState(threadId, { todos: newTodos, todoEtag: nanoid(6) });
		setAddText("");
		addTodoAnnotation(newTodos);
	}, [addText, todos, setThreadState, threadId, addTodoAnnotation]);

	const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
		setDraggingIndex(index);
		e.dataTransfer.setData("index", String(index));
		e.dataTransfer.effectAllowed = "move";
	}, []);

	const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
		setDragOverIndex(index);
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			const fromIndex = parseInt(e.dataTransfer.getData("index"), 10);
			if (draggingIndex === null || isNaN(fromIndex)) {
				setDraggingIndex(null);
				setDragOverIndex(null);
				return;
			}
			const toIndex = dragOverIndex !== null ? dragOverIndex : todos.length;
			const updated = [...todos];
			const [item] = updated.splice(fromIndex, 1);
			updated.splice(toIndex, 0, item);
			setThreadState(threadId, { todos: updated, todoEtag: nanoid(6) });
			setDraggingIndex(null);
			setDragOverIndex(null);
			addTodoAnnotation(updated);
		},
		[draggingIndex, dragOverIndex, todos, setThreadState, threadId, addTodoAnnotation],
	);

	const handleDragEnd = useCallback(() => {
		setDraggingIndex(null);
		setDragOverIndex(null);
	}, []);

	if (!todos.length) {
		return (
			<Box p="3">
				<Text fontSize="xs" color="var(--wc-text-muted)" textAlign="center" mb="2">
					No todos yet
				</Text>
				<Input
					size="xs"
					fontSize="xs"
					value={addText}
					onChange={(e) => setAddText(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") addTodo();
					}}
					placeholder="Add todo..."
				/>
			</Box>
		);
	}

	return (
		<VStack gap="3" p="2" align="stretch">
			{todos.map((todo, i) => (
				<Box
					key={i}
					borderWidth="2px"
					borderColor={
						dragOverIndex === i ? "var(--wc-accent-blue-border)" : "transparent"
					}
					// borderRadius="md"
					// p="2"
					// py="1"
					// bg="var(--wc-bg-subtle)"
					opacity={draggingIndex === i ? 0.6 : 1}
					draggable
					onDragStart={(e) => handleDragStart(e, i)}
					onDragOver={(e) => handleDragOver(e, i)}
					onDragLeave={() => setDragOverIndex(null)}
					onDrop={handleDrop}
					onDragEnd={handleDragEnd}
				>
					<Flex gap="1.5" align="center">
						<Box
							cursor="pointer"
							flexShrink={0}
							display="flex"
							alignItems="center"
							justifyContent="center"
							w="14px"
							h="14px"
							borderWidth="1px"
							borderColor={
								todo.status === "done"
									? "var(--wc-accent-green)"
									: "var(--wc-border-default)"
							}
							borderRadius="sm"
							bg="transparent"
							mr="1"
							onClick={() => toggleDone(i)}
						>
							{todo.status === "done" && (
								<Check size={12} strokeWidth={3} color="var(--wc-accent-green)" />
							)}
						</Box>

						<Text
							fontSize="xs"
							fontWeight="600"
							color="var(--wc-text-faint)"
							flexShrink={0}
						>
							{i}.
						</Text>

						{editingIndex === i ? (
							<Flex gap="1" flex="1" minW="0" align="center">
								<Input
									ref={editRef}
									size="xs"
									fontSize="xs"
									flex="1"
									minW="0"
									value={draftText}
									onChange={(e) => setDraftText(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter") saveEdit();
										if (e.key === "Escape") cancelEdit();
									}}
									onBlur={saveEdit}
								/>
								<Box cursor="pointer" onClick={saveEdit}>
									<Check size={12} color="var(--wc-text-muted)" />
								</Box>
								<Box cursor="pointer" onClick={cancelEdit}>
									<XCircle size={12} color="var(--wc-text-muted)" />
								</Box>
							</Flex>
						) : (
							<>
								<Text
									fontSize="xs"
									color={
										todo.status === "done"
											? "var(--wc-text-muted)"
											: "var(--wc-text-primary)"
									}
									textDecoration={
										todo.status === "done" ? "line-through" : "none"
									}
									flex="1"
									minW="0"
									overflow="hidden"
									textOverflow="ellipsis"
									whiteSpace="nowrap"
								>
									{todo.text}
								</Text>
								<Box
									cursor="grab"
									_hover={{ color: "var(--wc-text-primary)" }}
									flexShrink={0}
									display="flex"
									alignItems="center"
									px="0.5"
								>
									<MdDragHandle size={15} color="var(--wc-text-muted)" />
								</Box>
								<Box
									w="1px"
									h="12px"
									bg="var(--wc-border-subtle)"
									flexShrink={0}
									mx="1"
								/>
								<Box
									cursor="pointer"
									_hover={{ color: "var(--wc-text-primary)" }}
									onClick={() => startEdit(i)}
								>
									<Edit2 size={12} color="var(--wc-text-muted)" />
								</Box>
								<Box
									cursor="pointer"
									_hover={{ color: "var(--wc-accent-red)" }}
									onClick={() => setDeleteConfirm(i)}
									ml="2"
								>
									<Trash2 size={12} color="var(--wc-accent-red)" />
								</Box>
							</>
						)}
					</Flex>
				</Box>
			))}

			<Input
				size="xs"
				fontSize="xs"
				value={addText}
				onChange={(e) => setAddText(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter") addTodo();
				}}
				placeholder="Add todo..."
			/>

			{deleteConfirm !== null && (
				<ConfirmDialog
					title="Delete Todo"
					message={`Are you sure you want to delete "${todos[deleteConfirm]?.text}"?`}
					isOpen={true}
					onConfirm={() => deleteTodo(deleteConfirm)}
					onCancel={() => setDeleteConfirm(null)}
					confirmLabel="Delete"
				/>
			)}
		</VStack>
	);
});
