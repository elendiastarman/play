from django.shortcuts import render, redirect, render_to_response
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.core.urlresolvers import reverse
from django.core.exceptions import ObjectDoesNotExist, MultipleObjectsReturned

from django.template import Context, RequestContext
from django.template.loader import render_to_string
from django.utils.safestring import mark_safe
from django.views.decorators.csrf import csrf_exempt
import json

from PPCG.transcriptAnalyzer import *

# Create your views here.

def convos_view(request, *args, **kwargs):
    context = RequestContext(request)

    if request.is_ajax():
##        print("???")
        #data = json.loads(request.body.decode())
##        print(request.GET)
        data = [int(request.GET[x]) for x in ['year','month','day']]
        print(data)
        
        stuff = parseConvos(year=data[0], month=data[1], day=data[2])
        groups = stuff['groups']
        msgs = stuff['messages']
        
        context['convos'] = [[(msgs[n] if n in msgs else None) for n in g] for g in filter(lambda x:len(x)>3, groups)]
        
        return render_to_response('PPCG/convothreads.html', context)

    else:
        return render(request, 'PPCG/convos.html', context_instance=context)
