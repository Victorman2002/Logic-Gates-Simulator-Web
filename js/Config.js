const CONFIG = {
    'INPUT': { ins: 0, outs: 1, title: 'Entrada' },
    'OUTPUT': { ins: 1, outs: 0, title: 'Salida' },
    'AND': { ins: 2, outs: 1, title: 'AND' },
    'OR': { ins: 2, outs: 1, title: 'OR' },
    'XOR': { ins: 2, outs: 1, title: 'XOR' },
    'NOT': { ins: 1, outs: 1, title: 'NOT' },
    'FULL_ADDER': { ins: 3, outs: 2, title: 'Full Adder' }
};

if (typeof module !== 'undefined') module.exports = { CONFIG };
