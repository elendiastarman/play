from django.shortcuts import render, redirect
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.core.urlresolvers import reverse
from django.core.exceptions import ObjectDoesNotExist, MultipleObjectsReturned

from django.template import Context, RequestContext
import json

from minkolang.minkolang_08 import Program

import os
import sys
import traceback
import multiprocessing
from multiprocessing.managers import BaseManager

global stdnull
stdnull = open(os.devnull, 'w')

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

# Create your views here.
def main_view(request, **kwargs):
    global manager
    global prgmT
    global proxies

    if not manager:
        manager = MyManager()
        manager.start()
    
    context = RequestContext(request)
    context['code'] = '"Hello world!"(O).'
    context['code_lines'] = []

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
                        target = proxy_prgm.run,
                        args = (steps,),
                        name="program run")
                    
                    prgmT[uid].start()
                    prgmT[uid].join(60) #time limit of 1 minute

                    if prgmT[uid].is_alive():
                        prgmT[uid].terminate()
                        proxy_prgm.stop()
                    
                except Exception as e:
                    traceback.print_exc(file=sys.stderr)
                    raise e
                
                oldpos = proxy_prgm.getOldPosition()
                data = {'x':oldpos[0], 'y':oldpos[1], 'z':oldpos[2]}
                data['stack'] = proxy_prgm.getStack()
                looptext = lambda L: " ".join([L[0], str(L[4]), str(L[3])])
                data['loops'] = "<br/>".join(map(looptext, proxy_prgm.getLoops()))
                
                data['output'] = proxy_prgm.getOutput()
                return HttpResponse(json.dumps(data), content_type="application/json")

    return render(request, 'minkolang/main.html', context_instance=context)

def interpreter_view(request, **kwargs):
    context = RequestContext(request)

    return render(request, 'minkolang/interpreter.html', context_instance=context)
