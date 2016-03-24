import urllib.request as ur
import html.parser as hp

def parseConvos(roomNum=240, year=2016, month=3, day=23, hourStart=0, hourEnd=24):
    urlTemp = "http://chat.stackexchange.com/transcript/"+"{}/"*4+"{}-{}"
    url = urlTemp.format(*[roomNum, year, month, day, hourStart, hourEnd])

    print(url)

    text = ur.urlopen(url).read().decode('utf-8')

    class parser(hp.HTMLParser):
        def __init__(self, *args, **kwargs):
            super().__init__()
            self.numTags = 0
            self.numText = 0
            self.state = ""
            self.names = {}
            self.messages = {}

        def handle_starttag(self, tag, attrs):
            if tag in ("div","a"):
                self.numTags += 1
                if attrs[0][1].startswith("monologue"):
                    uid = int(attrs[0][1][15:].rstrip(" mine"))
                    self.currUser = uid
                    if uid not in self.names:
                        self.state = "need name"
                    
                elif attrs[0][1] == "message":
                    mid = int(attrs[1][1].split('-')[1])
                    self.messages[mid] = {'uid':self.currUser,
                                          'name':self.names[self.currUser]}
                    self.currMess = mid

                elif attrs[0][1] == "reply-info":
                    rid = int(attrs[1][1].split('#')[1])
                    self.messages[self.currMess]["rid"] = rid

                elif attrs[0][1] == "username" and self.state == "need name":
                    self.state = "get name"

                elif attrs[0][1] == "content":
                    self.state = "content"

                elif attrs[0][1].startswith("onebox") and self.state == "content":
                    self.messages[self.currMess]["content"] = "<<onebox>>"
                    self.state = ""

        def handle_data(self, data):
            if self.state == "content":
                self.numText += 1
                self.state = ""
                self.messages[self.currMess]["content"] = data.strip()

            if self.state == "get name":
                self.state = ""
                self.names[self.currUser] = data.strip()

    p = parser()
    p.feed(text)


    groups = []
    for mid, val in sorted(p.messages.items()):
        if "rid" in val:
            rid = val["rid"]
            found = 0
            for g in groups:
                if rid in g:
                    g.append(mid)
                    found = 1

            if not found: groups.append([rid,mid])

    groups2 = sorted(groups, key=lambda x:len(x), reverse=True)

    return {'groups':groups, 'sorted':groups2, 'messages':p.messages}

if __name__ == '__main__':
    stuff = parseConvos()
