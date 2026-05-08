class AgentAB extends Agent {
  constructor() {
    super();
    this.board_logic = new Board();
  }


  compute(board, time) {
    let moves = this.board_logic.valid_moves(board);

    // let mejorMovimiento = [return de alfabeta]

    return moves[0]
  }

  // Haurísticas para evaluar un tablero
  heuristics(board) {
    return 0
  }

  // Implementar la poda
  alfabeta(board, depth, alpha, beta, isMaximizing) {

  }
}
