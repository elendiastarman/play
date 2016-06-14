var program = [];
var PC = [0,1];
var PCset = 0;
var stepnum = 0;
var RAM = [];
var bps_read = [];
var bps_write = [];

function bin(x) {
    return x >= 0 ? ("0000000000000000"+x.toString(2)).slice(-16) : ("1111111111111111"+((65535^-x)+1).toString(2)).slice(-16);
}

function addRAMslots(addr) {
    while (addr >= RAM.length) {
        RAM.push([0,0,0]);
        $('#ram-bank').append($('<tr><td>'+(RAM.length-1)+'</td><td>'+bin(RAM.length-1)+'</td><td>0</td><td>'+bin(0)+'</td><td>0</td><td>0</td></tr>'));
    }
}

function RAMwrite(addr, val) {
    addRAMslots(addr);
    
    if (val < 0) { val = (65535^-val)+1; }
    val = val && 65536; //16-bit words
    if (addr === 0) { PC[1] = val; }
    
    RAM[addr][0] = val;
    RAM[addr][2]++;
    var row = $('#ram-bank tr')[addr+1].children;
    $(row[2]).text(val);
    $(row[3]).text(bin(val));
    $(row[5]).text(RAM[addr][2]);
    
    if (bps_write.indexOf(addr)>=0){ console.log(addr+", "+bps_write); stop_code(); }
}

function RAMread(addr) {
    addRAMslots(addr);
    
    RAM[addr][1]++;
    $($('#ram-bank tr')[addr+1].children[4]).text(RAM[addr][1]);
    
    if (bps_read.indexOf(addr)>=0){ stop_code(); }
    
    return RAM[addr][0];
}

function MNZ(test, val, dest){ if (test){ RAMwrite(dest, val); } }
function MLZ(test, val, dest){ if (test<0 || test>=32768){ RAMwrite(dest, val); } }
function ADD(val1, val2, dest){ RAMwrite(dest, val1+val2); }
function SUB(val1, val2, dest){ RAMwrite(dest, val1-val2); }
function AND(val1, val2, dest){ RAMwrite(dest, val1&val2); }
function OR(val1, val2, dest){ RAMwrite(dest, val1|val2); }
function XOR(val1, val2, dest){ RAMwrite(dest, val1^val2); }
function ANT(val1, val2, dest){ RAMwrite(dest, val1&!val2); }
function SL(val1, val2, dest){ RAMwrite(dest, val1<<val2); }
function SRL(val1, val2, dest){ RAMwrite(dest, val1>>val2); }
function SRA(val1, val2, dest){ RAMwrite(dest, val1>>val2 + (val1>=32768?32768:0)); }

var opnames = ["MNZ","MLZ","ADD","SUB","AND","OR","XOR","ANT","SL","SRL","SRA"];

$(document).ready(function(){ set_code(); });

function set_code() {
    var code = $('#asm-code').val();
    var lines = code.split("\n");
    new_program = [];
    
    PC = [0, 1];
    PCset = 0;
    RAM = [];
    $($('#machine-code tr').slice(2)).remove();
    $($('#ram-bank tr').slice(1)).remove();
    $('#error').text("");
    $('#pc').text("0");
    
    for (var i=0; i<lines.length; i++) {
        var nocomment = lines[i].split(";")[0];
        
        var table_row = $('<tr></tr>');
        table_row.append($('<td colspan=2 class="asm">'+nocomment+'</td>'));
        
        var parts = nocomment.split(" ");
        
        if (opnames.indexOf(parts[1]) < 0){ $('#error').text("Command "+parts[1]+" on line "+i+" is invalid."); return; }
        
        new_program.push({"line-num": parts[0].slice(0,parts[0].length-1),
                          "opname": parts[1],
                          "opcode": opnames.indexOf(parts[1]),
                          "add1": parts[2],
                          "add2": parts[3],
                          "add3": parts[4]
                         });
        
        table_row.append($('<td colspan=2>'+("00000"+new_program[i]["opcode"].toString(2)).slice(-5)+'</td>'));
        
        for (var j=0; j<3; j++) {
            var type = ['','A','B','C'].indexOf(parts[j+2].slice(0,1));
            var loc;
            
            if (type<0) {
                type=0
                loc = parseInt(parts[j+2]);
            } else {
                loc = parseInt(parts[j+2].slice(1));
            }
            
            new_program[i]["add"+(j+1)+"_type"] = type
            new_program[i]["add"+(j+1)+"_loc"] = loc
            
            table_row.append($('<td>'+("00"+type.toString(2)).slice(-2)+'</td>'));
            table_row.append($('<td>'+bin(loc)+'</td>'));
        }
        
        $('#machine-code').append(table_row);
    }
    
    program = new_program;
    $($('#machine-code tr')[2]).addClass('highlight');
    $($('#machine-code tr')[3]).addClass('highlight2');
    enable_buttons();
}

function step_code() {
    if (PC[0] >= program.length) {
        $('#error').text("Program finished!");
        disable_buttons();
        stop_code();
        return;
    }
    
    stepnum++;
    var inst = program[PC[0]];
    var vals = [];
    
    $($('#machine-code tr')[PC[0]+2]).removeClass('highlight');
    $($('#machine-code tr')[PC[1]+2]).removeClass('highlight2');
    
    for (var i=0; i<3; i++) {
        var val = inst["add"+(i+1)+"_loc"];
        
        for (var j=0; j<inst["add"+(i+1)+"_type"]; j++) {
            val = RAMread(val);
        }
        
        vals.push(val);
    }
    
    PC[0] = PC[1];
    PC[1] = PC[0]+1;
    
    window[inst["opname"]](vals[0], vals[1], vals[2]);
    
    $('#pc').text(PC[0]);
    $($('#machine-code tr')[PC[0]+2]).addClass('highlight');
    $($('#machine-code tr')[PC[1]+2]).addClass('highlight2');
}

var code_timer;
function run_code(){
    if (!code_timer){
        code_timer = setInterval(step_code, 1);
        $('#run-code').html("Stop");
    } else {
        stop_code();
    }
}
function stop_code(){
    clearInterval(code_timer);
    code_timer = 0;
    $('#run-code').html("Run");
    $('#slow-code').html("Slow");
}
function slow_code(){
    if (!code_timer){
        code_timer = setInterval(step_code, $('#mspt').val());
        $('#slow-code').html("Stop");
    } else {
        stop_code();
    }
}

function enable_buttons(){
    $('#run-code').prop('disabled', false);
    $('#step-code').prop('disabled', false);
    $('#slow-code').prop('disabled', false);
}
function disable_buttons(){
    $('#run-code').prop('disabled', true);
    $('#step-code').prop('disabled', true);
    $('#slow-code').prop('disabled', true);
}

function set_breakpoints(){
    var bpsr = $('#breakpoints-read').val();
    var bpsw = $('#breakpoints-write').val();
    
    bps_read = bpsr ? bpsr.split(/[,]? /).map(Number) : [];
    bps_write = bpsw ? bpsw.split(/[,]? /).map(Number) : [];
}