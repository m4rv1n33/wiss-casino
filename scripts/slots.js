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
        cell.innerText = final_text;
        return
    } else { cell.innerText = symbols[pick_random_array_element(symbol_identifiers)]; }
    
    setTimeout(cell_animation, next_frame_time * 1000, cell, final_text, duration, time + next_frame_time);
}

function render_board(animate) {
    document.getElementById('credit-display').innerText = credits + " credits";

    for (let i = 0; i < board.length; i++) {
        if (animate) { cell_animation(board_cells[i], symbols[board[i]], Math.max(2, Math.random() * 3)); }
        else { board_cells[i].innerText = symbols[board[i]]; }
    }
}

function spin() {
    if (credits < 10) return

    board = []

    for (let i = 0; i < BOARD_WIDTH * BOARD_HEIGHT; i++) {
        board.push(symbol_identifiers[pick_random_array_element_weighted(symbol_weights)]);
    }

    credits -= 10;
    render_board(true)
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

render_board(false);
document.getElementById('spin-button').addEventListener('click', spin);