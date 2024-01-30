/* Source: https://mjai.ekyu.moe/report/ac7f456533f7d814.html#kyoku-2-0 
Also saved in mahjong_mortal_ui/example_logs/Example_mjai_report.html
*/
json_data = {
    "dan":["雀豪★1","雀豪★1","雀聖★2","雀聖★2"],
    "lobby":0,
    "log":[[
        [2,0,0], // East 3, no repeats, no riichi sticks
        [22000,11300,44700,22000], // start points
        [22], // Dora 2p
        [], // Uradora
        // PID0 = E in E1  now: West
        [25,18,18,46,22,31,16,34,29,47,17,13,17],
        [28,21,13,19,24,41,35,34,11,26,41,45,28,34,37],
        [31,46,47,25,21,60,28,60,60,29,60,60,60,60,60],
        // PID1 = S in E1  now: North
        [37,23,45,42,51,37,13,38,43,23,46,38,12],              // hand
        [47,12,11,44,47,14,"3838p38",43,33,22,36,14,28,12,17], // draws
        [43,42,46,45,44,47,47,11,43,33,22,36,60,14,60],        // discards
        // PID2 = W in E1,  now: East << POV player
        [41,21,36,26,15,39,29,44,47,32,46,26,35],
        [29,16,43,16,26,52,38,31,32,38,25,36,24,31,"c141516",25],
        [44,39,60,46,47,32,60,60,60,60,21,26,41,60,29,29],
        // PID3 i N in E1   now: South
        [28,19,27,33,15,44,11,22,32,15,19,35,45],       // hand
        [33,39,19,21,29,44,42,14,27,42,45,42,41,16,39], // draws
        [44,60,11,45,35,60,33,60,60,60,60,60,60,42,60], // discards
        [
            "和了", // "heaven" = Agari = Win (Tsumo or Ron)
            [-7700,7700,0,0], // point change
            [1,0,1,"30符4飜7700点","断幺九(1飜)","ドラ(2飜)","赤ドラ(1飜)"]
        ]
    ]],
    "name":["Aさん","Bさん","Cさん","Dさん"],
    "rate":[1538.0,1261.0,2263.0,645.0],
    "ratingc":"PF4",
    "rule":{"aka":0,"aka51":1,"aka52":1,"aka53":1,
    "disp":"玉の間南喰赤"},
    "sx":["C","C","C","C"]
}


//take '2m' and return 2 + 10 etc.
function tm2t(str) { 
    //tenhou's tile encoding:
    //   11-19    - 1-9 man
    //   21-29    - 1-9 pin
    //   31-39    - 1-9 sou
    //   41-47    - ESWN WGR
    //   51,52,53 - aka 5 man, pin, sou
    let num = parseInt(str[0]);
    const tcon = { m : 1, p : 2, s : 3, z : 4 };

    return num ? 10 * tcon[str[1]] + num : 50 + tcon[str[1]];
}

// take 2+10 and return '2m'
function tenhou2str(tileInt) {
    if (tileInt > 50) {
        const akacon = { 51:'0m', 52:'0p', 53:'0s'}
        return akacon[tileInt]
    }
    suitInt = Math.floor(tileInt / 10)
    tileInt = tileInt % 10
    const tcon = ['m', 'p', 's', 'z']
    output = tileInt.toString() + tcon[suitInt-1]
    return output
}

// TODO: This should really just be a class keeping state of the entire round
class TurnNum {
    constructor(dealerIdx, draws, discards) {
        this.dealerIdx = dealerIdx
        this.draws = draws
        this.discards = discards
        this.ply = 0
        this.pidx = dealerIdx
        this.nextDiscardIdx = [0,0,0,0]
        this.nextDrawIdx = [0,0,0,0]
    }
    getDraw() {
        let draw = this.draws[this.pidx][this.nextDrawIdx[this.pidx]]
        if (typeof draw == "undefined") { 
            console.log("out of draws")
            max_ply = this.ply
            return null 
        }
        if (typeof draw == "string") {
            console.log('string draw', draw)
            if (draw.indexOf('p') !== -1) {
                draw = parseInt(draw[5]+draw[6]) // no matter were 'p' is, the last two digits are the ponned tile
                console.log('pon', draw)
                return draw
            }
            let chiIdx = draw.indexOf('c')
            if (chiIdx !== -1) {
                draw = parseInt(draw[1]+draw[2])
                console.log('chi', draw)
                return draw
            }
            throw new Error(`Cannot parse draw ${draw}`)
        }
        return draw
    }
    getDiscard() {
        return this.discards[this.pidx][this.nextDiscardIdx[this.pidx]]
    }
    incPly() {
        if (this.ply%2==1) {
            this.nextDrawIdx[this.pidx]++
            this.nextDiscardIdx[this.pidx]++
            this.pidx = this.whoIsNext()
        }
        this.ply++
    }
    whoIsNext() {
        let debug = false
        for (let tmpPidx of Array(4).keys()) {
            if (tmpPidx == this.pidx) {
                debug && console.log('skip: cannot call own tile')
                continue // skip: cannot call own tile
            }
            if (debug) {
                console.log('test', tmpPidx, this.nextDrawIdx[tmpPidx], this.ply, this.pidx)
            }
            let draw = this.draws[tmpPidx][this.nextDrawIdx[tmpPidx]]
            debug && console.log(draw, tenhou2str(draw), this.draws[tmpPidx])
            if (typeof draw == 'string') {
                let chiAllowed = (this.pidx+1) % 4 == tmpPidx
                if (chiAllowed || draw.indexOf('c') == -1) {
                    console.log('called', draw, tmpPidx)
                    let discardsElem = document.querySelector(`.grid-discard-p${this.pidx}`)
                    discardsElem.lastChild.style.opacity = "0.5"
                    return tmpPidx
                }
            }
        }
        return (this.pidx+1) % 4
    }
}

function removeFromArray(array, value) {
    const indexToRemove = array.indexOf(value)
    if (indexToRemove === -1) { 
        throw new Error(`Value ${value} not in array ${array}`)
    }
    array.splice(indexToRemove, 1)
}

function parseJsonData(data) {
    const log = data['log'][0]
    logIdx = 0
    round = log[logIdx++]
    scores = log[logIdx++]
    dora = log[logIdx++]
    uradora = log[logIdx++]
    let haipais = []
    let draws = []
    let discards = []
    for (pnum of Array(4).keys()) {
        haipais.push(Array.from(log[logIdx++]))
        draws.push(log[logIdx++])
        discards.push(log[logIdx++])
        haipais[pnum].sort()
    }

    gridInfo = document.querySelector('.grid-info')
    gridInfo.replaceChildren()
    gridInfo.append('round ', JSON.stringify(round), document.createElement('br'))
    gridInfo.append('dora ', JSON.stringify(dora), document.createElement('br'))
    gridInfo.append('uradora ', JSON.stringify(uradora), document.createElement('br'))

    // Initialize whose turn it is, and pointers for current draws/discards for each player
    let ply = new TurnNum(round[0], draws, discards)
    for (let tmpPidx of Array(4).keys()) {
        discardsElem = document.querySelector(`.grid-discard-p${tmpPidx}`)
        discardsElem.replaceChildren()
    }

    while (ply.ply < ply_counter) {
        //console.log(ply.ply, ply.pidx)
        draw = ply.getDraw(draws)
        if (typeof draw == "undefined") {
            console.log("out of draws")
            break 
        }
        //console.log(`ply ${ply.ply} pidx ${ply.pidx} draw ${draw}, ${tenhou2str(draw)}`)
        ply.incPly()
        if (ply.ply >= ply_counter) {
            break
        }
        discard = ply.getDiscard(discards)
        if (typeof discard == "undefined") {
            console.log("out of discards")
            break
        }
        //console.log(`ply ${ply.ply} pidx ${ply.pidx} discard ${discard}`)
        if (discard==60) {
            discard = draw // tsumogiri the drawn tile
        } else {
            //console.log(haipais[ply.pidx], discard)
            removeFromArray(haipais[ply.pidx], discard)
            haipais[ply.pidx].push(draw)
        }
        addDiscard(ply.pidx, [tenhou2str(discard)])
        ply.incPly()
    }
    for (pnum of Array(4).keys()) {
        hand = document.querySelector(`.grid-hand-p${pnum}`)
        hand.replaceChildren()
        for (tileInt of haipais[pnum]) {
            addTiles(hand, [tenhou2str(tileInt)], false)
        }
    }
}

function createTile(tileStr) {
    const tileImg = document.createElement('img')
    tileImg.src = `media/Regular_shortnames/${tileStr}.svg`
    tileImg.style.background = "white"
    tileImg.style.border = "1px solid grey"
    tileImg.style.padding = "1px 1px 1px 1px"
    return tileImg
}

function addTiles(container, tileStrArray, replace) {
    if (replace) {
        container.replaceChildren()
    }
    for (i in tileStrArray) {
        container.appendChild(createTile(tileStrArray[i]))
    }   
}

function addDiscard(pidx, tileStrArray) {
    discardsElem = document.querySelector(`.grid-discard-p${pidx}`)
    addTiles(discardsElem, tileStrArray)
}

function convertTileStr(str) {
    let output = []
    let suit = ''
    for (i=str.length-1; i>=0; i--) {
        if (!isNaN(str[i])) {
            if (suit === '') {
                throw new Error(`error in convertTileStr: ${str}`)
            }
            output.push(str[i]+suit)
        } else {
            suit = str[i]
        }
    }
    output.reverse()
    return output
}

function incPlyCounter() {
    ply_counter < max_ply && ply_counter++;
}

function decPlyCounter() {
    ply_counter > 0 && ply_counter--;
}

function getPlyCounter() {
    return ply_counter;
}

function connectUI() {
    const inc = document.getElementById("ply-inc");
    const inc2 = document.getElementById("ply-inc2");
    const input = document.getElementById("ply-counter");
    const dec = document.getElementById("ply-dec");
    const dec2 = document.getElementById("ply-dec2");
    inc.addEventListener("click", () => {
        incPlyCounter();
        input.value = getPlyCounter();
        parseJsonData(json_data)
    });
    inc2.addEventListener("click", () => {
        incPlyCounter();
        incPlyCounter();
        incPlyCounter();
        incPlyCounter();
        input.value = getPlyCounter();
        parseJsonData(json_data)
    });
    dec.addEventListener("click", () => {
        if (input.value > 0) {
          decPlyCounter();
        }
        input.value = getPlyCounter();
        parseJsonData(json_data)
    });
    dec2.addEventListener("click", () => {
        decPlyCounter();
        decPlyCounter();
        decPlyCounter();
        decPlyCounter();
        input.value = getPlyCounter();
        parseJsonData(json_data)
    });
}

let ply_counter = 0
let max_ply = 999
parseJsonData(json_data)
connectUI()

