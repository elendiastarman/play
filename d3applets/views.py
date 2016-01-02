from django.shortcuts import render, redirect
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.core.urlresolvers import reverse
from django.core.exceptions import ObjectDoesNotExist, MultipleObjectsReturned

from django.template import Context, RequestContext, TemplateDoesNotExist
from django.utils.safestring import mark_safe

import os
import re
import sys

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

def dotandcross_view(request, **kwargs):
    context = RequestContext(request)

    return render(request, 'd3applets/dotandcross.html', context_instance=context)

def radiansDemo_view(request, **kwargs):
    context = RequestContext(request)

    return render(request, 'd3applets/radiansDemo.html', context_instance=context)

def gravity_view(request, **kwargs):
    context = RequestContext(request)

    return render(request, 'd3applets/gravity.html', context_instance=context)
