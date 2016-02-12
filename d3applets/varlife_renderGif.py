### https://en.wikipedia.org/wiki/GIF#Example_GIF_file

def createGif(gridData, colorData, width, height, cellSize, frameDuration, filepath):

    fileString = '474946383961' #b'GIF89a', the header
    W = hex(width*cellSize)[2:].zfill(4)
    W = W[2:4] + W[:2]
    H = hex(height*cellSize)[2:].zfill(4)
    H = H[2:4] + H[:2]
    fileString += W #width, 3 px
    fileString += H #height, 5 px

    from math import log, ceil

    numColors = len(colorData)+1
    paletteSize = max(2**ceil(log(numColors,2)),8)
    ##fileString += hex(paletteSize)[2:].zfill(2) #number of colors

    ### Ctrl+F "18. Logical Screen Descriptor" here:
    ### https://www.w3.org/Graphics/GIF/spec-gif89a.txt
    fileString += 'F' + hex(ceil(log(paletteSize,2))-1)[2:]

    fileString += hex(numColors)[2:].zfill(2) #background color is n+2 (black)
    fileString += '00' #default pixel aspect ratio

##    fileString += '000000' #color #1, black
##    fileString += 'FFFFFF' #color #2, white
##    fileString += '000000' #color #3, transparent
##    fileString += 'FF0000' #color #4, red
##    fileString += '00FF00' #color #4, green
##    fileString += '0000FF' #color #4, blue
    
    for color in colorData: fileString += color[1:]
    fileString += '808080' #gray border

    for i in range(numColors, paletteSize): fileString += '000000' #buffer

    fileString += '21FF' #Application Extension block
    fileString += '0B' #eleven bytes of data follow
    fileString += '4E45545343415045322E30' #NETSCAPE2.0

    fileString += '03' #three more bytes of data
    fileString += '01' #data sub-block index (always 1)
    fileString += 'FFFF' #unsigned number of repetitions - 65536
    fileString += '00' #end of App Ext block

    def LZWencode(S, b, debug=0):
        #http://www.matthewflickinger.com/lab/whatsinagif/lzw_image_data.asp
        offset = 2**b
        table = [[i] for i in range(offset)] + ["CLEAR", "STOP"]
        oldT = table[:]
        oldS = S[:]
        L,S = S[:1], S[1:] #init
        codes = [offset]
        nb = b+1
        bits = bin(offset)[2:].zfill(nb)

        while S:
            L.append(S.pop(0)) #read
    ##        print("Read: ",L[:-1],L[-1])
            if L in table: #found
    ##            print("Found: ",L)
                pass
            else:
    ##            print("Not Found: ",L[:-1],L[-1])
                if len(table) == 4095:
                    print("!!!")
                    pass
                else:
                    pad = ceil(log(len(table),2))
                    if len(L) >= 2: table.append(L)#; print("table: ",table)
                    L,P = L[-1:], L[:-1]

                    codes.append(table.index(P))
                    bits = bin(table.index(P))[2:].zfill(pad) + bits
##                print(bin(table.index(P))[2:].zfill(pad))
##                print(pad)
##                print(bits)
    ##            print("codes: ",codes)

##                if len(table) >= 2**nb: nb+=1

        pad = ceil(log(len(table),2))
        
        if L in table:
            codes.append(table.index(L))
            bits = bin(codes[-1])[2:].zfill(pad) + bits
        else:
            codes.append(table.index(L[:-1]))
            bits = bin(codes[-1])[2:].zfill(pad) + bits
            codes.append(L[-1])
            bits = bin(codes[-1])[2:].zfill(pad) + bits

        codes.append(offset+1)
        bits = bin(offset+1)[2:].zfill(pad) + bits

##        print(codes)
##        print(bits)

        return bits

    frameStart = ''
    frameStart += '21F9' #Graphic Control Extension

    frameStart += '04' #4 bytes of GCE data follow

    frameStart += '00' #no action taken
    
    F = hex(frameDuration//10)[2:].zfill(4)
    F = F[2:4] + F[:2]
    frameStart += F #delay for animation in multiples of 0.01 sec
    frameStart += '00' #no transparency #hex(numColors)[2:].zfill(2) #color n+1 is transparent
    frameStart += '00' #end of GCE block

    frameStart += '2C' #Image Descriptor

    frameStart += '00000000' #(0,0), top left corner of image in logical screen
    frameStart += W+H #image width and height in pixels (little endian)

    frameStart += '00' #no local color table

    print(len(gridData))
    print(len(gridData[0]))
    print(len(gridData[0][0]))

    numFrames = len(gridData)-2
    for i in range(numFrames):
        fileString += frameStart

        numBits = ceil(log(paletteSize,2))
        fileString += hex(numBits)[2:].zfill(2) #start of image - LZW minimum code size

        ##colorSeq = [0,1,1,1,0,1,1,1,1,1,1,1,1,1,1]
        ##colorSeq = [3]*15
        ##numBits = ceil(log(numColors,2))
        ##
        ##colorSeq = [2**numBits+0] + colorSeq + [2**numBits+1] #clear at the start, end at the end

        ##colorSeq = [256,40] + [255]*3 + [40] + [255]*10 + [257]
        ##numBits = 8

##        colorSeq = sum(gridData[i],[])
        colorSeq = []
        for y in range(height):
            colorSeq.extend([numColors]*(width*cellSize))
            temp = []
            for x in range(width):
                temp.append(numColors)
                temp.extend([gridData[i][y][x]]*8)
                temp.append(numColors)

            colorSeq.extend(temp*8)
            
            colorSeq.extend([numColors]*(width*cellSize))
            
        print(len(colorSeq))
        bitString = LZWencode(colorSeq, numBits)
        ##LZW = ([0,2**numBits,1,3,2**numBits]*5, numBits+1)
##        codeSeq = [2**numBits] + LZW[0] + [2**numBits+1]

##        bitString = ''
##        for c in codeSeq:
####            print(bin(c)[2:].zfill(LZW[1]))
##            bitString = bin(c)[2:].zfill(LZW[1]) + bitString

##        print(bitString)

        bitString = bitString.zfill(ceil(len(bitString)/8)*8)
        byteString = ''
        for i in range(len(bitString)//8):
            bits = bitString[i*8:i*8+8]
            byteString = hex(int(bits,2))[2:].zfill(2) + byteString

##        print(byteString)
        while len(byteString):
            fileString += hex(len(byteString[:510])//2)[2:].zfill(2) #number of LZW-encoded bytes
            fileString += byteString[:510]
            byteString = byteString[510:]

        fileString += '00' #end of image data

    fileString += '3B' #GIF file terminator

    with open(filepath, mode='wb') as f:
        f.write(bytes.fromhex(fileString))
