/**
 * @jest-environment jsdom
 */

const { CONFIG } = require('../js/Config.js');
const { PuertasLogicas } = require('../js/Logic.js');
const { LogicNode } = require('../js/LogicNode.js');
const { Wire } = require('../js/Wire.js');
const { SimulationEngine } = require('../js/SimulationEngine.js');

describe('1. Pruebas de Lógica Booleana (Logic.js)', () => {
    test('Puerta AND funciona correctamente', () => {
        expect(PuertasLogicas.AND(0, 0)).toBe(0);
        expect(PuertasLogicas.AND(0, 1)).toBe(0);
        expect(PuertasLogicas.AND(1, 0)).toBe(0);
        expect(PuertasLogicas.AND(1, 1)).toBe(1);
    });

    test('Puerta OR funciona correctamente', () => {
        expect(PuertasLogicas.OR(0, 0)).toBe(0);
        expect(PuertasLogicas.OR(0, 1)).toBe(1);
        expect(PuertasLogicas.OR(1, 0)).toBe(1);
        expect(PuertasLogicas.OR(1, 1)).toBe(1);
    });

    test('Puerta XOR funciona correctamente', () => {
        expect(PuertasLogicas.XOR(0, 0)).toBe(0);
        expect(PuertasLogicas.XOR(0, 1)).toBe(1);
        expect(PuertasLogicas.XOR(1, 0)).toBe(1);
        expect(PuertasLogicas.XOR(1, 1)).toBe(0);
    });

    test('Puerta NOT funciona correctamente', () => {
        expect(PuertasLogicas.NOT(0)).toBe(1);
        expect(PuertasLogicas.NOT(1)).toBe(0);
    });

    test('Sumador Completo (Full Adder) calcula suma y acarreo', () => {
        expect(PuertasLogicas.FullAdder(0, 0, 0)).toEqual({ suma: 0, carryOut: 0 });
        expect(PuertasLogicas.FullAdder(1, 1, 0)).toEqual({ suma: 0, carryOut: 1 });
        expect(PuertasLogicas.FullAdder(1, 1, 1)).toEqual({ suma: 1, carryOut: 1 });
    });
});

describe('2. Pruebas de Creación de Nodos (LogicNode.js)', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="workspace"></div>';
    });

    test('Crear un nodo de tipo AND genera la estructura DOM esperada', () => {
        const node = new LogicNode('node_1', 'AND', 100, 200);

        expect(node.id).toBe('node_1');
        expect(node.type).toBe('AND');
        expect(node.x).toBe(100);
        expect(node.y).toBe(200);
        expect(node.element).toBeDefined();
        expect(node.getConfig().title).toBe('AND');
    });

    test('Actualizar la posición en DOM modifica el estilo CSS inline', () => {
        const node = new LogicNode('node_2', 'OR', 50, 75);
        node.updateDOMPosition();

        expect(node.element.style.left).toBe('50px');
        expect(node.element.style.top).toBe('75px');
    });
});

describe('3. Pruebas del Motor de Simulación (SimulationEngine.js)', () => {
    test('Simula un circuito simple de Entrada -> AND -> Salida', () => {
        document.body.innerHTML = `
            <div id="workspace"><svg id="wires-layer"></svg></div>
            <div id="display_node_output"></div>
        `;

        const nodes = {
            'node_in1': new LogicNode('node_in1', 'INPUT', 0, 0),
            'node_in2': new LogicNode('node_in2', 'INPUT', 0, 100),
            'node_and': new LogicNode('node_and', 'AND', 200, 50),
            'node_out': new LogicNode('node_out', 'OUTPUT', 400, 50)
        };

        nodes['node_in1'].value = 1;
        nodes['node_in2'].value = 1;

        const wires = [
            new Wire('w1', 'node_in1', 0, 'node_and', 0),
            new Wire('w2', 'node_in2', 0, 'node_and', 1),
            new Wire('w3', 'node_and', 0, 'node_out', 0)
        ];

        const engine = new SimulationEngine(nodes, wires);
        expect(() => engine.run()).not.toThrow();
    });
});