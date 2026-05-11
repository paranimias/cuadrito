class Cruceta extends Agent{
    constructor(){
        super()

        this.boardUtil = new Board()

        this.UP = 0
        this.RIGHT = 1
        this.DOWN = 2
        this.LEFT = 3

        this.TOP = 1
        this.RBIT = 2
        this.BOTTOMBIT = 4
        this.LBIT = 8

        this.dirs = [
            [-1,0,2],
            [0,1,3],
            [1,0,0],
            [0,-1,1]
        ]

        // popcount precalculado
        this.bits = new Uint8Array(16)

        for(let i=0;i<16;i++){
            let x=i,c=0
            while(x){
                x &= x-1
                c++
            }
            this.bits[i]=c
        }
    }

    init(color, board, time=20000){
        super.init(color, board, time)

        this.maxDepth = 7

        if(this.size >= 25) this.maxDepth = 5
        else if(this.size >= 20) this.maxDepth = 6
        else if(this.size <= 10) this.maxDepth = 9
    }

    count(v){
        return this.bits[v & 15]
    }

    clone(board){
        let n = board.length
        let b = new Array(n)

        for(let i=0;i<n;i++){
            b[i] = board[i].slice()
        }

        return b
    }

    getMoves(board){
        return this.boardUtil.valid_moves(board)
    }

    isSafe(board,r,c,s){
        let v = board[r][c]

        if(v<0) return false

        let nv = v | (1<<s)

        if(this.count(nv)==3) return false

        let [dr,dc,os] = this.dirs[s]

        let nr=r+dr
        let nc=c+dc

        if(
            nr>=0 &&
            nr<board.length &&
            nc>=0 &&
            nc<board.length &&
            board[nr][nc]>=0
        ){
            let nnv = board[nr][nc] | (1<<os)

            if(this.count(nnv)==3){
                return false
            }
        }

        return true
    }

    boxesCompleted(board,r,c,s){
        let gain = 0

        let nv = board[r][c] | (1<<s)

        if(this.count(nv)==4) gain++

        let [dr,dc,os] = this.dirs[s]

        let nr=r+dr
        let nc=c+dc

        if(
            nr>=0 &&
            nr<board.length &&
            nc>=0 &&
            nc<board.length &&
            board[nr][nc]>=0
        ){
            let nnv = board[nr][nc] | (1<<os)

            if(this.count(nnv)==4){
                gain++
            }
        }

        return gain
    }

    scoreBoard(board){
        let mine = 0
        let opp = 0

        let myColor = this.color=='R' ? -1 : -2
        let opColor = this.color=='R' ? -2 : -1

        let chains = 0
        let longChains = 0
        let loops = 0

        let n = board.length

        for(let i=0;i<n;i++){
            for(let j=0;j<n;j++){
                let v = board[i][j]

                if(v==myColor) mine++
                else if(v==opColor) opp++
            }
        }

        let structures = this.detectStructures(board)

        chains = structures.chains.length
        loops = structures.loops.length

        for(let c of structures.chains){
            if(c.length>=3) longChains++
        }

        let parityBonus = 0

        if(longChains % 2 == 1){
            parityBonus = 15
        }else{
            parityBonus = -15
        }

        return (
            (mine - opp)*100
            + parityBonus
            - chains*2
            - loops
        )
    }

    detectStructures(board){
        let n = board.length

        let visited = Array.from(
            {length:n},
            ()=>new Uint8Array(n)
        )

        let chains = []
        let loops = []

        for(let i=0;i<n;i++){
            for(let j=0;j<n;j++){

                if(visited[i][j]) continue
                if(board[i][j]<0) continue

                if(this.count(board[i][j])!=2) continue

                let queue=[[i,j]]
                visited[i][j]=1

                let component=[]

                while(queue.length){

                    let [r,c]=queue.pop()

                    component.push([r,c])

                    for(let s=0;s<4;s++){

                        if(board[r][c]&(1<<s)) continue

                        let [dr,dc,os]=this.dirs[s]

                        let nr=r+dr
                        let nc=c+dc

                        if(
                            nr<0 ||
                            nr>=n ||
                            nc<0 ||
                            nc>=n
                        ) continue

                        if(visited[nr][nc]) continue
                        if(board[nr][nc]<0) continue

                        if(this.count(board[nr][nc])!=2) continue

                        visited[nr][nc]=1

                        queue.push([nr,nc])
                    }
                }

                let loop=true

                for(let [r,c] of component){

                    let deg=0

                    for(let s=0;s<4;s++){

                        if(board[r][c]&(1<<s)) continue

                        let [dr,dc]=this.dirs[s]

                        let nr=r+dr
                        let nc=c+dc

                        if(
                            nr<0 ||
                            nr>=n ||
                            nc<0 ||
                            nc>=n
                        ) continue

                        if(board[nr][nc]<0) continue

                        if(this.count(board[nr][nc])==2){
                            deg++
                        }
                    }

                    if(deg!=2){
                        loop=false
                        break
                    }
                }

                if(loop){
                    loops.push(component)
                }else{
                    chains.push(component)
                }
            }
        }

        return {chains,loops}
    }

    applyMove(board,r,c,s,ply){
        let b = this.clone(board)

        this.boardUtil.move(b,r,c,s,ply)

        return b
    }

    movePriority(board,m){

        let [r,c,s]=m

        let gain = this.boxesCompleted(board,r,c,s)

        if(gain>0){
            return 10000 + gain*1000
        }

        if(this.isSafe(board,r,c,s)){
            return 5000
        }

        let penalty = 0

        let nv = board[r][c] | (1<<s)

        if(this.count(nv)==3) penalty++

        let [dr,dc,os] = this.dirs[s]

        let nr=r+dr
        let nc=c+dc

        if(
            nr>=0 &&
            nr<board.length &&
            nc>=0 &&
            nc<board.length &&
            board[nr][nc]>=0
        ){
            let nnv = board[nr][nc] | (1<<os)

            if(this.count(nnv)==3){
                penalty++
            }
        }

        return -penalty*100
    }

    orderedMoves(board){

        let moves = this.getMoves(board)

        moves.sort((a,b)=>
            this.movePriority(board,b)
            -
            this.movePriority(board,a)
        )

        return moves
    }

    terminal(board){

        let n = board.length

        for(let i=0;i<n;i++){
            for(let j=0;j<n;j++){

                if(board[i][j]>=0){
                    return false
                }
            }
        }

        return true
    }

    minimax(board,depth,alpha,beta,maximizing,ply,startTime,timeLimit){

        if(Date.now()-startTime > timeLimit){
            return this.scoreBoard(board)
        }

        if(depth<=0 || this.terminal(board)){
            return this.scoreBoard(board)
        }

        let moves = this.orderedMoves(board)

        if(maximizing){

            let value = -1e9

            for(let m of moves){

                let [r,c,s]=m

                let gain = this.boxesCompleted(board,r,c,s)

                let nb = this.applyMove(board,r,c,s,ply)

                let nextMax = gain>0

                let score = this.minimax(
                    nb,
                    depth-1,
                    alpha,
                    beta,
                    nextMax,
                    ply,
                    startTime,
                    timeLimit
                )

                if(score>value){
                    value=score
                }

                if(value>alpha){
                    alpha=value
                }

                if(beta<=alpha){
                    break
                }
            }

            return value

        }else{

            let value = 1e9

            let op = (ply==-1)?-2:-1

            for(let m of moves){

                let [r,c,s]=m

                let gain = this.boxesCompleted(board,r,c,s)

                let nb = this.applyMove(board,r,c,s,op)

                let nextMin = !(gain>0)

                let score = this.minimax(
                    nb,
                    depth-1,
                    alpha,
                    beta,
                    nextMin,
                    ply,
                    startTime,
                    timeLimit
                )

                if(score<value){
                    value=score
                }

                if(value<beta){
                    beta=value
                }

                if(beta<=alpha){
                    break
                }
            }

            return value
        }
    }

    greedyCapture(board,moves){

        let best=null
        let bestGain=-1

        for(let m of moves){

            let g = this.boxesCompleted(
                board,
                m[0],
                m[1],
                m[2]
            )

            if(g>bestGain){
                bestGain=g
                best=m
            }
        }

        return best
    }

    endgameMove(board,moves){

        let bestMove = moves[0]
        let bestScore = -1e9

        let start = Date.now()

        let budget = 200

        if(this.size<=10){
            budget=1200
        }else if(this.size<=15){
            budget=700
        }else if(this.size<=20){
            budget=350
        }

        let ply = this.color=='R' ? -1 : -2

        for(let move of moves){

            let [r,c,s]=move

            let gain=this.boxesCompleted(board,r,c,s)

            let nb=this.applyMove(board,r,c,s,ply)

            let maximizing = gain>0

            let score=this.minimax(
                nb,
                this.maxDepth,
                -1e9,
                1e9,
                maximizing,
                ply,
                start,
                budget
            )

            if(score>bestScore){
                bestScore=score
                bestMove=move
            }
        }

        return bestMove
    }

    compute(board,time){

        let moves = this.orderedMoves(board)

        if(moves.length==1){
            return moves[0]
        }

        // CAPTURAS FORZADAS
        let captures=[]

        for(let m of moves){

            let g=this.boxesCompleted(
                board,
                m[0],
                m[1],
                m[2]
            )

            if(g>0){
                captures.push(m)
            }
        }

        if(captures.length){

            // endgame solver
            if(moves.length<120){
                return this.endgameMove(board,captures)
            }

            return this.greedyCapture(board,captures)
        }

        // SAFE MOVES
        let safe=[]

        for(let m of moves){

            if(this.isSafe(
                board,
                m[0],
                m[1],
                m[2]
            )){
                safe.push(m)
            }
        }

        if(safe.length){

            if(safe.length<40){

                return this.endgameMove(board,safe)
            }

            return safe[0]
        }

        // TODO inseguro
        return this.endgameMove(board,moves)
    }
}
