import React, { useEffect, useState } from 'react';
import { TopNavbar } from './top-navbar/top-navbar';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from '@/components/resizable/resizable';
import { SidePanel } from './side-panel/side-panel';
import { Canvas } from './canvas/canvas';
import { useNavigate, useParams } from 'react-router-dom';
import { useConfig } from '@/hooks/use-config';
import { useChartDB } from '@/hooks/use-chartdb';
import { useDialog } from '@/hooks/use-dialog';
import { useRedoUndoStack } from '@/hooks/use-redo-undo-stack';
import { Toaster } from '@/components/toast/toaster';
import { useFullScreenLoader } from '@/hooks/use-full-screen-spinner';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useLayout } from '@/hooks/use-layout';
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from '@/components/drawer/drawer';
import { Separator } from '@/components/separator/separator';
import { Diagram } from '@/lib/domain/diagram';

export const EditorPage: React.FC = () => {
    const { loadDiagram, currentDiagram } = useChartDB();
    const { isSidePanelShowed, hideSidePanel } = useLayout();
    const { resetRedoStack, resetUndoStack } = useRedoUndoStack();
    const { showLoader, hideLoader } = useFullScreenLoader();
    const { openCreateDiagramDialog } = useDialog();
    const { diagramId } = useParams<{ diagramId: string }>();
    const { config, updateConfig } = useConfig();
    const navigate = useNavigate();
    const { isLg } = useBreakpoint('lg');
    const { isXl } = useBreakpoint('xl');
    const { isMd: isDesktop } = useBreakpoint('md');
    const [initialDiagram, setInitialDiagram] = useState<Diagram | undefined>();

    useEffect(() => {
        if (!config) {
            return;
        }

        if (currentDiagram?.id === diagramId) {
            return;
        }

        const loadDefaultDiagram = async () => {
            if (diagramId) {
                setInitialDiagram(undefined);
                showLoader();
                resetRedoStack();
                resetUndoStack();
                const diagram = await loadDiagram(diagramId);
                if (!diagram) {
                    navigate('/');
                }
                setInitialDiagram(diagram);
                hideLoader();
            } else if (!diagramId && config.defaultDiagramId) {
                const diagram = await loadDiagram(config.defaultDiagramId);
                if (!diagram) {
                    await updateConfig({
                        defaultDiagramId: '',
                    });
                    navigate('/');
                } else {
                    navigate(`/diagrams/${config.defaultDiagramId}`);
                }
            } else {
                openCreateDiagramDialog();
            }
        };
        loadDefaultDiagram();
    }, [
        diagramId,
        openCreateDiagramDialog,
        config,
        navigate,
        loadDiagram,
        resetRedoStack,
        resetUndoStack,
        hideLoader,
        showLoader,
        currentDiagram?.id,
        updateConfig,
    ]);

    return (
        <>
            <section
                className={`bg-background ${isDesktop ? 'h-screen w-screen' : 'h-dvh w-dvw'} flex flex-col overflow-x-hidden`}
            >
                <TopNavbar />
                {isDesktop ? (
                    <ResizablePanelGroup direction="horizontal">
                        <ResizablePanel
                            defaultSize={isXl ? 25 : isLg ? 35 : 50}
                            minSize={isXl ? 25 : isLg ? 35 : 50}
                            maxSize={isSidePanelShowed ? 99 : 0}
                            // eslint-disable-next-line
                            className="transition-[flex-grow] duration-200"
                        >
                            <SidePanel />
                        </ResizablePanel>
                        <ResizableHandle />
                        <ResizablePanel
                            defaultSize={isXl ? 75 : isLg ? 65 : 50}
                        >
                            <Canvas
                                initialTables={initialDiagram?.tables ?? []}
                            />
                        </ResizablePanel>
                    </ResizablePanelGroup>
                ) : (
                    <>
                        <Drawer
                            open={isSidePanelShowed}
                            onClose={() => hideSidePanel()}
                        >
                            <DrawerContent className="h-full" fullScreen>
                                <DrawerHeader>
                                    <DrawerTitle>Manage Diagram</DrawerTitle>
                                    <DrawerDescription>
                                        Manage your diagram objects
                                    </DrawerDescription>
                                </DrawerHeader>
                                <Separator orientation="horizontal" />
                                <SidePanel data-vaul-no-drag />
                            </DrawerContent>
                        </Drawer>
                        <Canvas initialTables={initialDiagram?.tables ?? []} />
                    </>
                )}
            </section>
            <Toaster />
        </>
    );
};
