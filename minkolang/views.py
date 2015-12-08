from django.shortcuts import render, redirect
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.core.urlresolvers import reverse
from django.core.exceptions import ObjectDoesNotExist, MultipleObjectsReturned

from django.template import Context, RequestContext
from django.template.loader import render_to_string
from django.utils.safestring import mark_safe
from django.views.decorators.csrf import csrf_exempt
import json

from minkolang.minkolang_0_14 import Program
from minkolang.minkolang_09 import Program as Program_old

import os
import sys
import urllib
import traceback
import subprocess
import multiprocessing
from multiprocessing.managers import BaseManager

import random
import string

global prgmT
prgmT = {}

global proxies
proxies = {}

global manager
manager = None

class MyManager(BaseManager): pass
MyManager.register('Program', Program)
MyManager.register('Program_old', Program_old)

def encodeURL(S):
    U = urllib.parse.quote_plus(S)
    return U.replace('(','%28').replace(')','%29').replace('.','%2E')

# Create your views here.
def main_view(request, **kwargs):
    global manager
    global prgmT
    global proxies

    if not manager:
        manager = MyManager()
        manager.start()
    
    context = RequestContext(request)
    context['code'] = '"Hello world!"$O.'
    context['code_lines'] = []
    context['permalink'] = '?code=%22Hello+world%21%22%24O%2E'

    if request.method == 'GET':

        if 'action' in request.GET and request.GET["action"] == "load":
            try:
                if sys.platform == 'win32':
                    filename = os.getcwd()+"\\minkolang\\Code Examples\\"+request.GET['name']+".mkl"
                elif sys.platform == 'linux':
                    filename = "/home/elendia/webapps/play/play/minkolang/Code Examples/"+request.GET['name']+".mkl"
                text = open(filename,'r').read()
            except Exception as e:
                print(e)
                traceback.print_exc(e, file=std.stderr)
                raise e
            
            data = {'text':text}
            return HttpResponse(json.dumps(data), content_type="application/json")

        if not request.is_ajax():
            uid = ''.join(random.choice(string.ascii_letters+string.digits) for _ in range(20))
            context['uid'] = uid
        else:
            uid = request.GET['uid']

        print("UID:",uid)
        if uid in prgmT and prgmT[uid].is_alive():
            prgmT[uid].terminate()
            proxies[uid].stop()
        
        if 'code' in request.GET:
            code = request.GET['code']
            context['code'] = code
            context['permalink'] = "old?code="+encodeURL(code)
            if "input" in request.GET and request.GET["input"]:
                context['input'] = request.GET["input"]
                context['permalink'] += "&input="+encodeURL(request.GET["input"])

        if request.is_ajax():
            if request.GET["action"] == "start":

                try:
                    proxies[uid] = manager.Program(
                        code,
                        inputStr=request.GET["input"],
                        debugFlag=0,
                        outfile=None)
                    context['code_array'] = proxies[uid].getCode()
                    
                    return render(request, 'minkolang/codeTable.html', context_instance=context)
                except Exception as e:
                    traceback.print_exc(file=sys.stderr)
                    raise e
                
            elif request.GET["action"] == "step":

                try:
                    proxy_prgm = proxies[uid]
                    
                    steps = int(request.GET["steps"])

                    prgmT[uid] = multiprocessing.Process(
                        target = proxy_prgm.runCatch,
                        args = (steps,),
                        name="program run")
                    
                    prgmT[uid].start()
                    prgmT[uid].join(60) #time limit of 1 minute

                    if prgmT[uid].is_alive():
                        prgmT[uid].terminate()
                        proxy_prgm.stop()

                    V = json.loads(proxy_prgm.getVarsJson())
                    
                    oldpos = V['oldposition']
                    data = {'x':oldpos[0], 'y':oldpos[1], 'z':oldpos[2]}
                    data['stack'] = V['stack']
                    data['loops'] = render_to_string('minkolang/loopTable.html', {'loops':V['loops']})
                    
                    data['inputstr'] = V['inputStr']
                    data['output'] = "<br/>".join(V['output'].replace('<','&lt;').replace('>','&gt;').split('\n'))

                    if V['strMode']:
                        if V['currChar'] == '"':
                            data['currchar'] = "<code>\" </code> &nbsp;Starts a string literal."
                        else:
                            data['currchar'] = "Building up a string literal: <code>%s</code>" % V['strLiteral']
                    elif V['currChar'] == '"':
                        data['currchar'] = "<code>\" </code> &nbsp;Closes a string literal and \
                                            pushes the characters onto the stack in reverse order."
                    elif V['numMode']:
                        if V['currChar'] == "'":
                            data['currchar'] = "<code>' </code> &nbsp;Starts a number literal."
                        else:
                            data['currchar'] = "Building up a number literal: <code>%s</code>" % V['numLiteral']
                    elif V['currChar'] == "'":
                        data['currchar'] = "<code>' </code> &nbsp;Closes a string literal and \
                                            pushes the number onto the stack."
                    else:
                        if "0" <= V['currChar'] <= "9" and len(V['currChar']) == 1:
                            data['currchar'] = "<code>%d </code> &nbsp;Pushes a %d onto the stack." % ((int(V['currChar']),)*2)
                        elif V['currChar'] == "l":
                            data['currchar'] = "<code>l </code> &nbsp;Pushes a 10 onto the stack."
                        else:
                            data['currchar'] = V['oldToggle']*'$' + V['currChar']

                    data['register'] = V['register']

                    data['code_changed'] = V['codeChanged']
                    data['array_changed'] = V['arrayChanged']

                    if V['codeChanged']:
                        code_array = V['code'][:]
                        for z in range(len(code_array)):
                            for y in range(len(code_array[z])):
                                for x in range(len(code_array[z][y])):
                                    if type(code_array[z][y][x]) != str:
                                        if code_array[z][y][x] < 32:
                                            code_array[z][y][x] = "<em>%s</em>" % code_array[z][y][x]
                                        else:
                                            c = " "
                                            try:
                                                c = chr(code_array[z][y][x])
                                            except ValueError:
                                                c = "<em>%s</em>" % code_array[z][y][x]
                                            code_array[z][y][x] = c

                                        code_array[z][y][x] = mark_safe(code_array[z][y][x])
                                            
                        data['code_table'] = render_to_string('minkolang/codeTable.html', {'code_array':code_array})

                        code_put = []
                        if V['codeput']:
                            code_put = []
                            for key,value in V['codeput'].items():
                                coords = eval(key)
                                c = ''
                                if value < 32:
                                    c = "<em>%s</em>" % value
                                else:
                                    try:
                                        c = chr(value)
                                    except ValueError:
                                        c = "<em>%s</em>" % value
                                c = mark_safe(c)
                                code_put.append({'x':coords[0],
                                                 'y':coords[1],
                                                 'z':coords[2],
                                                 'v':value,
                                                 'c':c})
                            code_put.sort(key=lambda k:(k['x'],k['y'],k['z']))

                        data['code_put'] = render_to_string('minkolang/codePutTable.html', {'code_put':code_put})
                    if V['arrayChanged']:
                        data['array_table'] = render_to_string('minkolang/arrayTable.html', {'array':V['array']})

                    data['done'] = V['isDone']
                    data['error_type'] = V['errorType']
                    
                except Exception as e:
                    print("views.py error:",file=sys.stderr)
                    traceback.print_exc(file=sys.stderr)
                    raise e

                return HttpResponse(json.dumps(data), content_type="application/json")

    return render(request, 'minkolang/main.html', context_instance=context)

@csrf_exempt
def github_view(request, *args, **kwargs):

    data = json.loads(request.body.decode())

    #with open('github_json.txt','w') as f: f.write(str(data['pusher']))

    if data['pusher']['name'] == 'elendiastarman' and sys.platform == 'linux':
        attempt = subprocess.call("/webapps/maingit/repos/minkolang.git/pull-from-github")
        with open('github_pull_attempt.txt','w') as f: f.write("Exit code: %s"%attempt)

    return HttpResponse("OK")



####### DO NOT EDIT #######
def old_main_view(request, **kwargs):
    global manager
    global prgmT
    global proxies

    if not manager:
        manager = MyManager()
        manager.start()
    
    context = RequestContext(request)
    context['code'] = '"Hello world!"(O).'
    context['code_lines'] = []
    context['permalink'] = '?code=%22Hello+world%21%22%28O%29.'

    if request.method == 'GET':

        if not request.is_ajax():
            uid = ''.join(random.choice(string.ascii_letters+string.digits) for _ in range(20))
            context['uid'] = uid
        else:
            uid = request.GET['uid']

        print("UID:",uid)
        if uid in prgmT and prgmT[uid].is_alive():
            prgmT[uid].terminate()
            proxies[uid].stop()
        
        if 'code' in request.GET:
            code = request.GET['code']
            context['code'] = code
            context['permalink'] = "?code="+encodeURL(code)
            if "input" in request.GET and request.GET["input"]:
                context['input'] = request.GET["input"]
                context['permalink'] += "&input="+encodeURL(request.GET["input"])

        if request.is_ajax():
            if request.GET["action"] == "start":

                try:
                    proxies[uid] = manager.Program_old(
                        code,
                        inputStr=request.GET["input"],
                        debugFlag=0,
                        outfile=None)
                    context['code_array'] = proxies[uid].getCode()
                    
                    return render(request, 'minkolang/codeTable.html', context_instance=context)
                except Exception as e:
                    traceback.print_exc(file=sys.stderr)
                    raise e
                
            elif request.GET["action"] == "step":

                try:
                    proxy_prgm = proxies[uid]
                    
                    steps = int(request.GET["steps"])

                    prgmT[uid] = multiprocessing.Process(
                        target = proxy_prgm.run,
                        args = (steps,),
                        name="program run")
                    
                    prgmT[uid].start()
                    prgmT[uid].join(60) #time limit of 1 minute

                    if prgmT[uid].is_alive():
                        prgmT[uid].terminate()
                        proxy_prgm.stop()

                    V = json.loads(proxy_prgm.getVarsJson())

##                    print(V)
                    
                    oldpos = V['oldposition']
                    data = {'x':oldpos[0], 'y':oldpos[1], 'z':oldpos[2]}
                    data['stack'] = V['stack']
                    looptext = lambda L: " ".join([L[0], str(L[4]), str(L[3])])
                    data['loops'] = "<br/>".join(map(looptext, V['loops']))
                    
                    data['inputstr'] = V['inputStr']
                    data['output'] = "<br/>".join(V['output'].replace('<','&lt;').replace('>','&gt;').split('\n'))

                    data['currchar'] = V['oldToggle']*'$' + V['currChar']
                    

                    data['done'] = V['isDone']
                    
                except Exception as e:
                    print(e)
                    traceback.print_exc(file=sys.stderr)
                    raise e

                return HttpResponse(json.dumps(data), content_type="application/json")

    return render(request, 'minkolang/main_old.html', context_instance=context)
