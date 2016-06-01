from django.shortcuts import render, redirect
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.core.urlresolvers import reverse
from django.core.exceptions import ObjectDoesNotExist, MultipleObjectsReturned

from django.template import Context, RequestContext, TemplateDoesNotExist
from django.utils.safestring import mark_safe
from django.views.decorators.csrf import csrf_exempt

import os
import re
import ast
import sys
import random
import string
import traceback

from d3applets.varlife_renderGif import createGif

# Create your views here.
def home_view(request, **kwargs):
    context = RequestContext(request)

    if sys.platform == 'win32':
        path = os.path.join(os.getcwd(),"d3applets","templates","d3applets")
    elif sys.platform == 'linux':
        path = os.path.join("/home","elendia","webapps","play","play","d3applets","templates","d3applets/")

    applets = []
    for filename in os.listdir(path):
        if filename.endswith('.html') and filename != "404.html":
            tempFile = open(os.path.join(path,filename),'r')
            contents = tempFile.read()
            tempFile.close()

            header = re.search(r"<h1>(.*)</h1>", contents)
            description = re.search(r"<p id=['\"]desc['\"]>(.*)</p>", contents)

            if header and description:
                applets.append([header.group(1),
                                mark_safe(description.group(1)),
                                filename[:-5]])

    context['applets'] = sorted(applets)

    return render(request, 'd3applets/home.html', context_instance=context)

def other_view(request, **kwargs):
    context = RequestContext(request)
    print(kwargs['name'])

    try:
        return render(request, 'd3applets/'+kwargs['name']+'.html', context_instance=context)
    except TemplateDoesNotExist:
        raise Http404

@csrf_exempt
def varlife_renderGif(request, **kwargs):

    print("???")
    context = RequestContext(request)

    gridData = ast.literal_eval(request.POST['gridData'])
    colorData = ast.literal_eval(request.POST['colorData'])
    width = int(request.POST['width'])
    height = int(request.POST['height'])
    cellSize = int(request.POST['cellSize'])
    frameDuration = int(request.POST['frameDuration'])
    filename = ''.join(random.choice(string.ascii_letters) for _ in range(10))+'.gif'
    
    with open('renderGif_info.txt','w') as f:
        f.writeline(filename)
        f.writeline(str(gridData))
        f.writeline(str(len(gridData)))
        f.writeline(str(colorData))
        f.writeline(str(width)+", "+str(height)+", "+str(cellSize)+"; "+str(frameDuration))

    if sys.platform == 'win32':
        filepath = os.path.join(os.getcwd(),"d3applets","static","d3applets","renders",filename)
    elif sys.platform == 'linux':
        filepath = os.path.join("/home","elendia","webapps","static","d3applets","renders",filename)

    try:
        createGif(gridData, colorData, width, height, cellSize, frameDuration, filepath)
    except Exception as e:
        traceback.print_exc(file=sys.stderr)
        raise e

    return HttpResponse(filename, content_type="text/plain")
