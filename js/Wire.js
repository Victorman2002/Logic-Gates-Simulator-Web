class Wire {
    constructor(id, fromNodeId, fromPort, toNodeId, toPort) {
        this.id = id;
        this.from = fromNodeId;
        this.fromPort = fromPort;
        this.to = toNodeId;
        this.toPort = toPort;
    }

    draw(svgElement, workspaceRect, zoom = 1) {
        const portFrom = document.getElementById(`port_${this.from}_out_${this.fromPort}`);
        const portTo = document.getElementById(`port_${this.to}_in_${this.toPort}`);
        if (!portFrom || !portTo) return;
        
        const rectFrom = portFrom.getBoundingClientRect();
        const rectTo = portTo.getBoundingClientRect();
        
        const x1 = (rectFrom.left - workspaceRect.left) / zoom + 6;
        const y1 = (rectFrom.top - workspaceRect.top) / zoom + 6;
        const x2 = (rectTo.left - workspaceRect.left) / zoom + 6;
        const y2 = (rectTo.top - workspaceRect.top) / zoom + 6;
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const dx = Math.max(Math.abs(x2 - x1) * 0.5, 40);
        const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
        
        path.setAttribute('d', d);
        path.setAttribute('class', 'wire');
        path.onclick = (e) => { e.stopPropagation(); app.deleteWire(this.id); };
        svgElement.appendChild(path);
    }
}

if (typeof module !== 'undefined') module.exports = { Wire };
