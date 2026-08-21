class SimulationEngine {
    constructor(nodesMap, wiresList) {
        this.nodes = nodesMap;
        this.wires = wiresList;
    }

    flattenGraph() {
        let flatNodes = {};
        let flatWires = [];

        const expand = (node, currentWires) => {
            if (node.type !== 'GROUP') {
                flatNodes[node.id] = node;
                return;
            }
            Object.values(node.innerNodes).forEach(n => expand(JSON.parse(JSON.stringify(n)), node.innerWires));
            flatWires.push(...node.innerWires);

            currentWires.forEach(w => {
                if (w.from === node.id) {
                    const realOut = node.groupOuts[w.fromPort];
                    if(realOut) { w.from = realOut.id; w.fromPort = realOut.port; }
                }
                if (w.to === node.id) {
                    const realIn = node.groupIns[w.toPort];
                    if(realIn) { w.to = realIn.id; w.toPort = realIn.port; }
                }
            });
        };

        let tempWires = JSON.parse(JSON.stringify(this.wires));
        Object.values(this.nodes).forEach(n => expand(JSON.parse(JSON.stringify(n)), tempWires));
        flatWires.push(...tempWires);
        return { fNodes: flatNodes, fWires: flatWires.filter(w => flatNodes[w.from] && flatNodes[w.to]) };
    }

    run() {
        const { fNodes, fWires } = this.flattenGraph();
        let evaluated = {};
        
        const evalNode = (id) => {
            if (evaluated[id] !== undefined) return evaluated[id];
            const node = fNodes[id];
            if (!node) return 0;
            
            if (node.type === 'INPUT') { evaluated[id] = node.value; return node.value; }

            const config = CONFIG[node.type] || node.customConfig;
            let inputs = [];
            for (let i = 0; i < config.ins; i++) {
                const wire = fWires.find(w => w.to === id && w.toPort === i);
                if (wire) {
                    try {
                        let sourceOutputs = evalNode(wire.from);
                        inputs.push(Array.isArray(sourceOutputs) ? sourceOutputs[wire.fromPort] : sourceOutputs);
                    } catch(e) { inputs.push(0); }
                } else { inputs.push(0); }
            }

            let result = 0;
            switch (node.type) {
                case 'AND': result = PuertasLogicas.AND(inputs[0], inputs[1]); break;
                case 'OR':  result = PuertasLogicas.OR(inputs[0], inputs[1]); break;
                case 'XOR': result = PuertasLogicas.XOR(inputs[0], inputs[1]); break;
                case 'NOT': result = PuertasLogicas.NOT(inputs[0]); break;
                case 'FULL_ADDER': 
                    let fa = PuertasLogicas.FullAdder(inputs[0], inputs[1], inputs[2]);
                    result = [fa.suma, fa.carryOut]; break;
                case 'OUTPUT': result = inputs[0]; break;
            }

            evaluated[id] = Array.isArray(result) ? result.map(v => v ? 1 : 0) : (result ? 1 : 0);
            return evaluated[id];
        };

        Object.keys(fNodes).forEach(id => {
            if (fNodes[id].type === 'OUTPUT') {
                const val = evalNode(id);
                const display = document.getElementById(`display_${id}`); 
                if(display) {
                    display.innerText = val;
                    display.className = val === 1 ? 'val-display on' : 'val-display off';
                }
            }
        });
    }
}

if (typeof module !== 'undefined') module.exports = { SimulationEngine };