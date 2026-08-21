class SimulatorApp {
    constructor() {
        this.nodes = {};
        this.wires = [];
        this.nextNodeId = 1;
        this.nextWireId = 1;

        this.dom = {
            workspace: document.getElementById('workspace'),
            container: document.getElementById('workspace-container'),
            svg: document.getElementById('wires-layer'),
            selectionBox: document.getElementById('selection-box'),
            contextMenu: document.getElementById('context-menu')
        };

        this.camera = { x: -4500, y: -4500, zoom: 1 };
        this.state = {
            isPanning: false,
            isSelecting: false,
            selectionStart: { x: 0, y: 0 },
            isDraggingNode: false,
            draggedNodes: [], 
            wiring: { active: false, fromNode: null, fromPort: null, tempX: 0, tempY: 0 }
        };

        this.initEvents();
        this.updateCamera();
    }

    updateCamera() {
        this.dom.workspace.style.transform = `translate(${this.camera.x}px, ${this.camera.y}px) scale(${this.camera.zoom})`;
    }

    getWorkspacePos(clientX, clientY) {
        const rect = this.dom.container.getBoundingClientRect();
        return {
            x: (clientX - rect.left - this.camera.x) / this.camera.zoom,
            y: (clientY - rect.top - this.camera.y) / this.camera.zoom
        };
    }

    initEvents() {
        this.dom.container.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.dom.container.addEventListener('wheel', (e) => this.onWheel(e));
        this.dom.container.addEventListener('contextmenu', (e) => this.onContextMenu(e));
    }

    onMouseDown(e) {
        if (e.button === 2) {
            this.state.isPanning = true;
            this.dom.container.style.cursor = 'grabbing';
        } else if (e.button === 0) {
            this.dom.contextMenu.style.display = 'none';
            if (e.target === this.dom.container || e.target.id === 'wires-layer' || e.target === this.dom.workspace) {
                const rect = this.dom.container.getBoundingClientRect();
                this.state.isSelecting = true;
                this.state.selectionStart = { x: e.clientX - rect.left, y: e.clientY - rect.top };
                
                this.dom.selectionBox.style.left = this.state.selectionStart.x + 'px';
                this.dom.selectionBox.style.top = this.state.selectionStart.y + 'px';
                this.dom.selectionBox.style.width = '0px';
                this.dom.selectionBox.style.height = '0px';
                this.dom.selectionBox.style.display = 'block';
                
                if(!e.shiftKey) {
                    Object.values(this.nodes).forEach(n => n.selected = false);
                    this.updateSelectionVisuals();
                }
            }
        }
    }

    onMouseMove(e) {
        if (this.state.isPanning) {
            this.camera.x += e.movementX;
            this.camera.y += e.movementY;
            this.updateCamera();
        } else if (this.state.isSelecting) {
            const rect = this.dom.container.getBoundingClientRect();
            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top;

            const x = Math.min(currentX, this.state.selectionStart.x);
            const y = Math.min(currentY, this.state.selectionStart.y);
            const w = Math.abs(currentX - this.state.selectionStart.x);
            const h = Math.abs(currentY - this.state.selectionStart.y);
            
            this.dom.selectionBox.style.left = x + 'px';
            this.dom.selectionBox.style.top = y + 'px';
            this.dom.selectionBox.style.width = w + 'px';
            this.dom.selectionBox.style.height = h + 'px';

            const selRect = this.dom.selectionBox.getBoundingClientRect();
            Object.values(this.nodes).forEach(node => {
                const el = document.getElementById(node.id);
                if(el) {
                    const nodeRect = el.getBoundingClientRect();
                    node.selected = !(nodeRect.right < selRect.left || nodeRect.left > selRect.right || nodeRect.bottom < selRect.top || nodeRect.top > selRect.bottom);
                }
            });
            this.updateSelectionVisuals();
        } else if (this.state.isDraggingNode) {
            const wsPos = this.getWorkspacePos(e.clientX, e.clientY);
            this.state.draggedNodes.forEach(dn => {
                const node = this.nodes[dn.id];
                node.x = wsPos.x - dn.offsetX;
                node.y = wsPos.y - dn.offsetY;
                node.updateDOMPosition();
            });
            this.drawWires();
        } else if (this.state.wiring.active) {
            this.state.wiring.tempX = e.clientX;
            this.state.wiring.tempY = e.clientY;
            this.drawWires();
        }
    }

    onMouseUp(e) {
        if (this.state.isPanning) {
            this.state.isPanning = false;
            this.dom.container.style.cursor = 'crosshair';
        }
        if (this.state.isSelecting) {
            this.state.isSelecting = false;
            this.dom.selectionBox.style.display = 'none';
        }
        if (this.state.isDraggingNode) {
            this.state.isDraggingNode = false;
            this.state.draggedNodes.forEach(dn => {
                document.getElementById(dn.id).style.zIndex = 2;
            });
            this.state.draggedNodes = [];
        }
        if (this.state.wiring.active) {
            if (!e.target.classList.contains('in')) {
                this.cancelWiring();
            }
        }
    }

    onWheel(e) {
        e.preventDefault();
        const rect = this.dom.container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const targetX = (mouseX - this.camera.x) / this.camera.zoom;
        const targetY = (mouseY - this.camera.y) / this.camera.zoom;

        const zoomFactor = 0.1;
        this.camera.zoom += e.deltaY < 0 ? zoomFactor : -zoomFactor;
        this.camera.zoom = Math.min(Math.max(0.2, this.camera.zoom), 2);

        this.camera.x = mouseX - (targetX * this.camera.zoom);
        this.camera.y = mouseY - (targetY * this.camera.zoom);

        this.updateCamera();
        this.drawWires();
    }

    onContextMenu(e) {
        e.preventDefault();
        if(this.state.isPanning) return;
        const hasSelection = Object.values(this.nodes).some(n => n.selected);
        if(hasSelection) {
            this.dom.contextMenu.style.left = e.clientX + 'px';
            this.dom.contextMenu.style.top = e.clientY + 'px';
            this.dom.contextMenu.style.display = 'block';
        }
    }

    addNode(type) {
        const id = 'node_' + this.nextNodeId++;
        const rect = this.dom.container.getBoundingClientRect();
        const x = (-this.camera.x + (rect.width/2) - 60 + (Math.random()*40-20)) / this.camera.zoom;
        const y = (-this.camera.y + (rect.height/2) - 40 + (Math.random()*40-20)) / this.camera.zoom;
        
        const node = new LogicNode(id, type, x, y);
        this.nodes[id] = node;
        this.dom.workspace.appendChild(node.element);
        node.updateDOMPosition();
        
        if (window.innerWidth <= 768) {
            document.getElementById('sidebar').classList.remove('open');
        }
    }

    startNodeDrag(e, id) {
        if (e.button !== 0) return;
        if (!this.nodes[id].selected) {
            Object.values(this.nodes).forEach(n => n.selected = false);
            this.nodes[id].selected = true;
            this.updateSelectionVisuals();
        }

        this.state.isDraggingNode = true;
        const wsPos = this.getWorkspacePos(e.clientX, e.clientY);
        this.state.draggedNodes = [];
        
        Object.values(this.nodes).forEach(node => {
            if(node.selected) {
                this.state.draggedNodes.push({
                    id: node.id,
                    offsetX: wsPos.x - node.x,
                    offsetY: wsPos.y - node.y
                });
                document.getElementById(node.id).style.zIndex = 10;
            }
        });
    }

    toggleNodeInput(id) {
        const node = this.nodes[id];
        node.value = node.value === 0 ? 1 : 0;
        document.getElementById(id).querySelector('.val-btn').innerText = node.value;
        this.simulate();
    }

    updateSelectionVisuals() {
        Object.values(this.nodes).forEach(node => node.updateSelectionVisual());
    }

    handlePortClick(e, nodeId, portType, portIndex) {
        e.stopPropagation();
        if (portType === 'out') {
            this.state.wiring = { active: true, fromNode: nodeId, fromPort: portIndex, tempX: e.clientX, tempY: e.clientY };
            this.drawWires();
        } else if (portType === 'in' && this.state.wiring.active) {
            this.completeWiring(nodeId, portIndex);
        }
    }

    handlePortMouseUp(e, nodeId, portType, portIndex) {
        e.stopPropagation();
        if (portType === 'in' && this.state.wiring.active) {
            this.completeWiring(nodeId, portIndex);
        }
    }

    completeWiring(toNodeId, toPortIndex) {
        if (this.state.wiring.fromNode === toNodeId) { this.cancelWiring(); return; }
        
        const existingIdx = this.wires.findIndex(w => w.to === toNodeId && w.toPort === toPortIndex);
        if (existingIdx !== -1) this.wires.splice(existingIdx, 1);
        
        const wire = new Wire('wire_' + this.nextWireId++, this.state.wiring.fromNode, this.state.wiring.fromPort, toNodeId, toPortIndex);
        this.wires.push(wire);
        this.cancelWiring();
    }

    cancelWiring() {
        this.state.wiring = { active: false, fromNode: null, fromPort: null };
        this.drawWires();
        this.simulate();
    }

    drawWires() {
        this.dom.svg.innerHTML = ''; 
        const wsRect = this.dom.workspace.getBoundingClientRect();
        
        this.wires.forEach(wire => wire.draw(this.dom.svg, wsRect, this.camera.zoom));

        if (this.state.wiring.active) {
            const portFrom = document.getElementById(`port_${this.state.wiring.fromNode}_out_${this.state.wiring.fromPort}`);
            if (portFrom) {
                const rectFrom = portFrom.getBoundingClientRect();
                const x1 = (rectFrom.left - wsRect.left) / this.camera.zoom + 6;
                const y1 = (rectFrom.top - wsRect.top) / this.camera.zoom + 6;
                
                const x2 = (this.state.wiring.tempX - wsRect.left) / this.camera.zoom;
                const y2 = (this.state.wiring.tempY - wsRect.top) / this.camera.zoom;
                
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                const dx = Math.max(Math.abs(x2 - x1) * 0.5, 40);
                const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
                
                path.setAttribute('d', d);
                path.setAttribute('class', 'wire');
                path.setAttribute('style', 'stroke-dasharray: 5,5; opacity: 0.6; pointer-events: none;'); 
                this.dom.svg.appendChild(path);
            }
        }
    }

    deleteWire(wireId) {
        this.wires = this.wires.filter(w => w.id !== wireId);
        this.drawWires();
        this.simulate();
    }

    // --- NUEVAS FUNCIONALIDADES ---
    
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const toggleBtn = document.getElementById('sidebar-toggle');
        
        if (window.innerWidth <= 768) {
            sidebar.classList.toggle('open');
        } else {
            sidebar.classList.toggle('collapsed');
            if (sidebar.classList.contains('collapsed')) {
                toggleBtn.style.display = 'block';
            } else {
                toggleBtn.style.display = 'none';
            }
        }
        setTimeout(() => this.drawWires(), 300); // Redibujar tras la animación CSS
    }

    duplicateSelection() {
        this.dom.contextMenu.style.display = 'none';
        const selectedNodes = Object.values(this.nodes).filter(n => n.selected);
        if (selectedNodes.length === 0) return;

        const idMapping = {}; // Mapa para clonar cables internos

        selectedNodes.forEach(node => {
            const newId = 'node_' + this.nextNodeId++;
            idMapping[node.id] = newId;

            // Deep clone para las cajas negras (grupos)
            const clonedConfig = node.customConfig ? JSON.parse(JSON.stringify(node.customConfig)) : null;
            const newNode = new LogicNode(newId, node.type, node.x + 30, node.y + 30, clonedConfig);
            
            newNode.value = node.value;
            if(node.innerNodes) newNode.innerNodes = JSON.parse(JSON.stringify(node.innerNodes));
            if(node.innerWires) newNode.innerWires = JSON.parse(JSON.stringify(node.innerWires));
            if(node.groupIns) newNode.groupIns = JSON.parse(JSON.stringify(node.groupIns));
            if(node.groupOuts) newNode.groupOuts = JSON.parse(JSON.stringify(node.groupOuts));

            this.nodes[newId] = newNode;
            this.dom.workspace.appendChild(newNode.element);
            newNode.updateDOMPosition();

            node.selected = false;
            newNode.selected = true;
        });

        // Clonar cables si conectaban nodos que acaban de ser duplicados juntos
        const selectedOldIds = Object.keys(idMapping);
        const internalWires = this.wires.filter(w => selectedOldIds.includes(w.from) && selectedOldIds.includes(w.to));

        internalWires.forEach(w => {
            const newWireId = 'wire_' + this.nextWireId++;
            const newWire = new Wire(newWireId, idMapping[w.from], w.fromPort, idMapping[w.to], w.toPort);
            this.wires.push(newWire);
        });

        this.updateSelectionVisuals();
        this.drawWires();
        this.simulate();
    }

    saveProject() {
        const data = {
            nodes: Object.values(this.nodes).map(n => ({
                id: n.id, type: n.type, x: n.x, y: n.y, value: n.value,
                customConfig: n.customConfig, innerNodes: n.innerNodes,
                innerWires: n.innerWires, groupIns: n.groupIns, groupOuts: n.groupOuts
            })),
            wires: this.wires.map(w => ({
                id: w.id, from: w.from, fromPort: w.fromPort, to: w.to, toPort: w.toPort
            }))
        };

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'proyecto_logico.json'; // Formato estándar de guardado
        a.click();
        URL.revokeObjectURL(url);
    }

    loadProject(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.clearWorkspace();
                
                let maxNodeId = 0;
                let maxWireId = 0;

                data.nodes.forEach(nd => {
                    const node = new LogicNode(nd.id, nd.type, nd.x, nd.y, nd.customConfig);
                    node.value = nd.value || 0;
                    node.innerNodes = nd.innerNodes;
                    node.innerWires = nd.innerWires;
                    node.groupIns = nd.groupIns;
                    node.groupOuts = nd.groupOuts;
                    
                    this.nodes[node.id] = node;
                    this.dom.workspace.appendChild(node.element);
                    node.updateDOMPosition();

                    const numId = parseInt(nd.id.split('_')[1]);
                    if(numId > maxNodeId) maxNodeId = numId;
                });

                data.wires.forEach(wd => {
                    const wire = new Wire(wd.id, wd.from, wd.fromPort, wd.to, wd.toPort);
                    this.wires.push(wire);
                    
                    const numId = parseInt(wd.id.split('_')[1]);
                    if(numId > maxWireId) maxWireId = numId;
                });

                // Actualizar los contadores para que los siguientes nodos no pisen los IDs cargados
                this.nextNodeId = maxNodeId + 1;
                this.nextWireId = maxWireId + 1;
                
                this.drawWires();
                this.simulate();
            } catch (err) {
                alert("Error al cargar el archivo. Asegúrate de que es un proyecto válido (.json).");
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Resetear el input para poder cargar el mismo archivo dos veces seguidas si se quiere
    }

    // --- RESTO DE FUNCIONES (Agrupar, Eliminar, etc) ---

    groupSelection() {
        this.dom.contextMenu.style.display = 'none';
        const selected = Object.values(this.nodes).filter(n => n.selected);
        if (selected.length < 1) return;
        
        const name = prompt("Nombre del Grupo:", "Circuito Integrado");
        if (!name) return;

        let groupIns = [];
        let groupOuts = [];

        selected.forEach(node => {
            const config = node.getConfig();
            for(let i=0; i<config.ins; i++) {
                const connected = this.wires.filter(w => w.to === node.id && w.toPort === i);
                if (connected.length === 0 || connected.some(w => !this.nodes[w.from].selected)) {
                    groupIns.push({ id: node.id, port: i });
                }
            }
            for(let i=0; i<config.outs; i++) {
                const connected = this.wires.filter(w => w.from === node.id && w.fromPort === i);
                if (connected.length === 0 || connected.some(w => !this.nodes[w.to].selected)) {
                    groupOuts.push({ id: node.id, port: i });
                }
            }
        });

        const groupId = 'node_' + this.nextNodeId++;
        const customConfig = { ins: groupIns.length, outs: groupOuts.length, title: name };

        const innerNodes = {};
        selected.forEach(n => { innerNodes[n.id] = {...n}; });
        
        const innerWires = [];
        this.wires = this.wires.filter(w => {
            if (innerNodes[w.from] && innerNodes[w.to]) {
                innerWires.push({...w});
                return false; 
            }
            return true;
        });

        const groupNode = new LogicNode(groupId, 'GROUP', selected[0].x, selected[0].y, customConfig);
        groupNode.innerNodes = innerNodes;
        groupNode.innerWires = innerWires;
        groupNode.groupIns = groupIns;
        groupNode.groupOuts = groupOuts;
        groupNode.selected = true;

        selected.forEach(n => {
            document.getElementById(n.id).remove();
            delete this.nodes[n.id];
        });

        this.wires.forEach(w => {
            if (innerNodes[w.from]) {
                w.from = groupId; 
                w.fromPort = groupOuts.findIndex(go => go.id === w.from && go.port === w.fromPort);
            }
            if (innerNodes[w.to]) {
                w.to = groupId; 
                w.toPort = groupIns.findIndex(gi => gi.id === w.to && gi.port === w.toPort);
            }
        });

        this.nodes[groupId] = groupNode;
        this.dom.workspace.appendChild(groupNode.element);
        groupNode.updateDOMPosition();
        
        Object.values(this.nodes).forEach(n => n.selected = (n.id === groupId));
        this.updateSelectionVisuals();
        this.drawWires();
        this.simulate();
    }

    deleteSelection() {
        this.dom.contextMenu.style.display = 'none';
        const selected = Object.values(this.nodes).filter(n => n.selected);
        selected.forEach(n => {
            this.wires = this.wires.filter(w => w.from !== n.id && w.to !== n.id);
            document.getElementById(n.id).remove();
            delete this.nodes[n.id];
        });
        this.drawWires();
        this.simulate();
    }

    clearWorkspace() {
        Object.keys(this.nodes).forEach(id => document.getElementById(id).remove());
        this.nodes = {}; this.wires = []; this.drawWires();
    }

    simulate() {
        const engine = new SimulationEngine(this.nodes, this.wires);
        engine.run();
    }
}

const app = new SimulatorApp();
window.app = app;
