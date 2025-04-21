// Core components
import {
    DragDropContext,
    Droppable,
    Draggable
} from '@hello-pangea/dnd';

// Result types
import type { DropResult } from '@hello-pangea/dnd';

// Provider types
import type {
    DroppableProvided,
    DraggableProvided
} from '@hello-pangea/dnd';

// State types
import type {
    DroppableStateSnapshot,
    DraggableStateSnapshot
} from '@hello-pangea/dnd';

declare module '@hello-pangea/dnd' {
    import type { ComponentType, ReactElement } from 'react';

    export type DraggableId = string;
    export type DroppableId = string;

    export interface DragStart {
        draggableId: DraggableId;
        type: string;
        source: DraggableLocation;
    }

    export interface DragUpdate extends DragStart {
        destination?: DraggableLocation;
    }

    export interface DropResult extends DragUpdate {
        reason: 'DROP' | 'CANCEL';
    }

    export interface DraggableLocation {
        droppableId: DroppableId;
        index: number;
    }

    export interface DroppableProvided {
        innerRef: (element: HTMLElement | null) => void;
        placeholder?: ReactElement;
        droppableProps: {
            'data-rfd-droppable-id': string;
            'data-rfd-droppable-context-id': string;
        };
    }

    export interface DraggableProvided {
        innerRef: (element: HTMLElement | null) => void;
        draggableProps: {
            'data-rfd-draggable-context-id': string;
            'data-rfd-draggable-id': string;
        };
        dragHandleProps?: {
            'data-rfd-drag-handle-draggable-id': string;
            'data-rfd-drag-handle-context-id': string;
            'aria-describedby': string;
            role: string;
            tabIndex: number;
            draggable: boolean;
        };
    }

    export interface DroppableStateSnapshot {
        isDraggingOver: boolean;
        draggingOverWith?: DraggableId;
        draggingFromThisWith?: DraggableId;
    }

    export interface DraggableStateSnapshot {
        isDragging: boolean;
        isDropAnimating: boolean;
        dropAnimation?: {
            duration: number;
            curve: string;
            moveTo: {
                x: number;
                y: number;
            };
        };
        draggingOver?: DroppableId;
        combineWith?: DraggableId;
        combineTargetFor?: DraggableId;
        mode?: string;
    }

    export interface DroppableProps {
        droppableId: DroppableId;
        direction?: 'vertical' | 'horizontal';
        type?: string;
        mode?: 'standard' | 'virtual';
        isDropDisabled?: boolean;
        isCombineEnabled?: boolean;
        children: (provided: DroppableProvided, snapshot: DroppableStateSnapshot) => ReactElement;
    }

    export interface DraggableProps {
        draggableId: DraggableId;
        index: number;
        isDragDisabled?: boolean;
        disableInteractiveElementBlocking?: boolean;
        shouldRespectForcePress?: boolean;
        children: (provided: DraggableProvided, snapshot: DraggableStateSnapshot) => ReactElement;
    }

    export interface DragDropContextProps {
        onDragStart?: (initial: DragStart) => void;
        onDragUpdate?: (initial: DragUpdate) => void;
        onDragEnd: (result: DropResult) => void;
        children?: ReactElement | ReactElement[];
    }

    export const DragDropContext: ComponentType<DragDropContextProps>;
    export const Droppable: ComponentType<DroppableProps>;
    export const Draggable: ComponentType<DraggableProps>;
}