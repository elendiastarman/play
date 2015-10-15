from django.shortcuts import render, redirect
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.core.urlresolvers import reverse
from django.core.exceptions import ObjectDoesNotExist, MultipleObjectsReturned

from django.template import Context, RequestContext
import json

from minkolang.minkolang_08 import Program

import sys
import traceback
import multiprocessing
from multiprocessing.managers import BaseManager

global prgm
global prgmT
prgm = None
prgmT = None

##global proxy
##
##manager = None
##
##if not manager:
##    try:
##        manager = multiprocessing.Manager()
##        proxy = manager.Namespace()
##        proxy.prgm = None
##    except Exception as e:
##        traceback.print_exc(file=sys.stdout)
##        raise e

global proxy
proxy = None
global manager
manager = None

def foo(p, s):
    print(p.prgm)
    p.prgm.run(s)

class MyManager(BaseManager): pass
MyManager.register('Program', Program)

print("blah")

# Create your views here.
def main_view(request, **kwargs):
    global proxy
    global manager
    global prgm
    global prgmT

    if prgmT: prgmT.terminate()
    
    context = RequestContext(request)
    context['code'] = '"Hello world!"(O).'
    context['code_lines'] = []

    if request.method == 'GET':
        
        print(request)
        print(request.GET)
        
        if 'code' in request.GET:
            code = request.GET['code']
            print(code)
            print(request.GET['input'])
            context['code'] = code
            context['code_lines'] = code.split('\n')

            if prgmT: prgmT.terminate()

        if request.is_ajax():
            if request.GET["action"] == "start":

                try:
##                    prgm = Program(code, inputStr=request.GET["input"], debugFlag=1)
                    manager = MyManager()
                    manager.start()
                    proxy = manager.Program(code, inputStr=request.GET["input"], debugFlag=0)
##                    print(dir(proxy))
                    context['code_lines'] = proxy.getCode()[0]
                    return render(request, 'minkolang/codeTable.html', context_instance=context)
                except Exception as e:
                    traceback.print_exc(file=sys.stdout)
                    raise e
                
            elif request.GET["action"] == "step":
##                print("Taking %s steps." % request.GET["steps"])

                try:
                    prgm = proxy
##                    manager = MyManager()
##                    manager.register("ML_prgm", Program)
                    
##                    proxy.prgm = prgm
                    
                    steps = int(request.GET["steps"])
                    #prgm.run(steps-(steps>0))
##                    print("prgm:",prgm)

                    prgmT = multiprocessing.Process(target = proxy.run,
                                                    args = (steps,),
                                                    name="program run")
                    prgmT.start()
                    prgmT.join()
##                    print(prgmT.is_alive())
##                    print(threading.enumerate())
##                    prgmT.join()
##                    print(prgmT.exitcode)

##                    manager.shutdown()

                    
##                    print("prgm:",prgm)
                    
                    prgmT = None
##                    print("prgm:",prgm)

                    oldpos = proxy.getOldPosition()
                    data = {'x':oldpos[0], 'y':oldpos[1]}
                    print(proxy.getOutput(), data)
##                    print(prgm.position)
##                    print(threading.enumerate())
                except Exception as e:
                    traceback.print_exc(file=sys.stdout)
                    raise e
                
                data['output'] = proxy.getOutput()
                return HttpResponse(json.dumps(data), content_type="application/json")

        else:
            pgrm = None
            prgmT = None

    return render(request, 'minkolang/main.html', context_instance=context)

def interpreter_view(request, **kwargs):
    context = RequestContext(request)

    return render(request, 'minkolang/interpreter.html', context_instance=context)
