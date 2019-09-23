export const ADD = 'ADD';
export const SUB = 'SUB';
export const SET = 'SET';
export const MOVE = 'MOVE';
export const GOTO = 'GOTO';
export const COND_GOTO = 'COND_GOTO';
export const OR = 'OR';
export const LOAD = 'LOAD';
export const WRITE = 'WRITE';
export const ERROR = 'ERROR';
export const TOGGLE = 'TOGGLE';
export const MOVE_PRINTER = 'MOVE_PRINTER';
export const PAINT = 'PAINT';
export const INIT = 'INIT';
export const RESET = 'RESET';

const initialState = {
  memory: Object.seal(new Array(106).fill(0)), // [0, 100] users control, 101, 102, 103, 104 reserved, 105 free
  registers: Object.seal(new Array(3).fill(0)), // R1, R2, R3. General purpose registers
  //pastStates: [],
  pc: 0,
  running: false,
  painting: new Array(20).fill(0),
  width: 0,
  height: 0
}

function updateItemInArray(array, index, newVal) {
  return array.map((item, i) => {
    // Replace the item at index 2
    if(i === index) {
      return newVal;
    }

    // Leave every other item unchanged
    return item;
  });
}

export const init = (height, width, colors) => async dispatch => {
  dispatch({ type: INIT, payload: {height, width} });
}

export const add = (Ri, Rj, Rk) => async dispatch => {
  dispatch({ type: ADD, payload: {Ri, Rj, Rk} });
}

export const sub = (Ri, Rj, Rk) => async dispatch => {
  dispatch({ type: SUB, payload: {Ri, Rj, Rk} });
}

export const set = (Ri, value) => async dispatch => {
  dispatch({ type: SET, payload: {Ri, value} });
}

export const move = (Ri, Rj) => async dispatch => {
  dispatch({ type: MOVE, payload: {Ri, Rj} });
}

export const goto = (Mi) => async dispatch => {
  dispatch({ type: GOTO, payload: {Mi} });
}

export const cond_goto = (Ri, Rj, Mi) => async dispatch => {
  dispatch({ type: COND_GOTO, payload: {Ri, Rj, Mi} });
}

export const or = (Ri, Rj, Rk) => async dispatch => {
  dispatch({ type: OR, payload: {Ri, Rj, Rk} });
}

export const load = (Mi, Ri) => async dispatch => {
  dispatch({ type: LOAD, payload: {Mi, Ri} });
}

export const write = (Ri, Mi) => async dispatch => {
  dispatch({ type: WRITE, payload: {Ri, Mi} });
}

export const toggle = () => async dispatch => {
  dispatch({ type: TOGGLE });
}

export const movePrinter = (index, value) => async dispatch => {
  await dispatch({ type: PAINT });
  await dispatch({ type: MOVE_PRINTER, payload: {index, value}});
}

export const reset = () => async dispatch => {
  await dispatch({ type: RESET });
}


export default (state = initialState, action) => {
  //let pastStates = state.pastStates;
  //pastStates.push({memory: state.memory, registers: state.registers, currentMem: state.currentMem});
  const regs = state.registers;
  let newVal;
  let Ri, Rj, Rk;
  let pc = state.pc + 1; // pointing to next instruction

  switch (action.type) {
    case ADD:
    Ri = action.payload.Ri - 1;
    Rj = action.payload.Rj - 1;
    Rk = action.payload.Rk - 1;
    newVal = regs[Ri] + regs[Rj];
    return {
      ...state,
      registers: updateItemInArray(regs, Rk, newVal),
      //pastStates,
      pc
    }

    case SUB:
    Ri = action.payload.Ri - 1;
    Rj = action.payload.Rj - 1;
    Rk = action.payload.Rk - 1;
    newVal = regs[Ri] - regs[Rj];
    return {
      ...state,
      registers: updateItemInArray(regs, Rk, newVal),
      //pastStates,
      pc
    }

    case SET:
    Ri = action.payload.Ri - 1;
    newVal = action.payload.value;
    return {
      ...state,
      registers: updateItemInArray(regs, Ri, newVal),
      //pastStates,
      pc
    }

    case MOVE:
    Ri = action.payload.Ri - 1;
    Rj = action.payload.Rj - 1;
    return {
      ...state,
      registers: updateItemInArray(regs, Rj, regs[Ri]),
      //pastStates,
      pc
    }

    case GOTO:
    pc = action.payload.Mi;
    return {
      ...state,
      //pastStates,
      pc
    }

    case COND_GOTO:
    Ri = action.payload.Ri - 1;
    Rj = action.payload.Rj - 1;

    if (regs[Ri] > regs[Rj]) {
      pc = action.payload.Mi;
    }
    return {
      ...state,
      //pastStates,
      pc
    }

    case OR:
    newVal = regs[action.payload.Ri - 1] | regs[action.payload.Rj - 1];
    return {
      ...state,
      //pastStates,
      registers: updateItemInArray(regs, action.payload.Rk - 1, newVal),
      pc
    }

    case LOAD:
    return {
      ...state,
      //pastStates,
      registers: updateItemInArray(regs, action.payload.Ri - 1, state.memory[action.payload.Mi]),
      pc
    }

    case WRITE:
    return {
      ...state,
      //pastStates,
      memory: updateItemInArray(state.memory, action.payload.Mi, regs[action.payload.Ri - 1]),
      pc
    }

    case TOGGLE:
    return {
      ...state,
      running: !state.running
    }

    case MOVE_PRINTER:
    return {
      ...state,
      memory: updateItemInArray(state.memory, action.payload.index, action.payload.value)
    }

    case PAINT:
    const ourPainting = state.painting;
    if (state.memory[103]) {
      console.log("Painting: ", state.memory[103], state.memory[102], updateItemInArray(ourPainting, state.memory[102], state.memory[103]))
    }
    return {
      ...state,
      painting: updateItemInArray(ourPainting, state.memory[102], state.memory[103])
    }

    case INIT:
    const height = parseInt(action.payload.height);
    const width = parseInt(action.payload.width);
    const painting = new Array(height*width).fill(0);
    return {
      ...state,
      painting: painting,
      width: width,
      height: height,
      colors: action.payload.colors
    }

    case RESET:
     return initialState;
    default:
    return state
  }
}

