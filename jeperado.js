class Jeperado extends Agent {
    constructor() {
        super();
        this.boardOps = new Board();
    }

    compute(board, time) {
        const start = performance.now();
        
        let moves = this.boardOps.valid_moves(board);
        if (moves.length === 0) return [0, 0, 0];

        // tiempo por turno segun cuantos movimientos quedan
        let turnosEstimados = Math.max(1, moves.length / 2);
        const limit = Math.max(10, Math.min(time / turnosEstimados, 150));
        
        let myColor = (this.color === 'R') ? -1 : -2;
        let currentClosed = this.countClosed(board);

        // movimientos que no cierran cajas
        let safeMoves = [];
        for (let mov of moves) {
            let simB = this.boardOps.clone(board);
            this.boardOps.move(simB, mov[0], mov[1], mov[2], myColor);
            if (this.countClosed(simB) === currentClosed) {
                safeMoves.push(mov);
            }
        }

        if (safeMoves.length > 0) {
            return safeMoves[Math.floor(Math.random() * safeMoves.length)];
        }

        // si no hay seguros sacrificamos lo minimo con alfa beta
        let aExplorar = moves;
        if (aExplorar.length > 30) {
            aExplorar = aExplorar.sort(() => 0.5 - Math.random()).slice(0, 30);
        }

        let bestMove = aExplorar[0];
        let prof = 1;

        try {
            while (true) {
                if (performance.now() - start >= limit) break;
                let res = this.alfaBeta(board, prof, -Infinity, Infinity, true, start, limit, myColor);
                if (res.movimiento) bestMove = res.movimiento;
                prof++;
                if (Math.abs(res.puntaje) === Infinity || prof > 4) break;
            }
        } catch (e) {
            // se acabo el tiempo
        }

        return bestMove;
    }

    // cuantas cajas hay cerradas
    countClosed(board) {
        let count = 0;
        for (let i = 0; i < board.length; i++) {
            for (let j = 0; j < board.length; j++) {
                if (board[i][j] < 0) count++;
            }
        }
        return count;
    }

    alfaBeta(board, prof, alfa, beta, max, start, limit, myColor) {
        if (performance.now() - start >= limit) throw new Error("Timeout");
        let moves = this.boardOps.valid_moves(board);
        
        if (prof === 0 || moves.length === 0) {
            return { movimiento: null, puntaje: this.evaluate(board, myColor) };
        }

        let best = null;
        let evalNode = max ? -Infinity : Infinity;
        let oColor = myColor === -1 ? -2 : -1;

        for (let mov of moves) {
            let simB = this.boardOps.clone(board);
            this.boardOps.move(simB, mov[0], mov[1], mov[2], max ? myColor : oColor);
            let res = this.alfaBeta(simB, prof - 1, alfa, beta, !max, start, limit, myColor);
            let evalHijo = res.puntaje;

            if (max) {
                if (evalHijo > evalNode) { evalNode = evalHijo; best = mov; }
                alfa = Math.max(alfa, evalNode);
            } else {
                if (evalHijo < evalNode) { evalNode = evalHijo; best = mov; }
                beta = Math.min(beta, evalNode);
            }
            if (beta <= alfa) break;
        }
        return { movimiento: best, puntaje: evalNode };
    }

    // evaluar quien va ganando
    evaluate(board, myColor) {
        let myPoints = 0;
        let oPoints = 0;
        let oColor = myColor === -1 ? -2 : -1;
        for (let i = 0; i < board.length; i++) {
            for (let j = 0; j < board.length; j++) {
                if (board[i][j] === myColor) myPoints++;
                else if (board[i][j] === oColor) oPoints++;
            }
        }
        return myPoints - oPoints;
    }
}

if (typeof module !== 'undefined' && module.exports) module.exports = Jeperado;
