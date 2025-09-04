/* bj21.js
Title: Blackjack script for wiss-casino
Author: Marvin Strasser
Desc: "Simple" Blackjack implementation with Hit, Stand, Double Down, Split, Forfeit
Date: 20/08/2025
*/
(() => {
  // references
  const cashEl = document.getElementById('cash');
  const betInput = document.getElementById('bet-amount');
  const placeBetBtn = document.getElementById('place-bet');
  const hitBtn = document.getElementById('hit');
  const standBtn = document.getElementById('stand');
  const doubleBtn = document.getElementById('double');
  const splitBtn = document.getElementById('split');
  const surrenderBtn = document.getElementById('surrender');
  const newRoundBtn = document.getElementById('new-round');
  const dealerCardsEl = document.getElementById('dealer-cards');
  const dealerInfoEl = document.getElementById('dealer-info');
  const playerHandsEl = document.getElementById('player-hands');
  const messagesEl = document.getElementById('messages');

  // Game state
  let cash = 1000;
  let deck = [];
  let dealerHand = [];
  let playerHands = [];
  let currentHandIndex = 0;
  let roundActive = false;
  let dealerHoleFaceDown = true;

  const SUITS = ['♠','♥','♦','♣'];
  const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

  // Utility: create and shuffle deck
  function buildDeck() {
    const d = [];
    for (const s of SUITS) {
      for (const r of RANKS) d.push({suit: s, rank: r});
    }
    return d;
  }

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
  }

  function resetDeck() {
    deck = buildDeck();
    shuffle(deck);
  }

  function draw() {
    if (deck.length === 0) {
      resetDeck();
    }
    return deck.pop();
  }

  // Value calculation (best Ace usage)
  function handValue(cards) {
    let sum = 0;
    let aces = 0;
    for (const c of cards) {
      const r = c.rank;
      if (r === 'A') { aces++; sum += 1; }
      else if (['J','Q','K'].includes(r)) sum += 10;
      else sum += parseInt(r, 10);
    }

    // upgrade some aces from 1 to 11 if possible
    for (let i=0; i<aces; i++) {
      if (sum + 10 <= 21) sum += 10;
    }
    return sum;
  }

  function isBlackjack(cards) {
    return cards.length === 2 && handValue(cards) === 21;
  }

  // UI helpers
  function createCardElement(card) {
    const el = document.createElement('div');
    el.className = 'card';
    if (card.suit === '♥' || card.suit === '♦') el.classList.add('red');

    el.innerHTML = `<div class="rank">${card.rank}</div><div class="suit">${card.suit}</div>`;
    return el;
  }

  function renderDealer() {
    dealerCardsEl.innerHTML = '';
    for (let i=0;i<dealerHand.length;i++) {
      const c = dealerHand[i];
      if (i === 1 && dealerHoleFaceDown) {

        // face-down card
        const back = document.createElement('div');
        back.className = 'face-down';
        // back.textContent = '🂠';
        dealerCardsEl.appendChild(back);
      } 
      else {
        dealerCardsEl.appendChild(createCardElement(c));
      }
    }
    dealerInfoEl.textContent = dealerHoleFaceDown ? 'Hidden card' : `Value: ${handValue(dealerHand)}`;
  }

  function renderPlayerHands() {
    playerHandsEl.innerHTML = '';
    playerHands.forEach((h, idx) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'hand';
      // if (idx === currentHandIndex && roundActive) wrapper.style.outline = '2px solid #8cc';

      const header = document.createElement('div');
      header.className = 'hand-header';
      const left = document.createElement('div');
      left.innerHTML = `<div class="player-bet">Bet: ${h.bet} CHF${h.doubled ? ' (Doubled)' : ''}</div><div class="small-muted">${h.isSplitHand ? 'Split hand' : 'Main hand'}</div>`;
      const right = document.createElement('div');
      right.className = 'hand-info';
      right.textContent = `Value: ${handValue(h.cards)}`;

      header.appendChild(left);
      header.appendChild(right);

      const cardsDiv = document.createElement('div');
      cardsDiv.className = 'cards';
      for (const c of h.cards) {
        cardsDiv.appendChild(createCardElement(c));
      }

      const foot = document.createElement('div');
      foot.className = 'small-muted';
      if (h.finished) foot.textContent = 'Finished';
      else foot.textContent = (idx === currentHandIndex && roundActive) ? 'Your turn' : '';

      wrapper.appendChild(header);
      wrapper.appendChild(cardsDiv);
      wrapper.appendChild(foot);

      playerHandsEl.appendChild(wrapper);
    });
  }

  function setMessage(msg, important=false) {
    messagesEl.innerHTML = `<div class="${important ? 'decision' : ''}">${msg}</div>`;
  }

  function updateBankrollDisplay() {
    cashEl.textContent = cash;
  }

  function enableActionButtons(enable = true) {
    hitBtn.disabled = !enable;
    standBtn.disabled = !enable;
    doubleBtn.disabled = !enable;
    splitBtn.disabled = !enable;
    surrenderBtn.disabled = !enable;
  }

  // Game flow
  function startRound(bet) {
    roundActive = true;
    dealerHoleFaceDown = true;
    resetDeckIfNeeded();
    dealerHand = [];
    playerHands = [];
    currentHandIndex = 0;
    setMessage('Dealing...');

    // initial player hand
    const hand = { cards: [], bet: bet, finished: false, isSplitHand:false, doubled:false, surrendered:false };
    playerHands.push(hand);

    // deal
    hand.cards.push(draw());
    dealerHand.push(draw());
    hand.cards.push(draw());
    dealerHand.push(draw());

    // enable appropriate buttons
    renderAll();

    // check availability for split and double
    checkActionAvailability();

    // Check immediate blackjack
    if (isBlackjack(hand.cards)) {

      // reveal dealer card
      dealerHoleFaceDown = false;
      renderAll();

      // if dealer has blackjack -> push, else player wins 1.5x
      if (isBlackjack(dealerHand)) {
        setMessage('Both have Blackjack. Push (tie).', true);
      } 
      else {
        const payout = Math.floor(hand.bet * 1.5);
        cash += hand.bet + payout; // return bet + winnings
        setMessage(`Blackjack! You win ${payout} CHF.`, true);
      }

      roundActive = false;
      endRoundCleanup();

    } 
    else {
      setMessage('Your move. Hit, Stand, Double Down, Split, or Forfeit.');
      enableActionButtons(true);
    }
  }

  function resetDeckIfNeeded() {
    if (!deck || deck.length < 15) {
      resetDeck();
    }
  }

  function checkActionAvailability() {
    const h = playerHands[currentHandIndex];

    // Double down allowed only if first two cards and enough cash
    doubleBtn.disabled = !(h.cards.length === 2 && cash >= h.bet);

    // Split allowed only if first two cards and same rank and enough cash and haven't split already for this round
    let canSplit = false;
    if (h.cards.length === 2 && cash >= h.bet) {
      const r0 = h.cards[0].rank, r1 = h.cards[1].rank;

      // treat 10,J,Q,K as same for splitting
      if (r0 === r1) canSplit = true;
    }
    // disallow split if there is already a split in this round (single split only)
    const alreadySplit = playerHands.some(p => p.isSplitHand);
    splitBtn.disabled = !(canSplit && !alreadySplit);

    // Hit and Stand available
    hitBtn.disabled = false;
    standBtn.disabled = false;
    surrenderBtn.disabled = !(h.cards.length === 2); // forfeit allowed only as first decision (before hitting)
  }

  function renderAll() {
    renderDealer();
    renderPlayerHands();
    updateBankrollDisplay();
  }

  function nextHandOrDealer() {

    // move to next unfinished hand
    for (let i = 0; i < playerHands.length; i++) {
      if (!playerHands[i].finished && !playerHands[i].surrendered) {
        currentHandIndex = i;
        checkActionAvailability();
        renderAll();
        return;
      }
    }
    // no player hands left to play -> dealer turn
    dealerTurn();
  }

  function playerHit() {
    if (!roundActive) return;
    const h = playerHands[currentHandIndex];
    h.cards.push(draw());
    renderAll();
    const val = handValue(h.cards);
    if (val > 21) {
      // bust
      h.finished = true;
      setMessage(`Hand ${currentHandIndex + 1} busted with ${val}.`);
      enableActionButtons(false);

      // small delay and continue to next hand
      setTimeout(() => {
        nextHandOrDealer();
      }, 600);
    } 
    else if (val === 21) {
      h.finished = true;
      setMessage(`Hand ${currentHandIndex + 1} reached 21.`);
      enableActionButtons(false);
      setTimeout(() => nextHandOrDealer(), 600);
    } 
    else {
      // still playable
      checkActionAvailability();
      setMessage('You hit. Choose next action.');
    }
  }

  function playerStand() {
    if (!roundActive) return;
    const h = playerHands[currentHandIndex];
    h.finished = true;
    setMessage(`You stand on ${handValue(h.cards)}.`);
    enableActionButtons(false);
    setTimeout(() => nextHandOrDealer(), 1000);
  }

  function playerDouble() {
    if (!roundActive) return;
    const h = playerHands[currentHandIndex];
    if (h.cards.length !== 2 || cash < h.bet) {
      setMessage('Cannot double down now.');
      return;
    }

    // take extra bet immediately
    cash -= h.bet;
    h.bet *= 2;
    h.doubled = true;
    h.cards.push(draw());
    h.finished = true;
    renderAll();
    setMessage('Doubled down. One card dealt, then standing.');
    enableActionButtons(false);
    setTimeout(() => nextHandOrDealer(), 1000);
  }

  function playerSurrender() {
    if (!roundActive) return;
    const h = playerHands[currentHandIndex];
    if (h.cards.length !== 2) { setMessage('Surrender only allowed as first decision.'); return; }
    
    // surrender: lose half bet, end hand
    const lost = Math.ceil(h.bet / 2);
    setMessage(`You surrendered this hand and lose ${lost} CHF.`);
    h.surrendered = true;
    h.finished = true;
    
    // no return of bet: we already deducted bet at placing time, so just do not pay anything back; but we will refund half to player
    cash += (h.bet - lost); // refund half of bet
    
    // mark this hand as finished and continue
    enableActionButtons(false);
    setTimeout(() => nextHandOrDealer(), 400);
  }

  function playerSplit() {
    if (!roundActive) return;
    const h = playerHands[currentHandIndex];
    if (h.cards.length !== 2) { setMessage('Can only split with exactly two cards.'); return; }
    if (cash < h.bet) { setMessage('Not enough cash to split.'); return; }
    const r0 = h.cards[0].rank, r1 = h.cards[1].rank;
    if (r0 !== r1) { setMessage('Cards must be same rank to split.'); return; }

    // take additional bet equal to original bet
    cash -= h.bet;

    const cardToMove = h.cards.pop();
    const newHand = { cards: [cardToMove], bet: h.bet, finished: false, isSplitHand: true, doubled:false, surrendered:false };
    h.isSplitHand = true;

    // deal one card to each hand
    h.cards.push(draw());
    newHand.cards.push(draw());

    // insert new hand right after current hand; we will play current then new hand
    playerHands.splice(currentHandIndex + 1, 0, newHand);
    renderAll();
    setMessage('Hand split into two hands. Play them in order.');
    checkActionAvailability();
  }

  // Dealer
  function dealerTurn() {
    dealerHoleFaceDown = false;
    renderAll();
    setMessage('Dealer plays...');

    // Dealer draws until 17 or higher. Treat Ace as 11 where possible (soft 17 stand).
    const drawLoop = () => {
      const val = handValue(dealerHand);
      if (val < 17) {
        dealerHand.push(draw());
        renderAll();
        setTimeout(drawLoop, 600);
      } else {
        
        // stop and resolve
        setTimeout(resolveRound, 1000);
      }
    };
    setTimeout(drawLoop, 700);
  }

  // Resolve payouts for each player hand
  function resolveRound() {
    dealerHoleFaceDown = false;
    renderAll();
    const dealerVal = handValue(dealerHand);
    let messages = [];

    playerHands.forEach((h, idx) => {
      const hv = handValue(h.cards);
      let result = '';
      if (h.surrendered) {
        result = `Hand ${idx+1}: surrendered (half bet lost).`;
        messages.push(result);
        return;
      }
      if (hv > 21) {
        result = `Hand ${idx+1}: busted with ${hv}. You lose ${h.bet} CHF.`;
      } 
      else if (isBlackjack(h.cards) && !isBlackjack(dealerHand)) {
        const win = Math.floor(h.bet * 1.5);
        cash += h.bet + win;
        result = `Hand ${idx+1}: Blackjack! You win ${win} CHF.`;
      } 
      else if (isBlackjack(h.cards) && isBlackjack(dealerHand)) {
        
        // push
        cash += h.bet;
        result = `Hand ${idx+1}: Push. Bet returned.`;
      } else if (dealerVal > 21) {
        
        // dealer bust -> player wins
        cash += h.bet * 2;
        result = `Hand ${idx+1}: Dealer busted (${dealerVal}). You win ${h.bet} CHF.`;
      } 
      else if (hv > dealerVal) {
        cash += h.bet * 2;
        result = `Hand ${idx+1}: You ${hv} vs Dealer ${dealerVal}. You win ${h.bet} CHF.`;
      } 
      else if (hv === dealerVal) {
        cash += h.bet;
        result = `Hand ${idx+1}: Push (${hv}). Bet returned.`;
      } 
      else {
        result = `Hand ${idx+1}: You ${hv} vs Dealer ${dealerVal}. You lose ${h.bet} CHF.`;
      }
      messages.push(result);
    });

    setMessage(messages.join('<br>'), true);
    roundActive = false;
    endRoundCleanup();
  }

  function endRoundCleanup() {
    enableActionButtons(false);
    newRoundBtn.classList.remove('hidden');
    placeBetBtn.disabled = false;
    betInput.disabled = false;
    renderAll();
  }

  // Event wiring
  placeBetBtn.addEventListener('click', () => {
    const bet = Math.max(1, Math.floor(Number(betInput.value) || 0));
    if (bet <= 0) { setMessage('Enter a bet >= 1'); return; }
    if (bet > cash) { setMessage('Insufficient funds! (Skill issue tbh)'); return; }
    
    // deduct bet now
    cash -= bet;
    updateBankrollDisplay();
    placeBetBtn.disabled = true;
    betInput.disabled = true;
    newRoundBtn.classList.add('hidden');
    startRound(bet);
  });

  hitBtn.addEventListener('click', () => playerHit());
  standBtn.addEventListener('click', () => playerStand());
  doubleBtn.addEventListener('click', () => playerDouble());
  splitBtn.addEventListener('click', () => playerSplit());
  surrenderBtn.addEventListener('click', () => playerSurrender());

  newRoundBtn.addEventListener('click', () => {
    
    // cleanup and allow new bet
    dealerHand = [];
    playerHands = [];
    dealerCardsEl.innerHTML = '';
    playerHandsEl.innerHTML = '';
    messagesEl.innerHTML = '';
    newRoundBtn.classList.add('hidden');
    placeBetBtn.disabled = false;
    betInput.disabled = false;
    enableActionButtons(false);
    renderAll();
  });

  // initialization
  function init() {
    resetDeck();
    updateBankrollDisplay();
    enableActionButtons(false);
    setMessage('Place your bet to start a round.');
  }

  init();
  //addCash console command
  window.addCash = function(amount) {
  if (isNaN(amount) || amount <= 0) {
    console.warn  ("Usage: addCash(<positive number>)");
    return;
  }
  cash += amount;
  updateBankrollDisplay();
  console.log(`💰 Added ${amount} CHF. New balance: ${cash} CHF`);
};
})();