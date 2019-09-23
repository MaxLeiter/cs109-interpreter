import React from 'react'
import { render } from 'react-dom';
import brace from 'brace';
import AceEditor from 'react-ace';
import { connect } from 'react-redux';
import 'brace/mode/assembly_x86';
import 'brace/theme/monokai';
import CustomAsm from "./CustomAsm.js";
import {
  add,
  ADD,
  sub,
  SUB,
  set,
  SET,
  move,
  MOVE,
  goto,
  GOTO,
  cond_goto,
  COND_GOTO,
  or,
  OR,
  load,
  LOAD,
  write,
  WRITE,
  toggle,
  movePrinter,
  init,
  reset
} from '../../modules/cpu';

import TextTransition, { presets } from "react-text-transition";

const solution = `SET R1 5
WRITE R1 M101
LOAD M102 R2
COND_GOTO R1 R3 M2
SET R1 1 //color red
WRITE R1 M103 //paint red
LOAD M104 R3 //get current thickness value
COND_GOTO R2 R3 M8 //if desired > current, go to last one
SET R1 0
WRITE R1 M103
SET R1 15
WRITE R1 M101
LOAD M102 R2
COND_GOTO R1 R2 M12
SET R1 2 //color green
SET R2 1 //desired thickness value
WRITE R1 M103 //paint green
LOAD M104 R3 //get current thickness value
SET R1 0
WRITE R1 M103
SET R1 20
WRITE R1 M101
`;

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      value: solution || ''
    };
    this.interpreter = this.interpreter.bind(this);
    this.unclean = this.unclean.bind(this);
    this.aceEditor = React.createRef();
    this.xInput = React.createRef();
    this.yInput = React.createRef();
    this.renderGrid = this.renderGrid.bind(this);
    this.getColor = this.getColor.bind(this);
  }

  unclean(line) {
    const split_line = line.toLowerCase().split(" ");
    const command = split_line[0];
    split_line.shift();
    switch (command) {
      case ADD:
        if (split_line.length != 3) {
          return "invalid # of params";
        }
        if (!split_line[0].startsWith("r") || !split_line[1].startsWith("r")|| !split_line[2].startsWith("r")) {
          return "invalid params"
        }
      break;
    }
  }

  // the main loop / computer
  async interpreter(step) {
    await this.props.toggle();
    const lines = this.state.value.toLowerCase().split("\n");
    while (this.props.cpu.running) {
      for (let i = this.props.cpu.pc; i < lines.length && this.props.cpu.running; i++) {
        let line = lines[i];
        const needToClean = line.indexOf(";"); // comment
        if (needToClean > -1) {
          line = line.substring(0, needToClean);
        }
        line = line.trim();
        const split_line = line.split(" ");
        const command = split_line[0];
        split_line.shift();
        split_line = split_line.map((e) => {
          if (e.startsWith("r")) {
            return Number(e.substring(1, 2));
          } else if (e.startsWith("m")) {
            return Number(e.substring(1, e.length));
          } else {
            return Number(e);
          }
        });

        if (command.toUpperCase() === GOTO) {
            this.refs.aceEditor.editor.gotoLine(split_line[0]);
        } else if (command.toUpperCase() === COND_GOTO) {
            this.refs.aceEditor.editor.gotoLine(this.props.cpu.registers[split_line[0]] > this.props.cpu.registers[split_line[1]] ? split_line[2] : this.props.cpu.pc+2);
        } else {
            this.refs.aceEditor.editor.gotoLine(this.props.cpu.pc+1); // 1 for 0 indexed and 1 for next line
        }
        this.refs.aceEditor.editor.execCommand("gotolineend");

        switch (command.toUpperCase()) {
         case ADD:
          await this.props.add(split_line[0].substring(1, 1), split_line[1].substring(1, 1), split_line[2].substring(1, 1));
         break;
         case SUB:
          await this.props.sub(split_line[0], split_line[1], split_line[2]);
         break;
         case SET:
          await this.props.set(split_line[0], split_line[1]);
         break;
         case MOVE:
          await this.props.move(split_line[0], split_line[1]);
         break;
         case GOTO:
          await this.props.goto(split_line[0]);
         break;
         case COND_GOTO:
         await this.props.cond_goto(split_line[0], split_line[1], split_line[2]);
         break;
         case OR:
         await this.props.or(split_line[0], split_line[1], split_line[2]);
         break;
         case LOAD:
         await this.props.load(split_line[0], split_line[1]);
         break;     
         case WRITE:
         await this.props.write(split_line[0], split_line[1]);
         break;
         default:
          // 
          return;
         break;
       }
        if (step) {
          await this.props.toggle();
          return;
       }
       if (this.props.cpu.memory[101] < this.props.cpu.memory[102]) {
        await this.props.movePrinter(102, this.props.cpu.memory[102] - 1);
       } else if (this.props.cpu.memory[101] > this.props.cpu.memory[102]) {
        await this.props.movePrinter(102, this.props.cpu.memory[102] + 1);
       } else { // equal
        await this.props.movePrinter(102, this.props.cpu.memory[102]);
       }
       await this.sleep(800);
     }
   }
 }

sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async componentDidMount() {
  const customMode = new CustomAsm();
  this.refs.aceEditor.editor.getSession().setMode(customMode);
  await this.props.init(this.refs.xInput ? this.refs.xInput.value : 2, this.refs.yInput ? this.refs.yInput.value : 10);
}

async componentWillUnmount() {
  await this.props.reset();
}

getColor(index) {
  const color = this.props.cpu.painting[index];
  if (color === 0) {
    return 'white';
  } else if (color === 1) {
    return 'red';
  } else if (color === 2) {
    return 'green';
  } else if (color === 3) {
    return 'blue';
  } else {
    return 'white';
  }
}

renderGrid() {
  if (this.props.cpu.painting.length < 2) {
    return;
  }
  let element = "<table>";
  for (let i = 0; i < this.props.cpu.height; i++) {
    element += "<tr>";
    for (let j = 0; j < this.props.cpu.width; j++) {
      //if ((i + 1)*(j + 1) - 1 === this.props.cpu.memory[102]) {
     //   element += `<td style="opacity: .5; background-color: ${this.getColor((i + 1)*(j + 1) - 1)}"> ${i + 1*j + 1} </td>`;
      //} else 
      if (i % 2 == 0) {
        element += `<td style="background-color: ${this.getColor((i + 1)*(j + 1) - 1)}"> ${i + 1*j + 1} </td>`;
      } else {
        element += `<td style="background-color: ${this.getColor((i + 1)*(j + 1) - 1)}"> ${this.props.cpu.height * this.props.cpu.width - (i*j)} </td>`;
      }
    }
    element += "</tr>"
  }
  element += "</table>";
  return <div dangerouslySetInnerHTML={{__html: element}}/>;
 }


 render() {
  return (
    <div>
    <header style={{width: '100%', backgroundColor: 'black', color: '#fff'}}>
    CS109 Interpreter - by <a style={{color: 'orange'}} href="https://maxleiter.com">Max Leiter</a> <a style={{color: 'orange'}}  href="https://github.com/MaxLeiter/cs109-interpreter"> (Source) </a>
    </header>
    <div className="parent">
      <div className="item first">
        <div className="controls">
              {/*style={{height: this.refs && this.refs.aceEditor ? this.refs.aceEditor.refEditor.clientHeight : 652}*/}

          <button className="controls-item" onClick={() => this.interpreter(false)}> Run </button>
          <button className="controls-item" onClick={() => this.interpreter(true)}> Step </button>
          <button className="controls-item" disabled={this.props.cpu.pc === 0} onClick={() => this.interpreter(false)}> {this.props.cpu.running ? "Stop" : "Continue"} </button>
          <button className="controls-item" disabled={this.props.cpu.pc === 0} onClick={async () => {const height = this.props.cpu.height; const width = this.props.cpu.width; await this.props.reset(); await this.props.init(height, width)}}> Restart </button>

        </div>
          <AceEditor
          ref="aceEditor"
          mode="assembly_x86"
          theme="monokai"
          value={this.state.value}
          onChange={(newValue) => this.setState({value: newValue})}
          name="aceEditor"
          editorProps={{$blockScrolling: true}}
          setOptions={{firstLineNumber: 0, maxLines: 100, minLines: 40, style: {overflowY: 'scroll'}}}
          />
      </div>
      <div className="item last">
        <div className="item-inner">
        Size of image: <input ref="xInput" style={{width: 30}} defaultValue={2} /> x <input ref="yInput" defaultValue={10} style={{width: 30}}/>
        <button style={{marginLeft: 10}} onClick={() => this.props.init(this.refs.xInput ? this.refs.xInput.value : 2, this.refs.yInput ? this.refs.yInput.value : 10)}> Render & Reset </button>
        {this.renderGrid()}
        </div>
        <pre>
        PC: M{this.props.cpu.pc} <br />
        M101: <TextTransition inline={true} text={this.props.cpu.memory[101]} />              R1: <TextTransition inline={true} text={this.props.cpu.registers[0]} />  <br />
        M102: <TextTransition inline={true} text={this.props.cpu.memory[102]} />              R2: <TextTransition inline={true} text={this.props.cpu.registers[1]} />  <br />
        M103: <TextTransition inline={true} text={this.props.cpu.memory[103]} />              R3: <TextTransition inline={true} text={this.props.cpu.registers[2]} />  <br />
        M104: <TextTransition inline={true} text={this.props.cpu.memory[104]} />  <br />
        M105: <TextTransition inline={true} text={this.props.cpu.memory[105]} />  <br />
        <br />
              Instruction set:<br />
              <pre>
              ADD​ Ri Rj Rk <br />
              SUB​ Ri Rj Rk<br />
              SET​ Ri value<br />
              MOVE​ Ri Rj<br />
              GOTO​ Mi<br />
              COND_GOTO​ Ri Rj Mi<br />
              OR​ Ri Rj Rk<br />
              LOAD​ Mi Ri<br />
              WRITE​ Ri Mi<br />
              </pre>
              Registers: <pre>R1, R2, R3</pre><br />
              Memory: 
              <pre>
              M0...M100 R/W <br />M100...M104 Read
              </pre>
        </pre>
      </div>
      </div>
    </div>
    )
}
}

const mapStateToProps = state => {
  return {
    cpu: state.cpu,
  };
};

export default connect(
  mapStateToProps,
  {add, sub, set, move, goto, cond_goto, or, load, write, toggle, movePrinter, init, reset}
  )(App);