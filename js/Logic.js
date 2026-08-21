class PuertasLogicas {
    static AND(a, b) { return (a == 1 && b == 1) ? 1 : 0; }
    static OR(a, b) { return (a == 1 || b == 1) ? 1 : 0; }
    static XOR(a, b) { return (a != b) ? 1 : 0; }
    static NOT(a) { return (a == 0) ? 1 : 0; }
    static FullAdder(a, b, carryIn) {
        let suma1 = this.XOR(a, b);
        let acarreo1 = this.AND(a, b);
        let sumaFinal = this.XOR(suma1, carryIn);
        let acarreo2 = this.AND(suma1, carryIn);
        let acarreoFinal = this.OR(acarreo1, acarreo2);
        return { suma: sumaFinal, carryOut: acarreoFinal };
    }
}

if (typeof module !== 'undefined') module.exports = { PuertasLogicas };
