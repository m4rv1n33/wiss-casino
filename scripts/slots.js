const BOARD_WIDTH = 6; const BOARD_HEIGHT = 4;

const symbol_identifiers = [ "four", "rain", "person", "black", "money", "heaven", "soul", "life", "time" ];
const symbol_weights = [7, 6, 7, 6, 4, 6, 5, 5, 5];

const symbols = {
    four: "四", rain: "雨", person: "人",
    black: "黒", money: "金", heaven: "天",
    soul: "霊", life: "生", time: "時"
};

const symbol_values = {
    four: 4, rain: 8, person: 8,
    black: 20, money: 70, heaven: 20,
    soul: 36, life: 36, time: 25
};

const pattern_values = {
    line3: 1, line4: 3, line5: 5, line6: 10,
    square2: 2, square3: 6, square4: 12,
    arrow: 8, ring: 9, jackpot: 75
}

var credits = 100;
var board = [];
var board_cells = [];
var patterns = [];

var ongoing_spin_animations = 0;

function pick_random_array_element(arr) {
    return arr[ Math.floor(Math.random() * arr.length) ]
}

function pick_random_array_element_weighted(weights) {
    var sum = weights.reduce((a, c) => a + c, 0);
    var value = Math.floor(Math.random() * sum);
    var compare = 0

    var result = 0;
    
    for (let i = 0; i < weights.length; i++) {
        compare += weights[i];
        if (value < compare) return i;
    }

    return 0;
}

function cell_animation(cell, final_text, duration, time = 0) {
    var next_frame_time = (time / duration) * 0.1 + 0.01;

    if (time >= duration) {
        ongoing_spin_animations--;
        cell.innerText = final_text;

        evaluate_animation();
        return
    } else { cell.innerText = symbols[pick_random_array_element(symbol_identifiers)]; }
    
    setTimeout(cell_animation, next_frame_time * 1000, cell, final_text, duration, time + next_frame_time);
}

function evaluate_animation() {
    if (ongoing_spin_animations > 0) return

    patterns.forEach(e => {
        e.slice(1).forEach(cell => board_cells[cell].style.color = 'yellow');
        
        let payout = 0;
        switch (e[0][0]) {
            case "square":
            case "line":
                payout += pattern_values[e[0][0] + (e.length - 1)] * symbol_values[e[0][1]]
                break;
        }

        credits += payout;
        update_credit_display();
    });
}

function render_board(animate) {
    board_cells.forEach(e => e.style.color = 'black');

    for (let i = 0; i < board.length; i++) {
        if (animate) {
            ongoing_spin_animations++;
            cell_animation(board_cells[i], symbols[board[i]], Math.max(2, Math.random() * 3));
        } else { board_cells[i].innerText = symbols[board[i]]; }
    }
}

function spin() {
    if (credits < 10 || ongoing_spin_animations > 0) return

    board = []

    for (let i = 0; i < BOARD_WIDTH * BOARD_HEIGHT; i++) {
        board.push(symbol_identifiers[pick_random_array_element_weighted(symbol_weights)]);
    }

    credits -= 10;
    update_credit_display();
    render_board(true);

    evaluate_board();
}

function evaluate_board() {
    patterns = [];

    for (let i = 0; i < board.length; i++) {
        let symbol_type = board[i];
        
        for (let dir = 0; dir < 8; dir++) {
            let line_length = 1;
            let offset = 0;
            let offset_increase = 0;
            let pattern = [ [ "line", symbol_type ], i ];

            switch (dir) {
                case 0: offset_increase = 1; break;
                case 1: offset_increase = BOARD_WIDTH + 1; break;
                case 2: offset_increase = BOARD_WIDTH; break;
                case 3: offset_increase = BOARD_WIDTH - 1; break;
                case 4: offset_increase = -1; break;
                case 5: offset_increase = -BOARD_WIDTH - 1; break;
                case 6: offset_increase = -BOARD_WIDTH; break;
                case 7: offset_increase = -BOARD_WIDTH + 1; break;
            }

            offset += offset_increase;
            while (offset >= 0 && offset < board.length && board[i + offset] == symbol_type) {
                line_length++;
                pattern.push(i + offset);
                offset += offset_increase;
            }

            if (pattern.length < 4) continue;
            patterns.push(pattern);
        }
    }

    console.log(patterns);
}

function update_credit_display() {
    document.getElementById('credit-display').innerText = credits + " credits";
}

for (let y = 0; y < BOARD_HEIGHT; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
        let cell = document.createElement('div');
        cell.className = 'slots-cell';

        document.getElementById('slots-container').appendChild(cell);

        board.push(pick_random_array_element(symbol_identifiers));
        board_cells.push(cell);
    }
}

update_credit_display();
render_board(false);
document.getElementById('spin-button').addEventListener('click', spin);