class LogicNode {
    constructor(id, type, x, y, customConfig = null) {
        this.id = id;
        this.type = type;
        this.x = x;
        this.y = y;
        this.value = 0;
        this.selected = false;
        
        this.customConfig = customConfig;
        this.innerNodes = customConfig ? {} : null;
        this.innerWires = customConfig ? [] : null;
        this.groupIns = customConfig ? [] : null;
        this.groupOuts = customConfig ? [] : null;

        this.element = this.createDOMElement();
    }

    getConfig() {
        return this.customConfig || CONFIG[this.type];
    }

    createDOMElement() {
        const config = this.getConfig();
        const div = document.createElement('div');
        div.className = 'node';
        div.id = this.id;
        
        let headerHtml = `<div class="node-header" onmousedown="app.startNodeDrag(event, '${this.id}')">
            <span>${config.title}</span>
        </div>`;

        let bodyHtml = `<div class="node-body">`;
        if (this.type === 'INPUT') {
            bodyHtml += `<button class="val-btn" onclick="app.toggleNodeInput('${this.id}')">${this.value}</button>`;
        } else if (this.type === 'OUTPUT') {
            bodyHtml += `<div class="val-display off" id="display_${this.id}">0</div>`;
        } else {
            bodyHtml += `<div style="color: var(--text-muted); font-size: 0.65rem; pointer-events: none; text-transform: uppercase;">[ ${this.type} ]</div>`;
        }
        bodyHtml += `</div>`;

        let portsHtml = '';
        for (let i = 0; i < config.ins; i++) {
            const topPos = config.ins === 1 ? '50%' : `${20 + (80 / (config.ins + 1)) * (i + 1)}%`;
            portsHtml += `<div class="port in" id="port_${this.id}_in_${i}" style="top: ${topPos}; transform: translateY(-50%)" onmousedown="app.handlePortClick(event, '${this.id}', 'in', ${i})" onmouseup="app.handlePortMouseUp(event, '${this.id}', 'in', ${i})"></div>`;
        }
        for (let i = 0; i < config.outs; i++) {
            const topPos = config.outs === 1 ? '50%' : `${20 + (80 / (config.outs + 1)) * (i + 1)}%`;
            portsHtml += `<div class="port out" id="port_${this.id}_out_${i}" style="top: ${topPos}; transform: translateY(-50%)" onmousedown="app.handlePortClick(event, '${this.id}', 'out', ${i})"></div>`;
        }

        div.innerHTML = portsHtml + headerHtml + bodyHtml;
        return div;
    }

    updateDOMPosition() {
        this.element.style.left = this.x + 'px';
        this.element.style.top = this.y + 'px';
    }

    updateSelectionVisual() {
        if (this.selected) {
            this.element.classList.add('selected');
        } else {
            this.element.classList.remove('selected');
        }
    }
}

if (typeof module !== 'undefined') module.exports = { LogicNode };