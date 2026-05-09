//node struct
class MCTSNode {
  constructor(parent, move, boardState) {
    this.parent = parent;
    this.move = move;
    this.boardState = boardState;
    this.children = [];

    this.wins = 0;
    this.visits = 0;
    this.untriedMoves = [];
  }
}

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

  cloneBoard(board) {
    return board.map((row) => [...row]);
  }

  getAllValidMoves(board) {
    let validMoves = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (board[r][c] < 0) continue;
        for (let s = 0; s < 4; s++) {
          if ((board[r][c] & (1 << s)) === 0) {
            validMoves.push([r, c, s]);
          }
        }
      }
    }
    return validMoves;
  }

  applyMoveBoard(board, row, col, side) {
    let closedCount = 0;

    board[row][col] |= 1 << side;

    if (board[row][col] === 15) {
      closedCount++;
    }

    let nRow = row,
      nCol = col,
      nSide = side;

    if (side === 0) {
      nRow--;
      nSide = 2;
    }
    if (side === 1) {
      nCol++;
      nSide = 3;
    }
    if (side === 2) {
      nRow++;
      nSide = 0;
    }
    if (side === 3) {
      nCol--;
      nSide = 1;
    }

    if (nRow >= 0 && nRow < this.size && nCol >= 0 && nCol < this.size) {
      board[nRow][nCol] |= 1 << nSide;

      if (board[nRow][nCol] === 15) {
        closedCount++;
      }
    }
    return closedCount;
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  expand(node) {
    let move = node.untriedMoves.pop();
    let nextBoard = this.cloneBoard(node.boardState);

    this.applyMoveBoard(nextBoard, move[0], move[1], move[2]);

    let childNode = new MCTSNode(node, move, nextBoard);
    childNode.untriedMoves = this.getAllValidMoves(nextBoard);

    node.children.push(childNode);
    return childNode;
  }

  simulate(boardState) {
    let board = this.cloneBoard(boardState);
    let myScore = 0;
    let enemyScore = 0;

    let myColorValue = this.color == "R" ? -1 : -2;
    let enemyColorValue = this.color == "R" ? -2 : -1;

    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        if (board[row][col] === myColorValue) myScore++;
        else if (board[row][col] === enemyColorValue) enemyScore++;
      }
    }

    let availableMoves = this.getAllValidMoves(board);
    this.shuffleArray(availableMoves);

    let isMyTurn = true;

    for (let i = 0; i < availableMoves.length; i++) {
      let move = availableMoves[i];
      let row = move[0],
        col = move[1],
        side = move[2];

      if ((board[row][col] & (1 << side)) !== 0) {
        continue;
      }

      let closedBoxes = this.applyMoveBoard(board, row, col, side);

      if (closedBoxes > 0) {
        if (isMyTurn) myScore += closedBoxes;
        else enemyScore += closedBoxes;
      } else {
        isMyTurn = !isMyTurn;
      }
    }

    if (myScore > enemyScore) return 1;
    if (myScore < enemyScore) return 0;
    return 0.5;
  }

  backpropagate(node, result) {
    let currentNode = node;
    while (currentNode !== null) {
      currentNode.visits += 1;
      currentNode.wins += result;
      currentNode = currentNode.parent;
    }
  }

  getBestUCTChild(node) {
    let bestValue = -Infinity;
    let bestChild = null;

    let c = 1.41;

    for (let child of node.children) {
      if (child.visits === 0) return child;
      let winRate = child.wins / child.visits;
      let uctValue =
        winRate + c * Math.sqrt(Math.log(node.visits) / child.visits);
      if (uctValue > bestValue) {
        bestValue = uctValue;
        bestChild = child;
      }
    }
    return bestChild;
  }

  compute(board, time) {
    let safeMoves = this.calculateAllSafeMoves(board);

    if (safeMoves.length > 0) {
      let randomIndex = Math.floor(Math.random() * safeMoves.length);
      return safeMoves[randomIndex];
    }

    let startTime = Date.now();

    let timeLimit = Math.floor(time * 0.15);
    if (timeLimit < 100) timeLimit = 100;
    if (timeLimit > time) timeLimit = time - 50;

    let rootNode = new MCTSNode(null, null, board);
    rootNode.untriedMoves = this.getAllValidMoves(board);

    while (Date.now() - startTime < timeLimit) {
      let node = rootNode;

      while (node.untriedMoves.length === 0 && node.children.length > 0) {
        node = this.getBestUCTChild(node);
      }

      if (node.untriedMoves.length > 0) {
        node = this.expand(node);
      }

      let result = this.simulate(node.boardState);

      this.backpropagate(node, result);
    }

    let bestChild = null;
    let maxVisits = -1;

    for (let child of rootNode.children) {
      if (child.visits > maxVisits) {
        maxVisits = child.visits;
        bestChild = child;
      }
    }

    return bestChild.move;
  }
}
