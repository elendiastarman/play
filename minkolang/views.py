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

##global prgm
global prgmT
##prgm = None
prgmT = {}


global proxies
proxies = {}

global manager
manager = None

class MyManager(BaseManager): pass
MyManager.register('Program', Program)

# Create your views here.
def main_view(request, **kwargs):
##    global proxy_prgm
    global manager
##    global prgm
    global prgmT
    global proxies

    if not manager:
        manager = MyManager()
        manager.start()
    
    context = RequestContext(request)
    context['code'] = '"Hello world!"(O).'
    context['code_lines'] = []

##    print("Request session stuff.")
##    print(request.session)
##    print(request.session.items())
##    print()

    if request.method == 'GET':
        
##        print(request)
##        print(request.GET)

        if not request.is_ajax():
            uid = ''.join(random.choice(string.ascii_letters+string.digits) for _ in range(20))
            context['uid'] = uid
        else:
            uid = request.GET['uid']#.lstrip(" ")

        print("UID:",uid)
        if uid in prgmT and prgmT[uid].is_alive():
            prgmT[uid].terminate()
            proxies[uid].stop()
        
        if 'code' in request.GET:
            code = request.GET['code']
##            print(code)
##            print(request.GET['input'])
            context['code'] = code
            context['code_lines'] = code.split('\n')

        if request.is_ajax():
            if request.GET["action"] == "start":

                try:
                    proxies[uid] = manager.Program(
                        code,
                        inputStr=request.GET["input"],
                        debugFlag=0,
                        outfile=None)
                    context['code_lines'] = proxies[uid].getCode()[0]
##                    request.session['proxy_prgm'] = proxy_prgm

##                    print(request.session.items())
                    
                    return render(request, 'minkolang/codeTable.html', context_instance=context)
                except Exception as e:
                    traceback.print_exc(file=sys.stdout)
                    raise e
                
            elif request.GET["action"] == "step":

                try:
##                    print(request.session.items())
                    
##                    proxy_prgm = request.session['proxy_prgm']

                    proxy_prgm = proxies[uid]
                    
                    steps = int(request.GET["steps"])

                    prgmT[uid] = multiprocessing.Process(
                        target = proxy_prgm.run,
                        args = (steps,),
                        name="program run")
                    
                    prgmT[uid].start()
                    prgmT[uid].join(5)

                    if prgmT[uid].is_alive():
                        prgmT[uid].terminate()
                        proxy_prgm.stop()
                    
##                    prgmT[uid] = None

                    oldpos = proxy_prgm.getOldPosition()
                    data = {'x':oldpos[0], 'y':oldpos[1]}

##                    print(proxy_prgm.getOutput(), data)
                except Exception as e:
                    traceback.print_exc(file=sys.stdout)
                    raise e
                
                data['output'] = proxy_prgm.getOutput()
                return HttpResponse(json.dumps(data), content_type="application/json")

        else:
            pass
##            pgrm = None
##            prgmT = None

    return render(request, 'minkolang/main.html', context_instance=context)

def interpreter_view(request, **kwargs):
    context = RequestContext(request)

    return render(request, 'minkolang/interpreter.html', context_instance=context)
