class AgentAB2 extends Agent {
  constructor() {
    super();
    this.board_logic = new Board();
  }

  init(color, board, time=20000) {
    super.init(color, board, time);
    this.size = board.length; 
  }

  getNeighbor(r, c, s) {
    if (s === 0 && r > 0) return [r - 1, c];
    if (s === 1 && c < this.size - 1) return [r, c + 1];
    if (s === 2 && r < this.size - 1) return [r + 1, c];
    if (s === 3 && c > 0) return [r, c - 1];
    return null;
  }

  countSides(board, r, c) {
    const val = board[r][c];
    if (val < 0) return 4;
    return [0,1,2,3].reduce((acc, side) => acc + ((val & (1 << side )) ? 1 : 0), 0);
  }

  isCapturing(board, [r, c, s]) {
    // Revisa si cierra el cuadro actual
    if (this.countSides(board, r, c) === 3) return true;
    // Revisa si cierra el cuadro vecino (pared compartida)
    const n = this.getNeighbor(r, c, s);
    if (n && this.countSides(board, n[0], n[1]) === 3) return true;
    return false; 
  }

  isGivingAway(board, [r, c, s]) {
    // Revisa si regala el cuadro actual o el vecino dejándolos con 3 lados
    if (this.countSides(board, r, c) === 2) return true;
    const n = this.getNeighbor(r, c, s);
    if (n && this.countSides(board, n[0], n[1]) === 2) return true;
    return false; 
  }

  distToCenter(r, c, size) {
    const mid = (size - 1) / 2;
    return Math.sqrt(Math.pow(r - mid, 2) + Math.pow(c - mid, 2));
  }

  // En el paper se muestra que una parte que reduce mucho más el problema es ordenar los movimientos posibles
  orderMoves(board, moves, size) {
    return [...moves].sort((a, b) => {
      const aCap = this.isCapturing(board, a);
      const bCap = this.isCapturing(board, b);
      if (aCap !== bCap) return bCap ? 1 : -1;

      const aGive = this.isGivingAway(board, a);
      const bGive = this.isGivingAway(board, b);
      if (aGive !== bGive) return aGive ? 1 : -1;

      return this.distToCenter(a[0], a[1], size) - this.distToCenter(b[0], b[1], size);
    });
  }

  compute(board, time) {
    this.startTime = Date.now();
    // INFO: LÍMITE DE TIEMPO: Usamos máx el 3% del tiempo que nos queda, con un tope duro de 90ms
    this.timeLimit = Math.min(time * 0.03, 90); 

    const moves = this.board_logic.valid_moves(board);
    if (moves.length === 0) return null; 

    const orderedMoves = this.orderMoves(board, moves, board.length);
    let bestMoveGlobal = orderedMoves[0]; // Jugada por si no tenemos tiempo

    const myColorInt = (this.color === 'R') ? -1 : -2;

    let maxDepth = 1;
    while (maxDepth <= 6) { // tope de profundidad
      let bestMove = orderedMoves[0];
      let bestValue = -Infinity;

      for (let move of orderedMoves) {
        if (Date.now() - this.startTime > this.timeLimit) {
            return bestMoveGlobal;
        }

        const nextBoard = this.board_logic.clone(board);
        this.board_logic.move(nextBoard, move[0], move[1], move[2], myColorInt);
        
        const val = this.alfabeta(nextBoard, maxDepth - 1, -Infinity, Infinity, false);
        
        if (val > bestValue) {
            bestValue = val;
            bestMove = move;
        }
      }
      
      // Si terminamos esta profundidad a tiempo, guardamos el resultado como seguro
      bestMoveGlobal = bestMove;
      maxDepth++;
    }

    return bestMoveGlobal;
  }

  heuristics(board) {
    let score = 0;
    const myColor = (this.color === 'R') ? -1 : -2;
    
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board.length; j++) {
        if (board[i][j] === myColor) score += 10;
        else if (board[i][j] < 0) score -= 10; 
        
        const sides = this.countSides(board, i, j);
        if (sides === 3) score -= 5; 
      }
    }
    return score;
  }

  alfabeta(board, depth, alpha, beta, isMaximizing) {
    // CORTE DE EMERGENCIA POR TIEMPO: si se acaba, retornamos la heurística
    if (Date.now() - this.startTime > this.timeLimit) return this.heuristics(board);

    if (depth === 0) return this.heuristics(board);
    
    const moves = this.board_logic.valid_moves(board);
    if (moves.length === 0) return this.heuristics(board);

    const ordered = this.orderMoves(board, moves, board.length);

    if (isMaximizing) {
      let v = -Infinity;
      const myColorInt = (this.color === 'R') ? -1 : -2;

      for (let m of ordered) {
        const nb = this.board_logic.clone(board);
        this.board_logic.move(nb, m[0], m[1], m[2], myColorInt);
        
        v = Math.max(v, this.alfabeta(nb, depth - 1, alpha, beta, false));
        alpha = Math.max(alpha, v);
        if (beta <= alpha) break;
      }
      return v;
    } else {
      let v = Infinity;
      const oppColorInt = (this.color === 'R') ? -2 : -1; // Color del rival

      for (let m of ordered) {
        const nb = this.board_logic.clone(board);
        this.board_logic.move(nb, m[0], m[1], m[2], oppColorInt);
        
        v = Math.min(v, this.alfabeta(nb, depth - 1, alpha, beta, true));
        beta = Math.min(beta, v);
        if (beta <= alpha) break;
      }
      return v;
    }
  }
}
