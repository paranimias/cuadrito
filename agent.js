class MCTAgent extends Agent {
  constructor() {
    super();
  }

  init(color, board, time = 20000) {
    super.init(color, board, time);
  }

  getLineCount(boxValue) {
    let count = 0;
    for (let i = 0; i < 4; i++) {
      if ((boxValue & (1 << i)) !== 0) count++;
    }
    return count;
  }

  isSafeMove(board, row, col, side) {
    if ((board[row][col] & (1 << side)) !== 0) return false;

    let count1 = this.getLineCount(board[row][col]);
    if (count1 >= 2) return false;

    let neighborRow = row;
    let neighborCol = col;

    if (side == 0) {
      neighborRow = row - 1;
    }
    if (side == 1) {
      neighborCol = col + 1;
    }
    if (side == 2) {
      neighborRow = row + 1;
    }
    if (side == 3) {
      neighborCol = col - 1;
    }

    let isNeighborInsideBoard =
      neighborRow >= 0 &&
      neighborRow < this.size &&
      neighborCol >= 0 &&
      neighborCol < this.size;

    if (isNeighborInsideBoard) {
      let neighborBoxLines = this.getLineCount(board[neighborRow][neighborCol]);
      if (neighborBoxLines >= 2) {
        return false;
      }
    }
    return true;
  }

  calculateAllSafeMoves(board) {
    let safeMoves = [];

    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        for (let side = 0; side < 4; side++) {
          if (this.isSafeMove(board, row, col, side)) {
            safeMoves.push([row, col, side]);
          }
        }
      }
    }

    return safeMoves;
  }

  compute(board, time) {
    let safeMoves = this.calculateAllSafeMoves(board);

    if (safeMoves.length > 0) {
      let randomIndex = Math.floor(Math.random() * safeMoves.length);
      return safeMoves[randomIndex];
    }

    return this.getFallbackMove(board);
  }

  getFallbackMove(board) {
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        for (let s = 0; s < 4; s++) {
          if ((board[r][c] & (1 << s)) === 0) return [r, c, s];
        }
      }
    }
    return null;
  }
}
