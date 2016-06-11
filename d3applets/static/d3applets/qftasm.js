var program = [];
var opnames = ["MNZ","MLZ","ADD","SUB","XOR"];

$(document).ready(function(){ set_code(); });

function set_code() {
    console.log("Ding!");
    var code = $('#asm-code').val();
    var lines = code.split("\n");
    new_program = [];
    
    for (var i=0; i<lines.length; i++) {
        var nocomment = lines[i].split(";")[0];
        console.log(nocomment);
        
        var table_row = $('<tr></tr>');
        table_row.append($('<td colspan=2 class="asm">'+nocomment+'</td>'));
        
        var parts = nocomment.split(" ");
        new_program.push({"line-num": parts[0].slice(0,parts[0].length-1),
                          "opname": parts[1],
                          "opcode": opnames.indexOf(parts[1]).toString(2),
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
            
            loc_str = loc >= 0 ? ("00000000"+loc.toString(2)).slice(-8) : "-"+("00000000"+(-loc).toString(2)).slice(-8);
            
            table_row.append($('<td>'+("00"+type.toString(2)).slice(-2)+'</td>'));
            table_row.append($('<td>'+loc_str+'</td>'));
        }
        
        $('#machine-code').append(table_row);
    }
    
    program = new_program;
    console.log("Dong!");
}